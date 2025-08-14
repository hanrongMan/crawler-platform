import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase/client"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 第一步：在平台库进行用户身份验证
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { config_name, target_url, website_type, supabase_url, supabase_key, api_config, is_default } = body

    // 第二步：从平台库读取用户默认的 Supabase 连接配置
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

    // 第三步：使用用户的 Supabase 配置更新其数据库中的配置
    const target = createSupabaseClient(cfg.supabase_url, cfg.supabase_key)

    // 如果设置为默认配置，先取消该用户在目标库的其他默认
    if (is_default) {
      await target
        .from("user_scraping_configs")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", params.id)
    }

    // 更新配置（在用户自己的数据库）
    const { data: config, error } = await target
      .from("user_scraping_configs")
      .update({
        config_name,
        target_url,
        website_type,
        supabase_url,
        supabase_key,
        api_config,
        is_default: is_default || false,
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user config in user's Supabase:", error)
      return NextResponse.json({ 
        error: "Failed to update config in user's database",
        details: error.message 
      }, { status: 500 })
    }

    console.log(`[User Configs] Successfully updated config ${params.id} for user ${user.id}`)
    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error in PUT /api/user-configs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 第一步：在平台库进行用户身份验证
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 第二步：从平台库读取用户默认的 Supabase 连接配置
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

    // 第三步：使用用户的 Supabase 配置删除其数据库中的配置
    const target = createSupabaseClient(cfg.supabase_url, cfg.supabase_key)

    // 删除配置（在用户自己的数据库）
    const { error } = await target
      .from("user_scraping_configs")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting user config from user's Supabase:", error)
      return NextResponse.json({ 
        error: "Failed to delete config from user's database",
        details: error.message 
      }, { status: 500 })
    }

    console.log(`[User Configs] Successfully deleted config ${params.id} for user ${user.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/user-configs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
