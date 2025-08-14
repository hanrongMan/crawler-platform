"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Loader2, Database, Shield, Plus, FileText, Copy } from "lucide-react"
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
  const [showSetupOptions, setShowSetupOptions] = useState(false)
  const [copiedCreate, setCopiedCreate] = useState(false)
  const [copiedInit, setCopiedInit] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)
  const [sqlLocked, setSqlLocked] = useState(false)

  // 加载已保存的配置（避免重复请求）
  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current || !userId) return
    const loadSavedConfig = async () => {
      try {
        const supabase = await createClient()
        const { data: savedConfig, error } = await supabase
          .from("user_scraping_configs")
          .select("supabase_url, supabase_key, api_config")
          .eq("user_id", userId)
          .eq("is_default", true)
          .maybeSingle()

        if (!error && savedConfig) {
          setSupabaseUrl(savedConfig.supabase_url)
          setSupabaseKey(savedConfig.supabase_key)
          setIsConfigured(true)
          // 若已完成建表与初始化，禁用复制SQL按钮
          if (savedConfig.api_config && savedConfig.api_config.db_setup_done) {
            setSqlLocked(true)
          }
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

      // 这里只是提示，真实建表由用户手动执行SQL
      setConnectionResult({
        success: connectionTest.success,
        schemaValid: undefined,
        missingTables: undefined,
      })

      if (connectionTest.success) {
        setShowSetupOptions(true)
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

  const createTablesSQL = `
-- jobs（职位表）
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid null,
  title text not null,
  department text null,
  job_type text null,
  experience_level text null,
  location text null,
  salary_min numeric null,
  salary_max numeric null,
  salary_currency text null,
  salary_period text null,
  description text null,
  requirements text null,
  benefits text null,
  skills jsonb null,
  status text null,
  urgency_level text null,
  contact_email text null,
  contact_person text null,
  original_url text not null,
  source_website text not null,
  external_job_id text null,
  scraped_at timestamptz null,
  last_updated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_source_website on public.jobs(source_website);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);


-- 用户侧保存的配置 user_scraping_configs
create table if not exists public.user_scraping_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  config_name varchar not null,
  target_url text not null,
  website_type varchar not null,
  supabase_url text not null,
  supabase_key text not null,
  api_config jsonb null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 爬取配置表
create table if not exists public.scraping_configs (
    id uuid default gen_random_uuid() primary key,
    website_name varchar(100) not null unique,
    display_name varchar(100) not null,
    base_url text not null,
    selectors jsonb not null,
    pagination_config jsonb,
    rate_limit_ms integer default 1000,
    max_pages integer default 10,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 保证每个用户仅一条默认配置，is_default = true 存储用户的 Supabase ULR 和 API KEY
create unique index if not exists uq_user_default on public.user_scraping_configs(user_id, is_default) where is_default = true;


-- 关闭RLS
alter table public.jobs DISABLE row level security;
alter table public.user_scraping_configs DISABLE row level security;
alter table public.scraping_configs DISABLE row level security;


-- 幂等创建策略：先删除再创建
-- jobs
drop policy if exists jobs_read_all on public.jobs;
drop policy if exists jobs_write_all on public.jobs;
create policy jobs_read_all on public.jobs for select using (true);
create policy jobs_write_all on public.jobs for insert with check (true);


-- user_scraping_configs（仅限本人）
drop policy if exists cfg_read_own on public.user_scraping_configs;
drop policy if exists cfg_write_own on public.user_scraping_configs;
create policy cfg_read_own on public.user_scraping_configs for select using (auth.uid() = user_id);
create policy cfg_write_own on public.user_scraping_configs for insert with check (auth.uid() = user_id);

-- scraping_configs（供前端读取初始化站点列表）
drop policy if exists sc_read_all on public.scraping_configs;
drop policy if exists sc_write_all on public.scraping_configs;
create policy sc_read_all on public.scraping_configs for select using (true);
create policy sc_write_all on public.scraping_configs for insert with check (true);
`;

  const initDataSQL = `
-- 插入目前测试验证支持爬取的网站配置
INSERT INTO
    "public"."scraping_configs" (
        "website_name",
        "display_name",
        "base_url",
        "selectors",
        "is_active"
    )
VALUES
    (
        'bytedance',
        '字节招聘',
        'https://jobs.bytedance.com/experienced/position?page=1',
        '{}'::jsonb,
        true
    ),
    (
        'tencent',
        '腾讯招聘',
        'https://join.qq.com/post.html?page=1',
        '{}'::jsonb,
        true
    )
ON CONFLICT (website_name) DO NOTHING;
`;

  const handleCopy = async (text: string, which: 'create' | 'init') => {
    try {
      await navigator.clipboard.writeText(text)
      if (which === 'create') {
        setCopiedCreate(true)
        setTimeout(() => setCopiedCreate(false), 1500)
      } else {
        setCopiedInit(true)
        setTimeout(() => setCopiedInit(false), 1500)
      }
    } catch (e) {
      console.error('复制失败', e)
    }
  }

  const handleCheckAndSave = async () => {
    if (!supabaseUrl || !supabaseKey || !userId) return
    setChecking(true)
    setCheckMessage(null)

    try {
      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
      // 检查关键表
      const endpoints = [
        `${supabaseUrl}/rest/v1/jobs?select=id&limit=1`,
        `${supabaseUrl}/rest/v1/user_scraping_configs?select=id&limit=1`,
        `${supabaseUrl}/rest/v1/scraping_configs?select=website_name&limit=1`,
      ]

      for (const url of endpoints) {
        const res = await fetch(url, { headers })
        if (!res.ok) {
          throw new Error(`检查失败: ${url} 状态 ${res.status}`)
        }
      }

      // 检查初始化数据是否存在
      const scRes = await fetch(`${supabaseUrl}/rest/v1/scraping_configs?select=website_name&limit=2`, { headers })
      if (!scRes.ok) throw new Error('检查 scraping_configs 失败')
      const sc = await scRes.json()
      if (!Array.isArray(sc) || sc.length === 0) {
        throw new Error('未检测到初始化数据，请先执行“初始化数据”SQL')
      }

      // 保存当前用户的 Supabase URL/Key 到本系统数据库
      const supabase = await createClient()
      await supabase
        .from("user_scraping_configs")
        .delete()
        .eq("user_id", userId)
        .eq("is_default", true)

      const { error: insertErr } = await supabase
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
            api_config: { db_setup_done: true },
            updated_at: new Date().toISOString(),
          },
        ])

      if (insertErr) throw insertErr

      setIsConfigured(true)
      setSqlLocked(true)
      onConnectionSuccess?.(supabaseUrl, supabaseKey)
      setCheckMessage('检查通过，配置已保存')
    } catch (err) {
      setCheckMessage(err instanceof Error ? err.message : '检查失败，请确认已在 Supabase 执行 SQL')
    } finally {
      setChecking(false)
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
                    <div>数据库连接成功！</div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">连接失败: {connectionResult.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Setup Options */}
        {showSetupOptions && (
          <div className="space-y-6 border-t pt-4">
            <h3 className="font-semibold text-gray-900">数据库设置（复制到 Supabase SQL 编辑器执行）</h3>

            {/* Create Tables Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">创建数据表</h4>
                  <p className="text-sm text-gray-600">复制以下 SQL 到 Supabase SQL 编辑器执行</p>
                </div>
                <Button onClick={() => handleCopy(createTablesSQL, 'create')} variant="outline" size="sm" disabled={sqlLocked}>
                  <Copy className="mr-2 h-4 w-4" /> {sqlLocked ? '已完成（禁用）' : (copiedCreate ? '已复制' : '复制建表SQL')}
                </Button>
              </div>

              <div className="p-3 bg-gray-50 rounded-md">
                <pre className="font-mono text-sm bg-white p-2 rounded-md overflow-auto max-h-60 whitespace-pre-wrap">
{createTablesSQL}
                </pre>
              </div>
            </div>

            {/* Initialize Data Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">初始化数据</h4>
                  <p className="text-sm text-gray-600">复制以下 SQL 到 Supabase SQL 编辑器执行</p>
                </div>
                <Button onClick={() => handleCopy(initDataSQL, 'init')} variant="outline" size="sm" disabled={sqlLocked}>
                  <Copy className="mr-2 h-4 w-4" /> {sqlLocked ? '已完成（禁用）' : (copiedInit ? '已复制' : '复制初始化SQL')}
                </Button>
              </div>

              <div className="p-3 bg-gray-50 rounded-md">
                <pre className="font-mono text-sm bg-white p-2 rounded-md overflow-auto max-h-60 whitespace-pre-wrap">
{initDataSQL}
                </pre>
              </div>
            </div>

            {/* Check and Save */}
            <div className="space-y-2">
              <Button onClick={handleCheckAndSave} disabled={checking || isConfigured} variant="outline" className="w-full">
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    检查并保存配置中...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    检查是否已建表并初始化，然后保存配置
                  </>
                )}
              </Button>
              {checkMessage && (
                <Alert className={checkMessage.includes('通过') || checkMessage.includes('已保存') ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                  <AlertDescription className={checkMessage.includes('通过') || checkMessage.includes('已保存') ? 'text-green-800' : 'text-yellow-800'}>
                    {checkMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
