import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { appendLog, getLogsSince, subscribeLogs } from "@/lib/logging/scrape-log"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mode = req.nextUrl.searchParams.get("mode") || "sse"
  const since = Number(req.nextUrl.searchParams.get("since") || 0)

  if (mode === "poll") {
    // 简单轮询：返回自 since 之后的日志
    const logs = getLogsSince(user.id, since)
    return NextResponse.json({ logs, now: Date.now() })
  }

  // SSE
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      const send = (line: string) => controller.enqueue(enc.encode(`data: ${line}\n\n`))
      send(`[log] connected at ${new Date().toISOString()}`)
      const unsub = subscribeLogs(user.id, send)
      const heartbeat = setInterval(() => controller.enqueue(enc.encode(`: ping\n\n`)), 20000)
      controller.closed.finally(() => { clearInterval(heartbeat); unsub() })
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}


