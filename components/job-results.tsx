"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Building, Clock, DollarSign, ExternalLink, Users } from "lucide-react"

interface JobData {
  title: string
  company_name?: string
  department?: string
  location?: string
  experience_level?: string
  job_type?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  description?: string
  requirements?: string
  benefits?: string
  skills?: string[]
  original_url: string
  source_website: string
  external_job_id?: string
  publish_time?: string
}

export function JobResults({ jobs: initialJobs = [] as JobData[] }) {
  const [jobs, setJobs] = useState<JobData[]>(initialJobs)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/jobs")
        if (!res.ok) return
        const data = await res.json()
        if (!aborted && Array.isArray(data.jobs)) setJobs(data.jobs)
      } catch {}
    })()
    return () => { aborted = true }
  }, [])
  if (jobs.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无爬取结果</h3>
          <p className="text-gray-600 text-center">开始爬取后，职位信息将在这里显示</p>
        </CardContent>
      </Card>
    )
  }

  const formatSalary = (job: JobData) => {
    if (!job.salary_min && !job.salary_max) return null

    const currency = job.salary_currency === "CNY" ? "¥" : job.salary_currency || ""

    if (job.salary_min && job.salary_max) {
      return `${currency}${job.salary_min.toLocaleString()} - ${currency}${job.salary_max.toLocaleString()}`
    } else if (job.salary_min) {
      return `${currency}${job.salary_min.toLocaleString()}+`
    } else if (job.salary_max) {
      return `最高 ${currency}${job.salary_max.toLocaleString()}`
    }

    return null
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "tencent":
        return "bg-blue-100 text-blue-800"
      case "bytedance":
        return "bg-purple-100 text-purple-800"
      case "alibaba":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSourceName = (source: string) => {
    switch (source) {
      case "tencent":
        return "腾讯"
      case "bytedance":
        return "字节跳动"
      case "alibaba":
        return "阿里巴巴"
      default:
        return source
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            爬取结果总览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{jobs.length}</div>
              <div className="text-sm text-gray-600">总职位数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600">
                {new Set(jobs.map((job) => job.company_name)).size}
              </div>
              <div className="text-sm text-gray-600">公司数量</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{new Set(jobs.map((job) => job.location)).size}</div>
              <div className="text-sm text-gray-600">城市数量</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      <div className="space-y-4">
        {jobs.map((job, index) => (
          <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Title and Company */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900 leading-tight">{job.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {job.company_name && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {job.company_name}
                        </Badge>
                      )}
                      <Badge className={getSourceBadgeColor(job.source_website)}>
                        {getSourceName(job.source_website)}
                      </Badge>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                    )}
                    {job.experience_level && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.experience_level}
                      </div>
                    )}
                    {formatSalary(job) && (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {formatSalary(job)}
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {job.skills.slice(0, 5).map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{job.skills.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {job.description && <div className="text-sm text-gray-700 line-clamp-2">{job.description}</div>}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 lg:ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(job.original_url, "_blank")}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    查看原文
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
