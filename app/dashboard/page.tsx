import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { User, Activity, Database, Settings, History, TrendingUp } from "lucide-react"
import Link from "next/link"
import UserTaskHistory from "@/components/user-task-history"
import UserUsageChart from "@/components/user-usage-chart"

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 简化：不依赖 user_profiles
  const profile: any = {
    full_name: user.user_metadata?.full_name || user.email,
    role: "user",
    login_count: 0,
    daily_scraping_limit: 1000,
    monthly_scraping_limit: 30000,
    current_daily_usage: 0,
    current_monthly_usage: 0,
    status: "approved",
  }

  // Get user statistics
  const { data: recentTasks } = await supabase
    .from("scraping_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: usageLogs } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Calculate usage percentages
  const dailyUsagePercent = (profile.current_daily_usage / profile.daily_scraping_limit) * 100
  const monthlyUsagePercent = (profile.current_monthly_usage / profile.monthly_scraping_limit) * 100

  // Get total stats
  const totalTasks = recentTasks?.length || 0
  const completedTasks = recentTasks?.filter((task) => task.status === "completed").length || 0
  const totalJobsScraped = recentTasks?.reduce((sum, task) => sum + (task.jobs_scraped || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-blue-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">用户仪表板</h1>
                <p className="text-sm text-gray-600">欢迎回来，{profile.full_name || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {profile.role === "admin" ? "管理员" : profile.role === "moderator" ? "审核员" : "用户"}
              </Badge>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Usage Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">总任务数</p>
                    <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">完成任务</p>
                    <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{totalJobsScraped}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">登录次数</p>
                    <p className="text-2xl font-bold text-gray-900">{profile.login_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  日使用限制
                </CardTitle>
                <CardDescription>今日爬取任务使用情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>已使用</span>
                  <span>
                    {profile.current_daily_usage} / {profile.daily_scraping_limit}
                  </span>
                </div>
                <Progress value={dailyUsagePercent} className="h-2" />
                <p className="text-xs text-gray-600">
                  剩余 {profile.daily_scraping_limit - profile.current_daily_usage} 次爬取机会
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  月使用限制
                </CardTitle>
                <CardDescription>本月爬取任务使用情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>已使用</span>
                  <span>
                    {profile.current_monthly_usage} / {profile.monthly_scraping_limit}
                  </span>
                </div>
                <Progress value={monthlyUsagePercent} className="h-2" />
                <p className="text-xs text-gray-600">
                  剩余 {profile.monthly_scraping_limit - profile.current_monthly_usage} 次爬取机会
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks">任务历史</TabsTrigger>
              <TabsTrigger value="usage">使用统计</TabsTrigger>
              <TabsTrigger value="activity">活动日志</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    最近任务
                  </CardTitle>
                  <CardDescription>查看您最近的爬取任务记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserTaskHistory tasks={recentTasks || []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    使用趋势
                  </CardTitle>
                  <CardDescription>查看您的使用情况统计图表</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserUsageChart userId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    活动日志
                  </CardTitle>
                  <CardDescription>查看您的账户活动记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {usageLogs && usageLogs.length > 0 ? (
                      usageLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {log.action_type === "scraping_task" ? "爬取任务" : log.action_type}
                            </p>
                            <p className="text-sm text-gray-600">
                              {log.resource_used} - {new Date(log.created_at).toLocaleString("zh-CN")}
                            </p>
                          </div>
                          <Badge variant="outline">{log.usage_count}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活动记录</h3>
                        <p className="text-gray-600">开始使用平台后，活动记录将显示在这里</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>常用功能快速入口</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Activity className="h-4 w-4 mr-2" />
                    开始爬取
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    账户设置
                  </Button>
                </Link>
                {(profile.role === "admin" || profile.role === "moderator") && (
                  <Link href="/admin">
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      管理面板
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
