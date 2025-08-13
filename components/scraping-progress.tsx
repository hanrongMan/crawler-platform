import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, TrendingUp } from "lucide-react"

interface ScrapingTask {
  id: string
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  jobsFound: number
  error?: string
}

interface ScrapingProgressProps {
  task: ScrapingTask
}

export function ScrapingProgress({ task }: ScrapingProgressProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (task.status) {
      case "running":
        return "bg-blue-600"
      case "completed":
        return "bg-green-600"
      case "failed":
        return "bg-red-600"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = () => {
    switch (task.status) {
      case "running":
        return "爬取中"
      case "completed":
        return "已完成"
      case "failed":
        return "失败"
      default:
        return "等待中"
    }
  }

  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            API爬取进度
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              API模式
            </Badge>
            <Badge variant="outline" className={`${getStatusColor()} text-white border-0`}>
              {getStatusText()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">API请求进度</span>
            <span className="font-semibold">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{task.jobsFound}</div>
            <div className="text-sm text-gray-600">API获取职位</div>
          </div>
          <div className="text-center p-3 bg-cyan-50 rounded-lg">
            <div className="text-2xl font-bold text-cyan-600">{task.progress}%</div>
            <div className="text-sm text-gray-600">完成度</div>
          </div>
        </div>

        {/* Error Message */}
        {task.status === "failed" && task.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              API爬取失败: {task.error}
              <br />
              <span className="text-xs">提示：可能是API接口变更或网络问题</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {task.status === "completed" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              API爬取完成！成功通过API获取 {task.jobsFound} 个职位信息
            </AlertDescription>
          </Alert>
        )}

        {/* API Mode Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 API模式直接调用招聘网站的数据接口，避免了HTML解析问题，数据获取更准确可靠
        </div>
      </CardContent>
    </Card>
  )
}
