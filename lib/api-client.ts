import { createClient } from "@/lib/supabase/client"

export interface ScrapeRequest {
  targetUrl: string
  supabaseUrl?: string
  supabaseKey?: string
  websiteType?: string
  maxPages?: number
  enableDeduplication?: boolean
  apiConfig?: any
}

export interface ScrapeResponse {
  success: boolean
  message?: string
  stats?: {
    total_found: number
    jobs_processed: number
    jobs_saved: number
    companies_saved: number
    pages_scraped: number
    website_type: string
  }
  jobs?: any[]
  saved_jobs?: any[]
  error?: string
  details?: string
}

export interface ScrapingConfig {
  id: string
  name: string
  display_name: string
  base_url: string
  example_urls: string[]
  description: string
  supported_features: string[]
  rate_limit_ms: number
  max_pages: number
  status: string
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`
    }

    return headers
  }

  async scrapeJobs(request: ScrapeRequest): Promise<ScrapeResponse> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await fetch(`${this.baseUrl}/api/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetUrl: request.targetUrl,
          websiteType: request.websiteType,
          maxPages: request.maxPages,
          apiConfig: request.apiConfig,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("Scrape API error:", error)
      throw error
    }
  }

  async getScrapingConfigs(): Promise<{ configs: ScrapingConfig[]; total: number; active_count: number }> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await fetch(`${this.baseUrl}/api/scraping-configs`, {
        headers,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("Get configs API error:", error)
      throw error
    }
  }

  async getTaskStatus(taskId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await fetch(`${this.baseUrl}/api/scraping-status/${taskId}`, {
        headers,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("Get task status API error:", error)
      throw error
    }
  }

  async updateTaskStatus(taskId: string, status: any): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await fetch(`${this.baseUrl}/api/scraping-status/${taskId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(status),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("Update task status API error:", error)
      throw error
    }
  }

  async createTask(taskId: string, initialStatus: any): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()

      const response = await fetch(`${this.baseUrl}/api/scraping-status/${taskId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(initialStatus),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("Create task API error:", error)
      throw error
    }
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("Health check API error:", error)
      throw error
    }
  }
}

// 默认客户端实例
export const apiClient = new ApiClient()
