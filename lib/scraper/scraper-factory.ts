import type { BaseScraper, ScrapingConfig } from "./base-scraper"
import { TencentApiScraper, ByteDanceApiScraper, AlibabaApiScraper } from "./api-scrapers"
import { ManualApiScraper, type ManualApiConfig } from "./manual-api-scraper"
import { UniversalScraper, type ApiConfig } from "./universal-scraper"
import { TencentScraper } from "./tencent-scraper"

export class ScraperFactory {
  private static scraperMap: Record<string, typeof BaseScraper> = {
    tencent: TencentScraper,
    bytedance: ByteDanceApiScraper,
    alibaba: AlibabaApiScraper,
  }

  static createScraper(config: ScrapingConfig): BaseScraper {
    const ScraperClass = this.scraperMap[config.website_name]

    if (!ScraperClass) {
      throw new Error(`Unsupported website: ${config.website_name}`)
    }

    return new ScraperClass(config)
  }

  static createManualScraper(apiConfig: ManualApiConfig | ApiConfig): ManualApiScraper | UniversalScraper {
    // 检查是否是新的ApiConfig格式
    if ("mapping" in apiConfig && "dataPath" in apiConfig) {
      return new UniversalScraper(apiConfig as ApiConfig)
    }
    return new ManualApiScraper(apiConfig as ManualApiConfig)
  }

  static createUniversalScraper(apiConfig: ApiConfig, logger?: (line: string) => void): UniversalScraper {
    return new UniversalScraper(apiConfig, logger)
  }

  static getSupportedWebsites(): string[] {
    return Object.keys(this.scraperMap)
  }

  static registerScraper(websiteName: string, scraperClass: typeof BaseScraper): void {
    this.scraperMap[websiteName] = scraperClass
  }

  static detectWebsiteType(url: string): string | null {
    const hostname = new URL(url).hostname.toLowerCase()

    if (hostname.includes("join.qq.com") || hostname.includes("tencent") || hostname.includes("careers.tencent.com")) {
      return "tencent"
    }

    if (hostname.includes("jobs.bytedance.com") || hostname.includes("bytedance")) {
      return "bytedance"
    }

    if (hostname.includes("talent-holding.alibaba.com") || hostname.includes("alibaba")) {
      return "alibaba"
    }

    return "manual"
  }

  static getWebsiteInfo(websiteType: string): {
    name: string
    description: string
    apiEndpoint: string
    supportedFeatures: string[]
  } | null {
    const websiteInfo = {
      tencent: {
        name: "腾讯招聘",
        description: "腾讯公司官方招聘平台",
        apiEndpoint: "https://join.qq.com/api/v1/position/searchPosition",
        supportedFeatures: ["职位搜索", "部门筛选", "地点筛选", "API直接调用"],
      },
      bytedance: {
        name: "字节跳动招聘",
        description: "字节跳动公司官方招聘平台",
        apiEndpoint: "需要通过网络分析获取真实API - 推荐使用通用爬虫",
        supportedFeatures: ["职位搜索", "薪资信息", "技能标签", "经验要求"],
      },
      alibaba: {
        name: "阿里巴巴招聘",
        description: "阿里巴巴集团官方招聘平台",
        apiEndpoint: "需要通过网络分析获取真实API - 推荐使用通用爬虫",
        supportedFeatures: ["职位搜索", "多地点支持", "福利信息"],
      },
      manual: {
        name: "手动配置",
        description: "通过分析网络请求手动配置API",
        apiEndpoint: "用户自定义",
        supportedFeatures: ["自定义API", "灵活配置", "支持所有网站"],
      },
      universal: {
        name: "通用爬虫",
        description: "基于API配置的通用爬虫，支持任何招聘网站",
        apiEndpoint: "用户配置的真实API端点",
        supportedFeatures: ["真实API调用", "字段映射", "分页支持", "错误处理"],
      },
    }

    return websiteInfo[websiteType] || null
  }
}
