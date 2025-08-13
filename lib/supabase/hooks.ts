"use client"

import { useState, useEffect } from "react"
import { SupabaseOperations } from "./operations"
import type { Job } from "./operations"

export function useSupabaseOperations(supabaseUrl: string, supabaseKey: string) {
  const [operations, setOperations] = useState<SupabaseOperations | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      try {
        const ops = new SupabaseOperations(supabaseUrl, supabaseKey)
        setOperations(ops)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize Supabase operations")
        setOperations(null)
      }
    } else {
      setOperations(null)
      setError(null)
    }
  }, [supabaseUrl, supabaseKey])

  return { operations, error }
}

export function useJobStats(operations: SupabaseOperations | null) {
  const [stats, setStats] = useState<{
    totalJobs: number
    totalCompanies: number
    jobsByWebsite: Record<string, number>
    jobsByLocation: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!operations) return

    setLoading(true)
    setError(null)

    try {
      const statsData = await operations.getJobStats()
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [operations])

  return { stats, loading, error, refetch: fetchStats }
}

export function useJobs(operations: SupabaseOperations | null, sourceWebsite?: string) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async () => {
    if (!operations) return

    setLoading(true)
    setError(null)

    try {
      const jobsData = sourceWebsite
        ? await operations.getJobsBySourceWebsite(sourceWebsite)
        : await operations.searchJobs({})
      setJobs(jobsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [operations, sourceWebsite])

  return { jobs, loading, error, refetch: fetchJobs }
}
