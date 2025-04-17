"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Withdraw() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [trxAddress, setTrxAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [balance] = useState(500) // Örnek bakiye

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number.parseInt(amount) < 100) {
      alert("Minimum 100 TL çekim yapabilirsiniz.")
      return
    }

    if (Number.parseInt(amount) > balance) {
      alert("Bakiyenizden fazla çekim yapamazsınız.")
      return
    }

    setIsSubmitting(true)

    try {
      // Burada API çağrısı yapılacak
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simüle edilmiş API çağrısı

      alert("Çekim talebiniz alındı. İşleminiz onaylandıktan sonra TRX adresinize gönderilecektir.")
      router.push("/dashboard")
    } catch (error) {
      console.error("Çekim hatası:", error)
      alert("Çekim işlemi sırasında bir hata oluştu.")
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
            <CardTitle>Çip Bozumu</CardTitle>
            <CardDescription>
              Mevcut bakiyeniz: {balance} TL
              <br />
              Çekimler TRX olarak yapılmaktadır.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Çekmek istediğiniz miktar (TL)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Minimum 100 TL"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="100"
                  max={balance.toString()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trxAddress">TRX Cüzdan Adresi</Label>
                <Input
                  id="trxAddress"
                  placeholder="TRX cüzdan adresinizi girin"
                  value={trxAddress}
                  onChange={(e) => setTrxAddress(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Lütfen doğru TRX adresini girdiğinizden emin olun. Yanlış adrese yapılan transferlerden sorumluluk
                  kabul edilmemektedir.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "İşleniyor..." : "Çekim Talebi Gönder"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
