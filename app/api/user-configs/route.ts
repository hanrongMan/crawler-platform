import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient()

		// 验证用户身份
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// 获取用户的所有配置
		const { data: configs, error } = await supabase
			.from("user_scraping_configs")
			.select("*")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Error fetching user configs:", error)
			return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 })
		}

		return NextResponse.json({ configs })
	} catch (error) {
		console.error("Error in GET /api/user-configs:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient()

		// 验证用户身份
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		
		// 检查是否是保存爬取模式的请求
		if (body.website_type && body.target_url && body.api_config) {
			// 保存爬取模式 - 只需要API配置
			const { website_type, target_url, api_config } = body
			
			// 生成配置名称
			const config_name = `${website_type}_scraping_config_${Date.now()}`
			
			// 获取用户的默认Supabase配置
			const { data: defaultConfig } = await supabase
				.from("user_scraping_configs")
				.select("supabase_url, supabase_key")
				.eq("user_id", user.id)
				.eq("is_default", true)
				.maybeSingle()
			
			if (!defaultConfig) {
				return NextResponse.json({ error: "请先配置Supabase连接" }, { status: 400 })
			}
			
			// 保存爬取配置
			const { data: config, error } = await supabase
				.from("user_scraping_configs")
				.insert({
					user_id: user.id,
					config_name,
					target_url,
					website_type,
					supabase_url: defaultConfig.supabase_url,
					supabase_key: defaultConfig.supabase_key,
					api_config,
					is_default: false,
				})
				.select()
				.single()

			if (error) {
				console.error("Error saving scraping config:", error)
				return NextResponse.json({ error: "Failed to save scraping config" }, { status: 500 })
			}

			return NextResponse.json({ ok: true, config })
		}
		
		// 原有的完整配置保存逻辑
		const { config_name, target_url, website_type, supabase_url, supabase_key, api_config, is_default } = body

		// 验证必填字段
		if (!config_name || !target_url || !website_type || !supabase_url || !supabase_key) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
		}

		// 如果设置为默认配置，先取消其他默认配置
		if (is_default) {
			await supabase.from("user_scraping_configs").update({ is_default: false }).eq("user_id", user.id)
		}

		// 保存配置
		const { data: config, error } = await supabase
			.from("user_scraping_configs")
			.insert({
				user_id: user.id,
				config_name,
				target_url,
				website_type,
				supabase_url,
				supabase_key,
				api_config,
				is_default: is_default || false,
			})
			.select()
			.single()

		if (error) {
			console.error("Error saving user config:", error)
			return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
		}

		return NextResponse.json({ config })
	} catch (error) {
		console.error("Error in POST /api/user-configs:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
