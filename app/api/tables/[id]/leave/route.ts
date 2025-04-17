import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Masadan ayrıl
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = params.id
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Masadan ayrılma isteği: Masa ID=${tableId}, Kullanıcı ID=${user_id}`)

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

    // Kullanıcı masada mı kontrol et
    const { data: player, error: playerError } = await supabaseAdmin
      .from("table_players")
      .select("*")
      .eq("table_id", tableId)
      .eq("user_id", user_id)
      .single()

    if (playerError) {
      console.error("Error fetching player:", playerError)
      return NextResponse.json({ error: "Player not found in this table" }, { status: 404 })
    }

    // Oyun başladıysa ayrılmaya izin verme
    if (table.status === "playing") {
      return NextResponse.json({ error: "Cannot leave a game in progress" }, { status: 400 })
    }

    // Kullanıcıyı masadan çıkar
    const { error: leaveError } = await supabaseAdmin
      .from("table_players")
      .delete()
      .eq("table_id", tableId)
      .eq("user_id", user_id)

    if (leaveError) {
      console.error("Error leaving table:", leaveError)
      return NextResponse.json({ error: "Failed to leave table" }, { status: 500 })
    }

    // Masada oyuncu kalmadıysa veya masa oluşturan kişi ayrıldıysa masayı sil
    const { data: remainingPlayers, error: countError } = await supabaseAdmin
      .from("table_players")
      .select("id, user_id")
      .eq("table_id", tableId)

    if (!countError) {
      if (!remainingPlayers || remainingPlayers.length === 0 || user_id === table.creator_id) {
        await supabaseAdmin.from("game_tables").delete().eq("id", tableId)
        console.log(
          `Masa silindi: Masa ID=${tableId}, Sebep: ${!remainingPlayers || remainingPlayers.length === 0 ? "Oyuncu kalmadı" : "Oluşturan kişi ayrıldı"}`,
        )
      }
    }

    console.log(`Masadan ayrılma başarılı: Masa ID=${tableId}, Kullanıcı ID=${user_id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
