export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import * as fuzz from "fuzzball"

// Utility: fuzzy match
function fuzzyMatch(query: string, choices: string[], cutoff = 60) {
  const result = fuzz.extract(query, choices, {
    scorer: fuzz.token_sort_ratio,
    limit: 1,
  })
  if (result.length > 0 && result[0][1] >= cutoff) {
    return result[0][0]
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const neighborhood = searchParams.get("neighborhood")
    const category = searchParams.get("category")
    const zipcode = searchParams.get("zipcode")
    const random = searchParams.get("random")
    const limit = searchParams.get("limit")

    // === Get fact by ID ===
    if (id) {
      const { data, error } = await supabase
        .from("neighborhood_fun_facts")
        .select("*")
        .eq("fact_id", id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json(data)
    }

    // === Base query builder ===
    let queryBuilder = supabase.from("neighborhood_fun_facts").select("*")

    // Neighborhood fuzzy match
    if (neighborhood) {
      const { data: allNeighs } = await supabase.from("neighborhood_fun_facts").select("neighborhood")
      const distinct = [...new Set((allNeighs || []).map(n => n.neighborhood))]
      const match = fuzzyMatch(neighborhood, distinct)
      if (!match) return NextResponse.json({ error: "No close neighborhood match found" }, { status: 404 })
      queryBuilder = queryBuilder.eq("neighborhood", match)
    }

    // Category fuzzy match
    if (category) {
      const { data: allCats } = await supabase.from("neighborhood_fun_facts").select("category")
      const distinct = [...new Set((allCats || []).map(c => c.category))]
      const match = fuzzyMatch(category, distinct)
      if (!match) return NextResponse.json({ error: "No close category match found" }, { status: 404 })
      queryBuilder = queryBuilder.eq("category", match)
    }

    if (zipcode) queryBuilder = queryBuilder.eq("zipcode", zipcode)

    // === Random mode ===
    if (random === "true") {
      const { data, error } = await supabase.rpc("random_facts", {
        n: limit ? parseInt(limit) : 1,
      })

      if (error) {
        console.error("Supabase RPC random error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log(data)
      return NextResponse.json(data)
    }

    // === Normal mode (non-random) ===
    if (limit) queryBuilder = queryBuilder.limit(parseInt(limit))

    const { data, error } = await queryBuilder
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    console.error("API error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
