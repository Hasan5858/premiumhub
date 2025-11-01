import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { NavigationProvider } from "@/contexts/NavigationContext"
import { SidebarProvider } from "@/contexts/SidebarContext"
import Layout from "@/components/Layout"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { initializeCache } from "@/services/cache"
import { useEffect } from "react"
import "@/styles/globals.css"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps }: AppProps) {
  // Initialize cache version check on app mount - runs before auth initialization
  // This ensures cache is cleared regardless of user login status
  useEffect(() => {
    // Run cache initialization immediately and synchronously if possible
    initializeCache()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationProvider>
          <SidebarProvider>
            <Layout>
              <Component {...pageProps} />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "#1F2937",
                    color: "#fff",
                  },
                }}
              />
            </Layout>
          </SidebarProvider>
        </NavigationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
