"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

export default function BuyChips() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")
  const [paymentDetails, setPaymentDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number.parseInt(amount) < 50) {
      alert("Minimum 50 TL yükleme yapabilirsiniz.")
      return
    }

    setIsSubmitting(true)

    try {
      // Burada API çağrısı yapılacak
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simüle edilmiş API çağrısı

      alert("Ödeme talebiniz alındı. İşleminiz onaylandıktan sonra bakiyenize yansıyacaktır.")
      router.push("/dashboard")
    } catch (error) {
      console.error("Ödeme hatası:", error)
      alert("Ödeme işlemi sırasında bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-md mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
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

        <Card>
          <CardHeader>
            <CardTitle>Çip Satın Al</CardTitle>
            <CardDescription>1 TL = 1 Çip</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Yüklemek istediğiniz miktar (TL)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Minimum 50 TL"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Ödeme Yöntemi</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank">Banka Havalesi</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trx" id="trx" />
                    <Label htmlFor="trx">TRX (Tron)</Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === "bank" && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium mb-2">Banka Bilgileri:</p>
                  <p className="text-sm">Banka: Ziraat Bankası</p>
                  <p className="text-sm">IBAN: TR00 0000 0000 0000 0000 0000 00</p>
                  <p className="text-sm">Ad Soyad: Okey Oyunu</p>
                </div>
              )}

              {paymentMethod === "trx" && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium mb-2">TRX Cüzdan Adresi:</p>
                  <p className="text-sm break-all">TRX1234567890abcdefghijklmnopqrstuvwxyz</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="details">
                  {paymentMethod === "bank" ? "Gönderen Ad Soyad / Açıklama" : "TRX İşlem ID / Gönderen Adres"}
                </Label>
                <Textarea
                  id="details"
                  placeholder={
                    paymentMethod === "bank"
                      ? "Havale yaparken kullandığınız isim ve açıklama"
                      : "TRX işlem ID veya gönderen cüzdan adresi"
                  }
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "İşleniyor..." : "Ödeme Talebini Gönder"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
