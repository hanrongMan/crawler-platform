"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NetworkAnalyzer } from "@/lib/scraper/network-analyzer"
import { Info, Network, Play } from "lucide-react"

interface NetworkAnalysisGuideProps {
  targetUrl: string
  onApiConfigDetected?: (config: any) => void
}

export function NetworkAnalysisGuide({ targetUrl, onApiConfigDetected }: NetworkAnalysisGuideProps) {
  const [analyzer] = useState(() => new NetworkAnalyzer())
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const result = await analyzer.analyzeWebsite(targetUrl)
      setAnalysisResult(result)
      onApiConfigDetected?.(result.suggestedConfig)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const guide = analyzer.getAnalysisGuide(targetUrl)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          网络请求分析
        </CardTitle>
        <CardDescription>现代招聘网站使用API获取数据，需要分析网络请求来获取正确的数据接口</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guide">分析指南</TabsTrigger>
            <TabsTrigger value="auto">自动分析</TabsTrigger>
            <TabsTrigger value="result">分析结果</TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                由于CORS限制，我们无法直接访问其他网站的API。请按照以下步骤手动分析网络请求。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">分析步骤:</h4>
                <pre className="text-sm whitespace-pre-wrap">{guide}</pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">腾讯招聘</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="outline">POST</Badge>
                    <p className="text-xs text-muted-foreground">/tencentcareer/api/post/Query</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">字节跳动</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="outline">GET</Badge>
                    <p className="text-xs text-muted-foreground">/api/v1/search/job</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">阿里巴巴</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="outline">POST</Badge>
                    <p className="text-xs text-muted-foreground">/api/position/list</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auto" className="space-y-4">
            <div className="text-center space-y-4">
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {isAnalyzing ? "分析中..." : "开始自动分析"}
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>自动分析将尝试识别目标网站的API端点和请求模式</AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            {analysisResult ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">发现的API端点:</h4>
                  <div className="space-y-2">
                    {analysisResult.apiEndpoints.map((endpoint: string, index: number) => (
                      <Badge key={index} variant="secondary" className="mr-2">
                        {endpoint}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">建议配置:</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm">
                      <code>{JSON.stringify(analysisResult.suggestedConfig, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">请先运行分析以查看结果</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
