"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export const useSocket = (tableId: string | null, userId: string | null, userName: string | null) => {
  const [isConnected, setIsConnected] = useState(false)
  const [players, setPlayers] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [gameState, setGameState] = useState<any>(null)

  useEffect(() => {
    // Eğer gerekli parametreler yoksa, socket bağlantısı kurmayı atla
    if (!tableId || !userId || !userName) {
      console.log("Socket bağlantısı için gerekli parametreler eksik:", { tableId, userId, userName })
      return
    }

    console.log("Socket bağlantısı kuruluyor:", { tableId, userId, userName })

    // Socket.IO bağlantısını başlat
    const initSocket = async () => {
      try {
        // Socket.IO sunucusunu başlat (Pages API rotasını kullan)
        await fetch("/api/socket")

        // Socket.IO istemcisini oluştur (eğer henüz oluşturulmadıysa)
        if (!socket) {
          socket = io()

          socket.on("connect", () => {
            console.log("Socket.IO bağlantısı kuruldu")
            setIsConnected(true)

            // Masaya katıl
            socket.emit("joinTable", tableId, {
              id: userId,
              name: userName,
            })
          })

          socket.on("disconnect", () => {
            console.log("Socket.IO bağlantısı kesildi")
            setIsConnected(false)
          })
        }

        // Oyuncu katıldığında
        socket.on("playerJoined", (player) => {
          console.log("Yeni oyuncu katıldı:", player)
          setPlayers((prev) => {
            // Eğer oyuncu zaten listedeyse ekleme
            if (prev.some((p) => p.id === player.id)) {
              return prev
            }
            return [...prev, player]
          })
        })

        // Oyuncu ayrıldığında
        socket.on("playerLeft", (playerId) => {
          console.log("Oyuncu ayrıldı:", playerId)
          setPlayers((prev) => prev.filter((p) => p.id !== playerId))
        })

        // Yeni mesaj geldiğinde
        socket.on("newMessage", (message) => {
          console.log("Yeni mesaj:", message)
          setMessages((prev) => [...prev, message])
        })

        // Oyun durumu güncellendiğinde
        socket.on("gameStateUpdated", (newGameState) => {
          console.log("Oyun durumu güncellendi:", newGameState)
          setGameState(newGameState)
        })

        // Taş oynandığında
        socket.on("tilePlayed", (playerId, tileData) => {
          console.log(`${playerId} taş oynadı:`, tileData)
          // Oyun durumunu güncelle
        })

        // Taş çekildiğinde
        socket.on("tileDrawn", (playerId) => {
          console.log(`${playerId} taş çekti`)
          // Oyun durumunu güncelle
        })
      } catch (error) {
        console.error("Socket başlatma hatası:", error)
      }
    }

    initSocket()

    // Temizleme fonksiyonu
    return () => {
      if (socket) {
        socket.emit("leaveTable", tableId, userId)
        socket.off("playerJoined")
        socket.off("playerLeft")
        socket.off("newMessage")
        socket.off("gameStateUpdated")
        socket.off("tilePlayed")
        socket.off("tileDrawn")
      }
    }
  }, [tableId, userId, userName])

  // Taş oynama fonksiyonu
  const playTile = (tileData: any) => {
    if (socket && isConnected && tableId && userId) {
      socket.emit("playTile", tableId, userId, tileData)
    }
  }

  // Taş çekme fonksiyonu
  const drawTile = () => {
    if (socket && isConnected && tableId && userId) {
      socket.emit("drawTile", tableId, userId)
    }
  }

  // Mesaj gönderme fonksiyonu
  const sendMessage = (message: string) => {
    if (socket && isConnected && tableId && userId && userName) {
      const messageData = {
        id: Date.now(),
        sender: userName,
        senderId: userId,
        text: message,
        timestamp: new Date().toISOString(),
      }
      socket.emit("sendMessage", tableId, messageData)
      setMessages((prev) => [...prev, messageData])
    }
  }

  // Oyun durumunu güncelleme fonksiyonu
  const updateGameState = (newGameState: any) => {
    if (socket && isConnected && tableId) {
      socket.emit("updateGameState", tableId, newGameState)
    }
  }

  return {
    isConnected,
    players,
    messages,
    gameState,
    playTile,
    drawTile,
    sendMessage,
    updateGameState,
  }
}
