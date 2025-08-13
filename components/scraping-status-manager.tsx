"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  X,
  Trash2,
  BarChart3,
  Globe,
  Building,
  Briefcase,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useScrapingContext } from "@/lib/context/scraping-context"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

export function ScrapingStatusManager() {
  const { state, cancelTask, clearCompletedTasks } = useScrapingContext()
  const [remoteTasks, setRemoteTasks] = useState<any[]>([])

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/scraping-tasks")
        if (!res.ok) return
        const data = await res.json()
        if (!aborted && Array.isArray(data.tasks)) setRemoteTasks(data.tasks)
      } catch {}
    })()
    return () => { aborted = true }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "cancelled":
        return <X className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "running":
        return "爬取中"
      case "completed":
        return "已完成"
      case "failed":
        return "失败"
      case "cancelled":
        return "已取消"
      default:
        return "等待中"
    }
  }

  const allTasks = [...remoteTasks, ...state.tasks]
  const completedTasks = allTasks.filter((task) => ["completed", "failed", "cancelled"].includes(task.status))

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            全局统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{state.globalStats.totalTasksCompleted}</span>
              </div>
              <div className="text-sm text-gray-600">完成任务</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{state.globalStats.totalJobsScraped}</span>
              </div>
              <div className="text-sm text-gray-600">爬取职位</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{state.globalStats.totalCompaniesFound}</span>
              </div>
              <div className="text-sm text-gray-600">发现公司</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Task */}
      {state.currentTask && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(state.currentTask.status)}
                当前任务
              </div>
              <Badge className={getStatusColor(state.currentTask.status)}>
                {getStatusText(state.currentTask.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task Info */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>目标网站:</strong> {state.currentTask.targetUrl}
              </div>
              <div className="text-sm text-gray-600">
                <strong>网站类型:</strong> {state.currentTask.websiteType}
              </div>
            </div>

            {/* Progress */}
            {state.currentTask.status === "running" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">进度</span>
                  <span className="font-semibold">{state.currentTask.progress}%</span>
                </div>
                <Progress value={state.currentTask.progress} className="h-2" />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{state.currentTask.jobsFound}</div>
                <div className="text-xs text-gray-600">找到职位</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{state.currentTask.jobsSaved}</div>
                <div className="text-xs text-gray-600">已保存</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">{state.currentTask.companiesSaved}</div>
                <div className="text-xs text-gray-600">公司数</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-gray-600">
                  {state.currentTask.currentPage}/{state.currentTask.totalPages}
                </div>
                <div className="text-xs text-gray-600">页面</div>
              </div>
            </div>

            {/* Error Message */}
            {state.currentTask.status === "failed" && state.currentTask.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">任务失败: {state.currentTask.error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            {state.currentTask.status === "running" && (
              <Button variant="outline" size="sm" onClick={() => cancelTask(state.currentTask!.id)} className="w-full">
                <X className="mr-2 h-4 w-4" />
                取消任务
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task History */}
      {state.tasks.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>任务历史</CardTitle>
              {completedTasks.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCompletedTasks}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  清除已完成
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.tasks.slice(0, 10).map((task, index) => (
                <div key={task.id}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="font-medium text-sm">{task.websiteType}</div>
                        <div className="text-xs text-gray-600">
                          {formatDistanceToNow(new Date(task.createdAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold">{task.jobsSaved} 职位</div>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {getStatusText(task.status)}
                        </Badge>
                      </div>
                      {task.status === "running" && (
                        <Button variant="ghost" size="sm" onClick={() => cancelTask(task.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < Math.min(state.tasks.length - 1, 9) && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {state.tasks.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无爬取任务</h3>
            <p className="text-gray-600 text-center">开始您的第一个爬取任务，任务状态将在这里显示</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
