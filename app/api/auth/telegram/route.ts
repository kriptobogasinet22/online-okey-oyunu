import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const requestData = await request.json()

  const { telegram_id, first_name, last_name, username } = requestData

  if (!telegram_id) {
    return NextResponse.json({ error: "Telegram ID is required" }, { status: 400 })
  }

  try {
    // Kullanıcıyı telegram_id ile ara
    let { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegram_id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Kullanıcı yoksa oluştur
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            telegram_id,
            first_name,
            last_name,
            username,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Error creating user:", insertError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      user = newUser

      // Yeni kullanıcı için bakiye oluştur
      const { error: balanceError } = await supabase.from("user_balances").insert([
        {
          user_id: user.id,
          balance: 0,
        },
      ])

      if (balanceError) {
        console.error("Error creating balance:", balanceError)
        // Bakiye oluşturma hatası kritik değil, devam edebiliriz
      }
    }

    // Supabase Auth ile oturum oluştur
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${telegram_id}@telegram.user`,
      password: `telegram-${telegram_id}-${process.env.SUPABASE_JWT_SECRET?.substring(0, 10) || "secret"}`,
    })

    if (signInError) {
      // Kullanıcı henüz auth sisteminde yoksa oluştur
      if (signInError.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${telegram_id}@telegram.user`,
          password: `telegram-${telegram_id}-${process.env.SUPABASE_JWT_SECRET?.substring(0, 10) || "secret"}`,
          options: {
            data: {
              telegram_id,
              user_id: user.id,
            },
          },
        })

        if (signUpError) {
          console.error("Error signing up:", signUpError)
          return NextResponse.json({ error: "Authentication error" }, { status: 500 })
        }

        return NextResponse.json({ success: true, user })
      }

      console.error("Error signing in:", signInError)
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }

    return NextResponse.json({ success: true, user, session })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
