import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Oyunu başlat
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = params.id
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Oyun başlatma isteği: Masa ID=${tableId}, Kullanıcı ID=${user_id}`)

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

    // Masadaki oyuncuları getir
    const { data: players, error: playersError } = await supabaseAdmin
      .from("table_players")
      .select("*")
      .eq("table_id", tableId)

    if (playersError) {
      console.error("Error fetching players:", playersError)
      return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
    }

    // En az 2 oyuncu olmalı
    if (!players || players.length < 2) {
      return NextResponse.json({ error: "At least 2 players are required to start the game" }, { status: 400 })
    }

    // Oyunu başlat
    const { error: updateError } = await supabaseAdmin
      .from("game_tables")
      .update({ status: "playing" })
      .eq("id", tableId)

    if (updateError) {
      console.error("Error starting game:", updateError)
      return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
    }

    // Oyun başladığında tüm oyuncuların bakiyesinden buy-in miktarını düş
    for (const player of players) {
      // Oyuncunun bakiyesini getir
      const { data: userBalance, error: balanceError } = await supabaseAdmin
        .from("user_balances")
        .select("balance")
        .eq("user_id", player.user_id)
        .single()

      if (balanceError) {
        console.error(`Error fetching balance for user ${player.user_id}:`, balanceError)
        continue
      }

      if (!userBalance) continue

      // Bakiyeyi güncelle
      await supabaseAdmin
        .from("user_balances")
        .update({ balance: userBalance.balance - table.buy_in })
        .eq("user_id", player.user_id)
    }

    // Oyun geçmişi oluştur
    const { error: historyError } = await supabaseAdmin.from("game_history").insert({
      table_id: tableId,
      started_at: new Date().toISOString(),
      game_data: {
        players: players.map((p) => ({ id: p.user_id, seat: p.seat_position })),
        status: "playing",
      },
    })

    if (historyError) {
      console.error("Error creating game history:", historyError)
      // Oyun geçmişi oluşturulamadı, ancak oyun başlatıldı
    }

    console.log(`Oyun başlatma başarılı: Masa ID=${tableId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
