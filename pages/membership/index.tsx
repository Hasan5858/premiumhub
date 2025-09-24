"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Head from "next/head"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { Check, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateMembershipPlan } from "@/services/auth"

export default function MembershipPage() {
  const { user, setUser } = useAuth()
  const router = useRouter()

  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTelegramPopup, setShowTelegramPopup] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Get plan from URL query if available
    const urlParams = new URLSearchParams(window.location.search)
    const planParam = urlParams.get("plan")
    if (planParam && ["monthly", "3month", "halfyearly", "yearly"].includes(planParam)) {
      setSelectedPlan(planParam)
    }
  }, [user, router])

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan)
    // Show Telegram contact popup instead of payment form
    setShowTelegramPopup(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    // Removed payment form validation

    try {
      setLoading(true)

      // In a real app, you would process payment here
      // For this demo, we'll just update the membership status
      await updateMembershipPlan(selectedPlan)

      // Update user in context with new membership status
      if (user) {
        const updatedUser = { ...user, membership_status: selectedPlan }
        setUser(updatedUser)
      }

      toast.success("Membership updated successfully")
      router.push("/profile?tab=membership")
    } catch (err) {
      console.error("Error updating membership:", err)
      setError(err instanceof Error ? err.message : "Failed to update membership. Please try again.")
      toast.error("Failed to update membership")
    } finally {
      setLoading(false)
    }
  }

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case "monthly":
        return "$3 / 200 TK"
      case "3month":
        return "$8 / 599 TK"
      case "halfyearly":
        return "$15 / 1099 TK"
      case "yearly":
        return "$25 / 1999 TK"
      default:
        return "$0"
    }
  }

  // Format plan name for display
  const getPlanName = (plan: string) => {
    switch (plan) {
      case "monthly":
        return "Monthly"
      case "3month":
        return "3 Months"
      case "halfyearly":
        return "6 Months"
      case "yearly":
        return "Yearly"
      default:
        return "Free"
    }
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <>
      <Head>
        <title>Membership Plans - PremiumHUB</title>
        <meta name="description" content="Upgrade your PremiumHUB membership for premium content access" />
      </Head>

      <div className="pt-20 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link
              href="/profile?tab=membership"
              className="mr-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-white">Membership Plans</h1>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded mb-6">{error}</div>
          )}

          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Choose Your Plan</h2>
              <p className="text-gray-300">
                Upgrade your membership to unlock premium content and features. Choose the plan that works best for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Free Plan */}
              <div
                className={`bg-gray-800 rounded-lg overflow-hidden ${user.membership_status === "free" ? "border-2 border-purple-500" : ""}`}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                  <div className="text-3xl font-bold text-white mb-4">$0</div>
                  <p className="text-gray-400 mb-6">Limited access to content</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Basic content access</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Standard definition</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Ad-supported</span>
                    </li>
                  </ul>
                  {user.membership_status !== "free" && (
                    <button
                      onClick={() => handlePlanSelect("free")}
                      className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Downgrade to Free
                    </button>
                  )}
                  {user.membership_status === "free" && (
                    <div className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-center">Current Plan</div>
                  )}
                </div>
              </div>

              {/* Monthly Plan */}
              <div
                className={`bg-gray-800 rounded-lg overflow-hidden ${user.membership_status === "monthly" ? "border-2 border-purple-500" : ""}`}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">Monthly</h3>
                  <div className="text-3xl font-bold text-white mb-4">$3 / 200 TK</div>
                  <p className="text-gray-400 mb-6">Billed monthly</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">2 device login</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Unlimited streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Bufferless streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">HD/4K streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Webseries access</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Creator access</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Premium categories</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Full support</span>
                    </li>
                  </ul>
                  {user.membership_status !== "monthly" ? (
                    <button
                      onClick={() => handlePlanSelect("monthly")}
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      {user.membership_status === "free" ? "Upgrade" : "Switch Plan"}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-center">Current Plan</div>
                  )}
                </div>
              </div>

              {/* 6 Month Plan */}
              <div
                className={`bg-gray-800 rounded-lg overflow-hidden ${user.membership_status === "halfyearly" ? "border-2 border-purple-500" : ""}`}
              >
                <div className="p-6">
                  <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    POPULAR
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">6 Months</h3>
                  <div className="text-3xl font-bold text-white mb-4">$15 / 1099 TK</div>
                  <p className="text-gray-400 mb-6">Save 17% ($9.99 per month)</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">2 device login</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Unlimited streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Bufferless streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">HD/4K streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Webseries access</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Creator access</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Premium categories</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Full support</span>
                    </li>
                  </ul>
                  {user.membership_status !== "halfyearly" ? (
                    <button
                      onClick={() => handlePlanSelect("halfyearly")}
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      {user.membership_status === "free" ? "Upgrade" : "Switch Plan"}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-center">Current Plan</div>
                  )}
                </div>
              </div>

              {/* Yearly Plan */}
              <div
                className={`bg-gray-800 rounded-lg overflow-hidden ${user.membership_status === "yearly" ? "border-2 border-purple-500" : ""}`}
              >
                <div className="p-6">
                  <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    BEST VALUE
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Yearly</h3>
                  <div className="text-3xl font-bold text-white mb-4">$25 / 1999 TK</div>
                  <p className="text-gray-400 mb-6">Save 25% ($7.50 per month)</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">2 device login</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Unlimited streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Bufferless streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">HD/4K streaming</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Webseries access</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Creator access</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Premium categories</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-300">Full support</span>
                    </li>
                  </ul>
                  {user.membership_status !== "yearly" ? (
                    <button
                      onClick={() => handlePlanSelect("yearly")}
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      {user.membership_status === "free" ? "Upgrade" : "Switch Plan"}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-center">Current Plan</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showTelegramPopup && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Contact on Telegram</h2>
                <p className="text-gray-300 mb-6">
                  To purchase the {getPlanName(selectedPlan)} plan ({getPlanPrice(selectedPlan)}), please contact our
                  support team on Telegram.
                </p>

                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-white mb-2">Payment Methods:</h3>
                  <p className="text-gray-300">Crypto / PayPal / Nagad / Bkash / Rocket</p>
                </div>

                <div className="flex flex-col gap-4">
                  <a
                    href="https://t.me/phubvipbot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
                  >
                    Contact on Telegram
                  </a>
                  <button
                    onClick={() => setShowTelegramPopup(false)}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
