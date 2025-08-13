"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UserPlus } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          注册中...
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          注册账户
        </>
      )}
    </Button>
  )
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null)

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-3xl font-bold text-gray-900">注册账户</CardTitle>
        <CardDescription className="text-lg text-gray-600">创建您的招聘数据爬虫平台账户</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {state.success}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱地址 *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@example.com"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              姓名 *
            </label>
            <Input id="fullName" name="fullName" type="text" placeholder="张三" required className="h-12 text-base" />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码 *
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="至少8位字符"
              className="h-12 text-base"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">使用须知</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 本平台仅供合法的数据分析和研究使用</li>
              <li>• 禁止用于商业竞争情报或恶意爬取</li>
              <li>• 注册后即可开始使用基础功能</li>
            </ul>
          </div>

          <SubmitButton />

          <div className="text-center text-gray-600">
            已有账户？{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              立即登录
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
