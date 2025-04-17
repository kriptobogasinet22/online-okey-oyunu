"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/client"
import Image from "next/image"
import { useSocket } from "@/hooks/useSocket"
import { toast } from "@/components/ui/use-toast"

interface GameProps {
  params: {
    id: string
  }
}

interface Player {
  id: string
  name: string
  position: number
  isCurrentPlayer: boolean
  avatar?: string | null
}

interface Tile {
  id: number
  color: string // red, blue, yellow, black
  number: number // 1-13
  isJoker?: boolean
}

interface ChatMessage {
  id: string | number
  sender: string
  senderId: string
  text: string
  timestamp: string
}

export default function Game({ params }: GameProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [gameState, setGameState] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const initialLoadRef = useRef(true)

  // useSocket hook'unu her zaman çağır, ancak gerekli parametreler yoksa null değerler gönder
  const socket = useSocket(
    params.id || null,
    user?.id || null,
    user?.first_name || user?.user_metadata?.first_name || null,
  )

  useEffect(() => {
    // Sayfa yüklendiğinde bir kere çalışacak
    console.log("Game sayfası yükleniyor, Masa ID:", params.id)

    // Geliştirme ortamını kontrol et
    const devMode = process.env.NODE_ENV === "development"
    setIsDevelopment(devMode)
    console.log("Geliştirme modu:", devMode)

    // Sayfa yüklendiğinde bir kere çalışacak
    const loadGameData = async () => {
      try {
        console.log("Oyun verisi yükleniyor...")

        if (devMode) {
          // Test kullanıcısını al
          const testUserStr = localStorage.getItem("testUser")
          if (!testUserStr) {
            console.error("Test kullanıcısı bulunamadı")
            setError("Kullanıcı bilgileri bulunamadı")
            return
          }

          const testUser = JSON.parse(testUserStr)
          console.log("Test kullanıcısı:", testUser)
          setUser(testUser)

          // Test masasını al
          const testTablesStr = localStorage.getItem("testTables") || "[]"
          const testTables = JSON.parse(testTablesStr)
          console.log("Tüm masalar:", testTables)

          // String olarak karşılaştır
          const table = testTables.find((t: any) => String(t.id) === String(params.id))
          console.log("Bulunan masa:", table)

          if (!table) {
            console.error("Masa bulunamadı")
            setError("Masa bulunamadı")
            toast({
              title: "Hata",
              description: "Masa bulunamadı",
              variant: "destructive",
            })
            return
          }

          // Oyun durumunu ayarla
          setGameState({
            tableId: params.id,
            name: table.name,
            status: table.status || "waiting",
            buyIn: table.buy_in,
            pot: table.buy_in * (table.players?.length || 0),
          })

          // Oyuncuları ayarla
          const tablePlayers = table.players || []
          console.log("Masa oyuncuları:", tablePlayers)

          const formattedPlayers = tablePlayers.map((p: any) => ({
            id: p.id,
            name: p.name,
            position: p.position,
            isCurrentPlayer: p.id === testUser.id,
            avatar: p.avatar,
          }))
          console.log("Formatlanmış oyuncular:", formattedPlayers)

          setPlayers(formattedPlayers)

          // Örnek taşlar oluştur
          if (table.status === "playing") {
            const exampleTiles = generateRandomTiles(14)
            setTiles(exampleTiles)
          } else {
            setTiles([])
          }

          // Sistem mesajı ekle
          setChatMessages([
            {
              id: "system-1",
              sender: "Sistem",
              senderId: "system",
              text: "Oyun odasına hoş geldiniz!",
              timestamp: new Date().toISOString(),
            },
          ])

          console.log("Oyun verisi başarıyla yüklendi")
        } else {
          // Gerçek API çağrısı
          const supabase = getSupabaseClient()
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (!session) {
            console.error("Oturum bulunamadı")
            setError("Oturum bulunamadı")
            return
          }

          setUser(session.user)

          // Masa bilgilerini getir
          const response = await fetch(`/api/tables/${params.id}`)
          const data = await response.json()

          if (!response.ok) {
            console.error("Masa bilgileri alınamadı:", data.error)
            setError(data.error || "Masa bilgileri alınamadı")
            return
          }

          // Oyun durumunu ayarla
          setGameState({
            tableId: params.id,
            name: data.table.name,
            status: data.table.status,
            buyIn: data.table.buy_in,
            pot: data.table.buy_in * data.players.length,
          })

          // Oyuncuları ayarla
          const formattedPlayers = data.players.map((p: any) => ({
            id: p.user.id,
            name: p.user.first_name,
            position: p.seat_position,
            isCurrentPlayer: p.user.id === session.user.id,
            avatar: p.user.avatar_url,
          }))

          setPlayers(formattedPlayers)

          // Eğer oyun başladıysa taşları getir
          if (data.table.status === "playing") {
            // Taşları getir
            const tilesResponse = await fetch(`/api/tables/${params.id}/tiles`)
            const tilesData = await tilesResponse.json()

            if (tilesResponse.ok) {
              setTiles(tilesData.tiles)
            }
          } else {
            // Oyun başlamadıysa boş taşlar göster
            setTiles([])
          }

          // Sistem mesajı ekle
          setChatMessages([
            {
              id: "system-1",
              sender: "Sistem",
              senderId: "system",
              text: "Oyun odasına hoş geldiniz!",
              timestamp: new Date().toISOString(),
            },
          ])
        }
      } catch (error) {
        console.error("Oyun verisi yükleme hatası:", error)
        setError("Oyun verisi yüklenirken bir hata oluştu")
      } finally {
        setIsLoading(false)
        initialLoadRef.current = false
      }
    }

    loadGameData()

    // Zamanlayıcı
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 30 // Süre dolduğunda yeniden başlat
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(timer)
      console.log("Game sayfası temizleniyor")
    }
  }, [params.id]) // Sadece params.id değiştiğinde çalışsın

  // WebSocket mesajlarını dinle
  useEffect(() => {
    if (socket && socket.players && socket.players.length > 0) {
      // Mevcut oyuncuları güncelle
      const updatedPlayers = [...players]

      socket.players.forEach((newPlayer) => {
        if (!updatedPlayers.some((p) => p.id === newPlayer.id)) {
          // Yeni oyuncuyu ekle
          updatedPlayers.push({
            id: newPlayer.id,
            name: newPlayer.name,
            position: findAvailablePosition(updatedPlayers),
            isCurrentPlayer: false,
            avatar: newPlayer.avatar,
          })
        }
      })

      setPlayers(updatedPlayers)
    }
  }, [socket, players])

  // Yeni mesajları dinle
  useEffect(() => {
    if (socket && socket.messages && socket.messages.length > 0) {
      const formattedMessages = socket.messages.map((msg) => ({
        id: msg.id || Date.now() + Math.random(),
        sender: msg.sender,
        senderId: msg.senderId,
        text: msg.text,
        timestamp: msg.timestamp || new Date().toISOString(),
      }))

      setChatMessages((prev) => {
        // Yeni mesajları ekle, tekrarları önle
        const existingIds = new Set(prev.map((m) => m.id))
        const newMessages = formattedMessages.filter((m) => !existingIds.has(m.id))
        return [...prev, ...newMessages]
      })
    }
  }, [socket])

  // Chat mesajları güncellendiğinde otomatik kaydırma
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Oyun durumunu dinle
  useEffect(() => {
    if (socket && socket.gameState) {
      setGameState(socket.gameState)
    }
  }, [socket])

  // Boş pozisyon bul
  const findAvailablePosition = (currentPlayers: Player[]): number => {
    const positions = [1, 2, 3, 4]
    const takenPositions = currentPlayers.map((p) => p.position)
    const availablePositions = positions.filter((p) => !takenPositions.includes(p))
    return availablePositions[0] || 1
  }

  // Rastgele taşlar oluştur
  const generateRandomTiles = (count: number): Tile[] => {
    const colors = ["red", "blue", "yellow", "black"]
    const tiles: Tile[] = []

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const number = Math.floor(Math.random() * 13) + 1
      tiles.push({
        id: i,
        color,
        number,
        isJoker: Math.random() < 0.05, // %5 ihtimalle joker
      })
    }

    return tiles
  }

  const handleLeaveGame = () => {
    if (confirm("Oyundan ayrılmak istediğinize emin misiniz?")) {
      if (isDevelopment) {
        // Test masasından ayrıl
        const testTablesStr = localStorage.getItem("testTables") || "[]"
        const testTables = JSON.parse(testTablesStr)
        const tableIndex = testTables.findIndex((t: any) => String(t.id) === String(params.id))

        if (tableIndex !== -1) {
          const table = testTables[tableIndex]

          // Kullanıcıyı masadan çıkar
          if (table.players) {
            const playerIndex = table.players.findIndex((p: any) => p.id === user.id)

            if (playerIndex !== -1) {
              // Oyun başlamadıysa bakiyeyi geri ver
              if (table.status !== "playing") {
                const testBalance = Number.parseInt(localStorage.getItem("testBalance") || "0", 10)
                localStorage.setItem("testBalance", (testBalance + table.buy_in).toString())
              }

              // Oyuncuyu masadan çıkar
              table.players.splice(playerIndex, 1)
              table.player_count = table.players.length

              // Masa boşsa veya oluşturan kişi ayrıldıysa sil, değilse güncelle
              if (table.players.length === 0 || user.id === table.creator_id) {
                testTables.splice(tableIndex, 1)
              } else {
                testTables[tableIndex] = table
              }

              localStorage.setItem("testTables", JSON.stringify(testTables))
            }
          }
        }
      } else {
        // Gerçek API çağrısı
        fetch(`/api/tables/${params.id}/leave`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }).catch((err) => {
          console.error("Masadan ayrılma hatası:", err)
        })
      }

      // WebSocket ile ayrılma bildirimi gönder
      if (socket) {
        socket.updateGameState({
          ...gameState,
          players: players.filter((p) => !p.isCurrentPlayer),
        })
      }

      setRedirectAttempted(true)
      router.push("/dashboard")
    }
  }

  const handleTileClick = (index: number) => {
    setSelectedTile(selectedTile === index ? null : index)

    // WebSocket ile taş oynama bildirimi gönder
    if (socket && selectedTile !== null) {
      socket.playTile({
        tileIndex: index,
        tile: tiles[index],
      })
    }
  }

  const handleStartGame = () => {
    if (players.length < 2) {
      toast({
        title: "Yetersiz Oyuncu",
        description: "Oyun başlatmak için en az 2 oyuncu gerekli",
        variant: "destructive",
      })
      return
    }

    if (isDevelopment) {
      // Test masasını güncelle
      const testTablesStr = localStorage.getItem("testTables") || "[]"
      const testTables = JSON.parse(testTablesStr)
      const tableIndex = testTables.findIndex((t: any) => String(t.id) === String(params.id))

      if (tableIndex !== -1) {
        testTables[tableIndex].status = "playing"
        localStorage.setItem("testTables", JSON.stringify(testTables))

        // Oyun durumunu güncelle
        const newGameState = {
          ...gameState,
          status: "playing",
        }

        setGameState(newGameState)

        // Taşları dağıt
        const playerTiles = generateRandomTiles(14)
        setTiles(playerTiles)

        // Sohbet mesajı ekle
        setChatMessages([
          ...chatMessages,
          {
            id: Date.now(),
            sender: "Sistem",
            senderId: "system",
            text: "Oyun başladı! Taşlar dağıtıldı.",
            timestamp: new Date().toISOString(),
          },
        ])

        // WebSocket ile oyun durumunu güncelle
        if (socket) {
          socket.updateGameState(newGameState)
        }

        // Oyun başladığında bakiyeleri düş
        const testBalance = Number.parseInt(localStorage.getItem("testBalance") || "0", 10)
        const buyInAmount = testTables[tableIndex].buy_in
        localStorage.setItem("testBalance", (testBalance - buyInAmount).toString())
      }
    } else {
      // Gerçek API çağrısı
      fetch(`/api/tables/${params.id}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const newGameState = {
              ...gameState,
              status: "playing",
            }

            setGameState(newGameState)

            // WebSocket ile oyun durumunu güncelle
            if (socket) {
              socket.updateGameState(newGameState)
            }

            // Taşları al
            return fetch(`/api/tables/${params.id}/tiles`)
          }
        })
        .then((response) => response?.json())
        .then((data) => {
          if (data?.tiles) {
            setTiles(data.tiles)

            // Sohbet mesajı ekle
            setChatMessages([
              ...chatMessages,
              {
                id: Date.now(),
                sender: "Sistem",
                senderId: "system",
                text: "Oyun başladı! Taşlar dağıtıldı.",
                timestamp: new Date().toISOString(),
              },
            ])
          }
        })
        .catch((err) => {
          console.error("Oyun başlatma hatası:", err)
          toast({
            title: "Hata",
            description: "Oyun başlatılırken bir hata oluştu",
            variant: "destructive",
          })
        })
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatInput.trim()) return

    const messageData = {
      id: Date.now(),
      sender: user?.first_name || user?.user_metadata?.first_name || "Siz",
      senderId: user?.id,
      text: chatInput,
      timestamp: new Date().toISOString(),
    }

    // WebSocket ile mesaj gönder
    if (socket && socket.isConnected) {
      socket.sendMessage(chatInput)
    } else {
      // WebSocket bağlantısı yoksa yerel olarak ekle
      setChatMessages([...chatMessages, messageData])
    }

    // Input'u temizle
    setChatInput("")
  }

  // Hata durumunda
  if (error && !redirectAttempted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md bg-white shadow-lg rounded-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Hata</h2>
            <p className="mb-4">{error}</p>
            <Button onClick={() => router.push("/dashboard")} className="w-full bg-blue-600 hover:bg-blue-700">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Yükleme durumunda
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Oyun yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Oyun durumu yoksa
  if (!gameState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md bg-white shadow-lg rounded-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Hata</h2>
            <p className="mb-4">Oyun bilgileri yüklenemedi.</p>
            <Button onClick={() => router.push("/dashboard")} className="w-full bg-blue-600 hover:bg-blue-700">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-white">
            {gameState.name} - Masa #{params.id.substring(0, 8)}
          </h1>
          <Button variant="destructive" onClick={handleLeaveGame}>
            Oyundan Ayrıl
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 md:gap-4">
          {/* Oyun alanı */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
              <CardContent className="p-2 md:p-4">
                <div
                  ref={gameAreaRef}
                  className="aspect-[4/3] bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center relative"
                >
                  {/* Orta alan */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      {gameState.status === "waiting" ? (
                        <>
                          <p className="text-lg font-bold mb-2">Pot: {gameState.pot} TL</p>
                          <p>Oyun başlamak için oyuncuları bekliyor...</p>
                          {socket && socket.isConnected && (
                            <p className="text-xs mt-2 text-green-300">Canlı bağlantı aktif ✓</p>
                          )}
                        </>
                      ) : (
                        <div className="relative w-16 h-16 md:w-24 md:h-24">
                          {/* Orta istaka */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-16 md:w-16 md:h-20 bg-white rounded-md shadow-md border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-2xl font-bold">?</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Oyuncular */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex justify-center items-center">
                    {players.find((p) => p.position === 3) ? (
                      <PlayerCard player={players.find((p) => p.position === 3)!} />
                    ) : (
                      <EmptySeat position={3} />
                    )}
                  </div>

                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {players.find((p) => p.position === 4) ? (
                      <PlayerCard player={players.find((p) => p.position === 4)!} />
                    ) : (
                      <EmptySeat position={4} />
                    )}
                  </div>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {players.find((p) => p.position === 2) ? (
                      <PlayerCard player={players.find((p) => p.position === 2)!} />
                    ) : (
                      <EmptySeat position={2} />
                    )}
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    {players.find((p) => p.position === 1) ? (
                      <PlayerCard player={players.find((p) => p.position === 1)!} />
                    ) : (
                      <EmptySeat position={1} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Taşlar */}
            <Card className="mt-2 md:mt-4 bg-white shadow-lg rounded-lg overflow-hidden">
              <CardContent className="p-2 md:p-4">
                <h2 className="font-bold mb-2 text-gray-800">Taşlarınız</h2>
                <div className="flex flex-wrap justify-center gap-1 md:gap-2 bg-gray-100 rounded-lg p-2 md:p-4 min-h-20">
                  {gameState.status === "playing" && tiles.length > 0 ? (
                    tiles.map((tile, index) => (
                      <div
                        key={tile.id}
                        className={`w-8 h-12 md:w-10 md:h-14 rounded-md cursor-pointer transition-all ${
                          selectedTile === index
                            ? "transform -translate-y-2 shadow-lg border-2 border-blue-500"
                            : "shadow border border-gray-300"
                        }`}
                        onClick={() => handleTileClick(index)}
                      >
                        <div
                          className={`w-full h-full rounded-md flex items-center justify-center font-bold text-lg ${
                            tile.color === "red"
                              ? "bg-red-100 text-red-600"
                              : tile.color === "blue"
                                ? "bg-blue-100 text-blue-600"
                                : tile.color === "yellow"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-gray-800 text-white"
                          }`}
                        >
                          {tile.isJoker ? "J" : tile.number}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 py-4">Oyun başladığında taşlarınız burada görünecek</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Oyun kontrolleri */}
            {gameState.status === "playing" && (
              <Card className="mt-2 md:mt-4 bg-white shadow-lg rounded-lg overflow-hidden">
                <CardContent className="p-2 md:p-4 flex flex-wrap gap-2 justify-center">
                  <Button onClick={() => socket?.drawTile()} className="bg-blue-600 hover:bg-blue-700">
                    Taş Çek
                  </Button>
                  <Button onClick={() => alert("Okey gösterildi!")} className="bg-green-600 hover:bg-green-700">
                    Okey Göster
                  </Button>
                  <Button onClick={() => alert("Per atıldı!")} className="bg-yellow-600 hover:bg-yellow-700">
                    Per At
                  </Button>
                  <Button onClick={() => alert("Bitti!")} className="bg-red-600 hover:bg-red-700">
                    Bitti!
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sağ panel */}
          <div className="lg:col-span-1">
            {/* Oyun bilgileri */}
            <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
              <CardContent className="p-4">
                <h2 className="font-bold mb-2 text-gray-800">Oyun Bilgileri</h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Masa:</span> {gameState.name}
                  </p>
                  <p>
                    <span className="font-medium">Giriş:</span> {gameState.buyIn} TL
                  </p>
                  <p>
                    <span className="font-medium">Pot:</span> {gameState.pot} TL
                  </p>
                  <p>
                    <span className="font-medium">Durum:</span>{" "}
                    {gameState.status === "waiting" ? "Bekleniyor" : "Oyunda"}
                  </p>
                  <p>
                    <span className="font-medium">Kalan Süre:</span> {timeLeft} saniye
                  </p>
                  {socket && (
                    <p>
                      <span className="font-medium">Bağlantı:</span>{" "}
                      {socket.isConnected ? (
                        <span className="text-green-600">Aktif</span>
                      ) : (
                        <span className="text-red-600">Kapalı</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <h2 className="font-bold mb-2 text-gray-800">Oyuncular</h2>
                  <div className="space-y-2">
                    {players.map((player) => (
                      <div key={player.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {player.avatar && (
                            <div className="w-6 h-6 rounded-full overflow-hidden">
                              <Image
                                src={player.avatar || "/placeholder.svg"}
                                alt={player.name}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span>
                            {player.name} {player.isCurrentPlayer && "(Siz)"}
                          </span>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {player.isCurrentPlayer ? "Hazır" : "Bekliyor"}
                        </span>
                      </div>
                    ))}
                    {players.length < 4 && (
                      <div className="text-gray-500 text-sm">{4 - players.length} oyuncu daha bekleniyor...</div>
                    )}
                  </div>
                </div>

                {gameState.status === "waiting" && players.some((p) => p.isCurrentPlayer) && (
                  <Button
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    disabled={players.length < 2}
                    onClick={handleStartGame}
                  >
                    {players.length < 2 ? "En az 2 oyuncu gerekli" : "Oyunu Başlat"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Sohbet */}
            <Card className="mt-2 md:mt-4 bg-white shadow-lg rounded-lg overflow-hidden">
              <CardContent className="p-4">
                <h2 className="font-bold mb-2 text-gray-800">Sohbet</h2>
                <div
                  ref={chatContainerRef}
                  className="bg-gray-100 rounded-lg p-2 h-40 overflow-y-auto mb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
                >
                  {chatMessages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`mb-1 ${msg.senderId === "system" ? "text-gray-500 italic" : ""}`}
                    >
                      <span className={`font-bold ${msg.senderId === user?.id ? "text-blue-600" : ""}`}>
                        {msg.sender}:
                      </span>{" "}
                      {msg.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div
      className={`bg-white p-2 rounded-lg w-24 md:w-32 text-center shadow-lg ${player.isCurrentPlayer ? "ring-2 ring-blue-500" : ""}`}
    >
      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full mx-auto mb-1 flex items-center justify-center overflow-hidden">
        {player.avatar ? (
          <Image
            src={player.avatar || "/placeholder.svg"}
            alt={player.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-xl font-bold text-gray-500">{player.name.charAt(0)}</div>
        )}
      </div>
      <p className="text-sm font-semibold">{player.name}</p>
    </div>
  )
}

function EmptySeat({ position }: { position: number }) {
  return (
    <div className="bg-gray-100 p-2 rounded-lg w-24 md:w-32 text-center shadow-md border border-dashed border-gray-300">
      \
