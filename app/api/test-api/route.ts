import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, method = "GET", headers = {}, body = null } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "缺少或无效的 url" }, { status: 400 })
    }

    // 仅允许 http/https
    const parsed = new URL(url)
    if (!/^https?:$/.test(parsed.protocol)) {
      return NextResponse.json({ error: "仅支持 http/https 协议" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      method,
      headers,
      body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const contentType = res.headers.get("content-type") || ""
    let preview: any
    try {
      if (contentType.includes("application/json")) {
        preview = await res.json()
      } else {
        const text = await res.text()
        preview = text.slice(0, 2000) // 只返回前2KB
      }
    } catch {
      preview = null
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: {
        "content-type": contentType,
      },
      preview,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


