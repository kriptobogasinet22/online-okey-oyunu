import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function POST() {
  try {
    // Test kullanıcısı bilgileri
    const testUser = {
      telegram_id: "12345678",
      first_name: "Test",
      last_name: "User",
      username: "testuser",
    }

    // Kullanıcıyı veritabanında ara veya oluştur
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("telegram_id", testUser.telegram_id)
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
          telegram_id: testUser.telegram_id,
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          username: testUser.username,
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Error creating user:", insertError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      userId = newUser.id

      // Yeni kullanıcı için bakiye oluştur (test için 1000 TL)
      await supabaseAdmin.from("user_balances").insert({
        user_id: userId,
        balance: 1000,
      })
    }

    // Kullanıcı için JWT token oluştur
    const { data: token, error: tokenError } = await supabaseAdmin.auth.admin.createUser({
      email: "test@example.com",
      password: "password123",
      email_confirm: true,
      user_metadata: {
        telegram_id: testUser.telegram_id,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        username: testUser.username,
      },
    })

    if (tokenError) {
      console.error("Error creating token:", tokenError)
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: userId,
        telegram_id: testUser.telegram_id,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        username: testUser.username,
      },
      session: token.session,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
