import { BaseScraper, type JobData, type ScrapingResult } from "./base-scraper"

// API响应类型定义
interface TencentApiResponse {
  Data: {
    Posts: Array<{
      PostId: string
      PostName: string
      LocationName: string
      CategoryName: string
      Responsibility: string
      Requirement: string
      PostURL: string
    }>
    Count: number
  }
  Message: string
}

interface ByteDanceApiResponse {
  data: {
    job_post_list: Array<{
      id: string
      title: string
      city_info: { name: string }
      category: string
      description: string
      requirement: string
      detail_url: string
      salary: { min: number; max: number; currency: string }
      experience: string
      skills: string[]
    }>
    has_more: boolean
    total: number
  }
}

interface AlibabaApiResponse {
  content: {
    datas: Array<{
      id: string
      name: string
      workLocation: string[]
      department: string
      description: string
      requirement: string
      detailUrl: string
      workExperience: string
    }>
    totalCount: number
    hasMore: boolean
  }
}

export class TencentApiScraper extends BaseScraper {
  private readonly apiEndpoint = "https://careers.tencent.com/tencentcareer/api/post/Query"

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

      while (hasNextPage && currentPage <= maxPages) {
        console.log(`Scraping Tencent API page ${currentPage}`)

        const apiData = await this.fetchApiData(currentPage)

        if (!apiData?.Data?.Posts || apiData.Data.Posts.length === 0) {
          console.log("No more jobs found, stopping...")
          break
        }

        for (const jobItem of apiData.Data.Posts) {
          const job = this.transformTencentJob(jobItem)
          if (job && this.isValidJobData(job)) {
            result.jobs.push(job)
          }
        }

        result.pages_scraped = currentPage

        // 检查是否还有更多数据
        hasNextPage = apiData.Data.Posts.length >= 10 // 假设每页10条
        currentPage++

        // 添加延迟避免请求过快
        await this.delay(this.config.rate_limit_ms)
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("Tencent API scraping error:", error)
    }

    return result
  }

  private async fetchApiData(page: number): Promise<TencentApiResponse | null> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://careers.tencent.com/",
        },
        body: JSON.stringify({
          CountryId: "",
          KeyWord: "",
          CategoryId: "",
          ProductId: "",
          LocationId: "",
          Offset: (page - 1) * 10,
          Limit: 10,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch Tencent API data:", error)
      return null
    }
  }

  private transformTencentJob(jobItem: TencentApiResponse["Data"]["Posts"][0]): JobData {
    return {
      title: this.cleanText(jobItem.PostName),
      company_name: "腾讯",
      department: jobItem.CategoryName ? this.cleanText(jobItem.CategoryName) : undefined,
      location: jobItem.LocationName ? this.cleanText(jobItem.LocationName) : undefined,
      description: jobItem.Responsibility ? this.cleanText(jobItem.Responsibility) : undefined,
      requirements: jobItem.Requirement ? this.cleanText(jobItem.Requirement) : undefined,
      original_url: jobItem.PostURL || `https://careers.tencent.com/jobdesc.html?postId=${jobItem.PostId}`,
      source_website: "tencent",
      external_job_id: jobItem.PostId,
    }
  }
}

export class ByteDanceApiScraper extends BaseScraper {
  private readonly apiEndpoint = "https://jobs.bytedance.com/api/v1/search/job"

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

      while (hasNextPage && currentPage <= maxPages) {
        console.log(`Scraping ByteDance API page ${currentPage}`)

        const apiData = await this.fetchApiData(currentPage)

        if (!apiData?.data?.job_post_list || apiData.data.job_post_list.length === 0) {
          console.log("No more jobs found, stopping...")
          break
        }

        for (const jobItem of apiData.data.job_post_list) {
          const job = this.transformByteDanceJob(jobItem)
          if (job && this.isValidJobData(job)) {
            result.jobs.push(job)
          }
        }

        result.pages_scraped = currentPage
        hasNextPage = apiData.data.has_more
        currentPage++

        await this.delay(this.config.rate_limit_ms)
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("ByteDance API scraping error:", error)
    }

    return result
  }

  private async fetchApiData(page: number): Promise<ByteDanceApiResponse | null> {
    try {
      const response = await fetch(`${this.apiEndpoint}?page=${page}&limit=20`, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://jobs.bytedance.com/",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch ByteDance API data:", error)
      return null
    }
  }

  private transformByteDanceJob(jobItem: ByteDanceApiResponse["data"]["job_post_list"][0]): JobData {
    return {
      title: this.cleanText(jobItem.title),
      company_name: "字节跳动",
      department: jobItem.category ? this.cleanText(jobItem.category) : undefined,
      location: jobItem.city_info?.name ? this.cleanText(jobItem.city_info.name) : undefined,
      experience_level: jobItem.experience ? this.cleanText(jobItem.experience) : undefined,
      salary_min: jobItem.salary?.min,
      salary_max: jobItem.salary?.max,
      salary_currency: jobItem.salary?.currency || "CNY",
      description: jobItem.description ? this.cleanText(jobItem.description) : undefined,
      requirements: jobItem.requirement ? this.cleanText(jobItem.requirement) : undefined,
      skills: jobItem.skills && jobItem.skills.length > 0 ? jobItem.skills : undefined,
      original_url: jobItem.detail_url || `https://jobs.bytedance.com/experienced/position/detail/${jobItem.id}`,
      source_website: "bytedance",
      external_job_id: jobItem.id,
    }
  }
}

export class AlibabaApiScraper extends BaseScraper {
  private readonly apiEndpoint = "https://talent-holding.alibaba.com/campus/api/position/list"

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

      while (hasNextPage && currentPage <= maxPages) {
        console.log(`Scraping Alibaba API page ${currentPage}`)

        const apiData = await this.fetchApiData(currentPage)

        if (!apiData?.content?.datas || apiData.content.datas.length === 0) {
          console.log("No more jobs found, stopping...")
          break
        }

        for (const jobItem of apiData.content.datas) {
          const job = this.transformAlibabaJob(jobItem)
          if (job && this.isValidJobData(job)) {
            result.jobs.push(job)
          }
        }

        result.pages_scraped = currentPage
        hasNextPage = apiData.content.hasMore
        currentPage++

        await this.delay(this.config.rate_limit_ms)
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("Alibaba API scraping error:", error)
    }

    return result
  }

  private async fetchApiData(page: number): Promise<AlibabaApiResponse | null> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://talent-holding.alibaba.com/",
        },
        body: JSON.stringify({
          pageIndex: page,
          pageSize: 20,
          lang: "zh",
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch Alibaba API data:", error)
      return null
    }
  }

  private transformAlibabaJob(jobItem: AlibabaApiResponse["content"]["datas"][0]): JobData {
    return {
      title: this.cleanText(jobItem.name),
      company_name: "阿里巴巴",
      department: jobItem.department ? this.cleanText(jobItem.department) : undefined,
      location:
        jobItem.workLocation && jobItem.workLocation.length > 0
          ? this.cleanText(jobItem.workLocation.join(", "))
          : undefined,
      experience_level: jobItem.workExperience ? this.cleanText(jobItem.workExperience) : undefined,
      description: jobItem.description ? this.cleanText(jobItem.description) : undefined,
      requirements: jobItem.requirement ? this.cleanText(jobItem.requirement) : undefined,
      original_url: jobItem.detailUrl || `https://talent-holding.alibaba.com/position/detail?id=${jobItem.id}`,
      source_website: "alibaba",
      external_job_id: jobItem.id,
    }
  }
}
