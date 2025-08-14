"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, AlertTriangle, LogOut, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { JobResults } from "@/components/job-results"
import { UserGuide } from "@/components/user-guide"
import { SupabaseConnectionTest } from "@/components/supabase-connection-test"
import { EnhancedScrapingForm } from "@/components/enhanced-scraping-form"
import { ApiAnalysisTool } from "@/components/api-analysis-tool"

import { useScrapingContext } from "@/lib/context/scraping-context"
import { ScraperFactory } from "@/lib/scraper/scraper-factory"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/actions"


export default function HomePage() {
  const [scrapedJobs, setScrapedJobs] = useState<any[]>([])
  const [connectionVerified, setConnectionVerified] = useState(false)
  const [supabaseConfig, setSupabaseConfig] = useState({ url: "", key: "" })
  const [currentConfig, setCurrentConfig] = useState<{
    target_url: string
    website_type: string
    supabase_url: string
    supabase_key: string
    api_config?: any
  } | null>(null)

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  const { createTask } = useScrapingContext()

  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      setAuthError(null)

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setAuthError("Supabase配置缺失，请检查环境变量")
        setLoading(false)
        return
      }

      const supabase = createClient()

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("请求超时")), 10000))

      const authPromise = supabase.auth.getUser()

      const {
        data: { user },
      } = (await Promise.race([authPromise, timeoutPromise])) as any

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // 直接从 Supabase 加载默认配置（不经过本地 API）
      try {
        const { data: defaultConfig, error: cfgError } = await supabase
          .from("user_scraping_configs")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle()
        if (!cfgError && defaultConfig) {
          setSupabaseConfig({ url: defaultConfig.supabase_url, key: defaultConfig.supabase_key })
          setConnectionVerified(true)
        }
      } catch (configError) {
        console.warn("加载默认配置失败:", configError)
      }
    } catch (error) {
      console.error("Auth error:", error)
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("请求超时")) {
          setAuthError("网络连接失败，请检查网络连接或稍后重试")
        } else {
          setAuthError(`认证失败: ${error.message}`)
        }
      } else {
        setAuthError("认证过程中发生未知错误")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setAuthError(null)
    checkUser()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  const handleStartScraping = useCallback(async (data: {
    targetUrl: string
    websiteType: string
    apiConfig?: any
  }) => {
    const websiteType = data.websiteType || ScraperFactory.detectWebsiteType(data.targetUrl)
    if (!websiteType) {
      throw new Error("无法识别网站类型，请手动选择")
    }

    // 从数据库获取用户的Supabase配置
    try {
      const supabase = createClient()
      const { data: userConfig, error } = await supabase
        .from("user_scraping_configs")
        .select("supabase_url, supabase_key")
        .eq("user_id", user?.id)
        .eq("is_default", true)
        .maybeSingle()

      if (error || !userConfig) {
        throw new Error("未找到Supabase配置，请先完成连接测试")
      }

      setCurrentConfig({
        target_url: data.targetUrl,
        website_type: websiteType,
        supabase_url: userConfig.supabase_url,
        supabase_key: userConfig.supabase_key,
        api_config: data.apiConfig,
      })

      await createTask({
        targetUrl: data.targetUrl,
        supabaseUrl: userConfig.supabase_url,
        supabaseKey: userConfig.supabase_key,
        websiteType,
        maxPages: 10,
        apiConfig: data.apiConfig,
      })

      setScrapedJobs([])
    } catch (error) {
      throw new Error(`获取配置失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }, [createTask, router, user])

  const handleConnectionSuccess = useCallback((url: string, key: string) => {
    setSupabaseConfig({ url, key })
    setConnectionVerified(true)
  }, [])



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证用户身份...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">连接失败</h3>
            <p className="text-red-700 text-sm mb-4">{authError}</p>
            <div className="space-y-2">
              <Button onClick={handleRetry} className="w-full">
                重试连接
              </Button>
              <Button variant="outline" onClick={() => router.push("/auth/login")} className="w-full">
                返回登录
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">数据爬虫平台</h1>
                <p className="text-sm text-gray-600">Data Scraping Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <UserGuide />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Introduction */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">分析页面&爬取数据&存入supabase</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              用爬取腾讯招聘官网，提取职位信息并存储到您的数据库，作为示例
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>使用说明：</strong>
              请先完成Supabase连接测试，配置会自动保存。然后选择目标网站并开始爬取数据。
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection">Supabase-Config</TabsTrigger>
              <TabsTrigger value="api-analysis">API分析</TabsTrigger>
              <TabsTrigger value="scraping">开始爬取</TabsTrigger>
              <TabsTrigger value="results">爬取结果</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-6">
              <SupabaseConnectionTest onConnectionSuccess={handleConnectionSuccess} userId={user?.id} />
            </TabsContent>

            <TabsContent value="api-analysis" className="space-y-6">
              <ApiAnalysisTool />
            </TabsContent>

            <TabsContent value="scraping" className="space-y-6">
              <EnhancedScrapingForm
                onSubmit={handleStartScraping}
                connectionVerified={connectionVerified}
                onConnectionSuccess={handleConnectionSuccess}
                defaultValues={
                  currentConfig
                    ? {
                        targetUrl: currentConfig.target_url,
                        supabaseUrl: currentConfig.supabase_url,
                        supabaseKey: currentConfig.supabase_key,
                        websiteType: currentConfig.website_type,
                      }
                    : undefined
                }
              />
            </TabsContent>

            <TabsContent value="results">
              <JobResults jobs={scrapedJobs} />
            </TabsContent>
          </Tabs>


        </div>
      </main>
    </div>
  )
}
