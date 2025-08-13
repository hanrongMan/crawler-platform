export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          website_url: string | null
          industry: string | null
          company_size: string | null
          location: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          website_url?: string | null
          industry?: string | null
          company_size?: string | null
          location?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          website_url?: string | null
          industry?: string | null
          company_size?: string | null
          location?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          company_id: string | null
          title: string
          department: string | null
          job_type: string | null
          experience_level: string | null
          location: string | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          salary_period: string | null
          description: string | null
          requirements: string | null
          benefits: string | null
          skills: any | null
          status: string | null
          urgency_level: string | null
          contact_email: string | null
          contact_person: string | null
          original_url: string
          source_website: string
          external_job_id: string | null
          scraped_at: string | null
          last_updated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          title: string
          department?: string | null
          job_type?: string | null
          experience_level?: string | null
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          salary_period?: string | null
          description?: string | null
          requirements?: string | null
          benefits?: string | null
          skills?: any | null
          status?: string | null
          urgency_level?: string | null
          contact_email?: string | null
          contact_person?: string | null
          original_url: string
          source_website: string
          external_job_id?: string | null
          scraped_at?: string | null
          last_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          title?: string
          department?: string | null
          job_type?: string | null
          experience_level?: string | null
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          salary_period?: string | null
          description?: string | null
          requirements?: string | null
          benefits?: string | null
          skills?: any | null
          status?: string | null
          urgency_level?: string | null
          contact_email?: string | null
          contact_person?: string | null
          original_url?: string
          source_website?: string
          external_job_id?: string | null
          scraped_at?: string | null
          last_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scraping_tasks: {
        Row: {
          id: string
          user_id: string | null
          target_url: string
          source_website: string
          supabase_url: string
          supabase_key: string
          status: string | null
          progress: number | null
          total_jobs_found: number | null
          jobs_scraped: number | null
          jobs_updated: number | null
          jobs_failed: number | null
          error_message: string | null
          error_details: any | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          target_url: string
          source_website: string
          supabase_url: string
          supabase_key: string
          status?: string | null
          progress?: number | null
          total_jobs_found?: number | null
          jobs_scraped?: number | null
          jobs_updated?: number | null
          jobs_failed?: number | null
          error_message?: string | null
          error_details?: any | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          target_url?: string
          source_website?: string
          supabase_url?: string
          supabase_key?: string
          status?: string | null
          progress?: number | null
          total_jobs_found?: number | null
          jobs_scraped?: number | null
          jobs_updated?: number | null
          jobs_failed?: number | null
          error_message?: string | null
          error_details?: any | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scraping_configs: {
        Row: {
          id: string
          website_name: string
          display_name: string
          base_url: string
          selectors: any
          pagination_config: any | null
          rate_limit_ms: number | null
          max_pages: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_name: string
          display_name: string
          base_url: string
          selectors: any
          pagination_config?: any | null
          rate_limit_ms?: number | null
          max_pages?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_name?: string
          display_name?: string
          base_url?: string
          selectors?: any
          pagination_config?: any | null
          rate_limit_ms?: number | null
          max_pages?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          status: string
          created_at: string
          updated_at: string
          approved_at: string | null
          approved_by: string | null
          rejection_reason: string | null
          last_login_at: string | null
          login_count: number
          daily_scraping_limit: number
          monthly_scraping_limit: number
          current_daily_usage: number
          current_monthly_usage: number
          usage_reset_date: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          last_login_at?: string | null
          login_count?: number
          daily_scraping_limit?: number
          monthly_scraping_limit?: number
          current_daily_usage?: number
          current_monthly_usage?: number
          usage_reset_date?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          last_login_at?: string | null
          login_count?: number
          daily_scraping_limit?: number
          monthly_scraping_limit?: number
          current_daily_usage?: number
          current_monthly_usage?: number
          usage_reset_date?: string
        }
      }
      user_applications: {
        Row: {
          id: string
          user_id: string
          application_reason: string
          intended_use_case: string
          organization: string | null
          website_url: string | null
          expected_usage_volume: string | null
          status: string
          created_at: string
          updated_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          auto_approved: boolean
        }
        Insert: {
          id?: string
          user_id: string
          application_reason: string
          intended_use_case: string
          organization?: string | null
          website_url?: string | null
          expected_usage_volume?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          auto_approved?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          application_reason?: string
          intended_use_case?: string
          organization?: string | null
          website_url?: string | null
          expected_usage_volume?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          auto_approved?: boolean
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          action_type: string
          resource_used: string | null
          usage_count: number
          metadata: any | null
          created_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          resource_used?: string | null
          usage_count?: number
          metadata?: any | null
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          resource_used?: string | null
          usage_count?: number
          metadata?: any | null
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_user_id: string | null
          action: string
          target_user_id: string | null
          details: any | null
          created_at: string
          ip_address: string | null
        }
        Insert: {
          id?: string
          admin_user_id?: string | null
          action: string
          target_user_id?: string | null
          details?: any | null
          created_at?: string
          ip_address?: string | null
        }
        Update: {
          id?: string
          admin_user_id?: string | null
          action?: string
          target_user_id?: string | null
          details?: any | null
          created_at?: string
          ip_address?: string | null
        }
      }
      user_scraping_configs: {
        Row: {
          id: string
          user_id: string
          config_name: string
          target_url: string
          website_type: string
          supabase_url: string
          supabase_key: string
          api_config: any | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          config_name: string
          target_url: string
          website_type: string
          supabase_url: string
          supabase_key: string
          api_config?: any | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          config_name?: string
          target_url?: string
          website_type?: string
          supabase_url?: string
          supabase_key?: string
          api_config?: any | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
