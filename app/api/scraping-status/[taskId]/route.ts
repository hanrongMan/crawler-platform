import { type NextRequest, NextResponse } from "next/server"

// 简单的内存存储，生产环境应该使用Redis或数据库
const taskStatus = new Map<string, any>()

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const taskId = params.taskId

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const status = taskStatus.get(taskId)

    if (!status) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      task_id: taskId,
      status: status,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get task status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const taskId = params.taskId
    const body = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    // 更新任务状态
    taskStatus.set(taskId, {
      ...taskStatus.get(taskId),
      ...body,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Task status updated",
      task_id: taskId,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update task status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// 创建新任务状态
export async function POST(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const taskId = params.taskId
    const body = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const initialStatus = {
      id: taskId,
      status: "pending",
      progress: 0,
      jobs_found: 0,
      pages_scraped: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    }

    taskStatus.set(taskId, initialStatus)

    return NextResponse.json({
      success: true,
      message: "Task created",
      task_id: taskId,
      status: initialStatus,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
