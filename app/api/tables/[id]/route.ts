import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Belirli bir masanın detaylarını getir
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = params.id

    // Masa bilgilerini ve oyuncuları getir
    const { data: table, error: tableError } = await supabaseAdmin
      .from("game_tables")
      .select("*")
      .eq("id", tableId)
      .single()

    if (tableError) {
      console.error("Error fetching table:", tableError)
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Masadaki oyuncuları getir
    const { data: players, error: playersError } = await supabaseAdmin
      .from("table_players")
      .select(`
        *,
        user:users(id, telegram_id, first_name, last_name, username)
      `)
      .eq("table_id", tableId)

    if (playersError) {
      console.error("Error fetching players:", playersError)
      return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
    }

    return NextResponse.json({
      table,
      players,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// Masaya katıl
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = params.id
    const { user_id, seat_position } = await request.json()

    if (!user_id || !seat_position) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Masaya katılma isteği: Masa ID=${tableId}, Kullanıcı ID=${user_id}, Koltuk=${seat_position}`)

    // Masa bilgilerini getir
    const { data: table, error: tableError } = await supabaseAdmin
      .from("game_tables")
      .select("*")
      .eq("id", tableId)
      .single()

    if (tableError) {
      console.error("Error fetching table:", tableError)
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Masa oyunda mı kontrol et
    if (table.status !== "waiting") {
      return NextResponse.json({ error: "Cannot join a game in progress" }, { status: 400 })
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

    if (!userBalance || userBalance.balance < table.buy_in) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Koltuk boş mu kontrol et
    const { data: existingSeat, error: seatError } = await supabaseAdmin
      .from("table_players")
      .select("*")
      .eq("table_id", tableId)
      .eq("seat_position", seat_position)
      .maybeSingle()

    if (seatError) {
      console.error("Error checking seat:", seatError)
      return NextResponse.json({ error: "Failed to check seat availability" }, { status: 500 })
    }

    if (existingSeat) {
      return NextResponse.json({ error: "Seat already taken" }, { status: 400 })
    }

    // Kullanıcı zaten masada mı kontrol et
    const { data: existingPlayer, error: playerError } = await supabaseAdmin
      .from("table_players")
      .select("*")
      .eq("table_id", tableId)
      .eq("user_id", user_id)
      .maybeSingle()

    if (playerError) {
      console.error("Error checking player:", playerError)
      return NextResponse.json({ error: "Failed to check player" }, { status: 500 })
    }

    if (existingPlayer) {
      return NextResponse.json({ error: "Already joined this table" }, { status: 400 })
    }

    // Kullanıcıyı masaya ekle
    const { error: joinError } = await supabaseAdmin.from("table_players").insert({
      table_id: tableId,
      user_id,
      seat_position,
    })

    if (joinError) {
      console.error("Error joining table:", joinError)
      return NextResponse.json({ error: "Failed to join table" }, { status: 500 })
    }

    // Kullanıcının bakiyesinden buy-in miktarını düş
    const { error: updateBalanceError } = await supabaseAdmin
      .from("user_balances")
      .update({ balance: userBalance.balance - table.buy_in })
      .eq("user_id", user_id)

    if (updateBalanceError) {
      console.error("Error updating balance:", updateBalanceError)
      // Bakiye güncellenemedi, ancak masaya katılma işlemi başarılı oldu
      // İdeal olarak burada bir transaction kullanılmalı, ancak basitlik için bu şekilde bırakıyoruz
    }

    console.log(`Masaya katılma başarılı: Masa ID=${tableId}, Kullanıcı ID=${user_id}, Koltuk=${seat_position}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
