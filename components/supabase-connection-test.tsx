"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Loader2, Database, Shield } from "lucide-react"
import { testSupabaseConnection, validateDatabaseSchema } from "@/lib/supabase/client"
import { createClient } from "@/lib/supabase/client"

interface ConnectionTestProps {
  onConnectionSuccess?: (url: string, key: string) => void
  userId?: string
}

export function SupabaseConnectionTest({ onConnectionSuccess, userId }: ConnectionTestProps) {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [testing, setTesting] = useState(false)
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean
    error?: string
    schemaValid?: boolean
    missingTables?: string[]
  } | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  // 加载已保存的配置（避免重复请求）
  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current || !userId) return
    const loadSavedConfig = async () => {
      try {
        const supabase = await createClient()
        const { data: savedConfig, error } = await supabase
          .from("user_scraping_configs")
          .select("supabase_url, supabase_key")
          .eq("user_id", userId)
          .eq("is_default", true)
          .maybeSingle()

        if (!error && savedConfig) {
          setSupabaseUrl(savedConfig.supabase_url)
          setSupabaseKey(savedConfig.supabase_key)
          setIsConfigured(true)
          onConnectionSuccess?.(savedConfig.supabase_url, savedConfig.supabase_key)
        }
        loadedRef.current = true
      } catch (error) {
        console.error("加载保存的配置失败:", error)
      }
    }

    loadSavedConfig()
  }, [userId, onConnectionSuccess])

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setConnectionResult({
        success: false,
        error: "请填写完整的Supabase配置信息",
      })
      return
    }

    setTesting(true)
    setConnectionResult(null)

    try {
      // 测试基本连接
      const connectionTest = await testSupabaseConnection(supabaseUrl, supabaseKey)

      if (!connectionTest.success) {
        setConnectionResult({
          success: false,
          error: connectionTest.error,
        })
        return
      }

      // 验证数据库表结构
      const schemaTest = await validateDatabaseSchema(supabaseUrl, supabaseKey)

      setConnectionResult({
        success: connectionTest.success,
        schemaValid: schemaTest.success,
        missingTables: schemaTest.missingTables,
      })

      if (connectionTest.success && schemaTest.success && userId) {
              try {
        const supabase = await createClient()
                // 先删除现有的默认配置
        await supabase
          .from("user_scraping_configs")
          .delete()
          .eq("user_id", userId)
          .eq("is_default", true)

        // 然后插入新的配置
        const { data, error } = await supabase
          .from("user_scraping_configs")
          .insert([
            {
              user_id: userId,
              config_name: "Default Supabase Config",
              target_url: "",
              website_type: "custom",
              supabase_url: supabaseUrl,
              supabase_key: supabaseKey,
              is_default: true,
              updated_at: new Date().toISOString(),
            },
          ])
          .select()

        if (error) {
          console.error("保存配置失败:", error)
          throw error
        }

          console.log("Supabase配置已自动保存")
          setIsConfigured(true)
        } catch (error) {
          console.error("保存配置失败:", error)
        }
      }

      if (connectionTest.success && schemaTest.success) {
        onConnectionSuccess?.(supabaseUrl, supabaseKey)
      }
    } catch (error) {
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : "连接测试失败",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Supabase 连接测试
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-supabase-url">Supabase URL</Label>
            <Input
              id="test-supabase-url"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className={`font-mono text-sm ${isConfigured ? "bg-green-50 border-green-300" : ""}`}
              disabled={isConfigured}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-supabase-key">Supabase API Key</Label>
            <Input
              id="test-supabase-key"
              type="password"
              placeholder="your-anon-key"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className={`font-mono text-sm ${isConfigured ? "bg-green-50 border-green-300" : ""}`}
              disabled={isConfigured}
            />
          </div>
        </div>

        {/* Test Button */}
        <Button
          onClick={handleTestConnection}
          disabled={!supabaseUrl || !supabaseKey || testing || isConfigured}
          className="w-full bg-transparent"
          variant="outline"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              测试连接中...
            </>
          ) : isConfigured ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              配置已保存
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              测试连接
            </>
          )}
        </Button>

        {/* Connection Result */}
        {connectionResult && (
          <div className="space-y-3">
            {connectionResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <div>数据库连接成功！配置已自动保存到数据库</div>
                    <div className="flex items-center gap-2">
                      <span>表结构验证:</span>
                      {connectionResult.schemaValid ? (
                        <Badge className="bg-green-100 text-green-800">完整</Badge>
                      ) : (
                        <Badge variant="destructive">不完整</Badge>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">连接失败: {connectionResult.error}</AlertDescription>
              </Alert>
            )}

            {/* Missing Tables Warning */}
            {connectionResult.missingTables && connectionResult.missingTables.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="space-y-2">
                    <div>缺少以下数据表，请先运行数据库初始化脚本：</div>
                    <div className="flex flex-wrap gap-1">
                      {connectionResult.missingTables.map((table) => (
                        <Badge key={table} variant="outline" className="text-yellow-700 border-yellow-300">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>获取Supabase配置：</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>登录到您的 Supabase 项目</li>
            <li>进入 Settings → API</li>
            <li>复制 Project URL 和 anon public key</li>
            <li>确保已运行数据库初始化脚本</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
