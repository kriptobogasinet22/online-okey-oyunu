"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }

    supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
  }
  return supabaseClient
}
