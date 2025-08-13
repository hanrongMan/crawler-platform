export interface ScrapingConfig {
  website_name: string
  display_name: string
  base_url: string
  selectors: {
    jobList: string
    title: string
    department?: string
    location?: string
    experience?: string
    salary?: string
    description?: string
    requirements?: string
    benefits?: string
    skills?: string
    publishTime?: string
    companyName?: string
    jobType?: string
  }
  pagination_config?: {
    nextPageSelector?: string
    pageParamName?: string
    startPage?: number
  }
  rate_limit_ms: number
  max_pages: number
}

export interface JobData {
  title: string
  company_name?: string
  department?: string
  location?: string
  experience_level?: string
  job_type?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  description?: string
  requirements?: string
  benefits?: string
  skills?: string[]
  original_url: string
  source_website: string
  external_job_id?: string
  contact_email?: string
  publish_time?: string
}

export interface ScrapingResult {
  success: boolean
  jobs: JobData[]
  total_found: number
  pages_scraped: number
  error?: string
  error_details?: any
}

export abstract class BaseScraper {
  protected config: ScrapingConfig
  protected baseUrl: string

  constructor(config: ScrapingConfig) {
    this.config = config
    this.baseUrl = config.base_url
  }

  abstract scrapeJobs(targetUrl: string, maxPages?: number): Promise<ScrapingResult>

  protected async fetchWithDelay(url: string, delay = 1000): Promise<string> {
    try {
      // 添加延迟以避免被反爬虫机制检测
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.text()
    } catch (error) {
      console.error("Fetch error:", error)
      throw error
    }
  }

  protected parseHTML(html: string): Document {
    const parser = new DOMParser()
    return parser.parseFromString(html, "text/html")
  }

  protected extractText(element: Element | null, selector?: string): string {
    if (!element) return ""

    if (selector) {
      const targetElement = element.querySelector(selector)
      return targetElement?.textContent?.trim() || ""
    }

    return element.textContent?.trim() || ""
  }

  protected extractAttribute(element: Element | null, attribute: string, selector?: string): string {
    if (!element) return ""

    if (selector) {
      const targetElement = element.querySelector(selector)
      return targetElement?.getAttribute(attribute) || ""
    }

    return element.getAttribute(attribute) || ""
  }

  protected extractMultipleTexts(element: Element | null, selector: string): string[] {
    if (!element) return []

    const elements = element.querySelectorAll(selector)
    return Array.from(elements)
      .map((el) => el.textContent?.trim() || "")
      .filter((text) => text)
  }

  protected parseSalary(salaryText: string): { min?: number; max?: number; currency?: string } {
    if (!salaryText) return {}

    // 匹配各种薪资格式
    const patterns = [
      /(\d+)-(\d+)k/i, // 15-25k
      /(\d+)k-(\d+)k/i, // 15k-25k
      /(\d+)-(\d+)万/i, // 15-25万
      /(\d+)万-(\d+)万/i, // 15万-25万
      /(\d+)-(\d+)/i, // 15000-25000
    ]

    for (const pattern of patterns) {
      const match = salaryText.match(pattern)
      if (match) {
        let min = Number.parseInt(match[1])
        let max = Number.parseInt(match[2])

        // 处理k和万的单位
        if (salaryText.includes("k") || salaryText.includes("K")) {
          min *= 1000
          max *= 1000
        } else if (salaryText.includes("万")) {
          min *= 10000
          max *= 10000
        }

        return {
          min,
          max,
          currency: "CNY",
        }
      }
    }

    return {}
  }

  protected generateJobId(title: string, company: string, location: string): string {
    const combined = `${title}-${company}-${location}`.toLowerCase()
    return btoa(combined)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 16)
  }

  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .replace(/[\r\n\t]/g, " ")
      .trim()
  }

  protected isValidJobData(job: JobData): boolean {
    return !!(job.title && job.title.length > 0 && job.original_url)
  }
}
