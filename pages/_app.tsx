import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { NavigationProvider } from "@/contexts/NavigationContext"
import { SidebarProvider } from "@/contexts/SidebarContext"
import Layout from "@/components/Layout"
import "@/styles/globals.css"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps }: AppProps) {
  return (
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
  )
}
