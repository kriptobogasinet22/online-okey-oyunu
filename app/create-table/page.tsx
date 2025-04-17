"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

export default function CreateTable() {
  const router = useRouter()
  const [tableName, setTableName] = useState("")
  const [buyIn, setBuyIn] = useState("50")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDevelopment] = useState(process.env.NODE_ENV === "development")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!tableName) {
      setError("Lütfen masa adı girin")
      return
    }

    setIsSubmitting(true)

    try {
      if (isDevelopment) {
        // Geliştirme modunda localStorage'a yeni masa ekle
        const testUserStr = localStorage.getItem("testUser")
        if (!testUserStr) {
          throw new Error("Kullanıcı bulunamadı")
        }

        const testUser = JSON.parse(testUserStr)
        const testBalance = Number.parseInt(localStorage.getItem("testBalance") || "0", 10)
        const buyInAmount = Number.parseInt(buyIn, 10)

        if (testBalance < buyInAmount) {
          setError("Yetersiz bakiye")
          setIsSubmitting(false)
          return
        }

        // Yeni masa ID'si oluştur
        const newTableId = Date.now().toString()

        // Masayı localStorage'a kaydet
        const tablesStr = localStorage.getItem("testTables") || "[]"
        const tables = JSON.parse(tablesStr)

        tables.push({
          id: newTableId,
          name: tableName,
          buy_in: buyInAmount,
          status: "waiting",
          creator_id: testUser.id,
          player_count: 1,
          players: [
            {
              id: testUser.id,
              name: testUser.first_name,
              position: 1,
              avatar: null,
            },
          ],
        })

        localStorage.setItem("testTables", JSON.stringify(tables))

        // Bakiye düşürme işlemi oyun başladığında yapılacak

        // Oyun sayfasına yönlendir
        toast({
          title: "Masa oluşturuldu",
          description: "Masa başarıyla oluşturuldu.",
        })
        router.push(`/game/${newTableId}`)
      } else {
        // Gerçek API çağrısı
        const supabase = getSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          throw new Error("Oturum bulunamadı")
        }

        const response = await fetch("/api/tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: tableName,
            buy_in: Number.parseInt(buyIn, 10),
            user_id: session.user.id,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Masa oluşturulurken bir hata oluştu")
        }

        toast({
          title: "Masa oluşturuldu",
          description: "Masa başarıyla oluşturuldu.",
        })

        // Oyun sayfasına yönlendir
        router.push(`/game/${data.table.id}`)
      }
    } catch (err: any) {
      console.error("Masa oluşturma hatası:", err)
      setError(err.message || "Masa oluşturulurken bir hata oluştu")
      toast({
        title: "Hata",
        description: err.message || "Masa oluşturulurken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen p-4 bg-gradient-to-b from-blue-500 to-blue-700">
      <div className="max-w-md mx-auto">
        <Button variant="ghost" className="mb-4 text-white hover:bg-blue-600/20" onClick={() => router.back()}>
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
            className="mr-2 h-4 w-4"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Geri
        </Button>

        <Card className="bg-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle>Yeni Masa Oluştur</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="tableName">Masa Adı</Label>
                <Input
                  id="tableName"
                  placeholder="Masa adını girin"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Giriş Ücreti</Label>
                <RadioGroup value={buyIn} onValueChange={setBuyIn} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50" id="r1" />
                    <Label htmlFor="r1">50 TL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="100" id="r2" />
                    <Label htmlFor="r2">100 TL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="200" id="r3" />
                    <Label htmlFor="r3">200 TL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="500" id="r4" />
                    <Label htmlFor="r4">500 TL</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? "Oluşturuluyor..." : "Masa Oluştur"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
