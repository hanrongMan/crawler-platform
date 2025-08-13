import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"
import { createSupabaseClient } from "./client"

export type Company = Database["public"]["Tables"]["companies"]["Row"]
export type Job = Database["public"]["Tables"]["jobs"]["Row"]
export type ScrapingTask = Database["public"]["Tables"]["scraping_tasks"]["Row"]
export type ScrapingConfig = Database["public"]["Tables"]["scraping_configs"]["Row"]

export class SupabaseOperations {
  private supabase: SupabaseClient<Database>

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createSupabaseClient(supabaseUrl, supabaseKey)
  }

  // 公司操作
  async createCompany(company: Database["public"]["Tables"]["companies"]["Insert"]): Promise<Company> {
    const { data, error } = await this.supabase.from("companies").insert(company).select().single()

    if (error) {
      throw new Error(`Failed to create company: ${error.message}`)
    }

    return data
  }

  async upsertCompanies(companies: Database["public"]["Tables"]["companies"]["Insert"][]): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from("companies")
      .upsert(companies, {
        onConflict: "name",
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      throw new Error(`Failed to upsert companies: ${error.message}`)
    }

    return data || []
  }

  async getCompanyByName(name: string): Promise<Company | null> {
    const { data, error } = await this.supabase.from("companies").select("*").eq("name", name).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      throw new Error(`Failed to get company: ${error.message}`)
    }

    return data
  }

  // 职位操作
  async createJob(job: Database["public"]["Tables"]["jobs"]["Insert"]): Promise<Job> {
    const { data, error } = await this.supabase.from("jobs").insert(job).select().single()

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`)
    }

    return data
  }

  async upsertJobs(jobs: Database["public"]["Tables"]["jobs"]["Insert"][]): Promise<Job[]> {
    const { data, error } = await this.supabase
      .from("jobs")
      .upsert(jobs, {
        onConflict: "source_website,external_job_id",
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      throw new Error(`Failed to upsert jobs: ${error.message}`)
    }

    return data || []
  }

  async getJobsBySourceWebsite(sourceWebsite: string, limit = 100): Promise<Job[]> {
    const { data, error } = await this.supabase
      .from("jobs")
      .select("*")
      .eq("source_website", sourceWebsite)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get jobs: ${error.message}`)
    }

    return data || []
  }

  async searchJobs(query: {
    title?: string
    location?: string
    company?: string
    skills?: string[]
    salaryMin?: number
    salaryMax?: number
    limit?: number
  }): Promise<Job[]> {
    let queryBuilder = this.supabase.from("jobs").select(`
      *,
      companies (
        name,
        logo_url,
        website_url
      )
    `)

    if (query.title) {
      queryBuilder = queryBuilder.ilike("title", `%${query.title}%`)
    }

    if (query.location) {
      queryBuilder = queryBuilder.ilike("location", `%${query.location}%`)
    }

    if (query.salaryMin) {
      queryBuilder = queryBuilder.gte("salary_min", query.salaryMin)
    }

    if (query.salaryMax) {
      queryBuilder = queryBuilder.lte("salary_max", query.salaryMax)
    }

    if (query.skills && query.skills.length > 0) {
      queryBuilder = queryBuilder.contains("skills", JSON.stringify(query.skills))
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false }).limit(query.limit || 50)

    if (error) {
      throw new Error(`Failed to search jobs: ${error.message}`)
    }

    return data || []
  }

  // 爬取任务操作
  async createScrapingTask(task: Database["public"]["Tables"]["scraping_tasks"]["Insert"]): Promise<ScrapingTask> {
    const { data, error } = await this.supabase.from("scraping_tasks").insert(task).select().single()

    if (error) {
      throw new Error(`Failed to create scraping task: ${error.message}`)
    }

    return data
  }

  async updateScrapingTask(
    id: string,
    updates: Database["public"]["Tables"]["scraping_tasks"]["Update"],
  ): Promise<ScrapingTask> {
    const { data, error } = await this.supabase.from("scraping_tasks").update(updates).eq("id", id).select().single()

    if (error) {
      throw new Error(`Failed to update scraping task: ${error.message}`)
    }

    return data
  }

  async getScrapingTask(id: string): Promise<ScrapingTask | null> {
    const { data, error } = await this.supabase.from("scraping_tasks").select("*").eq("id", id).single()

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get scraping task: ${error.message}`)
    }

    return data
  }

  async getRecentScrapingTasks(limit = 10): Promise<ScrapingTask[]> {
    const { data, error } = await this.supabase
      .from("scraping_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get scraping tasks: ${error.message}`)
    }

    return data || []
  }

  // 爬取配置操作
  async getScrapingConfigs(): Promise<ScrapingConfig[]> {
    const { data, error } = await this.supabase
      .from("scraping_configs")
      .select("*")
      .eq("is_active", true)
      .order("website_name")

    if (error) {
      throw new Error(`Failed to get scraping configs: ${error.message}`)
    }

    return data || []
  }

  async getScrapingConfigByWebsite(websiteName: string): Promise<ScrapingConfig | null> {
    const { data, error } = await this.supabase
      .from("scraping_configs")
      .select("*")
      .eq("website_name", websiteName)
      .single()

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get scraping config: ${error.message}`)
    }

    return data
  }

  // 统计操作
  async getJobStats(): Promise<{
    totalJobs: number
    totalCompanies: number
    jobsByWebsite: Record<string, number>
    jobsByLocation: Record<string, number>
  }> {
    // 总职位数
    const { count: totalJobs } = await this.supabase.from("jobs").select("*", { count: "exact", head: true })

    // 总公司数
    const { count: totalCompanies } = await this.supabase.from("companies").select("*", { count: "exact", head: true })

    // 按网站统计
    const { data: websiteStats } = await this.supabase
      .from("jobs")
      .select("source_website")
      .then(({ data }) => {
        const stats: Record<string, number> = {}
        data?.forEach((job) => {
          stats[job.source_website] = (stats[job.source_website] || 0) + 1
        })
        return { data: stats }
      })

    // 按地点统计
    const { data: locationStats } = await this.supabase
      .from("jobs")
      .select("location")
      .not("location", "is", null)
      .then(({ data }) => {
        const stats: Record<string, number> = {}
        data?.forEach((job) => {
          if (job.location) {
            stats[job.location] = (stats[job.location] || 0) + 1
          }
        })
        return { data: stats }
      })

    return {
      totalJobs: totalJobs || 0,
      totalCompanies: totalCompanies || 0,
      jobsByWebsite: websiteStats || {},
      jobsByLocation: locationStats || {},
    }
  }
}
