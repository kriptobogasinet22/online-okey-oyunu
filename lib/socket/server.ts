import type { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { NextApiRequest } from "next"
import type { NextApiResponse } from "next"

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const initSocketServer = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Yeni Socket.io sunucusu başlatılıyor...")
    const io = new SocketIOServer(res.socket.server)
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log(`Yeni bağlantı: ${socket.id}`)

      // Oyuncu bir masaya katıldığında
      socket.on("joinTable", (tableId: string, player: any) => {
        socket.join(`table:${tableId}`)
        console.log(`Oyuncu ${player.name} masa ${tableId}'ye katıldı`)

        // Masadaki diğer oyunculara bildir
        socket.to(`table:${tableId}`).emit("playerJoined", player)
      })

      // Oyuncu bir masadan ayrıldığında
      socket.on("leaveTable", (tableId: string, playerId: string) => {
        socket.leave(`table:${tableId}`)
        console.log(`Oyuncu ${playerId} masa ${tableId}'den ayrıldı`)

        // Masadaki diğer oyunculara bildir
        socket.to(`table:${tableId}`).emit("playerLeft", playerId)
      })

      // Oyuncu bir taş oynadığında
      socket.on("playTile", (tableId: string, playerId: string, tileData: any) => {
        console.log(`Oyuncu ${playerId} masa ${tableId}'de taş oynadı:`, tileData)

        // Masadaki diğer oyunculara bildir
        socket.to(`table:${tableId}`).emit("tilePlayed", playerId, tileData)
      })

      // Oyuncu taş çektiğinde
      socket.on("drawTile", (tableId: string, playerId: string) => {
        console.log(`Oyuncu ${playerId} masa ${tableId}'de taş çekti`)

        // Masadaki diğer oyunculara bildir
        socket.to(`table:${tableId}`).emit("tileDrawn", playerId)
      })

      // Oyuncu sohbet mesajı gönderdiğinde
      socket.on("sendMessage", (tableId: string, message: any) => {
        console.log(`Masa ${tableId}'de yeni mesaj:`, message)

        // Masadaki tüm oyunculara bildir
        io.to(`table:${tableId}`).emit("newMessage", message)
      })

      // Oyun durumu güncellendiğinde
      socket.on("updateGameState", (tableId: string, gameState: any) => {
        console.log(`Masa ${tableId} oyun durumu güncellendi`)

        // Masadaki tüm oyunculara bildir
        io.to(`table:${tableId}`).emit("gameStateUpdated", gameState)
      })

      // Bağlantı kesildiğinde
      socket.on("disconnect", () => {
        console.log(`Bağlantı kesildi: ${socket.id}`)
      })
    })
  }

  return res.socket.server.io
}
