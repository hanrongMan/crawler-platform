"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

export interface ScrapingTask {
  id: string
  targetUrl: string
  supabaseUrl: string
  supabaseKey: string
  websiteType: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress: number
  currentPage: number
  totalPages: number
  jobsFound: number
  jobsSaved: number
  companiesSaved: number
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

interface ScrapingState {
  tasks: ScrapingTask[]
  currentTask: ScrapingTask | null
  isScrapingActive: boolean
  globalStats: {
    totalTasksCompleted: number
    totalJobsScraped: number
    totalCompaniesFound: number
  }
}

type ScrapingAction =
  | { type: "CREATE_TASK"; payload: ScrapingTask }
  | { type: "UPDATE_TASK"; payload: { id: string; updates: Partial<ScrapingTask> } }
  | { type: "SET_CURRENT_TASK"; payload: ScrapingTask | null }
  | { type: "CANCEL_TASK"; payload: string }
  | { type: "CLEAR_COMPLETED_TASKS" }
  | { type: "UPDATE_GLOBAL_STATS"; payload: Partial<ScrapingState["globalStats"]> }
  | { type: "LOAD_TASKS"; payload: ScrapingTask[] }

const initialState: ScrapingState = {
  tasks: [],
  currentTask: null,
  isScrapingActive: false,
  globalStats: {
    totalTasksCompleted: 0,
    totalJobsScraped: 0,
    totalCompaniesFound: 0,
  },
}

function scrapingReducer(state: ScrapingState, action: ScrapingAction): ScrapingState {
  switch (action.type) {
    case "CREATE_TASK":
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        currentTask: action.payload,
        isScrapingActive: true,
      }

    case "UPDATE_TASK": {
      const updatedTasks = state.tasks.map((task) =>
        task.id === action.payload.id ? { ...task, ...action.payload.updates } : task,
      )

      const updatedCurrentTask =
        state.currentTask?.id === action.payload.id
          ? { ...state.currentTask, ...action.payload.updates }
          : state.currentTask

      const isActive = updatedTasks.some((task) => task.status === "running" || task.status === "pending")

      return {
        ...state,
        tasks: updatedTasks,
        currentTask: updatedCurrentTask,
        isScrapingActive: isActive,
      }
    }

    case "SET_CURRENT_TASK":
      return {
        ...state,
        currentTask: action.payload,
        isScrapingActive: action.payload?.status === "running" || action.payload?.status === "pending",
      }

    case "CANCEL_TASK": {
      const updatedTasks = state.tasks.map((task) =>
        task.id === action.payload
          ? { ...task, status: "cancelled" as const, completedAt: new Date().toISOString() }
          : task,
      )

      return {
        ...state,
        tasks: updatedTasks,
        currentTask: state.currentTask?.id === action.payload ? null : state.currentTask,
        isScrapingActive: updatedTasks.some((task) => task.status === "running" || task.status === "pending"),
      }
    }

    case "CLEAR_COMPLETED_TASKS":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.status === "running" || task.status === "pending"),
      }

    case "UPDATE_GLOBAL_STATS":
      return {
        ...state,
        globalStats: { ...state.globalStats, ...action.payload },
      }

    case "LOAD_TASKS":
      return {
        ...state,
        tasks: action.payload,
      }

    default:
      return state
  }
}

interface ScrapingContextType {
  state: ScrapingState
  createTask: (config: {
    targetUrl: string
    supabaseUrl: string
    supabaseKey: string
    websiteType: string
    maxPages?: number
  }) => Promise<string>
  cancelTask: (taskId: string) => void
  clearCompletedTasks: () => void
  getTaskById: (taskId: string) => ScrapingTask | undefined
  getRecentTasks: (limit?: number) => ScrapingTask[]
}

const ScrapingContext = createContext<ScrapingContextType | undefined>(undefined)

export function ScrapingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(scrapingReducer, initialState)

  // 从localStorage加载任务历史
  useEffect(() => {
    const savedTasks = localStorage.getItem("scraping-tasks")
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks)
        dispatch({ type: "LOAD_TASKS", payload: tasks })
      } catch (error) {
        console.error("Failed to load saved tasks:", error)
      }
    }
  }, [])

  // 保存任务到localStorage
  useEffect(() => {
    localStorage.setItem("scraping-tasks", JSON.stringify(state.tasks))
  }, [state.tasks])

  const createTask = useCallback(
    async (config: {
      targetUrl: string
      supabaseUrl: string
      supabaseKey: string
      websiteType: string
      maxPages?: number
      apiConfig?: any
    }): Promise<string> => {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newTask: ScrapingTask = {
        id: taskId,
        targetUrl: config.targetUrl,
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
        websiteType: config.websiteType,
        status: "pending",
        progress: 0,
        currentPage: 0,
        totalPages: config.maxPages || 10,
        jobsFound: 0,
        jobsSaved: 0,
        companiesSaved: 0,
        createdAt: new Date().toISOString(),
      }

      dispatch({ type: "CREATE_TASK", payload: newTask })

      // 开始执行爬取任务
      try {
        dispatch({
          type: "UPDATE_TASK",
          payload: {
            id: taskId,
            updates: { status: "running", startedAt: new Date().toISOString() },
          },
        })

        const result = await apiClient.scrapeJobs({
          targetUrl: config.targetUrl,
          supabaseUrl: config.supabaseUrl,
          supabaseKey: config.supabaseKey,
          websiteType: config.websiteType,
          maxPages: config.maxPages,
          apiConfig: config.apiConfig,
        })

        if (result.success) {
          dispatch({
            type: "UPDATE_TASK",
            payload: {
              id: taskId,
              updates: {
                status: "completed",
                progress: 100,
                jobsFound: result.stats?.total_found || 0,
                jobsSaved: result.stats?.jobs_saved || 0,
                companiesSaved: result.stats?.companies_saved || 0,
                completedAt: new Date().toISOString(),
              },
            },
          })

          // 更新全局统计
          dispatch({
            type: "UPDATE_GLOBAL_STATS",
            payload: {
              totalTasksCompleted: state.globalStats.totalTasksCompleted + 1,
              totalJobsScraped: state.globalStats.totalJobsScraped + (result.stats?.jobs_saved || 0),
              totalCompaniesFound: state.globalStats.totalCompaniesFound + (result.stats?.companies_saved || 0),
            },
          })
        } else {
          dispatch({
            type: "UPDATE_TASK",
            payload: {
              id: taskId,
              updates: {
                status: "failed",
                error: result.error || "爬取失败",
                completedAt: new Date().toISOString(),
              },
            },
          })
        }
      } catch (error) {
        dispatch({
          type: "UPDATE_TASK",
          payload: {
            id: taskId,
            updates: {
              status: "failed",
              error: error instanceof Error ? error.message : "未知错误",
              completedAt: new Date().toISOString(),
            },
          },
        })
      }

      return taskId
    },
    [state.globalStats],
  )

  const cancelTask = useCallback((taskId: string) => {
    dispatch({ type: "CANCEL_TASK", payload: taskId })
  }, [])

  const clearCompletedTasks = useCallback(() => {
    dispatch({ type: "CLEAR_COMPLETED_TASKS" })
  }, [])

  const getTaskById = useCallback(
    (taskId: string) => {
      return state.tasks.find((task) => task.id === taskId)
    },
    [state.tasks],
  )

  const getRecentTasks = useCallback(
    (limit = 10) => {
      return state.tasks.slice(0, limit)
    },
    [state.tasks],
  )

  const contextValue: ScrapingContextType = {
    state,
    createTask,
    cancelTask,
    clearCompletedTasks,
    getTaskById,
    getRecentTasks,
  }

  return <ScrapingContext.Provider value={contextValue}>{children}</ScrapingContext.Provider>
}

export function useScrapingContext() {
  const context = useContext(ScrapingContext)
  if (context === undefined) {
    throw new Error("useScrapingContext must be used within a ScrapingProvider")
  }
  return context
}
