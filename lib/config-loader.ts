import { createClient } from "@/lib/supabase/client"

export async function loadDefaultConfig() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: defaultConfig } = await supabase
      .from("user_scraping_configs")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single()

    return defaultConfig || null
  } catch (error) {
    console.error("Error loading default config:", error)
    return null
  }
}
