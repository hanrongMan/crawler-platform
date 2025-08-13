import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"

// Check if Supabase environment variables are available
export const isSupabaseConfigured = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.length === 0) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not set")
    return false
  }

  if (!key || key.length === 0) {
    console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set")
    return false
  }

  try {
    new URL(url)
  } catch {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not a valid URL:", url)
    return false
  }

  return true
})()

// Create a singleton instance of the Supabase client for Client Components
export function createClient() {
  if (!isSupabaseConfigured) {
    console.error("Supabase environment variables are not configured")
    // 返回dummy client而不是抛出错误，避免应用崩溃
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured" } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: "Supabase not configured" } }),
        signInWithPassword: () =>
          Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signUp: () =>
          Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
        insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        update: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        delete: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      }),
    } as any
  }

  try {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          fetch: (url, options = {}) => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒超时

            return fetch(url, {
              ...options,
              signal: controller.signal,
            })
              .catch((error) => {
                if (error.name === "AbortError") {
                  throw new Error("Request timeout - please check your network connection")
                }
                throw error
              })
              .finally(() => {
                clearTimeout(timeoutId)
              })
          },
        },
      },
    )
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: "Client creation failed" } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: "Client creation failed" } }),
        signInWithPassword: () =>
          Promise.resolve({ data: { user: null, session: null }, error: { message: "Client creation failed" } }),
        signUp: () =>
          Promise.resolve({ data: { user: null, session: null }, error: { message: "Client creation failed" } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: { message: "Client creation failed" } }),
        insert: () => Promise.resolve({ data: null, error: { message: "Client creation failed" } }),
        update: () => Promise.resolve({ data: null, error: { message: "Client creation failed" } }),
        delete: () => Promise.resolve({ data: null, error: { message: "Client creation failed" } }),
      }),
    } as any
  }
}

// 添加缺少的 createSupabaseClient 导出
// 创建动态Supabase客户端（用于用户自定义配置）
export function createSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and API key are required")
  }

  // 验证URL格式
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error("Invalid Supabase URL format")
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // 不持久化会话，因为这是用户自定义配置
    },
  })
}

// 测试Supabase连接
export async function testSupabaseConnection(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<{
  success: boolean
  error?: string
  details?: any
}> {
  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // 尝试执行一个简单的查询来测试连接
    const { data, error } = await supabase.from("companies").select("count").limit(1)

    if (error) {
      return {
        success: false,
        error: "Database connection failed",
        details: error,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown connection error",
      details: error,
    }
  }
}

// 验证数据库表结构
export async function validateDatabaseSchema(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<{
  success: boolean
  missingTables: string[]
  error?: string
}> {
  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    const requiredTables = ["companies", "jobs", "scraping_tasks", "scraping_configs"]
    const missingTables: string[] = []

    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1)
        if (error && error.code === "42P01") {
          // Table does not exist
          missingTables.push(table)
        }
      } catch (tableError) {
        missingTables.push(table)
      }
    }

    return {
      success: missingTables.length === 0,
      missingTables,
    }
  } catch (error) {
    return {
      success: false,
      missingTables: [],
      error: error instanceof Error ? error.message : "Schema validation failed",
    }
  }
}
