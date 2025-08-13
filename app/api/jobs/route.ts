import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 读取用户默认的目标 Supabase 配置
    const { data: cfg, error: cfgError } = await supabase
      .from("user_scraping_configs")
      .select("supabase_url, supabase_key")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle()

    if (cfgError || !cfg) {
      return NextResponse.json({ error: "未找到Supabase连接配置" }, { status: 400 })
    }

    const target = createSupabaseClient(cfg.supabase_url, cfg.supabase_key)

    const { data: jobs, error: jobsError } = await target
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 })
    }

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


