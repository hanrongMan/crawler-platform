import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// 支持的网站配置
const SCRAPING_CONFIGS = [
  {
    id: "tencent",
    name: "腾讯招聘",
    display_name: "腾讯招聘",
    base_url: "https://join.qq.com",
    example_urls: ["https://join.qq.com/post.html", "https://join.qq.com/post.html?pid=1"],
    description: "腾讯公司官方招聘网站",
    supported_features: ["职位列表", "薪资信息", "部门信息", "工作地点", "经验要求"],
    rate_limit_ms: 2000,
    max_pages: 20,
    status: "active",
  },
  {
    id: "bytedance",
    name: "字节跳动招聘",
    display_name: "字节跳动招聘",
    base_url: "https://jobs.bytedance.com/experienced/position?page=1",
    example_urls: [
      "https://jobs.bytedance.com/experienced/position",
      "https://jobs.bytedance.com/experienced/position?keywords=前端",
    ],
    description: "字节跳动公司官方招聘网站",
    supported_features: ["职位列表", "薪资范围", "技能标签", "工作地点", "经验要求"],
    rate_limit_ms: 1500,
    max_pages: 15,
    status: "active",
  },
  {
    id: "alibaba",
    name: "阿里招聘",
    display_name: "阿里招聘",
    base_url: "https://talent-holding.alibaba.com/off-campus/position-list?lang=zh",
    example_urls: [
      "https://talent-holding.alibaba.com/off-campus/position-list?lang=zh",
      "https://talent-holding.alibaba.com/campus/position-list",
    ],
    description: "阿里巴巴集团官方招聘网站",
    supported_features: ["职位列表", "福利待遇", "部门信息", "工作地点", "经验要求"],
    rate_limit_ms: 2500,
    max_pages: 25,
    status: "active",
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const response = {
      success: true,
      configs: SCRAPING_CONFIGS,
      total: SCRAPING_CONFIGS.length,
      active_count: SCRAPING_CONFIGS.filter((config) => config.status === "active").length,
      authentication: user ? "authenticated" : "not_authenticated",
    }

    // 如果用户已认证，添加用户特定信息
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("status, role, daily_scraping_limit, monthly_scraping_limit")
        .eq("id", user.id)
        .single()

      if (profile) {
        response.user_info = {
          status: profile.status,
          role: profile.role,
          daily_limit: profile.daily_scraping_limit,
          monthly_limit: profile.monthly_scraping_limit,
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch scraping configurations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed. Use GET to fetch configurations." }, { status: 405 })
}
