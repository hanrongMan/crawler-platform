import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield, Activity } from "lucide-react"
import ProfileEditForm from "@/components/profile-edit-form"
import PasswordChangeForm from "@/components/password-change-form"

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  // 个人资料页暂不从 user_profiles 读取，避免外部表依赖
  const { data: profile } = { data: { email: user.email, full_name: user.user_metadata?.full_name || "" } as any }

  if (!profile) {
    redirect("/auth/login")
  }

  // Get user application
  const { data: application } = await supabase.from("user_applications").select("*").eq("user_id", user.id).single()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-200">已批准</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">待审核</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">已拒绝</Badge>
      case "suspended":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">已暂停</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">管理员</Badge>
      case "moderator":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">审核员</Badge>
      default:
        return <Badge variant="outline">用户</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-blue-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
              <p className="text-sm text-gray-600">管理您的账户信息和设置</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                账户概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">邮箱地址</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">姓名</p>
                      <p className="font-medium">{profile.full_name || "未设置"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">注册时间</p>
                      <p className="font-medium">{new Date(profile.created_at).toLocaleDateString("zh-CN")}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">账户状态</p>
                      <div className="mt-1">{getStatusBadge(profile.status)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">用户角色</p>
                      <div className="mt-1">{getRoleBadge(profile.role)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">最后登录</p>
                      <p className="font-medium">
                        {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString("zh-CN") : "从未登录"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Limits */}
          <Card>
            <CardHeader>
              <CardTitle>使用限制</CardTitle>
              <CardDescription>您当前的使用配额和限制</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">日使用限制</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>已使用</span>
                      <span>
                        {profile.current_daily_usage} / {profile.daily_scraping_limit}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((profile.current_daily_usage / profile.daily_scraping_limit) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">月使用限制</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>已使用</span>
                      <span>
                        {profile.current_monthly_usage} / {profile.monthly_scraping_limit}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((profile.current_monthly_usage / profile.monthly_scraping_limit) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">编辑资料</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
              <TabsTrigger value="application">申请信息</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>编辑个人资料</CardTitle>
                  <CardDescription>更新您的个人信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileEditForm profile={profile} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>安全设置</CardTitle>
                  <CardDescription>管理您的账户安全</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordChangeForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="application">
              <Card>
                <CardHeader>
                  <CardTitle>申请信息</CardTitle>
                  <CardDescription>查看您的注册申请详情</CardDescription>
                </CardHeader>
                <CardContent>
                  {application ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">申请原因</label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{application.application_reason}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">预期用途</label>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{application.intended_use_case}</p>
                      </div>
                      {application.organization && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">组织</label>
                          <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{application.organization}</p>
                        </div>
                      )}
                      {application.website_url && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">网站</label>
                          <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                            <a
                              href={application.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {application.website_url}
                            </a>
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>申请时间：{new Date(application.created_at).toLocaleString("zh-CN")}</span>
                        {application.reviewed_at && (
                          <span>审核时间：{new Date(application.reviewed_at).toLocaleString("zh-CN")}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">未找到申请信息</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
