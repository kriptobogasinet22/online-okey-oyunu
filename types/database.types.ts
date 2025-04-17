export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_super_admin: boolean
          password_hash: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_super_admin?: boolean
          password_hash: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_super_admin?: boolean
          password_hash?: string
        }
      }
      game_history: {
        Row: {
          ended_at: string | null
          game_data: Json | null
          id: string
          started_at: string | null
          table_id: string
          winner_id: string | null
        }
        Insert: {
          ended_at?: string | null
          game_data?: Json | null
          id?: string
          started_at?: string | null
          table_id: string
          winner_id?: string | null
        }
        Update: {
          ended_at?: string | null
          game_data?: Json | null
          id?: string
          started_at?: string | null
          table_id?: string
          winner_id?: string | null
        }
      }
      game_tables: {
        Row: {
          buy_in: number
          completed_at: string | null
          created_at: string | null
          id: string
          name: string
          status: string
          winner_id: string | null
        }
        Insert: {
          buy_in?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name: string
          status?: string
          winner_id?: string | null
        }
        Update: {
          buy_in?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string
          winner_id?: string | null
        }
      }
      table_players: {
        Row: {
          id: string
          joined_at: string | null
          seat_position: number
          table_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          seat_position: number
          table_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          seat_position?: number
          table_id?: string
          user_id?: string
        }
      }
      user_balances: {
        Row: {
          balance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          updated_at?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
