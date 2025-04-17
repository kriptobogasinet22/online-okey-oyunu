"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function AdminPanel() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [tables, setTables] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [adminId, setAdminId] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    // Gerçek uygulamada oturum kontrolü yapılacak
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Admin kontrolü yap
          const { data: admin } = await supabase.from("admins").select("*").eq("email", session.user.email).single()

          if (admin) {
            setIsAuthenticated(true)
            setAdminId(admin.id)
            setIsSuperAdmin(admin.is_super_admin)
            loadData()
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }

      // Örnek veri
      setDeposits([
        {
          id: 1,
          userId: "user123",
          username: "ahmet123",
          amount: 500,
          method: "bank",
          details: "Ahmet Yılmaz / İş Bankası",
          status: "pending",
          createdAt: "2023-05-15 14:30",
        },
        {
          id: 2,
          userId: "user456",
          username: "mehmet456",
          amount: 1000,
          method: "trx",
          details: "TRX123456789",
          status: "completed",
          createdAt: "2023-05-14 10:15",
        },
        {
          id: 3,
          userId: "user789",
          username: "ayse789",
          amount: 200,
          method: "bank",
          details: "Ayşe Demir / Ziraat Bankası",
          status: "pending",
          createdAt: "2023-05-15 16:45",
        },
      ])

      setWithdrawals([
        {
          id: 1,
          userId: "user123",
          username: "ahmet123",
          amount: 300,
          trxAddress: "TRX987654321",
          status: "pending",
          createdAt: "2023-05-15 15:20",
        },
        {
          id: 2,
          userId: "user456",
          username: "mehmet456",
          amount: 500,
          trxAddress: "TRX123456789",
          status: "completed",
          createdAt: "2023-05-13 11:30",
        },
      ])

      setPaymentMethods([
        {
          id: 1,
          name: "Ziraat Bankası",
          type: "bank",
          details: { accountNumber: "TR00 0000 0000 0000 0000 0000 00", accountName: "Okey Oyunu" },
          isActive: true,
        },
        {
          id: 2,
          name: "TRX Wallet",
          type: "crypto",
          details: { address: "TRX1234567890abcdefghijklmnopqrstuvwxyz" },
          isActive: true,
        },
      ])

      // Masaları getir
      setTables([
        {
          id: "table1",
          name: "Masa 1",
          buy_in: 50,
          status: "waiting",
          player_count: 2,
          created_at: "2023-05-15 14:30",
        },
        {
          id: "table2",
          name: "Masa 2",
          buy_in: 100,
          status: "playing",
          player_count: 4,
          created_at: "2023-05-15 15:20",
        },
        {
          id: "table3",
          name: "Masa 3",
          buy_in: 200,
          status: "waiting",
          player_count: 1,
          created_at: "2023-05-15 16:45",
        },
      ])

      // Kullanıcıları getir
      setUsers([
        {
          id: "user123",
          telegram_id: "123456789",
          first_name: "Ahmet",
          last_name: "Yılmaz",
          username: "ahmet123",
          balance: 1500,
          created_at: "2023-05-10 10:30",
        },
        {
          id: "user456",
          telegram_id: "987654321",
          first_name: "Mehmet",
          last_name: "Demir",
          username: "mehmet456",
          balance: 2500,
          created_at: "2023-05-11 14:20",
        },
      ])
    }

    checkAuth()
  }, [])

  const loadData = async () => {
    try {
      // Gerçek API çağrıları
      const tablesResponse = await fetch("/api/admin/tables")
      if (tablesResponse.ok) {
        const data = await tablesResponse.json()
        setTables(data.tables)
      }

      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setUsers(data.users)
      }

      const depositsResponse = await fetch("/api/admin/deposits")
      if (depositsResponse.ok) {
        const data = await depositsResponse.json()
        setDeposits(data.deposits)
      }

      const withdrawalsResponse = await fetch("/api/admin/withdrawals")
      if (withdrawalsResponse.ok) {
        const data = await withdrawalsResponse.json()
        setWithdrawals(data.withdrawals)
      }

      const paymentMethodsResponse = await fetch("/api/admin/payment-methods")
      if (paymentMethodsResponse.ok) {
        const data = await paymentMethodsResponse.json()
        setPaymentMethods(data.paymentMethods)
      }
    } catch (error) {
      console.error("Data loading error:", error)
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()

      // Admin girişi yap
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error("Geçersiz e-posta veya şifre!")
      }

      // Admin kontrolü yap
      const { data: admin, error: adminError } = await supabase.from("admins").select("*").eq("email", email).single()

      if (adminError || !admin) {
        throw new Error("Bu hesap admin yetkisine sahip değil!")
      }

      setIsAuthenticated(true)
      setAdminId(admin.id)
      setIsSuperAdmin(admin.is_super_admin)
      loadData()
    } catch (error: any) {
      console.error("Giriş hatası:", error)
      toast({
        title: "Giriş Başarısız",
        description: error.message || "Giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveDeposit = async (id: number) => {
    try {
      // Gerçek API çağrısı
      const response = await fetch(`/api/admin/deposits/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_id: adminId }),
      })

      if (!response.ok) {
        throw new Error("İşlem onaylanamadı")
      }

      // UI güncelle
      setDeposits(deposits.map((deposit) => (deposit.id === id ? { ...deposit, status: "completed" } : deposit)))

      toast({
        title: "Başarılı",
        description: "Para yatırma talebi onaylandı.",
      })
    } catch (error: any) {
      console.error("Onaylama hatası:", error)
      toast({
        title: "Hata",
        description: error.message || "İşlem onaylanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleRejectDeposit = async (id: number) => {
    try {
      // Gerçek API çağrısı
      const response = await fetch(`/api/admin/deposits/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_id: adminId }),
      })

      if (!response.ok) {
        throw new Error("İşlem reddedilemedi")
      }

      // UI güncelle
      setDeposits(deposits.map((deposit) => (deposit.id === id ? { ...deposit, status: "rejected" } : deposit)))

      toast({
        title: "Başarılı",
        description: "Para yatırma talebi reddedildi.",
      })
    } catch (error: any) {
      console.error("Reddetme hatası:", error)
      toast({
        title: "Hata",
        description: error.message || "İşlem reddedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleApproveWithdrawal = async (id: number) => {
    try {
      // Gerçek API çağrısı
      const response = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_id: adminId }),
      })

      if (!response.ok) {
        throw new Error("İşlem onaylanamadı")
      }

      // UI güncelle
      setWithdrawals(
        withdrawals.map((withdrawal) => (withdrawal.id === id ? { ...withdrawal, status: "completed" } : withdrawal)),
      )

      toast({
        title: "Başarılı",
        description: "Para çekme talebi onaylandı.",
      })
    } catch (error: any) {
      console.error("Onaylama hatası:", error)
      toast({
        title: "Hata",
        description: error.message || "İşlem onaylanırken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleRejectWithdrawal = async (id: number) => {
    try {
      // Gerçek API çağrısı
      const response = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_id: adminId }),
      })

      if (!response.ok) {
        throw new Error("İşlem reddedilemedi")
      }

      // UI güncelle
      setWithdrawals(
        withdrawals.map((withdrawal) => (withdrawal.id === id ? { ...withdrawal, status: "rejected" } : withdrawal)),
      )

      toast({
        title: "Başarılı",
        description: "Para çekme talebi reddedildi.",
      })
    } catch (error: any) {
      console.error("Reddetme hatası:", error)
      toast({
        title: "Hata",
        description: error.message || "İşlem reddedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Bu masayı silmek istediğinize emin misiniz?")) {
      return
    }

    try {
      // Gerçek API çağrısı
      const response = await fetch("/api/admin/tables/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_id: tableId,
          admin_id: adminId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Masa silinemedi")
      }

      // UI güncelle
      setTables(tables.filter((table) => table.id !== tableId))

      toast({
        title: "Başarılı",
        description: "Masa başarıyla silindi.",
      })
    } catch (error: any) {
      console.error("Masa silme hatası:", error)
      toast({
        title: "Hata",
        description: error.message || "Masa silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md bg-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-center">Admin Girişi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Admin Paneli</h1>
          <Button variant="outline" className="bg-white hover:bg-gray-100" onClick={() => setIsAuthenticated(false)}>
            Çıkış Yap
          </Button>
        </div>

        <Tabs defaultValue="deposits" className="bg-white rounded-lg p-4 shadow-lg">
          <TabsList className="mb-4 bg-gray-100">
            <TabsTrigger value="deposits">Para Yatırma</TabsTrigger>
            <TabsTrigger value="withdrawals">Para Çekme</TabsTrigger>
            <TabsTrigger value="payment-methods">Ödeme Yöntemleri</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="tables">Masalar</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <CardTitle>Para Yatırma Talepleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Kullanıcı</th>
                        <th className="p-2 text-left">Miktar</th>
                        <th className="p-2 text-left">Yöntem</th>
                        <th className="p-2 text-left">Detaylar</th>
                        <th className="p-2 text-left">Tarih</th>
                        <th className="p-2 text-left">Durum</th>
                        <th className="p-2 text-left">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((deposit) => (
                        <tr key={deposit.id} className="border-t">
                          <td className="p-2">{deposit.id}</td>
                          <td className="p-2">{deposit.username}</td>
                          <td className="p-2">{deposit.amount} TL</td>
                          <td className="p-2">{deposit.method === "bank" ? "Banka" : "TRX"}</td>
                          <td className="p-2">{deposit.details}</td>
                          <td className="p-2">{deposit.createdAt}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                deposit.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : deposit.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {deposit.status === "pending"
                                ? "Bekliyor"
                                : deposit.status === "completed"
                                  ? "Onaylandı"
                                  : "Reddedildi"}
                            </span>
                          </td>
                          <td className="p-2">
                            {deposit.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                  onClick={() => handleApproveDeposit(deposit.id)}
                                >
                                  Onayla
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={() => handleRejectDeposit(deposit.id)}
                                >
                                  Reddet
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {deposits.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-gray-500">
                            Henüz para yatırma talebi bulunmuyor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Para Çekme Talepleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Kullanıcı</th>
                        <th className="p-2 text-left">Miktar</th>
                        <th className="p-2 text-left">TRX Adresi</th>
                        <th className="p-2 text-left">Tarih</th>
                        <th className="p-2 text-left">Durum</th>
                        <th className="p-2 text-left">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="border-t">
                          <td className="p-2">{withdrawal.id}</td>
                          <td className="p-2">{withdrawal.username}</td>
                          <td className="p-2">{withdrawal.amount} TL</td>
                          <td className="p-2">{withdrawal.trxAddress}</td>
                          <td className="p-2">{withdrawal.createdAt}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                withdrawal.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : withdrawal.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {withdrawal.status === "pending"
                                ? "Bekliyor"
                                : withdrawal.status === "completed"
                                  ? "Onaylandı"
                                  : "Reddedildi"}
                            </span>
                          </td>
                          <td className="p-2">
                            {withdrawal.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                  onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                >
                                  Onayla
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                >
                                  Reddet
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-gray-500">
                            Henüz para çekme talebi bulunmuyor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-methods">
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Yöntemleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {paymentMethods.map((method) => (
                    <Card key={method.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold">{method.name}</h3>
                            <p className="text-sm text-gray-500">
                              {method.type === "bank" ? "Banka Hesabı" : "Kripto Cüzdan"}
                            </p>

                            {method.type === "bank" && (
                              <div className="mt-2">
                                <p className="text-sm">Hesap No: {method.details.accountNumber}</p>
                                <p className="text-sm">Hesap Adı: {method.details.accountName}</p>
                              </div>
                            )}

                            {method.type === "crypto" && (
                              <div className="mt-2">
                                <p className="text-sm break-all">Adres: {method.details.address}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                method.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {method.isActive ? "Aktif" : "Pasif"}
                            </span>
                            <Button size="sm" variant="outline">
                              Düzenle
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              Sil
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button className="mt-2 bg-blue-600 hover:bg-blue-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Yeni Ödeme Yöntemi Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcılar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Telegram ID</th>
                        <th className="p-2 text-left">Ad</th>
                        <th className="p-2 text-left">Soyad</th>
                        <th className="p-2 text-left">Kullanıcı Adı</th>
                        <th className="p-2 text-left">Bakiye</th>
                        <th className="p-2 text-left">Kayıt Tarihi</th>
                        <th className="p-2 text-left">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t">
                          <td className="p-2">{user.id}</td>
                          <td className="p-2">{user.telegram_id}</td>
                          <td className="p-2">{user.first_name}</td>
                          <td className="p-2">{user.last_name}</td>
                          <td className="p-2">{user.username}</td>
                          <td className="p-2">{user.balance} TL</td>
                          <td className="p-2">{user.created_at}</td>
                          <td className="p-2">
                            <Button size="sm" variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                              Detaylar
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-gray-500">
                            Henüz kullanıcı bulunmuyor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables">
            <Card>
              <CardHeader>
                <CardTitle>Masalar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Masa Adı</th>
                        <th className="p-2 text-left">Giriş Ücreti</th>
                        <th className="p-2 text-left">Durum</th>
                        <th className="p-2 text-left">Oyuncu Sayısı</th>
                        <th className="p-2 text-left">Oluşturulma Tarihi</th>
                        <th className="p-2 text-left">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((table) => (
                        <tr key={table.id} className="border-t">
                          <td className="p-2">{table.id}</td>
                          <td className="p-2">{table.name}</td>
                          <td className="p-2">{table.buy_in} TL</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                table.status === "waiting"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {table.status === "waiting" ? "Bekliyor" : "Oyunda"}
                            </span>
                          </td>
                          <td className="p-2">{table.player_count}/4</td>
                          <td className="p-2">{table.created_at}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Detaylar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => handleDeleteTable(table.id)}
                                disabled={table.status === "playing" && !isSuperAdmin}
                              >
                                Sil
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {tables.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-gray-500">
                            Henüz masa bulunmuyor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
