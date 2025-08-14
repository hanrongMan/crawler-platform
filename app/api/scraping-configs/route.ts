import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSupabaseClient } from "@/lib/supabase/client"

export async function GET() {
  try {
    // 第一步：在平台库进行用户身份验证
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 第二步：从平台库读取该用户的默认 Supabase 连接配置
    const { data: cfg, error: cfgError } = await supabase
      .from("user_scraping_configs")
      .select("supabase_url, supabase_key")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle()

    if (cfgError) {
      console.error("Error fetching default config from platform:", cfgError)
      return NextResponse.json({ error: "Failed to fetch default config" }, { status: 500 })
    }
    
    if (!cfg) {
      return NextResponse.json({ error: "请先在 Supabase-Config 中配置并保存连接" }, { status: 400 })
    }

    // 第三步：使用用户的 Supabase 配置查询其 scraping_configs 表
    const target = createSupabaseClient(cfg.supabase_url, cfg.supabase_key)
    const { data: configs, error } = await target
      .from("scraping_configs")
      .select("website_name, display_name, base_url, is_active, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching scraping configs from user's Supabase:", error)
      return NextResponse.json({ 
        error: "Failed to fetch scraping configs from user's database",
        details: error.message 
      }, { status: 500 })
    }

    console.log(`[Scraping Configs] Successfully fetched ${configs?.length || 0} configs for user ${user.id}`)
    return NextResponse.json({ configs: configs || [] })
  } catch (e: any) {
    console.error("Error in GET /api/scraping-configs:", e)
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
  }
}
