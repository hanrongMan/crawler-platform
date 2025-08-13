import { BaseScraper, type ScrapingResult, type JobData } from "./base-scraper"

export interface ManualApiConfig {
  endpoint: string
  method: "GET" | "POST"
  headers: Record<string, string>
  body?: string
  responseDataPath: string // JSON路径，如 "data.jobs" 或 "result.list"
  jobMapping: {
    title: string
    company?: string
    location?: string
    department?: string
    description?: string
    requirements?: string
    salary?: string
    experience?: string
    url?: string
    id?: string
  }
}

export class ManualApiScraper extends BaseScraper {
  constructor(private config: ManualApiConfig) {
    super()
  }

  async scrapeJobs(targetUrl: string, maxPages = 5): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false,
      jobs: [],
      total_found: 0,
      pages_scraped: 0,
    }

    try {
      console.log(`Using manual API configuration for: ${this.config.endpoint}`)

      // 解析请求体中的分页参数
      let requestBody = this.config.body ? JSON.parse(this.config.body) : {}

      for (let page = 1; page <= maxPages; page++) {
        // 更新分页参数
        if (this.config.method === "POST" && requestBody) {
          requestBody = this.updatePaginationParams(requestBody, page)
        }

        const apiData = await this.fetchApiData(page, requestBody)

        if (!apiData) {
          console.log("No API response, stopping...")
          break
        }

        const jobs = this.extractJobsFromResponse(apiData)

        if (jobs.length === 0) {
          console.log("No more jobs found, stopping...")
          break
        }

        result.jobs.push(...jobs)
        result.pages_scraped = page

        await this.delay(1000) // 1秒延迟
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("Manual API scraping error:", error)
    }

    return result
  }

  private async fetchApiData(page: number, requestBody?: any): Promise<any> {
    try {
      const url = this.config.method === "GET" ? `${this.config.endpoint}?page=${page}&limit=20` : this.config.endpoint

      const response = await fetch(url, {
        method: this.config.method,
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        ...(this.config.method === "POST" &&
          requestBody && {
            body: JSON.stringify(requestBody),
          }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch manual API data:", error)
      throw error
    }
  }

  private extractJobsFromResponse(apiData: any): JobData[] {
    try {
      // 使用配置的路径提取职位数据
      const jobsArray = this.getNestedValue(apiData, this.config.responseDataPath)

      if (!Array.isArray(jobsArray)) {
        console.warn("Jobs data is not an array:", jobsArray)
        return []
      }

      return jobsArray.map((jobItem) => this.transformJob(jobItem)).filter(Boolean)
    } catch (error) {
      console.error("Error extracting jobs from response:", error)
      return []
    }
  }

  private transformJob(jobItem: any): JobData | null {
    try {
      const job: JobData = {
        title: this.getNestedValue(jobItem, this.config.jobMapping.title),
        company_name: this.config.jobMapping.company
          ? this.getNestedValue(jobItem, this.config.jobMapping.company)
          : "未知公司",
        location: this.config.jobMapping.location
          ? this.getNestedValue(jobItem, this.config.jobMapping.location)
          : undefined,
        department: this.config.jobMapping.department
          ? this.getNestedValue(jobItem, this.config.jobMapping.department)
          : undefined,
        description: this.config.jobMapping.description
          ? this.getNestedValue(jobItem, this.config.jobMapping.description)
          : undefined,
        requirements: this.config.jobMapping.requirements
          ? this.getNestedValue(jobItem, this.config.jobMapping.requirements)
          : undefined,
        original_url: this.config.jobMapping.url ? this.getNestedValue(jobItem, this.config.jobMapping.url) : undefined,
        source_website: "manual",
        external_job_id: this.config.jobMapping.id
          ? this.getNestedValue(jobItem, this.config.jobMapping.id)
          : undefined,
      }

      return this.isValidJobData(job) ? job : null
    } catch (error) {
      console.error("Error transforming job:", error)
      return null
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  private updatePaginationParams(body: any, page: number): any {
    // 常见的分页参数名称
    const paginationKeys = ["page", "pageIndex", "pageNum", "offset", "start"]
    const sizeKeys = ["size", "pageSize", "limit", "count"]

    const updatedBody = { ...body }

    // 更新页码
    for (const key of paginationKeys) {
      if (key in updatedBody) {
        updatedBody[key] = key === "offset" ? (page - 1) * 20 : page
        break
      }
    }

    // 确保有页面大小参数
    let hasSizeParam = false
    for (const key of sizeKeys) {
      if (key in updatedBody) {
        hasSizeParam = true
        break
      }
    }

    if (!hasSizeParam) {
      updatedBody.pageSize = 20
    }

    return updatedBody
  }
}
