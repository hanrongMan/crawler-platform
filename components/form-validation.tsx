"use client"

import { useState, useCallback } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string
}

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  const validateField = useCallback(
    (name: string, value: string): string | null => {
      const rule = rules[name]
      if (!rule) return null

      if (rule.required && (!value || value.trim() === "")) {
        return "此字段为必填项"
      }

      if (value && rule.minLength && value.length < rule.minLength) {
        return `最少需要 ${rule.minLength} 个字符`
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        return `最多允许 ${rule.maxLength} 个字符`
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        return "格式不正确"
      }

      if (value && rule.custom) {
        return rule.custom(value)
      }

      return null
    },
    [rules],
  )

  const validateForm = useCallback(
    (values: { [key: string]: string }): boolean => {
      const newErrors: ValidationErrors = {}

      Object.keys(rules).forEach((name) => {
        const error = validateField(name, values[name] || "")
        if (error) {
          newErrors[name] = error
        }
      })

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [rules, validateField],
  )

  const handleFieldChange = useCallback(
    (name: string, value: string) => {
      if (touched[name]) {
        const error = validateField(name, value)
        setErrors((prev) => ({
          ...prev,
          [name]: error || "",
        }))
      }
    },
    [touched, validateField],
  )

  const handleFieldBlur = useCallback(
    (name: string, value: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      const error = validateField(name, value)
      setErrors((prev) => ({
        ...prev,
        [name]: error || "",
      }))
    },
    [validateField],
  )

  const clearErrors = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  return {
    errors,
    touched,
    validateForm,
    handleFieldChange,
    handleFieldBlur,
    clearErrors,
    hasErrors: Object.keys(errors).some((key) => errors[key]),
  }
}

interface FormFieldErrorProps {
  error?: string
  success?: boolean
}

export function FormFieldError({ error, success }: FormFieldErrorProps) {
  if (!error && !success) return null

  return (
    <div className="mt-1">
      {error && (
        <Alert className="border-red-200 bg-red-50 py-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
        </Alert>
      )}
      {success && !error && (
        <Alert className="border-green-200 bg-green-50 py-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">验证通过</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// 常用验证规则
export const commonValidationRules = {
  url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      try {
        new URL(value)
        return null
      } catch {
        return "请输入有效的URL地址"
      }
    },
  },
  supabaseUrl: {
    required: true,
    pattern: /^https:\/\/.+\.supabase\.co$/,
    custom: (value: string) => {
      if (!value.includes("supabase.co")) {
        return "请输入有效的Supabase项目URL"
      }
      return null
    },
  },
  supabaseKey: {
    required: true,
    minLength: 20,
    custom: (value: string) => {
      if (!value.startsWith("eyJ")) {
        return "API密钥格式不正确"
      }
      return null
    },
  },
}
