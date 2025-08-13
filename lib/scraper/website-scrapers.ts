import { BaseScraper, type JobData, type ScrapingResult } from "./base-scraper"

export class TencentScraper extends BaseScraper {
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
        const pageUrl = this.buildPageUrl(targetUrl, currentPage)
        console.log(`Scraping Tencent page ${currentPage}: ${pageUrl}`)

        const html = await this.fetchWithDelay(pageUrl, this.config.rate_limit_ms)
        const doc = this.parseHTML(html)

        const jobElements = doc.querySelectorAll(this.config.selectors.jobList)

        if (jobElements.length === 0) {
          console.log("No jobs found on this page, stopping...")
          break
        }

        for (const jobElement of jobElements) {
          const job = this.extractJobData(jobElement, pageUrl)
          if (job && this.isValidJobData(job)) {
            result.jobs.push(job)
          }
        }

        result.pages_scraped = currentPage

        // 检查是否有下一页
        const nextPageElement = doc.querySelector(this.config.pagination_config?.nextPageSelector || ".next-page")
        hasNextPage = nextPageElement && !nextPageElement.classList.contains("disabled")

        currentPage++
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("Tencent scraping error:", error)
    }

    return result
  }

  private buildPageUrl(baseUrl: string, page: number): string {
    const url = new URL(baseUrl)
    url.searchParams.set("page", page.toString())
    return url.toString()
  }

  private extractJobData(element: Element, pageUrl: string): JobData | null {
    try {
      const title = this.extractText(element, this.config.selectors.title)
      if (!title) return null

      const location = this.extractText(element, this.config.selectors.location)
      const department = this.extractText(element, this.config.selectors.department)
      const experience = this.extractText(element, this.config.selectors.experience)
      const description = this.extractText(element, this.config.selectors.description)
      const requirements = this.extractText(element, this.config.selectors.requirements)

      // 提取职位链接
      const linkElement = element.querySelector("a[href]")
      const relativeUrl = linkElement?.getAttribute("href") || ""
      const originalUrl = relativeUrl.startsWith("http") ? relativeUrl : new URL(relativeUrl, this.baseUrl).toString()

      const job: JobData = {
        title: this.cleanText(title),
        company_name: "腾讯",
        department: department ? this.cleanText(department) : undefined,
        location: location ? this.cleanText(location) : undefined,
        experience_level: experience ? this.cleanText(experience) : undefined,
        description: description ? this.cleanText(description) : undefined,
        requirements: requirements ? this.cleanText(requirements) : undefined,
        original_url: originalUrl,
        source_website: "tencent",
        external_job_id: this.generateJobId(title, "腾讯", location || ""),
      }

      return job
    } catch (error) {
      console.error("Error extracting Tencent job data:", error)
      return null
    }
  }
}

export class ByteDanceScraper extends BaseScraper {
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
        const pageUrl = this.buildPageUrl(targetUrl, currentPage)
        console.log(`Scraping ByteDance page ${currentPage}: ${pageUrl}`)

        const html = await this.fetchWithDelay(pageUrl, this.config.rate_limit_ms)
        const doc = this.parseHTML(html)

        const jobElements = doc.querySelectorAll(this.config.selectors.jobList)

        if (jobElements.length === 0) {
          console.log("No jobs found on this page, stopping...")
          break
        }

        for (const jobElement of jobElements) {
          const job = this.extractJobData(jobElement, pageUrl)
          if (job && this.isValidJobData(job)) {
            result.jobs.push(job)
          }
        }

        result.pages_scraped = currentPage

        // 检查是否有下一页
        const nextPageElement = doc.querySelector(
          this.config.pagination_config?.nextPageSelector || ".pagination .next",
        )
        hasNextPage = nextPageElement && !nextPageElement.classList.contains("disabled")

        currentPage++
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("ByteDance scraping error:", error)
    }

    return result
  }

  private buildPageUrl(baseUrl: string, page: number): string {
    const url = new URL(baseUrl)
    url.searchParams.set("page", page.toString())
    return url.toString()
  }

  private extractJobData(element: Element, pageUrl: string): JobData | null {
    try {
      const title = this.extractText(element, this.config.selectors.title)
      if (!title) return null

      const location = this.extractText(element, this.config.selectors.location)
      const department = this.extractText(element, this.config.selectors.department)
      const experience = this.extractText(element, this.config.selectors.experience)
      const salaryText = this.extractText(element, this.config.selectors.salary)
      const description = this.extractText(element, this.config.selectors.description)
      const requirements = this.extractText(element, this.config.selectors.requirements)

      // 提取技能标签
      const skills = this.config.selectors.skills
        ? this.extractMultipleTexts(element, this.config.selectors.skills)
        : []

      // 解析薪资
      const salaryInfo = this.parseSalary(salaryText)

      // 提取职位链接
      const linkElement = element.querySelector("a[href]")
      const relativeUrl = linkElement?.getAttribute("href") || ""
      const originalUrl = relativeUrl.startsWith("http") ? relativeUrl : new URL(relativeUrl, this.baseUrl).toString()

      const job: JobData = {
        title: this.cleanText(title),
        company_name: "字节跳动",
        department: department ? this.cleanText(department) : undefined,
        location: location ? this.cleanText(location) : undefined,
        experience_level: experience ? this.cleanText(experience) : undefined,
        salary_min: salaryInfo.min,
        salary_max: salaryInfo.max,
        salary_currency: salaryInfo.currency,
        description: description ? this.cleanText(description) : undefined,
        requirements: requirements ? this.cleanText(requirements) : undefined,
        skills: skills.length > 0 ? skills : undefined,
        original_url: originalUrl,
        source_website: "bytedance",
        external_job_id: this.generateJobId(title, "字节跳动", location || ""),
      }

      return job
    } catch (error) {
      console.error("Error extracting ByteDance job data:", error)
      return null
    }
  }
}

export class AlibabaScraper extends BaseScraper {
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
        const pageUrl = this.buildPageUrl(targetUrl, currentPage)
        console.log(`Scraping Alibaba page ${currentPage}: ${pageUrl}`)

        const html = await this.fetchWithDelay(pageUrl, this.config.rate_limit_ms)
        const doc = this.parseHTML(html)

        const jobElements = doc.querySelectorAll(this.config.selectors.jobList)

        if (jobElements.length === 0) {
          console.log("No jobs found on this page, stopping...")
          break
        }

        for (const jobElement of jobElements) {
          const job = this.extractJobData(jobElement, pageUrl)
          if (job && this.isValidJobData(job)) {
            result.jobs.push(job)
          }
        }

        result.pages_scraped = currentPage

        // 检查是否有下一页
        const nextPageElement = doc.querySelector(
          this.config.pagination_config?.nextPageSelector || ".pagination .next",
        )
        hasNextPage = nextPageElement && !nextPageElement.classList.contains("disabled")

        currentPage++
      }

      result.total_found = result.jobs.length
      result.success = true
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.error_details = error
      console.error("Alibaba scraping error:", error)
    }

    return result
  }

  private buildPageUrl(baseUrl: string, page: number): string {
    const url = new URL(baseUrl)
    const pageParam = this.config.pagination_config?.pageParamName || "currentPage"
    url.searchParams.set(pageParam, page.toString())
    return url.toString()
  }

  private extractJobData(element: Element, pageUrl: string): JobData | null {
    try {
      const title = this.extractText(element, this.config.selectors.title)
      if (!title) return null

      const location = this.extractText(element, this.config.selectors.location)
      const department = this.extractText(element, this.config.selectors.department)
      const experience = this.extractText(element, this.config.selectors.experience)
      const description = this.extractText(element, this.config.selectors.description)
      const requirements = this.extractText(element, this.config.selectors.requirements)
      const benefits = this.extractText(element, this.config.selectors.benefits)

      // 提取职位链接
      const linkElement = element.querySelector("a[href]")
      const relativeUrl = linkElement?.getAttribute("href") || ""
      const originalUrl = relativeUrl.startsWith("http") ? relativeUrl : new URL(relativeUrl, this.baseUrl).toString()

      const job: JobData = {
        title: this.cleanText(title),
        company_name: "阿里巴巴",
        department: department ? this.cleanText(department) : undefined,
        location: location ? this.cleanText(location) : undefined,
        experience_level: experience ? this.cleanText(experience) : undefined,
        description: description ? this.cleanText(description) : undefined,
        requirements: requirements ? this.cleanText(requirements) : undefined,
        benefits: benefits ? this.cleanText(benefits) : undefined,
        original_url: originalUrl,
        source_website: "alibaba",
        external_job_id: this.generateJobId(title, "阿里巴巴", location || ""),
      }

      return job
    } catch (error) {
      console.error("Error extracting Alibaba job data:", error)
      return null
    }
  }
}
