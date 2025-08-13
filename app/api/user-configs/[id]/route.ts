import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { config_name, target_url, website_type, supabase_url, supabase_key, api_config, is_default } = body

    // 如果设置为默认配置，先取消其他默认配置
    if (is_default) {
      await supabase
        .from("user_scraping_configs")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", params.id)
    }

    // 更新配置
    const { data: config, error } = await supabase
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
      console.error("Error updating user config:", error)
      return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error in PUT /api/user-configs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 删除配置
    const { error } = await supabase.from("user_scraping_configs").delete().eq("id", params.id).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting user config:", error)
      return NextResponse.json({ error: "Failed to delete config" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/user-configs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
