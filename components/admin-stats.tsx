"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, Activity, Database } from "lucide-react"

interface AdminStatsData {
  userRegistrations: Array<{ date: string; count: number }>
  userStatusDistribution: Array<{ name: string; value: number; color: string }>
  scrapingActivity: Array<{ date: string; tasks: number; jobs: number }>
  totalStats: {
    totalUsers: number
    totalScrapingTasks: number
    totalJobsScraped: number
    activeUsersToday: number
  }
}

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()

        // Get user registrations over time (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: users } = await supabase
          .from("user_profiles")
          .select("created_at, status")
          .gte("created_at", thirtyDaysAgo.toISOString())

        // Get scraping tasks
        const { data: scrapingTasks } = await supabase
          .from("scraping_tasks")
          .select("created_at, jobs_scraped")
          .gte("created_at", thirtyDaysAgo.toISOString())

        // Get all users for status distribution
        const { data: allUsers } = await supabase.from("user_profiles").select("status")

        // Process user registrations by date
        const registrationsByDate: Record<string, number> = {}
        users?.forEach((user) => {
          const date = new Date(user.created_at).toLocaleDateString("zh-CN")
          registrationsByDate[date] = (registrationsByDate[date] || 0) + 1
        })

        const userRegistrations = Object.entries(registrationsByDate).map(([date, count]) => ({
          date,
          count,
        }))

        // Process user status distribution
        const statusCounts: Record<string, number> = {}
        allUsers?.forEach((user) => {
          statusCounts[user.status] = (statusCounts[user.status] || 0) + 1
        })

        const userStatusDistribution = [
          { name: "已批准", value: statusCounts.approved || 0, color: "#10B981" },
          { name: "待审核", value: statusCounts.pending || 0, color: "#F59E0B" },
          { name: "已拒绝", value: statusCounts.rejected || 0, color: "#EF4444" },
          { name: "已暂停", value: statusCounts.suspended || 0, color: "#6B7280" },
        ]

        // Process scraping activity
        const scrapingByDate: Record<string, { tasks: number; jobs: number }> = {}
        scrapingTasks?.forEach((task) => {
          const date = new Date(task.created_at).toLocaleDateString("zh-CN")
          if (!scrapingByDate[date]) {
            scrapingByDate[date] = { tasks: 0, jobs: 0 }
          }
          scrapingByDate[date].tasks += 1
          scrapingByDate[date].jobs += task.jobs_scraped || 0
        })

        const scrapingActivity = Object.entries(scrapingByDate).map(([date, data]) => ({
          date,
          ...data,
        }))

        // Calculate total stats
        const totalStats = {
          totalUsers: allUsers?.length || 0,
          totalScrapingTasks: scrapingTasks?.length || 0,
          totalJobsScraped: scrapingTasks?.reduce((sum, task) => sum + (task.jobs_scraped || 0), 0) || 0,
          activeUsersToday:
            users?.filter((user) => {
              const today = new Date().toDateString()
              return new Date(user.created_at).toDateString() === today
            }).length || 0,
        }

        setStats({
          userRegistrations,
          userStatusDistribution,
          scrapingActivity,
          totalStats,
        })
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">无法加载统计数据</h3>
        <p className="text-gray-600">请稍后重试</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">爬取任务</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStats.totalScrapingTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">爬取职位</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStats.totalJobsScraped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">今日新用户</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStats.activeUsersToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>用户状态分布</CardTitle>
            <CardDescription>当前所有用户的状态分布情况</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.userStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.userStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>用户注册趋势</CardTitle>
            <CardDescription>最近30天的用户注册情况</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.userRegistrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {stats.scrapingActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>爬取活动趋势</CardTitle>
            <CardDescription>最近30天的爬取任务和职位数量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.scrapingActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#10B981" name="任务数" />
                <Bar dataKey="jobs" fill="#F59E0B" name="职位数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
