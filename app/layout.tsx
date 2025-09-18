import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Queens Facts | Discover NYC's Most Diverse Borough",
  description:
    "Discover fascinating facts about Queens, NYC - the most ethnically diverse urban area in the world with over 130 languages spoken.",
  authors: [{name:"Rodolph Mesadieu", url:"rudymesadieu.com"}]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${poppins.variable}`} style={{ fontFamily: "Poppins, sans-serif" }}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
