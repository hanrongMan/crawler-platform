type Listener = (line: string) => void

interface LogEntry {
  ts: number
  line: string
}

const userIdToBuffer = new Map<string, LogEntry[]>()
const userIdToListeners = new Map<string, Set<Listener>>()
const MAX_BUFFER = 500

export function appendLog(userId: string, line: string) {
  const entry = { ts: Date.now(), line }
  const buf = userIdToBuffer.get(userId) || []
  buf.push(entry)
  while (buf.length > MAX_BUFFER) buf.shift()
  userIdToBuffer.set(userId, buf)

  const listeners = userIdToListeners.get(userId)
  if (listeners) {
    for (const l of listeners) {
      try { l(line) } catch {}
    }
  }
}

export function getLogsSince(userId: string, sinceTs = 0): LogEntry[] {
  const buf = userIdToBuffer.get(userId) || []
  if (!sinceTs) return buf
  return buf.filter((e) => e.ts > sinceTs)
}

export function subscribeLogs(userId: string, listener: Listener): () => void {
  if (!userIdToListeners.has(userId)) userIdToListeners.set(userId, new Set())
  userIdToListeners.get(userId)!.add(listener)
  return () => {
    const set = userIdToListeners.get(userId)
    if (!set) return
    set.delete(listener)
    if (set.size === 0) userIdToListeners.delete(userId)
  }
}


