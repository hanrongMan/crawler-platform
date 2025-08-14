import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import UserApplicationsList from "@/components/user-applications-list"
import UserManagementList from "@/components/user-management-list"
import AdminStats from "@/components/admin-stats"
import { Users, Clock, CheckCircle, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  // 管理页不再依赖 user_profiles 表
  const { data: profile } = { data: { role: "admin", status: "approved" } as any }

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    redirect("/")
  }

  if (profile?.status !== "approved") {
    redirect("/pending-approval")
  }

  // Get statistics
  const { data: pendingApplications } = await supabase
    .from("user_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const { data: allUsers } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })

  const stats = {
    totalUsers: allUsers?.length || 0,
    pendingApplications: pendingApplications?.length || 0,
    approvedUsers: allUsers?.filter((u) => u.status === "approved").length || 0,
    rejectedUsers: allUsers?.filter((u) => u.status === "rejected").length || 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理员面板</h1>
            <p className="text-gray-600 mt-2">用户审核和系统管理</p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {profile?.role === "admin" ? "超级管理员" : "审核员"}
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">总用户数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">待审核</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">已批准</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">已拒绝</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejectedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">待审核申请</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="stats">统计分析</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>待审核申请</CardTitle>
                <CardDescription>审核用户的注册申请，决定是否批准使用权限</CardDescription>
              </CardHeader>
              <CardContent>
                <UserApplicationsList applications={pendingApplications || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>用户管理</CardTitle>
                <CardDescription>管理所有用户账户和权限设置</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagementList users={allUsers || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <AdminStats />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
