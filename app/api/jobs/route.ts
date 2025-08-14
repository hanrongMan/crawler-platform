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

    // 允许带搜索词 q 执行后端模糊查询
    const q = _req.nextUrl.searchParams.get("q")?.trim() || ""
    const baseQuery = () =>
      target
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

    let jobs: any[] | null = null
    let jobsError: any = null

    if (q) {
      // 清洗查询串，避免 or 语法被逗号破坏
      const cleaned = q.replace(/[,]/g, " ")
      const pattern = `%${cleaned}%`
      const alias: Record<string, string[]> = {
        "腾讯": ["tencent"],
        "字节": ["bytedance"],
        "字节跳动": ["bytedance"],
        "阿里": ["alibaba"],
        "阿里巴巴": ["alibaba"],
      }
      const normalizedTargets = new Set<string>()
      Object.keys(alias).forEach((k) => {
        if (cleaned.includes(k)) alias[k].forEach((v) => normalizedTargets.add(v))
      })

      const orGroups: string[] = []
      const pushGroup = (fields: string[]) => {
        const parts = fields.map((f) => `${f}.ilike.${pattern}`)
        normalizedTargets.forEach((v) => parts.push(`source_website.eq.${v}`))
        orGroups.push(parts.join(","))
      }

      // 尝试由宽到窄的字段集，避免远端库缺列引发错误
      pushGroup(["title", "department", "location", "experience_level", "job_type", "description", "requirements", "source_website", "benefits"]) // 宽
      pushGroup(["title", "description", "requirements", "source_website"]) // 中
      pushGroup(["title", "description", "source_website"]) // 窄
      pushGroup(["title"]) // 最窄

      for (const orExpr of orGroups) {
        const { data, error } = await baseQuery().or(orExpr)
        if (!error) {
          jobs = data || []
          jobsError = null
          break
        }
        jobsError = error
      }

      // 如果全部失败，退回到不带过滤
      if (jobsError) {
        const { data, error } = await baseQuery()
        jobs = data || []
        jobsError = error
      }
    } else {
      const { data, error } = await baseQuery()
      jobs = data || []
      jobsError = error
    }

    // 2) 总数（该用户目标库中的全部职位数量，保持为整体统计，不受 q 影响）
    const { count: totalCount } = await target
      .from("jobs")
      .select("*", { count: "exact", head: true })

    // 3) source_website 去重数量（整体统计，不受 q 影响）
    const { data: sources } = await target
      .from("jobs")
      .select("source_website")
    const sourceWebsiteCount = Array.isArray(sources)
      ? new Set(sources.map((r: any) => r.source_website).filter((v) => v)).size
      : 0

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 })
    }

    return NextResponse.json({ jobs: jobs || [], totalCount: totalCount || 0, sourceWebsiteCount })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


