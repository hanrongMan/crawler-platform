import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("scraping_configs")
      .select("website_name, display_name, base_url, is_active, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ configs: data || [] })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
