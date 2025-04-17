import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Kullanıcı bakiyesini getir
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: balance, error } = await supabaseAdmin
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching balance:", error)
      return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
    }

    return NextResponse.json({ balance: balance?.balance || 0 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// Para yatırma talebi oluştur
export async function POST(request: NextRequest) {
  try {
    const { user_id, amount, payment_method, payment_details } = await request.json()

    if (!user_id || !amount || !payment_method || !payment_details) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Minimum yatırma tutarı kontrolü
    if (amount < 50) {
      return NextResponse.json({ error: "Minimum deposit amount is 50 TL" }, { status: 400 })
    }

    // Para yatırma talebi oluştur
    const { error } = await supabaseAdmin.from("deposits").insert({
      user_id,
      amount,
      payment_method,
      payment_details,
      status: "pending",
    })

    if (error) {
      console.error("Error creating deposit request:", error)
      return NextResponse.json({ error: "Failed to create deposit request" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
