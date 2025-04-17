import { type NextRequest, NextResponse } from "next/server"

// Oyuncunun taşlarını getir
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tableId = params.id
    const userId = request.nextUrl.searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Taşları getirme isteği: Masa ID=${tableId}, Kullanıcı ID=${userId}`)

    // Gerçek bir uygulamada, burada veritabanından oyuncunun taşlarını getirirdik
    // Ancak bu örnekte rastgele taşlar oluşturacağız

    const colors = ["red", "blue", "yellow", "black"]
    const tiles = []

    for (let i = 0; i < 14; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const number = Math.floor(Math.random() * 13) + 1
      tiles.push({
        id: i,
        color,
        number,
        isJoker: Math.random() < 0.05, // %5 ihtimalle joker
      })
    }

    console.log(`Taşlar oluşturuldu: ${tiles.length} adet`)
    return NextResponse.json({ tiles })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
