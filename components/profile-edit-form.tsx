"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"

interface ProfileEditFormProps {
  profile: {
    id: string
    full_name: string | null
    email: string
  }
}

export default function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: fullName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) {
        setMessage("更新失败：" + error.message)
      } else {
        setMessage("个人资料更新成功")
        router.refresh()
      }
    } catch (error) {
      setMessage("更新失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱地址</Label>
        <Input id="email" type="email" value={profile.email} disabled className="bg-gray-50" />
        <p className="text-xs text-gray-500">邮箱地址无法修改</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">姓名</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="请输入您的姓名"
        />
      </div>

      {message && (
        <div
          className={`text-sm p-3 rounded ${message.includes("成功") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            保存更改
          </>
        )}
      </Button>
    </form>
  )
}
