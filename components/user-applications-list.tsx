"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Eye, Calendar, User, Building, Globe } from "lucide-react"
import { approveUser, rejectUser } from "@/lib/actions"
import { useRouter } from "next/navigation"

interface UserApplication {
  id: string
  user_id: string
  application_reason: string
  intended_use_case: string
  organization: string | null
  website_url: string | null
  expected_usage_volume: string | null
  status: string
  created_at: string
  user_profiles?: {
    email: string
    full_name: string | null
  }
}

interface UserApplicationsListProps {
  applications: UserApplication[]
}

export default function UserApplicationsList({ applications }: UserApplicationsListProps) {
  const [selectedApplication, setSelectedApplication] = useState<UserApplication | null>(null)
  const [reviewerNotes, setReviewerNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleApprove = async (userId: string) => {
    setIsProcessing(true)
    try {
      await approveUser(userId, reviewerNotes)
      router.refresh()
      setSelectedApplication(null)
      setReviewerNotes("")
    } catch (error) {
      console.error("Failed to approve user:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      alert("请填写拒绝原因")
      return
    }

    setIsProcessing(true)
    try {
      await rejectUser(userId, rejectionReason, reviewerNotes)
      router.refresh()
      setSelectedApplication(null)
      setReviewerNotes("")
      setRejectionReason("")
    } catch (error) {
      console.error("Failed to reject user:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无待审核申请</h3>
        <p className="text-gray-600">所有申请都已处理完毕</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id} className="border-l-4 border-l-yellow-400">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">
                    {application.user_profiles?.full_name || application.user_profiles?.email || "未知用户"}
                  </span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    待审核
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(application.created_at).toLocaleDateString("zh-CN")}
                  </div>
                  {application.organization && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {application.organization}
                    </div>
                  )}
                  {application.website_url && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a
                        href={application.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        网站链接
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">申请原因：</span>
                    {application.application_reason.length > 100
                      ? `${application.application_reason.substring(0, 100)}...`
                      : application.application_reason}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                      <Eye className="h-4 w-4 mr-1" />
                      查看详情
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>申请详情</DialogTitle>
                      <DialogDescription>审核用户申请并做出决定</DialogDescription>
                    </DialogHeader>

                    {selectedApplication && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">邮箱</Label>
                            <p className="text-sm text-gray-900 mt-1">{selectedApplication.user_profiles?.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">姓名</Label>
                            <p className="text-sm text-gray-900 mt-1">
                              {selectedApplication.user_profiles?.full_name || "未提供"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">组织</Label>
                            <p className="text-sm text-gray-900 mt-1">{selectedApplication.organization || "未提供"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">申请时间</Label>
                            <p className="text-sm text-gray-900 mt-1">
                              {new Date(selectedApplication.created_at).toLocaleString("zh-CN")}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">申请原因</Label>
                          <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                            {selectedApplication.application_reason}
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">预期用途</Label>
                          <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                            {selectedApplication.intended_use_case}
                          </p>
                        </div>

                        {selectedApplication.expected_usage_volume && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">预期使用量</Label>
                            <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                              {selectedApplication.expected_usage_volume}
                            </p>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="reviewerNotes" className="text-sm font-medium text-gray-700">
                            审核备注（可选）
                          </Label>
                          <Textarea
                            id="reviewerNotes"
                            value={reviewerNotes}
                            onChange={(e) => setReviewerNotes(e.target.value)}
                            placeholder="添加审核备注..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700">
                            拒绝原因（拒绝时必填）
                          </Label>
                          <Textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="如果拒绝申请，请说明原因..."
                            className="mt-1"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => handleApprove(selectedApplication.user_id)}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            批准申请
                          </Button>
                          <Button
                            onClick={() => handleReject(selectedApplication.user_id)}
                            disabled={isProcessing}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            拒绝申请
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
