"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  Info,
  RefreshCw,
  Globe,
  Home,
  Film,
  Twitter,
  Instagram,
  Facebook,
  Loader,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function QueensFactsPage() {
  const [currentFact, setCurrentFact] = useState<{
    fact_text: string
    neighborhood?: string
    category?: string
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fade, setFade] = useState(true)

  useEffect(() => {
  const logVisit = async () => {
    try {
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "home_page_visit",
          path: "/",
        }),
      });
    } catch (err) {
      console.error("Error logging visit:", err);
    }
  };

  logVisit();
}, []);

  // Check if it's after 6pm EST and apply dark mode
  useEffect(() => {
    const checkNightTime = () => {
      const now = new Date()
      const estOffset = -5 * 60 // EST is UTC-5
      const estTime = new Date(
        now.getTime() + (now.getTimezoneOffset() + estOffset) * 60000
      )
      return estTime.getHours() >= 18 // 6pm or later
    }

    if (checkNightTime()) {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Fetch random fact from API
  const fetchRandomFact = async () => {
    try {
      const res = await fetch("/api/facts?random=true&limit=1")
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data[0]
      } else if (data.fact_text) {
        return data
      }
      return { fact_text: "No fact available right now." }
    } catch (err) {
      console.error("Error fetching fact:", err)
      return { fact_text: "Error fetching fact." }
    }
  }

  // Load initial fact
  useEffect(() => {
    const loadInitialFact = async () => {
      const fact = await fetchRandomFact()
      setCurrentFact(fact)
      setIsLoading(false)
    }
    loadInitialFact()
  }, [])

  // Handle new fact button click with fade
  const handleNewFact = async () => {
    setIsLoading(true)
    setFade(false) // fade out

    setTimeout(async () => {
      const fact = await fetchRandomFact();
      setCurrentFact(fact);
      setFade(true); // fade in
      setIsLoading(false);

      await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "fact_reload",
        path: "/",
      }),
      });

    }, 300)
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 transition-all duration-500 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      {/* Custom styles */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap");

        .dark body {
          background: linear-gradient(135deg, #1a1a2e 0%, #4a148c 100%);
        }

        .queens-gradient {
          background: linear-gradient(135deg, #0057b7 0%, #ffd700 100%);
        }

        .dark .queens-gradient {
          background: linear-gradient(135deg, #0f3460 0%, #892cdc 100%);
        }

        .fact-card {
          min-height: 300px;
          transition: all 0.3s ease;
        }

        .fact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>

      {/* Header */}
      <header className="queens-gradient text-white pb-20">
        <div className="container mx-auto px-4 pt-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold font-sans">Queens Facts</h1>
              <p className="text-lg mt-2">
                Discover the most diverse place on Earth
              </p>
            </div>
            <div className="hidden md:block">
              <img
                src="/queens-nyc-skyline-cityscape.jpg"
                alt="Queens skyline"
                className="h-20 rounded-lg shadow-lg"
              />
            </div>
          </div>
          <div className="mt-12 text-center">
            <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-1">
              <MapPin className="inline text-yellow-300 w-5 h-5" />
              <span className="ml-2 font-medium text-black dark:text-black pr-2">
                Queens, New York
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mt-6">Did You Know?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg">
              Press the button below to discover fascinating facts about Queens
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-16">
        <div className="max-w-4xl mx-auto">
          {/* Fact Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 md:p-10 fact-card">
            <div className="text-center">
              {/* Icon + Neighborhood + Category */}
              <div className="flex flex-col items-center justify-center space-y-2">
                {/* Info bubble */}
                <Info className="text-blue-600 w-12 h-12" />

                {/* Neighborhood name */}
                {currentFact?.neighborhood && (
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-lg">
                    {currentFact.neighborhood}
                  </span>
                )}

                {/* Category */}
                {currentFact?.category && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    {currentFact.category}
                  </span>
                )}
              </div>

              {/* Fact text */}
              <div
                className={`mt-6 transition-opacity duration-300 ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
              >
                <p className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-100">
                  {currentFact?.fact_text}
                </p>
              </div>

              {/* Button */}
              <Button
                onClick={handleNewFact}
                disabled={isLoading}
                className={`queens-gradient text-white font-bold py-3 px-8 rounded-full mt-8 transition-all duration-300 shadow-lg flex items-center mx-auto ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-90 pulse"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Get Another Fact
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6">
              <Globe className="text-blue-600 w-8 h-8" />
              <h3 className="font-bold text-lg mt-4">Cultural Diversity</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Over 130 languages are spoken in Queens, making it the most
                ethnically diverse urban area in the world.
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-gray-800 rounded-lg p-6">
              <Home className="text-yellow-600 w-8 h-8" />
              <h3 className="font-bold text-lg mt-4">Iconic Neighborhoods</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                From Astoria to Flushing, each neighborhood offers unique
                cultural experiences and cuisines.
              </p>
            </div>
            <div className="bg-red-50 dark:bg-gray-800 rounded-lg p-6">
              <Film className="text-red-600 w-8 h-8" />
              <h3 className="font-bold text-lg mt-4">Film Industry Hub</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Kaufman Astoria Studios has been home to productions from Sesame
                Street to Orange is the New Black.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold">Queens Facts</h3>
              <p className="mt-2 text-gray-400">
                Discovering the borough that never sleeps (as much as Manhattan)
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2023 Queens Facts. Made with ❤️ for NYC's most diverse borough.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
