"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Copy, Eye, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ApiConfig } from "@/lib/scraper/universal-scraper"

interface ApiConfigBuilderProps {
  onConfigChange: (config: ApiConfig) => void
  initialConfig?: ApiConfig
}

export function ApiConfigBuilder({ onConfigChange, initialConfig }: ApiConfigBuilderProps) {
  const [config, setConfig] = useState<ApiConfig>(
    initialConfig || {
      url: "",
      method: "GET",
      headers: {},
      body: null,
      dataPath: "",
      mapping: {
        title: "",
        external_job_id: "",
      },
    },
  )

  const [headerKey, setHeaderKey] = useState("")
  const [headerValue, setHeaderValue] = useState("")
  const [testResponse, setTestResponse] = useState("")

  const updateConfig = (updates: Partial<ApiConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const addHeader = () => {
    if (headerKey && headerValue) {
      updateConfig({
        headers: { ...config.headers, [headerKey]: headerValue },
      })
      setHeaderKey("")
      setHeaderValue("")
    }
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...config.headers }
    delete newHeaders[key]
    updateConfig({ headers: newHeaders })
  }

  const testApiCall = async () => {
    try {
      const requestOptions: RequestInit = {
        method: config.method,
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
      }

      if (config.body && config.method === "POST") {
        requestOptions.body = typeof config.body === "string" ? config.body : JSON.stringify(config.body)
      }

      const response = await fetch(config.url, requestOptions)
      const data = await response.json()
      setTestResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setTestResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const presetConfigs = [
    {
      name: "腾讯招聘 (示例)",
      config: {
        url: "https://careers.tencent.com/tencentcareer/api/post/Query",
        method: "POST" as const,
        headers: {
          Referer: "https://careers.tencent.com/",
        },
        body: {
          CountryId: "",
          KeyWord: "",
          CategoryId: "",
          ProductId: "",
          LocationId: "",
          Offset: 0,
          Limit: 10,
        },
        dataPath: "Data.Posts",
        mapping: {
          title: "PostName",
          company: "腾讯",
          location: "LocationName",
          department: "CategoryName",
          description: "Responsibility",
          requirements: "Requirement",
          original_url: "PostURL",
          external_job_id: "PostId",
        },
      },
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API 配置构建器</CardTitle>
          <CardDescription>
            配置自定义API端点来爬取招聘数据。请先使用浏览器开发者工具分析目标网站的网络请求。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 预设配置 */}
          <div>
            <Label>预设配置</Label>
            <div className="flex gap-2 mt-2">
              {presetConfigs.map((preset, index) => (
                <Button key={index} variant="outline" size="sm" onClick={() => updateConfig(preset.config)}>
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* API URL */}
          <div>
            <Label htmlFor="api-url">API URL *</Label>
            <Input
              id="api-url"
              value={config.url}
              onChange={(e) => updateConfig({ url: e.target.value })}
              placeholder="https://example.com/api/jobs"
            />
          </div>

          {/* HTTP Method */}
          <div>
            <Label>HTTP 方法</Label>
            <Select value={config.method} onValueChange={(value: "GET" | "POST") => updateConfig({ method: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Headers */}
          <div>
            <Label>请求头</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Header Key" value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} />
                <Input
                  placeholder="Header Value"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                />
                <Button onClick={addHeader} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(config.headers || {}).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {key}: {value}
                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeHeader(key)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Request Body */}
          {config.method === "POST" && (
            <div>
              <Label htmlFor="request-body">请求体 (JSON)</Label>
              <Textarea
                id="request-body"
                value={typeof config.body === "string" ? config.body : JSON.stringify(config.body, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    updateConfig({ body: parsed })
                  } catch {
                    updateConfig({ body: e.target.value })
                  }
                }}
                placeholder='{"page": 1, "limit": 20}'
                rows={4}
              />
            </div>
          )}

          {/* Data Path */}
          <div>
            <Label htmlFor="data-path">数据路径 *</Label>
            <Input
              id="data-path"
              value={config.dataPath}
              onChange={(e) => updateConfig({ dataPath: e.target.value })}
              placeholder="data.jobs 或 result.list"
            />
            <p className="text-sm text-muted-foreground mt-1">
              指定响应JSON中职位数组的路径，如 "data.jobs" 或 "result.list"
            </p>
          </div>

          {/* Test API */}
          <div className="flex gap-2">
            <Button onClick={testApiCall} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              测试API
            </Button>
            {testResponse && (
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(testResponse)}>
                <Copy className="h-4 w-4 mr-2" />
                复制响应
              </Button>
            )}
          </div>

          {testResponse && (
            <div>
              <Label>API 响应</Label>
              <Textarea value={testResponse} readOnly rows={10} className="font-mono text-sm" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>字段映射</CardTitle>
          <CardDescription>将API响应中的字段映射到标准的职位数据结构</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>使用点号分隔的路径来访问嵌套字段，如 "company.name" 或 "location.city"</AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title-mapping">职位标题 *</Label>
              <Input
                id="title-mapping"
                value={config.mapping.title}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, title: e.target.value },
                  })
                }
                placeholder="title 或 job.name"
              />
            </div>

            <div>
              <Label htmlFor="id-mapping">职位ID *</Label>
              <Input
                id="id-mapping"
                value={config.mapping.external_job_id}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, external_job_id: e.target.value },
                  })
                }
                placeholder="id 或 jobId"
              />
            </div>

            <div>
              <Label htmlFor="company-mapping">公司名称</Label>
              <Input
                id="company-mapping"
                value={config.mapping.company || ""}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, company: e.target.value },
                  })
                }
                placeholder="company 或 employer.name"
              />
            </div>

            <div>
              <Label htmlFor="location-mapping">工作地点</Label>
              <Input
                id="location-mapping"
                value={config.mapping.location || ""}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, location: e.target.value },
                  })
                }
                placeholder="location 或 city.name"
              />
            </div>

            <div>
              <Label htmlFor="department-mapping">部门</Label>
              <Input
                id="department-mapping"
                value={config.mapping.department || ""}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, department: e.target.value },
                  })
                }
                placeholder="department 或 category"
              />
            </div>

            <div>
              <Label htmlFor="experience-mapping">经验要求</Label>
              <Input
                id="experience-mapping"
                value={config.mapping.experience_level || ""}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, experience_level: e.target.value },
                  })
                }
                placeholder="experience 或 workYears"
              />
            </div>

            <div>
              <Label htmlFor="salary-min-mapping">最低薪资</Label>
              <Input
                id="salary-min-mapping"
                value={config.mapping.salary_min || ""}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, salary_min: e.target.value },
                  })
                }
                placeholder="salary.min 或 minSalary"
              />
            </div>

            <div>
              <Label htmlFor="salary-max-mapping">最高薪资</Label>
              <Input
                id="salary-max-mapping"
                value={config.mapping.salary_max || ""}
                onChange={(e) =>
                  updateConfig({
                    mapping: { ...config.mapping, salary_max: e.target.value },
                  })
                }
                placeholder="salary.max 或 maxSalary"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description-mapping">职位描述</Label>
            <Input
              id="description-mapping"
              value={config.mapping.description || ""}
              onChange={(e) =>
                updateConfig({
                  mapping: { ...config.mapping, description: e.target.value },
                })
              }
              placeholder="description 或 jobDesc"
            />
          </div>

          <div>
            <Label htmlFor="requirements-mapping">职位要求</Label>
            <Input
              id="requirements-mapping"
              value={config.mapping.requirements || ""}
              onChange={(e) =>
                updateConfig({
                  mapping: { ...config.mapping, requirements: e.target.value },
                })
              }
              placeholder="requirements 或 jobRequirement"
            />
          </div>

          <div>
            <Label htmlFor="skills-mapping">技能要求</Label>
            <Input
              id="skills-mapping"
              value={config.mapping.skills || ""}
              onChange={(e) =>
                updateConfig({
                  mapping: { ...config.mapping, skills: e.target.value },
                })
              }
              placeholder="skills 或 techStack"
            />
          </div>

          <div>
            <Label htmlFor="url-mapping">职位链接</Label>
            <Input
              id="url-mapping"
              value={config.mapping.original_url || ""}
              onChange={(e) =>
                updateConfig({
                  mapping: { ...config.mapping, original_url: e.target.value },
                })
              }
              placeholder="url 或 detailUrl"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
