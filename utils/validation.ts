import { z } from "zod"
import validator from "validator"

// User input validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => validator.normalizeEmail(val) as string),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long"),
})

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long")
    .regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces")
    .transform((val) => validator.escape(val.trim())),
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => validator.normalizeEmail(val) as string),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{6,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
})

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query is too long")
    .transform((val) => validator.escape(val.trim())),
})

// SQL injection prevention
export const sanitizeQuery = (value: string): string => {
  return validator.escape(value.replace(/[;'"\\]/g, ""))
}

// Input sanitization for general text
export const sanitizeText = (text: string): string => {
  return validator.escape(text.trim())
}

// Validate and sanitize email
export const validateEmail = (email: string): string | null => {
  try {
    return loginSchema.shape.email.parse(email)
  } catch (error) {
    return null
  }
}

// Validate and sanitize password
export const validatePassword = (password: string): boolean => {
  try {
    loginSchema.shape.password.parse(password)
    return true
  } catch (error) {
    return false
  }
}
