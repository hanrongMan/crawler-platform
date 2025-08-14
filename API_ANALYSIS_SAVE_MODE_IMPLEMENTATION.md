# API 分析 tab "保存爬取模式" 按钮实现文档

## 概述

API 分析 tab 的"保存爬取模式"按钮已经完全实现了您要求的"鉴权在平台库，然后用用户默认的 supabase_url/supabase_key 去该用户 Supabase 写入"的流程。

## 实现架构

### 数据流程

```
前端 (API 分析 tab)
    ↓
POST /api/user-configs
    ↓
平台库鉴权 (createClient())
    ↓
读取用户默认配置 (user_scraping_configs.is_default=true)
    ↓
用户自己的 Supabase 写入 (createSupabaseClient())
```

### 核心文件修改

#### 1. app/api/user-configs/route.ts

**POST 方法实现：**

```typescript
export async function POST(request: NextRequest) {
  try {
    // 第一步：在平台库进行用户身份验证
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // 第二步：从平台库读取用户默认的 Supabase 连接配置
    const { data: defaultConfig, error: configError } = await supabase
      .from("user_scraping_configs")
      .select("supabase_url, supabase_key")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle()

    // 第三步：使用用户的 Supabase 配置创建客户端，准备写入用户自己的数据库
    const target = createSupabaseClient(defaultConfig.supabase_url, defaultConfig.supabase_key)

    // 保存爬取模式（网站请求模板）- 这是 API 分析 tab 的主要功能
    if (body.website_type && body.target_url && body.api_config) {
      const { data: config, error } = await target
        .from("user_scraping_configs")
        .insert({
          user_id: user.id,
          config_name,
          target_url,
          website_type,
          supabase_url: defaultConfig.supabase_url,
          supabase_key: defaultConfig.supabase_key,
          api_config,
          is_default: false,
        })
        .select()
        .single()
    }
  }
}
```

#### 2. components/api-analysis-tool.tsx

**前端调用：**

```typescript
const handleSaveScrapingMode = async () => {
  const payload = {
    website_type: websiteType,
    target_url: configuredUrl,
    api_config: {
      url: constructedRequest.url,
      method: constructedRequest.method,
      headers: constructedRequest.headers,
      body: constructedRequest.body,
    },
  }

  const res = await fetch("/api/user-configs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}
```

## 相关 API 路由优化

为了保持一致性，我们还优化了其他相关的 API 路由，确保它们都遵循相同的模式：

### 1. app/api/scraping-configs/route.ts

- 平台库鉴权
- 读取用户默认配置
- 查询用户自己的 `scraping_configs` 表

### 2. app/api/jobs/route.ts

- 平台库鉴权
- 读取用户默认配置
- 查询用户自己的 `jobs` 表

### 3. app/api/scrape/route.ts

- 平台库鉴权
- 读取用户默认配置
- 写入用户自己的 `jobs` 表
- 记录任务到平台库的 `scraping_tasks` 表

### 4. app/api/user-configs/[id]/route.ts

- 平台库鉴权
- 读取用户默认配置
- 更新/删除用户自己的 `user_scraping_configs` 表

## 数据隔离保证

### 平台库 (Platform Supabase)
- 用户身份验证 (`auth`)
- 用户默认配置 (`user_scraping_configs.is_default=true`)
- 任务记录 (`scraping_tasks`)

### 用户库 (User's Supabase)
- 爬取配置 (`user_scraping_configs`)
- 职位数据 (`jobs`)
- 网站配置 (`scraping_configs`)

## 错误处理

所有 API 路由都包含完善的错误处理：

1. **鉴权失败**：返回 401 Unauthorized
2. **配置缺失**：返回 400 Bad Request，提示用户先配置连接
3. **数据库错误**：返回 500 Internal Server Error，包含详细错误信息
4. **日志记录**：所有关键操作都有详细的日志记录

## 使用流程

1. 用户在 Supabase-Config tab 中配置并保存连接
2. 用户在 API 分析 tab 中分析网站，构造请求
3. 点击"保存爬取模式"按钮
4. 系统在平台库验证用户身份
5. 系统从平台库读取用户的默认 Supabase 配置
6. 系统将爬取模式保存到用户自己的 Supabase 数据库
7. 返回成功消息

## 技术特点

- **数据隔离**：每个用户的数据存储在自己的 Supabase 实例中
- **统一鉴权**：所有操作都通过平台库进行身份验证
- **配置管理**：用户的默认 Supabase 配置统一存储在平台库中
- **错误恢复**：完善的错误处理和用户友好的错误消息
- **日志追踪**：详细的操作日志便于调试和监控

## 总结

API 分析 tab 的"保存爬取模式"功能已经完全实现了您的要求：

✅ **鉴权在平台库**：使用 `createClient()` 在平台库进行用户身份验证  
✅ **读取用户默认配置**：从平台库的 `user_scraping_configs` 表读取用户的默认 `supabase_url/supabase_key`  
✅ **写入用户自己的 Supabase**：使用 `createSupabaseClient()` 将数据写入用户自己的数据库  

这个实现确保了数据安全性和隔离性，同时提供了良好的用户体验和错误处理。
