import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    // Parse custom event type if provided
    const body = await req.json().catch(() => ({}));
    const event_type = body.event_type || "home_page_visit";
    const path = body.path || "/";

    // Request metadata
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "Unknown";

    const ua = req.headers.get("user-agent") || "Unknown";
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";
    const city = req.headers.get("x-vercel-ip-city") || "Unknown";
    const region = req.headers.get("x-vercel-ip-country-region") || "Unknown";

    if (process.env.NODE_ENV === "production") {
      const { error } = await supabase.from("queens_facts_audit").insert([
        {
          ip_address: ip,
          path,
          event_type,
          user_agent: ua,
          country,
          city,
          region,
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json({ success: false, error }, { status: 500 });
      }
    } else {
      console.log(`Audit log (dev mode, not inserted):`, {
        event_type,
        path,
        ip,
        ua,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Audit API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
