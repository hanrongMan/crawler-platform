"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Play, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useFormValidation, FormFieldError, commonValidationRules } from "./form-validation"
import { useScrapingContext } from "@/lib/context/scraping-context"
import { ScraperFactory } from "@/lib/scraper/scraper-factory"

interface EnhancedScrapingFormProps {
	onSubmit: (data: {
		targetUrl: string
		websiteType: string
		apiConfig?: any
	}) => Promise<void>
	connectionVerified: boolean
	onConnectionSuccess: (url: string, key: string) => void
	defaultValues?: {
		targetUrl: string
		supabaseUrl: string
		supabaseKey: string
		websiteType: string
	}
}

export function EnhancedScrapingForm({ onSubmit, connectionVerified, onConnectionSuccess, defaultValues }: EnhancedScrapingFormProps) {
	const [formData, setFormData] = useState({
		targetUrl: defaultValues?.targetUrl || "",
		websiteType: defaultValues?.websiteType || "",
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)

	const { state } = useScrapingContext()

	const { errors, validateForm, handleFieldChange, handleFieldBlur } = useFormValidation({
		targetUrl: commonValidationRules.url,
	})

	// 保存的所有配置（含多条同类型）
	const [savedConfigs, setSavedConfigs] = useState<any[]>([])
	// 各类型最新配置
	const [latestConfigs, setLatestConfigs] = useState<any[]>([])
	const [isLoadingConfigs, setIsLoadingConfigs] = useState(false)

	const selectedConfig = latestConfigs.find((c) => c.website_type === formData.websiteType)

	// 防止 StrictMode 下 useEffect 调用两次
	const loadedRef = useRef(false)

	// 加载用户保存的爬取配置，并按 website_type 取最新一条（仅首次执行）
	useEffect(() => {
		if (loadedRef.current) return
		loadedRef.current = true

		const loadSavedConfigs = async () => {
			setIsLoadingConfigs(true)
			try {
				const response = await fetch("/api/user-configs")
				if (response.ok) {
					const data = await response.json()
					if (data.configs && Array.isArray(data.configs)) {
						const sorted = data.configs
							.filter((cfg: any) => !!cfg.api_config)
							.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

						applyConfigs(sorted)
						return
					}
				}
				// 非 2xx 或数据异常，尝试本地缓存
				tryLoadFromLocal()
			} catch (error) {
				console.error("Failed to load saved configs:", error)
				tryLoadFromLocal()
			} finally {
				setIsLoadingConfigs(false)
			}
		}

		const applyConfigs = (configs: any[]) => {
			setSavedConfigs(configs)
			const seen = new Set<string>()
			const latest: any[] = []
			for (const cfg of configs) {
				if (!seen.has(cfg.website_type)) {
					latest.push(cfg)
					seen.add(cfg.website_type)
				}
			}
			setLatestConfigs(latest)
			if (latest.length > 0) {
				setFormData((prev) => ({
					...prev,
					websiteType: latest[0].website_type,
					targetUrl: latest[0].target_url || latest[0].api_config?.url || prev.targetUrl,
				}))
				handleFieldChange("targetUrl", latest[0].target_url || latest[0].api_config?.url || "")
			}
		}

		const tryLoadFromLocal = () => {
			try {
				const key = "latest-scraping-configs"
				const cached = JSON.parse(localStorage.getItem(key) || "[]")
				if (Array.isArray(cached) && cached.length > 0) {
					applyConfigs(cached)
				}
			} catch {}
		}

		loadSavedConfigs()
	}, [])

	const supportedWebsites = [
		{ value: "tencent", label: "腾讯招聘", url: "https://careers.tencent.com/", description: "使用API接口获取数据" },
		{ value: "bytedance", label: "字节跳动招聘", url: "https://jobs.bytedance.com/experienced/position", description: "使用API接口获取数据" },
		{ value: "alibaba", label: "阿里招聘", url: "https://talent-holding.alibaba.com/off-campus/position-list?lang=zh", description: "使用API接口获取数据" },
	]

	// 自动检测网站类型
	useEffect(() => {
		if (formData.targetUrl && !formData.websiteType) {
			const detectedType = ScraperFactory.detectWebsiteType(formData.targetUrl)
			if (detectedType) {
				setFormData((prev) => ({ ...prev, websiteType: detectedType }))
			}
		}
	}, [formData.targetUrl, formData.websiteType])

	const handleInputChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }))
		handleFieldChange(name, value)
		setSubmitError(null)
	}

	const handleInputBlur = (name: string, value: string) => {
		handleFieldBlur(name, value)
	}

	// 保存配置选择（值为 website_type）
	const handleConfigSelect = (websiteType: string) => {
		const cfg = latestConfigs.find((c) => c.website_type === websiteType)
		setFormData((prev) => ({
			...prev,
			websiteType,
			targetUrl: cfg?.target_url || cfg?.api_config?.url || prev.targetUrl,
		}))
		handleFieldChange("targetUrl", cfg?.target_url || cfg?.api_config?.url || "")
	}

	// 备用：选择内置网站
	const handleUrlSelect = (websiteValue: string) => {
		const website = supportedWebsites.find((w) => w.value === websiteValue)
		if (website) {
			setFormData((prev) => ({ ...prev, targetUrl: website.url, websiteType: websiteValue }))
			handleFieldChange("targetUrl", website.url)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSubmitError(null)

		if (!validateForm(formData)) return
		if (!connectionVerified) {
			setSubmitError("请先测试并验证Supabase连接")
			return
		}

		setIsSubmitting(true)
		setLogs(["开始提交爬取请求..."])

		// 先尝试打开 SSE，失败则回退轮询
		let sseOk = false
		let pollTimer: any = null
		let since = 0
		let ev: EventSource | null = null
		const stopStreams = () => {
			if (ev) {
				try { ev.close() } catch {}
				ev = null
			}
			if (pollTimer) {
				clearInterval(pollTimer)
				pollTimer = null
			}
		}

		try {
			try {
				ev = new EventSource('/api/scrape-log?mode=sse')
				ev.onmessage = (e) => {
					if (!sseOk) sseOk = true
					if (e.data) setLogs((prev) => [...prev, e.data])
				}
				ev.onerror = () => {
					try { ev?.close() } catch {}
					ev = null
				}
				// 等待 600ms 观察是否收到 SSE 消息
				await new Promise((r) => setTimeout(r, 600))
				if (!sseOk && ev) {
					try { ev.close() } catch {}
					ev = null
				}
			} catch {}

			if (!sseOk) {
				const poll = async () => {
					try {
						const res = await fetch(`/api/scrape-log?mode=poll&since=${since}`)
						if (res.ok) {
							const data = await res.json()
							const lines = (data.logs || []).map((l: any) => (since = Math.max(since, l.ts), l.line))
							if (lines.length) setLogs((prev) => [...prev, ...lines])
						}
					} catch {}
				}
				// 立即拉一次，再定时轮询
				await poll()
				pollTimer = setInterval(poll, 1500)
			}

			await onSubmit({
				targetUrl: formData.targetUrl,
				websiteType: formData.websiteType,
				apiConfig: selectedConfig?.api_config,
			})
			setLogs((prev) => [...prev, sseOk ? "已连接日志(SSE)..." : "SSE 不可用，使用轮询获取日志..."])
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : "提交失败，请重试")
			stopStreams()
		} finally {
			setIsSubmitting(false)
		}
	}

	const isFormValid = !Object.values(errors).some((error) => error) && connectionVerified
	const canSubmit = isFormValid && !isSubmitting && !state.isScrapingActive

	const [logs, setLogs] = useState<string[]>([])

	return (
		<Card className="border-blue-200 shadow-lg">
			<CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Database className="h-5 w-5" />
							爬取配置
						</CardTitle>
						<CardDescription className="text-blue-100">选择目标网站并开始爬取招聘数据</CardDescription>
					</div>
					{/* 使用指南按钮移至页面头部（退出前方），此处移除 */}
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Website Selection */}
					<div className="space-y-2">
						<Label htmlFor="website-select">选择爬取接口</Label>
						<Select onValueChange={(v) => (latestConfigs.length ? handleConfigSelect(v) : handleUrlSelect(v))} value={formData.websiteType}>
							<SelectTrigger>
								<SelectValue placeholder={isLoadingConfigs ? "加载中..." : "选择要爬取的招聘网站"} />
							</SelectTrigger>
							<SelectContent>
								{latestConfigs.length > 0 ? (
									latestConfigs.map((config) => (
										<SelectItem key={config.website_type} value={config.website_type}>
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-2">
													<Badge variant="secondary">{config.website_type}</Badge>
													<Badge variant="outline">{config.config_name || `${config.website_type} 配置`}</Badge>
													<span className="text-xs text-muted-foreground">{new Date(config.created_at).toLocaleString()}</span>
												</div>
												<span className="text-xs text-muted-foreground">{config.target_url || config.api_config?.url}</span>
											</div>
										</SelectItem>
									))
								) : (
									supportedWebsites.map((website) => (
										<SelectItem key={website.value} value={website.value}>
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-2">
													<Badge variant="outline">{website.label}</Badge>
												</div>
												<span className="text-xs text-muted-foreground">{website.description}</span>
											</div>
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
						{latestConfigs.length === 0 && !isLoadingConfigs && (
							<p className="text-xs text-muted-foreground">暂无保存的爬取配置，请先在"API分析"中保存爬取模式</p>
						)}
					</div>

					{/* URL / Request Sample */}
					<div className="space-y-2">
						<Label htmlFor="target-url">爬取请求样例</Label>
						<div className="bg-gray-50 border rounded-lg p-3">
							<pre className="text-xs font-mono whitespace-pre-wrap break-all">
{JSON.stringify(selectedConfig?.api_config || { url: formData.targetUrl, method: "GET" }, null, 2)}
							</pre>
						</div>
					</div>

					{/* Connection Status */}
					{connectionVerified && (
						<Alert className="border-green-200 bg-green-50">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								<div className="space-y-1">
									<p>已连接到 Supabase</p>
									<p className="text-xs text-green-700">配置将用于保存爬取结果</p>
								</div>
							</AlertDescription>
						</Alert>
					)}

					{/* Submit */}
					<div className="pt-2">
						<Button type="submit" disabled={!canSubmit} className="w-full">
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在开始爬取...
								</>
							) : (
								<>
									<Play className="mr-2 h-4 w-4" /> 开始爬取
								</>
							)}
						</Button>
						{submitError && (
							<p className="text-sm text-red-600 mt-2 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {submitError}</p>
						)}
					</div>

					{/* 抓取日志 */}
					<div className="space-y-2">
						<Label>抓取日志</Label>
						<div className="bg-black text-green-200 text-xs rounded-md p-3 max-h-56 overflow-auto">
							{logs.length === 0 ? (
								<div className="opacity-60">暂无日志</div>
							) : (
								<pre className="whitespace-pre-wrap break-all">{logs.join("\n")}</pre>
							)}
						</div>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
