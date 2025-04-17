"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { WebApp } from "@/types/telegram-web-app"

declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp
    }
  }
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDevelopment, setIsDevelopment] = useState(false)

  const handleTelegramLogin = async () => {
    if (isDevelopment) {
      // Geliştirme modunda test kullanıcısı ile giriş yap
      try {
        setIsLoading(true)

        // Test kullanıcısı oluştur
        const testUser = {
          id: "12345678",
          first_name: "Test",
          last_name: "User",
          username: "testuser",
        }

        // Geliştirme modunda localStorage kullanarak oturum yönetimi
        localStorage.setItem("testUser", JSON.stringify(testUser))
        localStorage.setItem("testBalance", "1000")

        // Kullanıcı bilgilerini ayarla ve dashboard'a yönlendir
        setUser(testUser)
        router.push("/dashboard")
      } catch (err) {
        console.error("Test giriş hatası:", err)
        setError("Test giriş yapılırken bir hata oluştu.")
        setIsLoading(false)
      }
    } else if (window.Telegram && window.Telegram.WebApp) {
      // Telegram ile giriş kodu değişmedi
      try {
        setIsLoading(true)
        // Telegram WebApp'i başlat
        const tgApp = window.Telegram.WebApp
        tgApp.expand()

        // Telegram verilerini al
        const initData = tgApp.initData

        // Telegram verilerini API'ye gönder
        const response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ initData }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Giriş yapılırken bir hata oluştu")
        }

        // Supabase oturumunu ayarla
        const supabase = getSupabaseClient()
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })

        // Kullanıcı bilgilerini ayarla ve dashboard'a yönlendir
        setUser(data.user)
        router.push("/dashboard")
      } catch (err) {
        console.error("Telegram giriş hatası:", err)
        setError("Telegram ile giriş yapılırken bir hata oluştu.")
        setIsLoading(false)
      }
    } else {
      setError("Telegram WebApp bulunamadı. Lütfen Telegram uygulaması içinden erişin.")
    }
  }

  useEffect(() => {
    // Geliştirme ortamını kontrol et
    setIsDevelopment(process.env.NODE_ENV === "development")

    // Geliştirme modunda test kullanıcısını kontrol et
    if (process.env.NODE_ENV === "development") {
      const testUserStr = localStorage.getItem("testUser")
      if (testUserStr) {
        try {
          const testUser = JSON.parse(testUserStr)
          setUser(testUser)
          router.push("/dashboard")
          return
        } catch (err) {
          console.error("Test kullanıcı verisi çözümlenemedi:", err)
        }
      }
    }

    // Telegram WebApp script yükleme
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-web-app.js"
    script.async = true
    script.onload = () => {
      setIsLoading(false)

      // Telegram WebApp başlatma
      if (window.Telegram && window.Telegram.WebApp) {
        try {
          const tgApp = window.Telegram.WebApp
          tgApp.expand()

          // Kullanıcı daha önce giriş yapmış mı kontrol et
          const supabase = getSupabaseClient()
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              // Kullanıcı giriş yapmış, dashboard'a yönlendir
              setUser(session.user)
              router.push("/dashboard")
            }
          })
        } catch (err) {
          console.error("Telegram WebApp başlatma hatası:", err)
          setError("Telegram WebApp başlatılamadı.")
        }
      } else {
        setError("Telegram WebApp bulunamadı. Lütfen Telegram uygulaması içinden erişin.")
      }
    }

    script.onerror = () => {
      setIsLoading(false)
      setError("Telegram WebApp yüklenemedi.")
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Online Okey Oyunu</h1>

      {isLoading ? (
        <p>Yükleniyor...</p>
      ) : error ? (
        <div className="text-red-500 mb-4">
          <p>{error}</p>
          <p className="text-sm mt-2">
            Bu uygulama Telegram Mini App olarak çalışmaktadır. Lütfen Telegram uygulaması içinden erişin.
            {isDevelopment && (
              <span className="block mt-2 text-blue-500">
                Geliştirme modunda olduğunuz için aşağıdaki butonu kullanarak test giriş yapabilirsiniz.
              </span>
            )}
          </p>
        </div>
      ) : user ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Hoş Geldiniz, {user.first_name || user.user_metadata?.first_name || "Kullanıcı"}</CardTitle>
            <CardDescription>Oyun panelinize erişebilirsiniz.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Oyun Paneline Git
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Button onClick={handleTelegramLogin} className="mb-6 bg-[#0088cc] hover:bg-[#0077b5]">
            {isDevelopment ? "Test Giriş Yap" : "Telegram ile Giriş Yap"}
          </Button>

          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Oyun Paneli</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Oyun panelini görmek için giriş yapmalısınız.</p>
              {isDevelopment && (
                <p className="mt-4 text-sm text-blue-500">
                  Geliştirme modunda olduğunuz için "Test Giriş Yap" butonunu kullanabilirsiniz.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
