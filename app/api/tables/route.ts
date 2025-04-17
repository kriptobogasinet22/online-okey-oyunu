import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Tüm masaları getir
export async function GET() {
  try {
    const { data: tables, error } = await supabaseAdmin
      .from("game_tables")
      .select(`
        *,
        table_players:table_players(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tables:", error)
      return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
    }

    // Her masa için oyuncu sayısını hesapla
    const tablesWithPlayerCount = tables.map((table) => ({
      ...table,
      player_count: table.table_players ? table.table_players.length : 0,
      table_players: undefined, // Oyuncu detaylarını client'a gönderme
    }))

    return NextResponse.json({ tables: tablesWithPlayerCount })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// Yeni masa oluştur
export async function POST(request: NextRequest) {
  try {
    const { name, buy_in, user_id } = await request.json()

    if (!name || !buy_in || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    if (!userBalance || userBalance.balance < buy_in) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Yeni masa oluştur
    const { data: newTable, error: tableError } = await supabaseAdmin
      .from("game_tables")
      .insert({
        name,
        buy_in,
        status: "waiting",
        creator_id: user_id, // Masa oluşturan kullanıcıyı kaydet
      })
      .select()
      .single()

    if (tableError) {
      console.error("Error creating table:", tableError)
      return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
    }

    // Masa oluşturan kullanıcıyı masaya ekle (1 numaralı koltuk)
    const { error: playerError } = await supabaseAdmin.from("table_players").insert({
      table_id: newTable.id,
      user_id,
      seat_position: 1,
    })

    if (playerError) {
      console.error("Error adding player to table:", playerError)
      // Masa oluşturuldu ama oyuncu eklenemedi, masayı sil
      await supabaseAdmin.from("game_tables").delete().eq("id", newTable.id)
      return NextResponse.json({ error: "Failed to add player to table" }, { status: 500 })
    }

    // NOT: Bakiye düşürme işlemi oyun başladığında yapılacak

    return NextResponse.json({ table: newTable })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
