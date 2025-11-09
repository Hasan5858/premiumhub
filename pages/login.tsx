import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, LogIn, X, Copy, Check } from "lucide-react"
import { login } from "@/services/auth"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { setUser } = useAuth()
  const formSubmittedRef = useRef(false)
  
  // Restore form values and error from sessionStorage on mount (in case of remount)
  // NOTE: We don't store password for security reasons - it will be cleared if page remounts
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("login_email")
    const savedError = sessionStorage.getItem("login_error")
    
    if (savedEmail && !email) {
      setEmail(savedEmail)
    }
    if (savedError && !error) {
      setError(savedError)
    }
  }, [])
  
  // Save form values to sessionStorage as user types (for persistence)
  useEffect(() => {
    if (email) {
      sessionStorage.setItem("login_email", email)
    }
  }, [email])
  
  // Keep error in sessionStorage so it persists across remounts
  useEffect(() => {
    if (error) {
      sessionStorage.setItem("login_error", error)
    } else {
      sessionStorage.removeItem("login_error")
    }
  }, [error])

  const copyErrorToClipboard = () => {
    if (error) {
      navigator.clipboard.writeText(error)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent double submission
    if (formSubmittedRef.current || loading) {
      console.log("[Login Page] Submission already in progress, ignoring")
      return
    }
    
    formSubmittedRef.current = true
    
    // Only clear error if user is starting a fresh attempt (not retrying after seeing error)
    // If there's already an error visible, keep it until we have a new result
    const hadError = !!error
    if (!hadError) {
      setError(null)
      sessionStorage.removeItem("login_error")
    }
    
    setLoading(true)

    try {
      console.log("[Login Page] Attempting login...")
      console.log("[Login Page] Form values:", { email, passwordLength: password.length })
      
      const response = await login(email, password)
      console.log("[Login Page] Login response received:", response)
      
      if (!response) {
        throw new Error("No response received from server")
      }

      if (!response.user) {
        console.warn("[Login Page] Response missing user data:", response)
        throw new Error("Login response missing user data")
      }

      // Clear form data from sessionStorage on success
      sessionStorage.removeItem("login_email")
      sessionStorage.removeItem("login_error")
      
      setUser(response.user)
      console.log("[Login Page] User set in context, redirecting...")
      toast.success("Login successful!")
      
      // Use window.location for a full page reload to ensure auth state is properly initialized
      // This is more reliable than router.push for auth redirects
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    } catch (err) {
      console.error("[Login Page] Login error:", err)
      
      let errorMessage = "Login failed. Please try again."
      
      if (err instanceof Error) {
        errorMessage = err.message
        console.error("[Login Page] Error message:", err.message)
        console.error("[Login Page] Error stack:", err.stack)
      } else if (typeof err === 'object' && err !== null) {
        // Try to extract error information from various possible structures
        const errorObj = err as any
        if (errorObj.response) {
          console.error("[Login Page] Error response:", errorObj.response)
          if (errorObj.response.data) {
            console.error("[Login Page] Error response data:", errorObj.response.data)
            errorMessage = errorObj.response.data.message || errorObj.response.data.error || JSON.stringify(errorObj.response.data)
          } else {
            errorMessage = `Server error: ${errorObj.response.status} ${errorObj.response.statusText || ''}`
          }
        } else if (errorObj.message) {
          errorMessage = errorObj.message
        } else {
          errorMessage = JSON.stringify(err)
        }
      }
      
      // Set error and persist it
      setError(errorMessage)
      sessionStorage.setItem("login_error", errorMessage)
      
      // IMPORTANT: DO NOT clear form values on error - keep them so user can retry easily
      console.log("[Login Page] Error set, form values preserved:", { email, passwordLength: password.length })
      
      // Don't show toast - keep error visible on page instead
      // toast.error(errorMessage, { duration: Infinity }) // Use Infinity if we want toast to stay
    } finally {
      setLoading(false)
      formSubmittedRef.current = false
    }
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Or{" "}
            <Link href="/signup" className="font-medium text-purple-500 hover:text-purple-400">
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/70 text-red-400 px-4 py-3 rounded-lg shadow-lg relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <span>Login Error</span>
                  <button
                    onClick={copyErrorToClipboard}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    title="Copy error message"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <div className="text-sm break-words whitespace-pre-wrap font-mono bg-gray-900/50 p-2 rounded mt-2">
                  {error}
                </div>
                <div className="mt-2 text-xs text-red-500/70">
                  Check browser console (F12) for detailed logs. Error will persist until you close it manually.
                </div>
              </div>
              <button
                onClick={() => {
                  setError(null)
                  sessionStorage.removeItem("login_error")
                }}
                className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                title="Close error"
                aria-label="Close error"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
          onReset={(e) => {
            // Prevent accidental form resets - log if it happens
            console.warn("[Login Page] Form reset prevented!", e)
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-purple-500 hover:text-purple-400">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign in
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
