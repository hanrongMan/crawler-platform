import { BaseScraper } from "./base-scraper"

interface TencentJob {
  id: string
  title: string
  department: string
  location: string
  jobType: string
  experienceLevel: string
  salary?: {
    min?: number
    max?: number
    currency?: string
  }
  description?: string
  requirements?: string
  benefits?: string
  originalUrl: string
  sourceWebsite: string
  scrapedAt: string
}

interface TencentApiResponse {
  code: number
  message: string
  data: {
    list: Array<{
      id: string
      title: string
      department: string
      location: string
      jobType: string
      experienceLevel: string
      salary?: {
        min?: number
        max?: number
        currency?: string
      }
      description?: string
      requirements?: string
      benefits?: string
    }>
    total: number
    page: number
    pageSize: number
  }
}

export class TencentScraper extends BaseScraper {
  private apiUrl = "https://join.qq.com/api/v1/position/searchPosition"
  private baseUrl = "https://join.qq.com"

  async scrapeJobs(targetUrl: string, maxPages: number = 10): Promise<TencentJob[]> {
    const jobs: TencentJob[] = []
    
    try {
      for (let page = 1; page <= maxPages; page++) {
        console.log(`正在爬取第 ${page} 页...`)
        
        const response = await this.makeApiRequest(page)
        
        if (!response || !response.data || !response.data.list) {
          console.log(`第 ${page} 页没有数据，停止爬取`)
          break
        }

        const pageJobs = response.data.list.map(job => this.transformJob(job, targetUrl))
        jobs.push(...pageJobs)

        // 如果当前页的数据少于页面大小，说明已经到最后一页
        if (response.data.list.length < response.data.pageSize) {
          console.log(`第 ${page} 页数据不足，已到最后一页`)
          break
        }

        // 添加延迟避免请求过快
        await this.delay(1000)
      }
    } catch (error) {
      console.error("腾讯招聘爬取失败:", error)
      throw error
    }

    return jobs
  }

  private async makeApiRequest(page: number): Promise<TencentApiResponse> {
    const timestamp = Date.now()
    const url = `${this.apiUrl}?timestamp=${timestamp}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=UTF-8",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7",
      "Origin": "https://join.qq.com",
      "Referer": `https://join.qq.com/post.html?page=${page}`,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    }

    // 适配不同字段命名的请求体，逐一尝试
    const candidateBodies: Array<Record<string, any>> = [
      {
        pageIndex: page,
        pageSize: 20,
        keyword: "",
        workArea: [],
        category: "",
        country: "",
      },
      {
        page: page,
        pageSize: 20,
        keyword: "",
        department: "",
        location: "",
        jobType: "",
        experienceLevel: "",
      },
    ]

    let lastError: any = null
    for (const body of candidateBodies) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          lastError = new Error(`API请求失败: ${response.status} ${response.statusText}`)
          continue
        }

        const json = (await response.json()) as any

        // 校验结果结构是否包含职位列表
        const hasList = Array.isArray(json?.data?.list) && json.data.list.length >= 0
        const hasRecords = Array.isArray(json?.data?.records) && json.data.records.length >= 0
        if (hasList || hasRecords) {
          // 统一为 data.list 格式返回
          if (!hasList && hasRecords) {
            json.data.list = json.data.records
            json.data.pageSize = json.data.pageSize || 20
          }
          return json as TencentApiResponse
        }

        // 若无列表，继续尝试下一种body
        lastError = new Error("API返回结构不包含职位列表")
      } catch (err) {
        lastError = err
      }
    }

    throw lastError || new Error("腾讯招聘API请求失败")
  }

  private transformJob(apiJob: any, targetUrl: string): TencentJob {
    return {
      id: apiJob.id || `tencent_${Date.now()}_${Math.random()}`,
      title: apiJob.title || "",
      department: apiJob.department || "",
      location: apiJob.location || "",
      jobType: apiJob.jobType || "",
      experienceLevel: apiJob.experienceLevel || "",
      salary: apiJob.salary || undefined,
      description: apiJob.description || "",
      requirements: apiJob.requirements || "",
      benefits: apiJob.benefits || "",
      originalUrl: `${this.baseUrl}/post.html?id=${apiJob.id}`,
      sourceWebsite: "腾讯招聘",
      scrapedAt: new Date().toISOString()
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
