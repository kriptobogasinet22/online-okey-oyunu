"use client"

// Telegram WebApp API tipini tanımlayalım
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
      }
    }
  }
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-800 to-green-950 p-4">
      <div className="w-full max-w-md bg-white/95 shadow-xl rounded-lg p-8">
        <h1 className="text-2xl font-bold text-green-800 text-center mb-4">Online Okey Oyunu</h1>
        <p className="text-center mb-6">Arkadaşlarınızla birlikte online okey oynayın</p>
        <div className="flex justify-center">
          <a
            href="/dashboard"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Oyuna Başla
          </a>
        </div>
      </div>
    </div>
  )
}
