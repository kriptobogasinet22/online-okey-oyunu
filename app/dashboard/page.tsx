"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

interface Table {
  id: string
  name: string
  buy_in: number
  status: string
  player_count: number
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [joiningTable, setJoiningTable] = useState<string | null>(null)

  useEffect(() => {
    // Geliştirme ortamını kontrol et
    setIsDevelopment(process.env.NODE_ENV === "development")

    const checkAuth = async () => {
      // Geliştirme modunda test kullanıcısını kontrol et
      if (process.env.NODE_ENV === "development") {
        const testUserStr = localStorage.getItem("testUser")
        if (testUserStr) {
          try {
            const testUser = JSON.parse(testUserStr)
            setUser(testUser)

            // Test bakiyesini al
            const testBalance = localStorage.getItem("testBalance") || "1000"
            setBalance(Number.parseInt(testBalance, 10))

            // Test masalarını al
            const testTablesStr = localStorage.getItem("testTables") || "[]"
            const testTables = JSON.parse(testTablesStr)

            // Eğer test masaları yoksa, örnek masalar oluştur
            if (testTables.length === 0) {
              const exampleTables = [
                { id: "1", name: "Masa 1", buy_in: 50, status: "waiting", player_count: 2 },
                { id: "2", name: "Masa 2", buy_in: 100, status: "waiting", player_count: 3 },
                { id: "3", name: "Masa 3", buy_in: 50, status: "playing", player_count: 4 },
                { id: "4", name: "VIP Masa", buy_in: 200, status: "waiting", player_count: 1 },
              ]
              localStorage.setItem("testTables", JSON.stringify(exampleTables))
              setTables(exampleTables)
            } else {
              setTables(testTables)
            }

            setIsLoading(false)
            return
          } catch (err) {
            console.error("Test kullanıcı verisi çözümlenemedi:", err)
          }
        }
      }

      // Normal auth kontrolü
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Kullanıcı giriş yapmamışsa ana sayfaya yönlendir
        router.push("/")
        return
      }

      setUser(session.user)

      // Kullanıcı bakiyesini getir
      try {
        const response = await fetch(`/api/balance?user_id=${session.user.id}`)
        const data = await response.json()

        if (response.ok) {
          setBalance(data.balance)
        }
      } catch (error) {
        console.error("Bakiye getirme hatası:", error)
      }

      // Masaları getir
      try {
        const response = await fetch("/api/tables")
        const data = await response.json()

        if (response.ok) {
          setTables(data.tables)
        }
      } catch (error) {
        console.error("Masaları getirme hatası:", error)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleCreateTable = () => {
    router.push("/create-table")
  }

  const handleJoinTable = async (tableId: string) => {
    try {
      setJoiningTable(tableId)
      console.log(`Masaya katılma işlemi başlatılıyor: Masa ID=${tableId}`)

      if (isDevelopment) {
        // Geliştirme modunda masaya katılma
        console.log("Test modunda masaya katılma işlemi")
        const testTablesStr = localStorage.getItem("testTables") || "[]"
        const testTables = JSON.parse(testTablesStr)

        // Masayı bul
        const tableIndex = testTables.findIndex((t: any) => String(t.id) === String(tableId))
        if (tableIndex === -1) {
          toast({
            title: "Hata",
            description: "Masa bulunamadı",
            variant: "destructive",
          })
          setJoiningTable(null)
          return
        }

        const table = testTables[tableIndex]
        console.log("Masa bulundu:", table)

        // Kullanıcı bilgilerini al
        const testUserStr = localStorage.getItem("testUser")
        if (!testUserStr) {
          toast({
            title: "Hata",
            description: "Kullanıcı bulunamadı",
            variant: "destructive",
          })
          setJoiningTable(null)
          return
        }

        const testUser = JSON.parse(testUserStr)
        console.log("Kullanıcı:", testUser)

        // Bakiye kontrolü
        const testBalance = Number.parseInt(localStorage.getItem("testBalance") || "0", 10)
        if (testBalance < table.buy_in) {
          toast({
            title: "Yetersiz Bakiye",
            description: `Bu masaya katılmak için en az ${table.buy_in} TL bakiyeniz olmalı`,
            variant: "destructive",
          })
          setJoiningTable(null)
          return
        }

        // Kullanıcı zaten masada mı kontrol et
        if (table.players && table.players.some((p: any) => p.id === testUser.id)) {
          console.log("Kullanıcı zaten masada, oyun sayfasına yönlendiriliyor")
          router.push(`/game/${tableId}`)
          return
        }

        // Boş koltuk bul
        const positions = [1, 2, 3, 4]
        const takenPositions = table.players ? table.players.map((p: any) => p.position) : []
        const availablePositions = positions.filter((p) => !takenPositions.includes(p))

        if (availablePositions.length === 0) {
          toast({
            title: "Masa Dolu",
            description: "Bu masada boş koltuk bulunmuyor",
            variant: "destructive",
          })
          setJoiningTable(null)
          return
        }

        console.log("Boş koltuklar:", availablePositions)

        // Kullanıcıyı masaya ekle
        if (!table.players) {
          table.players = []
        }

        const selectedPosition = availablePositions[0]
        table.players.push({
          id: testUser.id,
          name: testUser.first_name,
          position: selectedPosition,
          avatar: null,
        })

        table.player_count = table.players.length

        // Masayı güncelle
        testTables[tableIndex] = table
        localStorage.setItem("testTables", JSON.stringify(testTables))

        // Bakiyeyi güncelle
        localStorage.setItem("testBalance", (testBalance - table.buy_in).toString())

        console.log(`Masaya katılma başarılı: Masa=${table.name}, Koltuk=${selectedPosition}`)
        toast({
          title: "Başarılı",
          description: `${table.name} masasına katıldınız`,
        })

        // Oyun sayfasına yönlendir
        console.log(`Oyun sayfasına yönlendiriliyor: /game/${tableId}`)

        // Önce state'i güncelleyelim, sonra yönlendirelim
        setJoiningTable(null)

        // Yönlendirmeyi bir sonraki tick'e erteleyelim
        setTimeout(() => {
          router.push(`/game/${tableId}`)
        }, 100)
      } else {
        // Gerçek API çağrısı ile masaya katılma
        console.log("API ile masaya katılma işlemi")

        // Önce boş koltuk bul
        const response = await fetch(`/api/tables/${tableId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Masa bilgileri alınamadı")
        }

        console.log("Masa bilgileri alındı:", data)

        // Mevcut oyuncuları kontrol et
        const players = data.players || []
        const positions = [1, 2, 3, 4]
        const takenPositions = players.map((p: any) => p.seat_position)
        const availablePositions = positions.filter((p) => !takenPositions.includes(p))

        if (availablePositions.length === 0) {
          toast({
            title: "Masa Dolu",
            description: "Bu masada boş koltuk bulunmuyor",
            variant: "destructive",
          })
          setJoiningTable(null)
          return
        }

        console.log("Boş koltuklar:", availablePositions)
        const selectedPosition = availablePositions[0]

        // Masaya katıl
        console.log(`Masaya katılma isteği gönderiliyor: Masa ID=${tableId}, Koltuk=${selectedPosition}`)
        const joinResponse = await fetch(`/api/tables/${tableId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            seat_position: selectedPosition,
          }),
        })

        const joinData = await joinResponse.json()
        console.log("Masaya katılma yanıtı:", joinData)

        if (!joinResponse.ok) {
          throw new Error(joinData.error || "Masaya katılırken bir hata oluştu")
        }

        toast({
          title: "Başarılı",
          description: `${data.table.name} masasına katıldınız`,
        })

        // Oyun sayfasına yönlendir
        console.log(`Oyun sayfasına yönlendiriliyor: /game/${tableId}`)

        // Önce state'i güncelleyelim, sonra yönlendirelim
        setJoiningTable(null)

        // Yönlendirmeyi bir sonraki tick'e erteleyelim
        setTimeout(() => {
          router.push(`/game/${tableId}`)
        }, 100)
      }
    } catch (error: any) {
      console.error("Masaya katılma hatası:", error)
      toast({
        title: "Hata",
        description: error.message || "Masaya katılırken bir hata oluştu",
        variant: "destructive",
      })
      setJoiningTable(null)
    }
  }

  const handleBuyChips = () => {
    router.push("/buy-chips")
  }

  const handleWithdraw = () => {
    router.push("/withdraw")
  }

  const handleLogout = async () => {
    if (isDevelopment) {
      // Geliştirme modunda localStorage'dan test kullanıcısını temizle
      localStorage.removeItem("testUser")
      localStorage.removeItem("testBalance")
    } else {
      // Normal oturumu kapat
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
    }
    router.push("/")
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>
  }

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Oyun Paneli</h1>
            <p className="text-gray-600">
              Hoş geldiniz, {user?.first_name || user?.user_metadata?.first_name || "Oyuncu"}
              {isDevelopment && <span className="ml-2 text-blue-500">(Test Modu)</span>}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
            <Card className="w-full md:w-auto">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Bakiyeniz</p>
                  <p className="text-2xl font-bold">{balance} TL</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBuyChips} variant="outline" size="sm">
                    Çip Al
                  </Button>
                  <Button onClick={handleWithdraw} variant="outline" size="sm">
                    Çip Boz
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleLogout} variant="outline" size="sm" className="md:self-center">
              Çıkış Yap
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tables">
          <TabsList className="mb-4">
            <TabsTrigger value="tables">Masalar</TabsTrigger>
            <TabsTrigger value="history">Oyun Geçmişi</TabsTrigger>
            <TabsTrigger value="transactions">İşlemler</TabsTrigger>
          </TabsList>

          <TabsContent value="tables">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {tables.map((table) => (
                <Card key={table.id} className="bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{table.name}</CardTitle>
                    <CardDescription>
                      {table.player_count}/4 Oyuncu • {table.buy_in} TL Giriş
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          table.status === "waiting" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {table.status === "waiting" ? "Bekliyor" : "Oyunda"}
                      </span>
                      <Button
                        onClick={() => handleJoinTable(table.id)}
                        disabled={table.status !== "waiting" || table.player_count === 4 || joiningTable === table.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {joiningTable === table.id ? "Katılıyor..." : "Katıl"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card
                className="border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={handleCreateTable}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="rounded-full bg-gray-100 p-3 mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-500"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Yeni Masa Oluştur</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Oyun Geçmişi</CardTitle>
                <CardDescription>Önceki oyunlarınızın sonuçları</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">Henüz oyun geçmişiniz bulunmuyor.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>İşlem Geçmişi</CardTitle>
                <CardDescription>Çip alım ve bozum işlemleriniz</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">Henüz işlem geçmişiniz bulunmuyor.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
