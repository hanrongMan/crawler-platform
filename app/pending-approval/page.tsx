import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Mail, CheckCircle } from "lucide-react"
import { signOut } from "@/lib/actions"

export const dynamic = "force-dynamic"

export default async function PendingApprovalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 审批流程已移除，直接跳转首页
  redirect("/")
  return null as any

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            {profile?.status === "rejected" ? (
              <Mail className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-xl font-semibold">
            {profile?.status === "rejected" ? "申请被拒绝" : "等待审核"}
          </CardTitle>
          <CardDescription>
            {profile?.status === "rejected" ? "您的申请已被管理员拒绝" : "您的账户申请正在审核中，请耐心等待"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {false && (
            <div className="rounded-lg bg-red-50 p-4">
              <h4 className="font-medium text-red-800 mb-2">拒绝原因：</h4>
              <p className="text-sm text-red-700">示例</p>
            </div>
          )}

          {false && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                申请已提交于 示例
              </div>

              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div>
                  <span className="font-medium text-gray-700">申请原因：</span>
                  <p className="text-sm text-gray-600 mt-1">{application.application_reason}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">预期用途：</span>
                  <p className="text-sm text-gray-600 mt-1">{application.intended_use_case}</p>
                </div>
                {application.organization && (
                  <div>
                    <span className="font-medium text-gray-700">组织：</span>
                    <p className="text-sm text-gray-600 mt-1">{application.organization}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4">
            <form action={signOut} className="w-full">
              <Button type="submit" variant="outline" className="w-full bg-transparent">
                退出登录
              </Button>
            </form>
          </div>

          {false && (
            <div className="text-center text-sm text-gray-500">
              <p>通常审核时间为 1-2 个工作日</p>
              <p>如有疑问，请联系管理员</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
