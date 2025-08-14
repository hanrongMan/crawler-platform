import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase/client"

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

		// 从平台库读取用户的默认 Supabase 目标配置
		const { data: cfg, error: cfgError } = await supabase
			.from("user_scraping_configs")
			.select("supabase_url, supabase_key")
			.eq("user_id", user.id)
			.eq("is_default", true)
			.maybeSingle()

		if (cfgError || !cfg) {
			return NextResponse.json({ error: "未找到Supabase连接配置" }, { status: 400 })
		}

		// 使用用户配置的 Supabase 查询其库中的 user_scraping_configs（该表在建表SQL中已创建）
		const target = createSupabaseClient(cfg.supabase_url, cfg.supabase_key)
		const { data: configs, error } = await target
			.from("user_scraping_configs")
			.select("*")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })

		if (error) {
			console.error("Error fetching user configs from target:", error)
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
		// 第一步：在平台库进行用户身份验证
		const supabase = await createClient()
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		
		// 第二步：从平台库获取用户默认的 Supabase 连接配置
		const { data: defaultConfig, error: configError } = await supabase
			.from("user_scraping_configs")
			.select("supabase_url, supabase_key")
			.eq("user_id", user.id)
			.eq("is_default", true)
			.maybeSingle()

		if (configError) {
			console.error("Error fetching default config from platform:", configError)
			return NextResponse.json({ error: "Failed to fetch default config" }, { status: 500 })
		}

		if (!defaultConfig) {
			return NextResponse.json({ error: "请先在 Supabase-Config 中配置并保存连接" }, { status: 400 })
		}

		// 第三步：使用用户的 Supabase 配置创建客户端，准备写入用户自己的数据库
		const target = createSupabaseClient(defaultConfig.supabase_url, defaultConfig.supabase_key)

		// 保存爬取模式（网站请求模板）- 这是 API 分析 tab 的主要功能
		if (body.website_type && body.target_url && body.api_config) {
			const { website_type, target_url, api_config } = body
			const config_name = `${website_type}_scraping_config_${Date.now()}`

			console.log(`[API Analysis] Saving scraping mode for user ${user.id}, website: ${website_type}`)
			console.log(`[API Analysis] Target Supabase: ${defaultConfig.supabase_url}`)

			const { data: config, error } = await target
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
				console.error("Error saving scraping config to user's Supabase:", error)
				return NextResponse.json({ 
					error: "Failed to save scraping config to user's database",
					details: error.message 
				}, { status: 500 })
			}

			console.log(`[API Analysis] Successfully saved scraping config: ${config.id}`)
			return NextResponse.json({ 
				ok: true, 
				config,
				message: "爬取模式已保存到您的 Supabase 数据库"
			})
		}
		
		// 完整配置保存（很少用；同样保存到用户 Supabase）
		const { config_name, target_url, website_type, supabase_url, supabase_key, api_config, is_default } = body

		if (!config_name || !target_url || !website_type || !supabase_url || !supabase_key) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
		}

		// 若设置为默认，先清除此用户在目标库的其他默认
		if (is_default) {
			await target
				.from("user_scraping_configs")
				.update({ is_default: false })
				.eq("user_id", user.id)
		}

		const { data: config, error } = await target
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
			console.error("Error saving user config to target:", error)
			return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
		}

		return NextResponse.json({ config })
	} catch (error) {
		console.error("Error in POST /api/user-configs:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
