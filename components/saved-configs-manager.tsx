"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Star, StarOff, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserConfig {
  id: string
  config_name: string
  target_url: string
  website_type: string
  supabase_url: string
  supabase_key: string
  api_config?: any
  is_default: boolean
  created_at: string
}

interface SavedConfigsManagerProps {
  onLoadConfig: (config: UserConfig) => void
  currentConfig?: {
    target_url: string
    website_type: string
    supabase_url: string
    supabase_key: string
    api_config?: any
  }
}

export function SavedConfigsManager({ onLoadConfig, currentConfig }: SavedConfigsManagerProps) {
  const [configs, setConfigs] = useState<UserConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configName, setConfigName] = useState("")
  const [showSaveForm, setShowSaveForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/user-configs")
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
      }
    } catch (error) {
      console.error("Error fetching configs:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentConfig = async () => {
    if (!configName.trim() || !currentConfig) {
      toast({
        title: "错误",
        description: "请输入配置名称",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/user-configs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config_name: configName,
          target_url: currentConfig.target_url,
          website_type: currentConfig.website_type,
          supabase_url: currentConfig.supabase_url,
          supabase_key: currentConfig.supabase_key,
          api_config: currentConfig.api_config,
          is_default: configs.length === 0, // 如果是第一个配置，设为默认
        }),
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "配置已保存",
        })
        setConfigName("")
        setShowSaveForm(false)
        fetchConfigs()
      } else {
        throw new Error("Failed to save config")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "保存配置失败",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteConfig = async (id: string) => {
    try {
      const response = await fetch(`/api/user-configs/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "配置已删除",
        })
        fetchConfigs()
      } else {
        throw new Error("Failed to delete config")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "删除配置失败",
        variant: "destructive",
      })
    }
  }

  const toggleDefault = async (config: UserConfig) => {
    try {
      const response = await fetch(`/api/user-configs/${config.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...config,
          is_default: !config.is_default,
        }),
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: config.is_default ? "已取消默认配置" : "已设为默认配置",
        })
        fetchConfigs()
      } else {
        throw new Error("Failed to update config")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "更新配置失败",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载配置中...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          已保存的配置
          <Button variant="outline" size="sm" onClick={() => setShowSaveForm(!showSaveForm)} disabled={!currentConfig}>
            <Plus className="w-4 h-4 mr-2" />
            保存当前配置
          </Button>
        </CardTitle>
        <CardDescription>管理您的爬虫配置，避免重复输入</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSaveForm && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="space-y-3">
              <div>
                <Label htmlFor="config-name">配置名称</Label>
                <Input
                  id="config-name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="例如：腾讯招聘配置"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveCurrentConfig} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
                <Button variant="outline" onClick={() => setShowSaveForm(false)}>
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无保存的配置</div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{config.config_name}</h4>
                    {config.is_default && <Badge variant="secondary">默认</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.website_type} • {new URL(config.target_url).hostname}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleDefault(config)}>
                    {config.is_default ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onLoadConfig(config)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteConfig(config.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
