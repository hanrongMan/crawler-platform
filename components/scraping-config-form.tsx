"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Save, RotateCcw } from "lucide-react"

interface ScrapingConfigFormProps {
  onSave?: (config: any) => void
}

export function ScrapingConfigForm({ onSave }: ScrapingConfigFormProps) {
  const [config, setConfig] = useState({
    maxPages: 10,
    rateLimit: 2000,
    enableProxy: false,
    proxyUrl: "",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timeout: 30000,
    retryAttempts: 3,
    enableDeduplication: true,
    saveToDatabase: true,
  })

  const handleSave = () => {
    onSave?.(config)
  }

  const handleReset = () => {
    setConfig({
      maxPages: 10,
      rateLimit: 2000,
      enableProxy: false,
      proxyUrl: "",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      timeout: 30000,
      retryAttempts: 3,
      enableDeduplication: true,
      saveToDatabase: true,
    })
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          高级配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">基础设置</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-pages">最大爬取页数</Label>
              <Input
                id="max-pages"
                type="number"
                min="1"
                max="100"
                value={config.maxPages}
                onChange={(e) => setConfig({ ...config, maxPages: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-limit">请求间隔 (毫秒)</Label>
              <Input
                id="rate-limit"
                type="number"
                min="500"
                max="10000"
                value={config.rateLimit}
                onChange={(e) => setConfig({ ...config, rateLimit: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">请求超时 (毫秒)</Label>
              <Input
                id="timeout"
                type="number"
                min="5000"
                max="60000"
                value={config.timeout}
                onChange={(e) => setConfig({ ...config, timeout: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry-attempts">重试次数</Label>
              <Input
                id="retry-attempts"
                type="number"
                min="0"
                max="10"
                value={config.retryAttempts}
                onChange={(e) => setConfig({ ...config, retryAttempts: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Proxy Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">代理设置</h4>

          <div className="flex items-center space-x-2">
            <Switch
              id="enable-proxy"
              checked={config.enableProxy}
              onCheckedChange={(checked) => setConfig({ ...config, enableProxy: checked })}
            />
            <Label htmlFor="enable-proxy">启用代理</Label>
          </div>

          {config.enableProxy && (
            <div className="space-y-2">
              <Label htmlFor="proxy-url">代理地址</Label>
              <Input
                id="proxy-url"
                placeholder="http://proxy.example.com:8080"
                value={config.proxyUrl}
                onChange={(e) => setConfig({ ...config, proxyUrl: e.target.value })}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">高级设置</h4>

          <div className="space-y-2">
            <Label htmlFor="user-agent">User Agent</Label>
            <Textarea
              id="user-agent"
              rows={2}
              value={config.userAgent}
              onChange={(e) => setConfig({ ...config, userAgent: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-deduplication"
                checked={config.enableDeduplication}
                onCheckedChange={(checked) => setConfig({ ...config, enableDeduplication: checked })}
              />
              <Label htmlFor="enable-deduplication">启用去重</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="save-to-database"
                checked={config.saveToDatabase}
                onCheckedChange={(checked) => setConfig({ ...config, saveToDatabase: checked })}
              />
              <Label htmlFor="save-to-database">保存到数据库</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            保存配置
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            重置默认
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
