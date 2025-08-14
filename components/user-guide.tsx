"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, BookOpen, Video, ExternalLink, Lightbulb, AlertTriangle } from "lucide-react"

export function UserGuide() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <HelpCircle className="h-4 w-4" />
          使用指南
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            数据爬虫平台使用指南
          </DialogTitle>
          <DialogDescription>详细的使用说明和常见问题解答</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">快速开始</TabsTrigger>
            <TabsTrigger value="configuration">配置说明</TabsTrigger>
            <TabsTrigger value="troubleshooting">故障排除</TabsTrigger>
            <TabsTrigger value="faq">常见问题</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速开始</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">准备Supabase项目</h4>
                      <p className="text-sm text-gray-600">创建一个新的Supabase项目，获取项目URL和API密钥</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      2
                    </div>
                    <div className="w-full">
                      <h4 className="font-semibold">运行数据库脚本</h4>
                      <p className="text-sm text-gray-600 mb-2">在 Supabase SQL 编辑器中执行建表与初始化脚本：</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">测试连接</h4>
                      <p className="text-sm text-gray-600">使用连接测试功能验证数据库配置是否正确</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold">开始爬取</h4>
                      <p className="text-sm text-gray-600">选择目标网站，配置参数，开始爬取职位数据</p>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>提示:</strong> 首次使用建议先用小范围测试，确认配置正确后再进行大规模爬取。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">配置说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">支持的招聘网站</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">腾讯招聘</Badge>
                        <p className="text-sm text-gray-600">join.qq.com</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">字节跳动</Badge>
                        <p className="text-sm text-gray-600">jobs.bytedance.com</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">阿里巴巴</Badge>
                        <p className="text-sm text-gray-600">talent-holding.alibaba.com</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Supabase配置</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>项目URL:</strong> 格式为 https://your-project.supabase.co
                      </p>
                      <p>
                        <strong>API密钥:</strong> 使用anon public key，可在项目设置的API页面找到
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">爬取参数</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>最大页数:</strong> 建议设置为10-20页，避免过度请求
                      </p>
                      <p>
                        <strong>请求间隔:</strong> 系统会自动控制请求频率，避免被反爬虫机制拦截
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">故障排除</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">连接失败</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>检查Supabase URL格式是否正确</li>
                      <li>确认API密钥是否有效</li>
                      <li>验证网络连接是否正常</li>
                      <li>检查Supabase项目是否处于活跃状态</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">爬取失败</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>目标网站可能更新了页面结构</li>
                      <li>网络请求被拦截或超时</li>
                      <li>数据库写入权限不足</li>
                      <li>爬取频率过高被限制</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">数据不完整</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>部分职位信息可能缺失某些字段</li>
                      <li>网站反爬虫机制导致部分页面无法访问</li>
                      <li>数据清洗过程中过滤了无效数据</li>
                    </ul>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    如果问题持续存在，请检查浏览器控制台的错误信息，或联系技术支持。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">常见问题</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Q: 爬取的数据会保存多久？</h4>
                    <p className="text-sm text-gray-600">
                      数据保存在您自己的Supabase数据库中，保存时间由您的Supabase项目设置决定。
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Q: 可以同时爬取多个网站吗？</h4>
                    <p className="text-sm text-gray-600">
                      目前系统支持单个任务执行，建议逐个网站进行爬取以确保数据质量。
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Q: 爬取频率有限制吗？</h4>
                    <p className="text-sm text-gray-600">
                      系统内置了请求频率控制，建议合理使用，避免对目标网站造成过大压力。
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Q: 数据格式是什么样的？</h4>
                    <p className="text-sm text-gray-600">
                      数据包括职位标题、公司名称、工作地点、薪资范围、技能要求等标准化字段。
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Q: 如何导出爬取的数据？</h4>
                    <p className="text-sm text-gray-600">
                      可以直接在Supabase控制台中查看和导出数据，支持CSV、JSON等多种格式。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button onClick={() => setOpen(false)}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
