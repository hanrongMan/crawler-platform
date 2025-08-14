import { BaseScraper, type JobData, type ScrapingResult } from "./base-scraper"

export interface ApiConfig {
  url: string
  method: "GET" | "POST"
  headers?: Record<string, string>
  body?: any
  dataPath: string // JSON路径，如 "data.jobs" 或 "result.list"
  mapping: JobMapping
}

export interface JobMapping {
  title: string
  company?: string
  location?: string
  department?: string
  description?: string
  requirements?: string
  salary_min?: string
  salary_max?: string
  experience_level?: string
  job_type?: string
  skills?: string
  original_url?: string
  external_job_id: string
}

export class UniversalScraper extends BaseScraper {
  private apiConfig: ApiConfig
  private logger?: (line: string) => void

  constructor(apiConfig: ApiConfig, logger?: (line: string) => void) {
    // 从 apiConfig.url 解析 base_url
    let baseUrl = ""
    try {
      const u = new URL(apiConfig.url)
      baseUrl = `${u.protocol}//${u.host}`
    } catch {
      baseUrl = ""
    }

    super({
      website_name: "universal",
      display_name: "通用爬虫",
      base_url: baseUrl,
      selectors: {
        jobList: "",
        title: "",
      },
      pagination_config: undefined,
      rate_limit_ms: 1000,
      max_pages: 10,
    })
    this.apiConfig = apiConfig
    this.logger = logger
  }

  async scrapeJobs(targetUrl: string, maxPages = 5): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false,
      jobs: [],
      total_found: 0,
      pages_scraped: 0,
    }

    try {
      let currentPage = 1
      let hasNextPage = true

      // 预估每页大小，用于判断是否还有下一页
      const expectedPageSize = typeof this.apiConfig?.body?.pageSize === "number"
        ? this.apiConfig.body.pageSize
        : typeof this.apiConfig?.body?.limit === "number"
        ? this.apiConfig.body.limit
        : 20

      while (hasNextPage && currentPage <= maxPages) {
        console.log(`Scraping page ${currentPage} using universal scraper`)

        const apiData = await this.fetchApiData(currentPage)

        if (!apiData) {
          console.log("No data returned from API, stopping...")
          break
        }

        const jobs = this.extractJobsFromResponse(apiData)

        if (jobs.length === 0) {
          console.log("No jobs found in response, stopping...")
          break
        }

        // 转换并打印样例
        const transformedThisPage: JobData[] = []
        for (const jobItem of jobs) {
          const job = this.transformJob(jobItem)
          // 放宽校验：只要有标题或外部ID即可，original_url 在后端归一化时补齐
          if (job && (job.title || job.external_job_id)) transformedThisPage.push(job)
        }

        if (transformedThisPage.length > 0) {
          try {
            this.logger?.(`[extracted] page=${currentPage} count=${transformedThisPage.length} sample=${JSON.stringify(transformedThisPage[0]).slice(0,200)}`)
          } catch {}
        }

        result.jobs.push(...transformedThisPage)

        result.pages_scraped = currentPage

        // 简单的分页逻辑 - 如果返回的数据少于预期，认为没有更多页面
        hasNextPage = jobs.length >= expectedPageSize
        currentPage++

        await this.delay(this.config?.rate_limit_ms ?? 1000)
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("Universal scraper error:", error)
    }

    return result
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async fetchApiData(page: number): Promise<any> {
    try {
      // 构建请求URL，支持分页参数
      let url = this.apiConfig.url
      if (url.includes("{page}")) {
        url = url.replace("{page}", page.toString())
      } else if (this.apiConfig.method === "GET") {
        const separator = url.includes("?") ? "&" : "?"
        url += `${separator}page=${page}`
      }

      // 更新时间戳参数（timestamp 或 ts）为当前时间
      try {
        const urlObj = new URL(url)
        const now = Date.now().toString()
        if (urlObj.searchParams.has("timestamp")) {
          urlObj.searchParams.set("timestamp", now)
        }
        if (urlObj.searchParams.has("ts")) {
          urlObj.searchParams.set("ts", now)
        }
        url = urlObj.toString()
      } catch {
        // 非绝对URL时的兜底替换
        const now = Date.now().toString()
        url = url.replace(/(timestamp|ts)=\d+/i, `$1=${now}`)
      }

      // 构建请求体，支持分页参数
      let body = this.apiConfig.body
      if (body && typeof body === "object") {
        body = { ...body }
        if (body.page !== undefined) {
          body.page = page
        }
        if (body.pageIndex !== undefined) {
          body.pageIndex = page
        }
        if (body.offset !== undefined) {
          body.offset = (page - 1) * (body.limit || body.pageSize || 20)
        }
        // 规范化 pageSize（保留原始或使用默认值）
        if (body.pageSize !== undefined && typeof body.pageSize !== "number") {
          body.pageSize = Number.parseInt(String(body.pageSize)) || 20
        }
        // 若有 limit/offset 的风格，确保同步更新 offset
        if (body.limit !== undefined && body.offset !== undefined) {
          body.offset = (page - 1) * body.limit
        }
      }

      const requestOptions: RequestInit = {
        method: this.apiConfig.method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...this.apiConfig.headers,
        },
      }

      if (body && this.apiConfig.method === "POST") {
        requestOptions.body = JSON.stringify(body)
      }

      // 打印请求信息（避免日志过长，body截断）
      try {
        const bodyPreview = body ? JSON.stringify(body).slice(0, 500) : undefined
        this.logger?.(`[request] page=${page} method=${requestOptions.method} url=${url} body=${bodyPreview ?? ''}`)
      } catch {}

      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()
      // 打印响应信息（预览前1000字符）
      try {
        this.logger?.(`[response] page=${page} ${JSON.stringify(json).slice(0, 500)}`)
      } catch {}
      return json
    } catch (error) {
      console.error("Failed to fetch API data:", error)
      throw error
    }
  }

  private extractJobsFromResponse(data: any): any[] {
    try {
      // 使用dataPath从响应中提取jobs数组
      const path = this.apiConfig.dataPath.split(".")
      let current = data

      for (const key of path) {
        if (current && typeof current === "object" && key in current) {
          current = current[key]
        } else {
          console.warn(`Path ${this.apiConfig.dataPath} not found in response`)
          return []
        }
      }

      return Array.isArray(current) ? current : []
    } catch (error) {
      console.error("Error extracting jobs from response:", error)
      return []
    }
  }

  private transformJob(jobItem: any): JobData {
    const mapping = this.apiConfig.mapping

    return {
      title: this.getValueByPath(jobItem, mapping.title),
      company_name: mapping.company ? this.getValueByPath(jobItem, mapping.company) : undefined,
      location: mapping.location ? this.getValueByPath(jobItem, mapping.location) : undefined,
      department: mapping.department ? this.getValueByPath(jobItem, mapping.department) : undefined,
      job_type: mapping.job_type ? this.getValueByPath(jobItem, mapping.job_type) : undefined,
      description: mapping.description ? this.getValueByPath(jobItem, mapping.description) : undefined,
      requirements: mapping.requirements ? this.getValueByPath(jobItem, mapping.requirements) : undefined,
      salary_min: mapping.salary_min ? this.parseNumber(this.getValueByPath(jobItem, mapping.salary_min)) : undefined,
      salary_max: mapping.salary_max ? this.parseNumber(this.getValueByPath(jobItem, mapping.salary_max)) : undefined,
      experience_level: mapping.experience_level ? this.getValueByPath(jobItem, mapping.experience_level) : undefined,
      skills: mapping.skills ? this.parseSkills(this.getValueByPath(jobItem, mapping.skills)) : undefined,
      original_url: mapping.original_url ? this.getValueByPath(jobItem, mapping.original_url) : undefined,
      external_job_id: this.getValueByPath(jobItem, mapping.external_job_id),
      source_website: "custom",
    }
  }

  private getValueByPath(obj: any, path: string): any {
    try {
      const keys = path.split(".")
      let current = obj

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key]
        } else {
          return undefined
        }
      }

      return typeof current === "string" ? this.cleanText(current) : current
    } catch (error) {
      return undefined
    }
  }

  private parseNumber(value: any): number | undefined {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const num = Number.parseFloat(value.replace(/[^\d.]/g, ""))
      return isNaN(num) ? undefined : num
    }
    return undefined
  }

  private parseSkills(value: any): string[] | undefined {
    if (Array.isArray(value)) {
      return value.map((skill) => (typeof skill === "string" ? skill : String(skill)))
    }
    if (typeof value === "string") {
      return value
        .split(/[,，;；]/)
        .map((skill) => skill.trim())
        .filter(Boolean)
    }
    return undefined
  }
}
