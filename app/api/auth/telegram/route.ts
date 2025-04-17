import { type NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { supabaseAdmin } from "@/lib/supabase/server"

// Telegram Mini App'den gelen verileri doğrulama
function verifyTelegramWebAppData(telegramInitData: string): boolean {
  try {
    // Geliştirme modunda doğrulamayı atla
    if (process.env.NODE_ENV === "development") {
      return true
    }

    const initData = new URLSearchParams(telegramInitData)
    const hash = initData.get("hash")
    if (!hash) return false

    // Hash'i doğrulamak için diğer parametreleri alıyoruz
    initData.delete("hash")
    const dataCheckString = Array.from(initData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    // HMAC-SHA-256 ile hash'i doğruluyoruz
    const secretKey = createHmac("sha256", "WebAppData")
      .update(process.env.TELEGRAM_BOT_TOKEN || "")
      .digest()

    const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    return calculatedHash === hash
  } catch (error) {
    console.error("Telegram data verification error:", error)
    return false
  }
}

// Telegram avatarını getir
async function getTelegramUserAvatar(userId: string): Promise<string | null> {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return null
    }

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUserProfilePhotos?user_id=${userId}&limit=1`,
    )

    const data = await response.json()

    if (!data.ok || !data.result.photos || data.result.photos.length === 0) {
      return null
    }

    // En büyük boyuttaki fotoğrafı al
    const photo = data.result.photos[0][0]

    // Fotoğraf dosyasını al
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${photo.file_id}`,
    )

    const fileData = await fileResponse.json()

    if (!fileData.ok || !fileData.result.file_path) {
      return null
    }

    // Fotoğraf URL'sini oluştur
    return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`
  } catch (error) {
    console.error("Error fetching Telegram avatar:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json()

    // Telegram verilerini doğrula
    if (!verifyTelegramWebAppData(initData)) {
      return NextResponse.json({ error: "Invalid Telegram data" }, { status: 400 })
    }

    // Telegram verilerini parse et
    const parsedData = new URLSearchParams(initData)
    const userDataStr = parsedData.get("user")

    if (!userDataStr) {
      return NextResponse.json({ error: "User data not found" }, { status: 400 })
    }

    const userData = JSON.parse(userDataStr)
    const telegramId = userData.id.toString()

    // Kullanıcı avatarını getir
    const avatarUrl = await getTelegramUserAvatar(telegramId)

    // Kullanıcıyı veritabanında ara veya oluştur
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    let userId = existingUser?.id

    // Kullanıcı yoksa oluştur
    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          telegram_id: telegramId,
          first_name: userData.first_name,
          last_name: userData.last_name || null,
          username: userData.username || null,
          avatar_url: avatarUrl,
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Error creating user:", insertError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      userId = newUser.id

      // Yeni kullanıcı için bakiye oluştur (başlangıç bakiyesi 0)
      await supabaseAdmin.from("user_balances").insert({
        user_id: userId,
        balance: 0,
      })
    } else {
      // Kullanıcı varsa avatar güncellemesi yap
      if (avatarUrl) {
        await supabaseAdmin.from("users").update({ avatar_url: avatarUrl }).eq("id", userId)
      }
    }

    // Kullanıcı için JWT token oluştur
    const { data: token, error: tokenError } = await supabaseAdmin.auth.admin.createUser({
      email: `${telegramId}@telegram.user`,
      password: `telegram-${telegramId}-${Date.now()}`,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramId,
        first_name: userData.first_name,
        last_name: userData.last_name || null,
        username: userData.username || null,
        avatar_url: avatarUrl,
      },
    })

    if (tokenError) {
      console.error("Error creating token:", tokenError)
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: userId,
        telegram_id: telegramId,
        first_name: userData.first_name,
        last_name: userData.last_name || null,
        username: userData.username || null,
        avatar_url: avatarUrl,
      },
      session: token.session,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
