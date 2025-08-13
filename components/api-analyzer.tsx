"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Network } from "lucide-react"

interface ApiAnalyzerProps {
  onConfigGenerated: (config: any) => void
}

export function ApiAnalyzer({ onConfigGenerated }: ApiAnalyzerProps) {
  const [step, setStep] = useState(1)
  const [networkData, setNetworkData] = useState("")
  const [apiConfig, setApiConfig] = useState({
    endpoint: "",
    method: "GET" as "GET" | "POST",
    headers: "{}",
    body: "",
    responseDataPath: "",
    jobMapping: {
      title: "",
      company: "",
      location: "",
      department: "",
      description: "",
      requirements: "",
      url: "",
      id: "",
    },
  })

  const handleAnalyzeNetwork = () => {
    try {
      const data = JSON.parse(networkData)
      // 自动填充一些常见的配置
      if (data.url) {
        setApiConfig((prev) => ({ ...prev, endpoint: data.url }))
      }
      if (data.method) {
        setApiConfig((prev) => ({ ...prev, method: data.method.toUpperCase() }))
      }
      if (data.headers) {
        setApiConfig((prev) => ({ ...prev, headers: JSON.stringify(data.headers, null, 2) }))
      }
      if (data.body) {
        setApiConfig((prev) => ({ ...prev, body: JSON.stringify(data.body, null, 2) }))
      }
      setStep(2)
    } catch (error) {
      alert("请输入有效的JSON格式网络请求数据")
    }
  }

  const generateConfig = () => {
    try {
      const config = {
        endpoint: apiConfig.endpoint,
        method: apiConfig.method,
        headers: JSON.parse(apiConfig.headers),
        body: apiConfig.body ? apiConfig.body : undefined,
        responseDataPath: apiConfig.responseDataPath,
        jobMapping: apiConfig.jobMapping,
      }
      onConfigGenerated(config)
    } catch (error) {
      alert("配置格式错误，请检查JSON格式")
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          API 分析工具
        </CardTitle>
        <CardDescription>分析招聘网站的网络请求，生成爬虫配置</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 操作步骤：</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>打开目标招聘网站（如腾讯招聘）</li>
                <li>按F12打开开发者工具，切换到"网络"标签</li>
                <li>在网站上搜索职位或翻页</li>
                <li>找到返回职位数据的API请求（通常是XHR类型）</li>
                <li>右键该请求 → 复制 → 复制为cURL或复制响应</li>
                <li>将数据粘贴到下方文本框</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="network-data">网络请求数据 (JSON格式)</Label>
              <Textarea
                id="network-data"
                placeholder='粘贴网络请求数据，例如：
{
  "url": "https://join.qq.com/post.html?page=1",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "page": 1,
    "limit": 20
  }
}'
                value={networkData}
                onChange={(e) => setNetworkData(e.target.value)}
                rows={10}
              />
            </div>

            <Button onClick={handleAnalyzeNetwork} className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              分析网络请求
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">API端点</Label>
                <Input
                  id="endpoint"
                  value={apiConfig.endpoint}
                  onChange={(e) => setApiConfig((prev) => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://api.example.com/jobs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">请求方法</Label>
                <Select
                  value={apiConfig.method}
                  onValueChange={(value: "GET" | "POST") => setApiConfig((prev) => ({ ...prev, method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">请求头 (JSON格式)</Label>
              <Textarea
                id="headers"
                value={apiConfig.headers}
                onChange={(e) => setApiConfig((prev) => ({ ...prev, headers: e.target.value }))}
                rows={4}
              />
            </div>

            {apiConfig.method === "POST" && (
              <div className="space-y-2">
                <Label htmlFor="body">请求体 (JSON格式)</Label>
                <Textarea
                  id="body"
                  value={apiConfig.body}
                  onChange={(e) => setApiConfig((prev) => ({ ...prev, body: e.target.value }))}
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="response-path">响应数据路径</Label>
              <Input
                id="response-path"
                value={apiConfig.responseDataPath}
                onChange={(e) => setApiConfig((prev) => ({ ...prev, responseDataPath: e.target.value }))}
                placeholder="data.jobs 或 result.list"
              />
              <p className="text-sm text-gray-500">职位数组在响应JSON中的路径，用点号分隔</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">字段映射配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(apiConfig.jobMapping).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key}>
                      {key === "title"
                        ? "职位标题*"
                        : key === "company"
                          ? "公司名称"
                          : key === "location"
                            ? "工作地点"
                            : key === "department"
                              ? "部门"
                              : key === "description"
                                ? "职位描述"
                                : key === "requirements"
                                  ? "任职要求"
                                  : key === "url"
                                    ? "详情链接"
                                    : "ID"}
                    </Label>
                    <Input
                      id={key}
                      value={value}
                      onChange={(e) =>
                        setApiConfig((prev) => ({
                          ...prev,
                          jobMapping: { ...prev.jobMapping, [key]: e.target.value },
                        }))
                      }
                      placeholder={`如: ${key === "title" ? "name 或 title" : key}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline">
                返回上一步
              </Button>
              <Button onClick={generateConfig} className="flex-1">
                生成爬虫配置
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
