"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Calendar, Activity } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  status: string
  created_at: string
  last_login_at: string | null
  login_count: number
  current_daily_usage: number
  current_monthly_usage: number
  daily_scraping_limit: number
  monthly_scraping_limit: number
}

interface UserManagementListProps {
  users: UserProfile[]
}

export default function UserManagementList({ users }: UserManagementListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="搜索用户邮箱或姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已批准</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="suspended">已暂停</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            <SelectItem value="user">用户</SelectItem>
            <SelectItem value="moderator">审核员</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{user.full_name || user.email}</span>
                      {getStatusBadge(user.status)}
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{user.email}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        注册于 {new Date(user.created_at).toLocaleDateString("zh-CN")}
                      </div>
                      {user.last_login_at && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          最后登录 {new Date(user.last_login_at).toLocaleDateString("zh-CN")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-gray-600">使用情况</div>
                    <div className="font-medium">
                      日: {user.current_daily_usage}/{user.daily_scraping_limit}
                    </div>
                    <div className="font-medium">
                      月: {user.current_monthly_usage}/{user.monthly_scraping_limit}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-600">登录次数</div>
                    <div className="font-medium">{user.login_count}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">未找到用户</h3>
          <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
        </div>
      )}
    </div>
  )
}
