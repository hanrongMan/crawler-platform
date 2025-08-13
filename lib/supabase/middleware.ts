import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "./types"

// Check if Supabase environment variables are available
export const isSupabaseConfigured = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.length === 0 || !key || key.length === 0) {
    return false
  }

  // Check if URL is a placeholder
  if (url.includes('your_supabase_url_here') || key.includes('your_supabase_anon_key_here')) {
    return false
  }

  // Validate URL format
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
})()

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // Check if this is an auth callback
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (code) {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code)
      // Redirect to home page after successful auth
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Refresh session if expired - required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes - redirect to login if not authenticated
    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/auth/login") ||
      request.nextUrl.pathname.startsWith("/auth/sign-up") ||
      request.nextUrl.pathname === "/auth/callback"

    const isApiRoute = request.nextUrl.pathname.startsWith("/api/")
    const isPublicRoute = request.nextUrl.pathname === "/"

    // Allow access to auth routes, API routes, and public routes
    if (isAuthRoute || isApiRoute || isPublicRoute) {
      return supabaseResponse
    }

    // For protected routes, check if user is authenticated
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  } catch (error) {
    console.error("Supabase middleware error:", error)
    // If there's an error with Supabase, just continue without auth
    return NextResponse.next({
      request,
    })
  }
}
