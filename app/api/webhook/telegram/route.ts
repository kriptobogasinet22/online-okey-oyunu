import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Telegram Webhook işleyicisi
export async function POST(request: NextRequest) {
  try {
    // Telegram Bot Token'ı kontrol et
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN environment variable is not set")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    // Webhook verilerini al
    const update = await request.json()
    console.log("Received Telegram update:", JSON.stringify(update))

    // Mesaj veya callback_query var mı kontrol et
    if (!update.message && !update.callback_query) {
      return NextResponse.json({ status: "ok" })
    }

    // Mesaj işleme
    if (update.message) {
      const { message } = update
      const chatId = message.chat.id
      const text = message.text || ""

      // Komut işleme
      if (text.startsWith("/")) {
        await handleCommand(text, chatId, message.from)
      } else {
        // Normal mesaj işleme
        await sendTelegramMessage(chatId, "Merhaba! Komutlar için /help yazabilirsiniz.")
      }
    }

    // Callback query işleme (buton tıklamaları)
    if (update.callback_query) {
      const { callback_query } = update
      const chatId = callback_query.message.chat.id
      const data = callback_query.data

      await handleCallbackQuery(data, chatId, callback_query.from)

      // Callback query'yi yanıtla
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callback_query.id,
        }),
      })
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Komut işleme fonksiyonu
async function handleCommand(command: string, chatId: number, user: any) {
  const cmd = command.split(" ")[0].toLowerCase()

  switch (cmd) {
    case "/start":
      await sendWelcomeMessage(chatId, user)
      break
    case "/oyun":
      await createOkeyTable(chatId, user)
      break
    case "/help":
      await sendHelpMessage(chatId)
      break
    default:
      await sendTelegramMessage(chatId, "Geçersiz komut. Komutlar için /help yazabilirsiniz.")
  }
}

// Yardım mesajı gönderme fonksiyonu
async function sendHelpMessage(chatId: number) {
  const helpText = `
Merhaba! İşte kullanabileceğiniz komutlar:
/start - Botu başlatır ve hoş geldiniz mesajı gönderir.
/oyun - Yeni bir Okey oyunu başlatır.
/help - Bu yardım mesajını görüntüler.
`
  await sendTelegramMessage(chatId, helpText)
}

// Hoş geldiniz mesajı gönderme fonksiyonu
async function sendWelcomeMessage(chatId: number, user: any) {
  const welcomeText = `
Merhaba ${user.first_name || "Oyuncu"}! Okey oyununa hoş geldin!
Yeni bir oyun başlatmak için /oyun yazabilirsin.
`
  await sendTelegramMessage(chatId, welcomeText)
}

// Okey oyunu oluşturma fonksiyonu
async function createOkeyTable(chatId: number, user: any) {
  // Burada Okey oyunu oluşturma ve veritabanına kaydetme işlemleri yapılacak.
  // Örnek olarak, masa oluşturulduğunda oyuncuya bilgi mesajı gönderelim.
  const tableId = Math.floor(Math.random() * 1000) // Geçici masa ID'si
  await sendTelegramMessage(chatId, `Okey masası oluşturuldu! Masa ID: ${tableId}`)

  // Veritabanına masa kaydetme (supabaseAdmin kullanılacak)
  const { data, error } = await supabaseAdmin
    .from("okey_tables")
    .insert([{ chat_id: chatId, table_id: tableId, creator_user_id: user.id }])

  if (error) {
    console.error("Masa oluşturulurken hata:", error)
    await sendTelegramMessage(chatId, "Masa oluşturulurken bir hata oluştu.")
  } else {
    console.log("Masa başarıyla oluşturuldu:", data)
    await sendTelegramMessage(chatId, `Masa başarıyla oluşturuldu. Masa ID: ${tableId}`)
  }
}

// Telegram mesajı gönderme fonksiyonu
async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN environment variable is not set")
    return
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    })

    if (!response.ok) {
      console.error("Mesaj gönderme hatası:", response.status, response.statusText)
    }
  } catch (error) {
    console.error("Mesaj gönderme sırasında hata:", error)
  }
}

// Callback Query işleme fonksiyonu
async function handleCallbackQuery(data: string, chatId: number, user: any) {
  // Buton tıklamasıyla ilgili işlemleri burada gerçekleştir
  console.log("Callback data:", data)

  switch (data) {
    case "join_table":
      await joinOkeyTable(chatId, user)
      break
    default:
      await sendTelegramMessage(chatId, "Geçersiz işlem.")
  }
}

// Okey masasına katılma fonksiyonu
async function joinOkeyTable(chatId: number, user: any) {
  // Oyuncunun masaya katılma işlemleri
  await sendTelegramMessage(chatId, `${user.first_name || "Oyuncu"} masaya katıldı!`)
}
