import type { JobData } from "./base-scraper"

export interface ScrapingProgress {
  status: "pending" | "running" | "completed" | "failed"
  progress: number // 0-100
  currentPage: number
  totalPages: number
  jobsFound: number
  message: string
}

export class ScrapingProgressTracker {
  private callbacks: ((progress: ScrapingProgress) => void)[] = []
  private currentProgress: ScrapingProgress = {
    status: "pending",
    progress: 0,
    currentPage: 0,
    totalPages: 0,
    jobsFound: 0,
    message: "Initializing...",
  }

  onProgress(callback: (progress: ScrapingProgress) => void): void {
    this.callbacks.push(callback)
  }

  updateProgress(update: Partial<ScrapingProgress>): void {
    this.currentProgress = { ...this.currentProgress, ...update }
    this.callbacks.forEach((callback) => callback(this.currentProgress))
  }

  getProgress(): ScrapingProgress {
    return { ...this.currentProgress }
  }

  reset(): void {
    this.currentProgress = {
      status: "pending",
      progress: 0,
      currentPage: 0,
      totalPages: 0,
      jobsFound: 0,
      message: "Initializing...",
    }
  }
}

export class JobDataValidator {
  static validateJob(job: JobData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!job.title || job.title.trim().length === 0) {
      errors.push("Job title is required")
    }

    if (!job.original_url || !this.isValidUrl(job.original_url)) {
      errors.push("Valid original URL is required")
    }

    if (!job.source_website || job.source_website.trim().length === 0) {
      errors.push("Source website is required")
    }

    if (job.salary_min && job.salary_max && job.salary_min > job.salary_max) {
      errors.push("Minimum salary cannot be greater than maximum salary")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static sanitizeJob(job: JobData): JobData {
    return {
      ...job,
      title: this.sanitizeText(job.title),
      company_name: job.company_name ? this.sanitizeText(job.company_name) : undefined,
      department: job.department ? this.sanitizeText(job.department) : undefined,
      location: job.location ? this.sanitizeText(job.location) : undefined,
      experience_level: job.experience_level ? this.sanitizeText(job.experience_level) : undefined,
      job_type: job.job_type ? this.sanitizeText(job.job_type) : undefined,
      description: job.description ? this.sanitizeText(job.description) : undefined,
      requirements: job.requirements ? this.sanitizeText(job.requirements) : undefined,
      benefits: job.benefits ? this.sanitizeText(job.benefits) : undefined,
      skills: job.skills ? job.skills.map((skill) => this.sanitizeText(skill)).filter(Boolean) : undefined,
    }
  }

  private static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .substring(0, 1000) // Limit length
  }
}

export class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private timeWindow: number // in milliseconds

  constructor(maxRequests = 10, timeWindowMs = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindowMs
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()

    // Remove old requests outside the time window
    this.requests = this.requests.filter((time) => now - time < this.timeWindow)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest)

      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    this.requests.push(now)
  }
}

export function detectJobDuplicates(jobs: JobData[]): JobData[] {
  const seen = new Set<string>()
  const uniqueJobs: JobData[] = []

  for (const job of jobs) {
    const key = `${job.title}-${job.company_name}-${job.location}`.toLowerCase()

    if (!seen.has(key)) {
      seen.add(key)
      uniqueJobs.push(job)
    }
  }

  return uniqueJobs
}

export function normalizeJobData(job: JobData): JobData {
  return {
    ...job,
    // Normalize location
    location: job.location ? normalizeLocation(job.location) : undefined,
    // Normalize experience level
    experience_level: job.experience_level ? normalizeExperience(job.experience_level) : undefined,
    // Normalize job type
    job_type: job.job_type ? normalizeJobType(job.job_type) : undefined,
  }
}

function normalizeLocation(location: string): string {
  const locationMap: Record<string, string> = {
    北京: "北京",
    上海: "上海",
    深圳: "深圳",
    广州: "广州",
    杭州: "杭州",
    成都: "成都",
    武汉: "武汉",
    西安: "西安",
    南京: "南京",
    苏州: "苏州",
  }

  for (const [key, value] of Object.entries(locationMap)) {
    if (location.includes(key)) {
      return value
    }
  }

  return location
}

function normalizeExperience(experience: string): string {
  const exp = experience.toLowerCase()

  if (exp.includes("应届") || exp.includes("校招") || exp.includes("0年") || exp.includes("0-1")) {
    return "应届生"
  }
  if (exp.includes("1-3") || exp.includes("1年") || exp.includes("2年") || exp.includes("3年")) {
    return "1-3年"
  }
  if (exp.includes("3-5") || exp.includes("4年") || exp.includes("5年")) {
    return "3-5年"
  }
  if (
    exp.includes("5-10") ||
    exp.includes("6年") ||
    exp.includes("7年") ||
    exp.includes("8年") ||
    exp.includes("9年") ||
    exp.includes("10年")
  ) {
    return "5-10年"
  }
  if (exp.includes("10年以上") || exp.includes("10+")) {
    return "10年以上"
  }

  return experience
}

function normalizeJobType(jobType: string): string {
  const type = jobType.toLowerCase()

  if (type.includes("全职") || type.includes("正式")) {
    return "全职"
  }
  if (type.includes("兼职") || type.includes("part")) {
    return "兼职"
  }
  if (type.includes("实习") || type.includes("intern")) {
    return "实习"
  }
  if (type.includes("合同") || type.includes("contract")) {
    return "合同工"
  }

  return jobType
}
