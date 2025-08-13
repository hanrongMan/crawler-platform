"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Globe, Database, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface ScrapingTask {
  id: string
  target_url: string
  source_website: string
  status: string
  progress: number | null
  total_jobs_found: number | null
  jobs_scraped: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

interface UserTaskHistoryProps {
  tasks: ScrapingTask[]
}

export default function UserTaskHistory({ tasks }: UserTaskHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            已完成
          </Badge>
        )
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            运行中
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            失败
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWebsiteDisplayName = (website: string) => {
    const names: Record<string, string> = {
      tencent: "腾讯招聘",
      bytedance: "字节跳动",
      alibaba: "阿里巴巴",
      manual: "自定义网站",
    }
    return names[website] || website
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务记录</h3>
        <p className="text-gray-600">开始您的第一个爬取任务吧</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{getWebsiteDisplayName(task.source_website)}</span>
                  {getStatusBadge(task.status)}
                </div>

                <div className="text-sm text-gray-600">
                  <p className="truncate max-w-md">{task.target_url}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(task.created_at).toLocaleDateString("zh-CN")}
                  </div>
                  {task.jobs_scraped !== null && (
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      {task.jobs_scraped} 个职位
                    </div>
                  )}
                  {task.progress !== null && task.status === "running" && <div>进度: {task.progress}%</div>}
                </div>

                {task.error_message && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {task.error_message}
                  </div>
                )}
              </div>

              <div className="text-right text-sm text-gray-500">
                {task.completed_at ? (
                  <div>
                    <div>完成时间</div>
                    <div>{new Date(task.completed_at).toLocaleString("zh-CN")}</div>
                  </div>
                ) : task.started_at ? (
                  <div>
                    <div>开始时间</div>
                    <div>{new Date(task.started_at).toLocaleString("zh-CN")}</div>
                  </div>
                ) : (
                  <div>等待开始</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
