import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { appendLog } from "@/lib/logging/scrape-log"
import { ScraperFactory } from "@/lib/scraper/scraper-factory"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const { targetUrl, websiteType, maxPages = 10, apiConfig } = await request.json()

    if (!targetUrl || !websiteType) {
      return NextResponse.json(
        { error: "缺少必要参数: targetUrl 和 websiteType" },
        { status: 400 }
      )
    }

    // 获取当前用户
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "用户未认证" },
        { status: 401 }
      )
    }

    // 从数据库获取用户的Supabase配置
    const { data: userConfig, error: configError } = await supabase
      .from("user_scraping_configs")
      .select("supabase_url, supabase_key")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle()

    if (configError || !userConfig) {
      return NextResponse.json(
        { error: "未找到Supabase配置，请先完成连接测试" },
        { status: 400 }
      )
    }

    // 创建目标数据库的客户端
    const targetSupabase = createSupabaseClient(
      userConfig.supabase_url,
      userConfig.supabase_key
    )

    // 创建爬虫实例（若传入 apiConfig 则强制使用通用爬虫，确保严格按请求样例执行）
    let jobsResult: any
    if (apiConfig) {
      // 富化 apiConfig：缺省时补齐 Referer/Origin、method、以及常用网站的默认解析映射
      const enriched = { ...(apiConfig as any) }

      // 默认方法
      if (!enriched.method) {
        enriched.method = websiteType === "tencent" ? "POST" : "GET"
      }

      // 默认头部
      enriched.headers = enriched.headers || {}
      try {
        const u = new URL(targetUrl)
        if (!enriched.headers.Origin) enriched.headers.Origin = `${u.protocol}//${u.host}`
        if (!enriched.headers.Referer) enriched.headers.Referer = targetUrl
      } catch {}

      // 常见站点的默认 dataPath 与字段映射（如果用户未配置）
      if (!enriched.dataPath || !enriched.mapping) {
        // 优先兼容你提供的响应：data.positionList[*]
        const defaultPath = "data.positionList"
        if (!enriched.dataPath) enriched.dataPath = defaultPath
        if (!enriched.mapping) {
          enriched.mapping = {
            title: "positionTitle",
            department: "bgs",
            location: "workCities",
            job_type: "position",
            experience_level: "recruitLabelName",
            description: undefined as any,
            requirements: undefined as any,
            salary_min: undefined as any,
            salary_max: undefined as any,
            external_job_id: "postId",
            original_url: undefined as any,
          }
        }
      }

      const universal = ScraperFactory.createUniversalScraper(enriched, (line: string) => appendLog(user.id, line))
      console.log(`开始爬取(通用) ${websiteType} 网站: ${targetUrl}`)
      appendLog(user.id, `[start] universal ${websiteType} ${targetUrl}`)
      jobsResult = await universal.scrapeJobs(targetUrl, maxPages)
    } else {
      // 没有 apiConfig 时，退回专用爬虫
      const scraper = ScraperFactory.createScraper({
        website_name: websiteType,
        base_url: targetUrl,
        selectors: {},
        pagination_config: null,
        rate_limit_ms: 1000,
        max_pages: maxPages,
      })
      console.log(`开始爬取(专用) ${websiteType} 网站: ${targetUrl}`)
      appendLog(user.id, `[start] dedicated ${websiteType} ${targetUrl}`)
      jobsResult = await scraper.scrapeJobs(targetUrl, maxPages)
    }

    // 兼容通用/专用爬虫的返回结构
    let jobs: any[] = Array.isArray(jobsResult) ? jobsResult : (jobsResult?.jobs ?? [])
    // 如果解析为空，再兜底直接取 data.positionList
    if (!jobs.length && jobsResult && typeof jobsResult === "object") {
      try {
        const direct = (jobsResult as any)?.data?.positionList
        if (Array.isArray(direct) && direct.length > 0) {
          jobs = direct
          console.warn("[Persist] Fallback using data.positionList directly")
        }
      } catch {}
    }
    try {
      console.log("[Persist] Jobs parsed count", jobs.length)
      appendLog(user.id, `[parsed] count=${jobs.length}`)
    } catch {}
    if (!jobs.length) {
      console.warn("[Persist] No jobs parsed. Check dataPath/mapping and response structure.")
    }

    // 保存爬取结果到目标数据库
    const savedJobs = []
    let printedSample = false
    for (const job of jobs) {
      try {
        // 规范化字段，兼容专用与通用爬虫
        // 构造 original_url（若缺失且为腾讯，使用 external_job_id 拼接）
        let originalUrl = job.originalUrl ?? job.original_url ?? job.url ?? null
        if (!originalUrl && websiteType === "tencent" && (job.external_job_id || job.id)) {
          const pid = job.external_job_id || job.id
          originalUrl = `https://join.qq.com/post.html?id=${pid}`
        }

        const normalized = {
          title: job.title,
          department: job.department ?? null,
          job_type: job.jobType ?? job.job_type ?? null,
          experience_level: job.experienceLevel ?? job.experience_level ?? null,
          location: job.location ?? null,
          salary_min: job.salary?.min ?? job.salary_min ?? null,
          salary_max: job.salary?.max ?? job.salary_max ?? null,
          salary_currency: job.salary?.currency ?? job.salary_currency ?? null,
          description: job.description ?? null,
          requirements: job.requirements ?? null,
          benefits: job.benefits ?? null,
          original_url: originalUrl,
          // 强制以选择的 websiteType 为准
          source_website: websiteType,
          external_job_id: job.id ?? job.external_job_id ?? null,
          scraped_at: job.scrapedAt ?? new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // 打印入库前的数据（仅首条示例）
        if (!printedSample) {
          try { console.log("[Persist] Job sample", normalized) } catch {}
          appendLog(user.id, `[sample] ${JSON.stringify(normalized).slice(0, 400)}`)
          printedSample = true
        }

        const { data: savedJob, error: saveError } = await targetSupabase
          .from("jobs")
          .insert([normalized])
          .select()
          .single()

        if (!saveError && savedJob) {
          savedJobs.push(savedJob)
          appendLog(user.id, `[insert] ok id=${savedJob.id}`)
        } else if (saveError) {
          console.error("[Persist] Insert error", saveError)
          appendLog(user.id, `[insert] error ${saveError.message || 'unknown'}`)
        }
      } catch (error) {
        console.error(`保存职位失败: ${job.title}`, error)
      }
    }

    // 记录爬取任务
    const mainSupabase = await createClient()
    const { data: taskData, error: taskError } = await mainSupabase
      .from("scraping_tasks")
      .insert([
        {
          user_id: user.id,
          target_url: targetUrl,
          source_website: websiteType,
          supabase_url: userConfig.supabase_url,
          supabase_key: userConfig.supabase_key,
          status: "completed",
          progress: 100,
          total_jobs_found: jobs.length,
          jobs_scraped: savedJobs.length,
          jobs_updated: 0,
          jobs_failed: jobs.length - savedJobs.length,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()

    if (taskError) {
      console.error("记录爬取任务失败:", taskError)
    }

    return NextResponse.json({
      success: true,
      message: `成功爬取 ${savedJobs.length} 个职位`,
      data: {
        totalJobs: jobs.length,
        savedJobs: savedJobs.length,
        failedJobs: jobs.length - savedJobs.length,
        jobs: savedJobs
      }
    })

  } catch (error) {
    console.error("爬取失败:", error)
    return NextResponse.json(
      { error: `爬取失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const response = {
    message: "Job Scraping API (API Mode)",
    description: "Uses direct API calls to fetch job data from recruitment websites",
    endpoints: {
      POST: "/api/scrape - Start API-based scraping (Authentication required)",
      GET: "/api/scraping-configs - Get supported website configurations",
    },
    supported_websites: Object.keys(DEFAULT_SCRAPING_CONFIGS),
    scraping_method: "API",
    authentication: user ? "Authenticated" : "Not authenticated",
  }

  return NextResponse.json(response)
}
