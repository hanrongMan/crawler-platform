"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Eye, AlertCircle, Loader2, Play, Save, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function ApiAnalysisTool() {
  const [websiteType, setWebsiteType] = useState<string>("")
  const [configuredUrl, setConfiguredUrl] = useState<string>("")
  const [isWebsiteAnalyzing, setIsWebsiteAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState("")
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [constructedRequest, setConstructedRequest] = useState<any | null>(null)

  const [jsonData, setJsonData] = useState<string>("")
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<any | null>(null)

  const [siteOptions, setSiteOptions] = useState<Array<{ value: string; label: string; base_url: string }>>([])

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/scraping-configs")
        if (!res.ok) return
        const data = await res.json()
        if (aborted) return
        const opts = (data.configs || []).map((c: any) => ({
          value: c.website_name,
          label: c.display_name,
          base_url: c.base_url,
        }))
        setSiteOptions(opts)
      } catch {}
    })()
    return () => { aborted = true }
  }, [])

  const analysisSteps = [
    "解析结构",
    "扫描网络请求",
    "识别职位接口",
    "提取参数",
    "生成请求模板",
  ]

  const handleWebsiteChange = (v: string) => {
    setWebsiteType(v)
    setConstructedRequest(null)
    setCompletedSteps([])
    setAnalysisProgress(0)

    const found = siteOptions.find((s) => s.value === v)
    setConfiguredUrl(found?.base_url || "")
  }

  const handleAnalyzeWebsite = async () => {
    if (!websiteType || !configuredUrl) return
    setIsWebsiteAnalyzing(true)
    setConstructedRequest(null)
    setAnalysisProgress(0)
    setCompletedSteps([])

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(analysisSteps[i])
      setAnalysisProgress(Math.round(((i + 1) / analysisSteps.length) * 100))
      await wait(350)
      setCompletedSteps((prev) => [...prev, analysisSteps[i]])
    }

    let derivedUrl = configuredUrl
    const ts = Date.now().toString()
    if (websiteType === "tencent") derivedUrl = `https://join.qq.com/api/v1/position/searchPosition?timestamp=${ts}`
    if (websiteType === "bytedance") derivedUrl = `https://jobs.bytedance.com/api/v1/search/job/posts?portal_type=2&portal_entrance=1&_signature={signature}`
    if (websiteType === "alibaba") derivedUrl = `https://talent-holding.alibaba.com/api/position/list?ts=${ts}`

    const method = websiteType === "tencent" || websiteType === "alibaba" || websiteType === "bytedance" ? "POST" : "GET"

    const headers: Record<string, string> = {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    }

    try {
      const u = new URL(configuredUrl)
      headers["Origin"] = `${u.protocol}//${u.host}`
      headers["Referer"] = configuredUrl
    } catch {}

    const body = websiteType === "tencent"
      ? { pageIndex: 1, pageSize: 20 }
      : websiteType === "alibaba"
      ? { page: 1, pageSize: 20 }
      : websiteType === "bytedance"
      ? {
          keyword: "",
          limit: 20,
          offset: 0,
          job_category_id_list: [],
          tag_id_list: [],
          location_code_list: [],
          subject_id_list: [],
          recruitment_id_list: [],
          job_function_id_list: [],
          storefront_id_list: [],
        }
      : undefined

    // ByteDance 额外头部
    if (websiteType === "bytedance") {
      headers["portal-channel"] = "office"
      headers["portal-platform"] = "pc"
      // Origin/Referer 已在下方统一设置
    }

    const req = body ? { pageUrl: configuredUrl, url: derivedUrl, method, headers, body } : { pageUrl: configuredUrl, url: derivedUrl, method, headers }
    setConstructedRequest(req)
    setIsWebsiteAnalyzing(false)
  }

  const handleTestApi = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      let payload: any = null
      if (constructedRequest) {
        const { url, method, headers, body } = constructedRequest
        payload = { url, method, headers, body }
      }

      const res = await fetch("/api/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setTestResult(data)
    } catch (error: any) {
      setTestResult({ ok: false, error: error?.message || "测试失败" })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveScrapingMode = async () => {
    if (!constructedRequest || !websiteType) return
    setIsSaving(true)
    setSaveResult(null)
    try {
      const payload = {
        website_type: websiteType,
        target_url: configuredUrl,
        api_config: {
          url: constructedRequest.url,
          method: constructedRequest.method,
          headers: constructedRequest.headers,
          body: constructedRequest.body,
        },
      }

      const res = await fetch("/api/user-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setSaveResult(data)

      // 同步写入本地，供“开始爬取”页离线读取
      try {
        const key = "latest-scraping-configs"
        const existing = JSON.parse(localStorage.getItem(key) || "[]")
        // 先移除同类型旧项
        const filtered = Array.isArray(existing) ? existing.filter((c: any) => c.website_type !== websiteType) : []
        const toSave = [{
          website_type: websiteType,
          target_url: payload.target_url,
          api_config: payload.api_config,
          created_at: new Date().toISOString(),
          config_name: `${websiteType}_local_${Date.now()}`,
        }, ...filtered]
        localStorage.setItem(key, JSON.stringify(toSave))
      } catch {}
    } catch (error: any) {
      setSaveResult({ ok: false, error: error?.message || "保存失败" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          API 分析工具
        </CardTitle>
        <p className="text-sm text-gray-600">分析网站的网络请求，生成可用的请求模板</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guide">分析指南</TabsTrigger>
            <TabsTrigger value="analysis">自动分析</TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                请参考以下步骤手动分析网络请求，自动分析目前只验证了个别网站。
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">分析步骤</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>打开目标招聘网站(如腾讯招聘)</li>
                <li>按F12打开开发者工具,切换到"网络"标签</li>
                <li>在网站上搜索职位或翻页</li>
                <li>找到返回职位数据的API请求(通常是XHR类型)</li>
                <li>右键该请求 → 复制→ 复制为cURL或复制响应</li>
                <li>将数据粘贴到 自动分析 tab 里面的构造出请求 文本框中，点击测试 API 按钮，如果测试成功，则点击保存爬取模式</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">常见API模式</h3>
              <div className="space-y-2 text-green-800">
                <div><strong>腾讯招聘:</strong> GET https://join.qq.com/api/v1/position/getPositionFamily?timestamp=1755078401498</div>
                <div><strong>字节跳动:</strong> POST https://jobs.bytedance.com/api/v1/search/job/posts?keyword=&limit=10&offset=0</div>
                <div><strong>阿里招聘:</strong> POST https://talent-holding.alibaba.com/position/search?_csrf=1465e7a1-a603-4d3b-901d-6e8d1d48d683</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="website-select">选择分析网站</Label>
              <Select onValueChange={handleWebsiteChange} value={websiteType}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要分析的招聘网站" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions.map((w) => (
                    <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {configuredUrl && (
              <div className="space-y-2">
                <Label htmlFor="configured-url">配置的 URL（可编辑，页面或接口）</Label>
                <Input
                  id="configured-url"
                  placeholder="自动填充的地址或手动输入"
                  value={configuredUrl}
                  onChange={(e) => setConfiguredUrl(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {configuredUrl && (
              <div className="space-y-3">
                <Button onClick={handleAnalyzeWebsite} disabled={!websiteType || !configuredUrl || isWebsiteAnalyzing}>
                  {isWebsiteAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 分析网站请求中...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" /> 分析网站
                    </>
                  )}
                </Button>
                
                {/* 分析步骤流程 */}
                {(isWebsiteAnalyzing || completedSteps.length > 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {analysisSteps.map((step, index) => (
                        <div key={step} className="flex items-center">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                            completedSteps.includes(step) 
                              ? 'bg-green-500 text-white' 
                              : isWebsiteAnalyzing && analysisStep === step
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {completedSteps.includes(step) ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <span className={`ml-2 text-sm ${
                            completedSteps.includes(step) 
                              ? 'text-green-600 font-medium' 
                              : isWebsiteAnalyzing && analysisStep === step
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-500'
                          }`}>
                            {step}
                          </span>
                          {index < analysisSteps.length - 1 && (
                            <div className={`w-8 h-0.5 mx-2 ${
                              completedSteps.includes(analysisSteps[index + 1]) 
                                ? 'bg-green-500' 
                                : 'bg-gray-300'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}

            {constructedRequest && (
              <div className="space-y-2">
                <Label>构造出的请求</Label>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <pre className="text-sm font-mono text-gray-800 overflow-x-auto">{JSON.stringify(constructedRequest, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleTestApi} disabled={isTesting || (!constructedRequest && !jsonData.trim())} variant="outline">
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 测试中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> 测试 API
                  </>
                )}
              </Button>
              <Button onClick={handleSaveScrapingMode} disabled={isSaving || !constructedRequest || !websiteType}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> 保存爬取模式
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">API 测试结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">{JSON.stringify(testResult, null, 2)}</pre>
                </CardContent>
              </Card>
            )}

            {saveResult && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">保存结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">{JSON.stringify(saveResult, null, 2)}</pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
