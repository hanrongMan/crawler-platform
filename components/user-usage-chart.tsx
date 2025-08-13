"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Activity } from "lucide-react"

interface UsageData {
  date: string
  tasks: number
  jobs: number
}

interface UserUsageChartProps {
  userId: string
}

export default function UserUsageChart({ userId }: UserUsageChartProps) {
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const supabase = createClient()

        // Get usage logs from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: usageLogs } = await supabase
          .from("usage_logs")
          .select("created_at, action_type, usage_count, metadata")
          .eq("user_id", userId)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true })

        // Process data by date
        const dataByDate: Record<string, { tasks: number; jobs: number }> = {}

        usageLogs?.forEach((log) => {
          const date = new Date(log.created_at).toLocaleDateString("zh-CN")
          if (!dataByDate[date]) {
            dataByDate[date] = { tasks: 0, jobs: 0 }
          }

          if (log.action_type === "scraping_task") {
            dataByDate[date].tasks += 1
          }

          // Extract job count from metadata if available
          if (log.metadata && typeof log.metadata === "object" && "jobs_saved" in log.metadata) {
            dataByDate[date].jobs += log.metadata.jobs_saved || 0
          }
        })

        // Convert to array format for charts
        const chartData = Object.entries(dataByDate).map(([date, data]) => ({
          date,
          ...data,
        }))

        setUsageData(chartData)
      } catch (error) {
        console.error("Failed to fetch usage data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (usageData.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无使用数据</h3>
        <p className="text-gray-600">开始使用平台后，使用统计将显示在这里</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              任务趋势
            </CardTitle>
            <CardDescription>最近30天的爬取任务数量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              职位数量趋势
            </CardTitle>
            <CardDescription>最近30天爬取的职位数量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="jobs" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
