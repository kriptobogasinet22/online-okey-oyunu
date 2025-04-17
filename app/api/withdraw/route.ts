import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Para çekme talebi oluştur
export async function POST(request: NextRequest) {
  try {
    const { user_id, amount, trx_address } = await request.json()

    if (!user_id || !amount || !trx_address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Minimum çekme tutarı kontrolü
    if (amount < 100) {
      return NextResponse.json({ error: "Minimum withdrawal amount is 100 TL" }, { status: 400 })
    }

    // Kullanıcının yeterli bakiyesi var mı kontrol et
    const { data: userBalance, error: balanceError } = await supabaseAdmin
      .from("user_balances")
      .select("balance")
      .eq("user_id", user_id)
      .single()

    if (balanceError) {
      console.error("Error fetching user balance:", balanceError)
      return NextResponse.json({ error: "Failed to fetch user balance" }, { status: 500 })
    }

    if (!userBalance || userBalance.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Para çekme talebi oluştur
    const { error } = await supabaseAdmin.from("withdrawals").insert({
      user_id,
      amount,
      trx_address,
      status: "pending",
    })

    if (error) {
      console.error("Error creating withdrawal request:", error)
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
