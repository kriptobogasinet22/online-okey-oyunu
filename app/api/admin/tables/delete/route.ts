import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

// Admin: Masa silme
export async function POST(request: NextRequest) {
  try {
    const { table_id, admin_id } = await request.json()

    if (!table_id || !admin_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Admin yetkisi kontrol et
    const { data: admin, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("id", admin_id)
      .single()

    if (adminError || !admin) {
      console.error("Error verifying admin:", adminError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Masa bilgilerini getir
    const { data: table, error: tableError } = await supabaseAdmin
      .from("game_tables")
      .select("*")
      .eq("id", table_id)
      .single()

    if (tableError) {
      console.error("Error fetching table:", tableError)
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Oyun devam ediyorsa silmeye izin verme (sadece süper admin silebilir)
    if (table.status === "playing" && !admin.is_super_admin) {
      return NextResponse.json({ error: "Cannot delete a game in progress" }, { status: 400 })
    }

    // Masayı sil
    const { error: deleteError } = await supabaseAdmin.from("game_tables").delete().eq("id", table_id)

    if (deleteError) {
      console.error("Error deleting table:", deleteError)
      return NextResponse.json({ error: "Failed to delete table" }, { status: 500 })
    }

    console.log(`Masa silindi: Masa ID=${table_id}, Admin ID=${admin_id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
