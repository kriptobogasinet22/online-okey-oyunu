"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Telegram WebApp API tipini tanımlayalım
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
      }
    }
  }
}

export default function Home() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Telegram WebApp API'sini kontrol et
    const isTelegramWebApp = window.Telegram && window.Telegram.WebApp

    if (isTelegramWebApp) {
      // Telegram WebApp'i hazır olduğunu bildir
      window.Telegram.WebApp.ready()
      // WebApp'i genişlet
      window.Telegram.WebApp.expand()

      // Telegram kullanıcı bilgilerini al
      const telegramUser = window.Telegram.WebApp.initDataUnsafe.user

      if (telegramUser) {
        // Kullanıcı giriş yapmış, dashboard'a yönlendir
        handleTelegramLogin(telegramUser)
      }
    } else {
      // Tarayıcıdan erişim durumunda otomatik olarak dashboard'a yönlendir
      // Not: Gerçek uygulamada burada bir kimlik doğrulama kontrolü yapılmalıdır
      checkSession()
    }
  }, [])

  // Oturum kontrolü
  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      router.push("/dashboard")
    }
  }

  // Telegram ile giriş işlemi
  const handleTelegramLogin = async (telegramUser: any) => {
    try {
      // Telegram kullanıcı bilgilerini API'ye gönder ve giriş yap
      const response = await fetch("/api/auth/telegram-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_id: telegramUser.id.toString(),
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name || "",
          username: telegramUser.username || "",
        }),
      })

      if (response.ok) {
        // Başarılı giriş, dashboard'a yönlendir
        router.push("/dashboard")
      } else {
        console.error("Telegram login failed")
      }
    } catch (error) {
      console.error("Error during Telegram login:", error)
    }
  }

  // Tarayıcıdan erişim için giriş butonu
  const handleBrowserLogin = () => {
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-800 to-green-950 p-4">
      <Card className="w-full max-w-md bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative w-24 h-24">
            <Image src="/logo.png" alt="Okey Oyunu Logo" fill style={{ objectFit: "contain" }} priority />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Online Okey Oyunu</CardTitle>
          <CardDescription>Arkadaşlarınızla birlikte online okey oynayın</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Gerçek oyuncularla online okey oynamak için giriş yapın veya hesap oluşturun.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full bg-[#0088cc] hover:bg-[#0077b5]" onClick={handleBrowserLogin}>
            Giriş Yap
          </Button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Telegram üzerinden açtıysanız otomatik olarak giriş yapılacaktır.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
