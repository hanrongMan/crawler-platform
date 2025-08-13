"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// Sign in action
export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign up action
export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")

  if (!email || !password || !fullName) {
    return { error: "Email, password, and name are required" }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          full_name: fullName.toString(),
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    // If user creation is successful, directly create an approved user profile
    if (data.user) {
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: data.user.id,
        email: email.toString(),
        full_name: fullName.toString(),
        status: "approved", // Directly set to approved
        role: "user",
        daily_limit: 50,
        monthly_limit: 1000,
        approved_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("Failed to create user profile:", profileError)
      }
    }

    return {
      success: "注册成功！请检查您的邮箱以确认账户，确认后即可登录使用。",
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign out action
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

// Admin actions
export async function approveUser(userId: string, reviewerNotes?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    throw new Error("Insufficient permissions")
  }

  // Update user profile
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", userId)

  if (profileError) {
    throw new Error("Failed to approve user")
  }

  // Update application
  const { error: applicationError } = await supabase
    .from("user_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      reviewer_notes: reviewerNotes,
    })
    .eq("user_id", userId)

  if (applicationError) {
    console.error("Failed to update application:", applicationError)
  }

  // Log admin action
  await supabase.from("admin_audit_log").insert({
    admin_user_id: user.id,
    action: "approve_user",
    target_user_id: userId,
    details: { reviewer_notes: reviewerNotes },
  })

  revalidatePath("/admin")
}

export async function rejectUser(userId: string, rejectionReason: string, reviewerNotes?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if current user is admin
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    throw new Error("Insufficient permissions")
  }

  // Update user profile
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
    })
    .eq("id", userId)

  if (profileError) {
    throw new Error("Failed to reject user")
  }

  // Update application
  const { error: applicationError } = await supabase
    .from("user_applications")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      reviewer_notes: reviewerNotes,
    })
    .eq("user_id", userId)

  if (applicationError) {
    console.error("Failed to update application:", applicationError)
  }

  // Log admin action
  await supabase.from("admin_audit_log").insert({
    admin_user_id: user.id,
    action: "reject_user",
    target_user_id: userId,
    details: { rejection_reason: rejectionReason, reviewer_notes: reviewerNotes },
  })

  revalidatePath("/admin")
}
