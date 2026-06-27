// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client - TYPES FORCED TO WORK
// ═══════════════════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles:  {
        Row: {
          user_id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          online_status: boolean | null
          last_seen: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert:  {
          user_id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          online_status?: boolean | null
          last_seen?: string | null
          created_at?:  string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          username?: string | null
          display_name?:  string | null
          avatar_url?: string | null
          bio?:  string | null
          online_status?: boolean | null
          last_seen?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          last_message_at: string | null
          archived: boolean | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          last_message_at?: string | null
          archived?: boolean | null
        }
        Update:  {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          last_message_at?:  string | null
          archived?: boolean | null
        }
      }
      conversation_participants: {
        Row: {
          id:  string
          conversation_id: string
          user_id: string
          joined_at: string | null
          left_at: string | null
        }
        Insert:  {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string | null
          left_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?:  string
          joined_at?: string | null
          left_at?:  string | null
        }
      }
      messages:  {
        Row: {
          id: string
          conversation_id: string
          sender_id:  string
          content: string | null
          encrypted: boolean | null
          media_url: string | null
          media_type: string | null
          tone: string | null
          visibility: string | null
          is_system_message: boolean | null
          is_featured:  boolean | null
          admin_injected: boolean | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          read_by: string[] | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content?: string | null
          encrypted?:  boolean | null
          media_url?: string | null
          media_type?: string | null
          tone?: string | null
          visibility?:  string | null
          is_system_message?: boolean | null
          is_featured?: boolean | null
          admin_injected?:  boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          read_by?: string[] | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string | null
          encrypted?: boolean | null
          media_url?: string | null
          media_type?:  string | null
          tone?: string | null
          visibility?: string | null
          is_system_message?: boolean | null
          is_featured?: boolean | null
          admin_injected?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          read_by?:  string[] | null
        }
      }
      message_reactions:  {
        Row: {
          id: string
          message_id: string
          user_id:  string
          reaction_type: string
          created_at: string | null
        }
        Insert:  {
          id?: string
          message_id: string
          user_id: string
          reaction_type: string
          created_at?: string | null
        }
        Update: {
          id?:  string
          message_id?: string
          user_id?: string
          reaction_type?: string
          created_at?: string | null
        }
      }
      blocked_users: {
        Row:  {
          id: string
          user_id: string
          blocked_user_id: string
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          blocked_user_id: string
          reason?: string | null
          created_at?:  string | null
        }
        Update: {
          id?: string
          user_id?: string
          blocked_user_id?: string
          reason?: string | null
          created_at?: string | null
        }
      }
      user_reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reason: string
          details:  string | null
          status: string | null
          resolved_by:  string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          reporter_id:  string
          reported_user_id: string
          reason: string
          details?: string | null
          status?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string
          reason?: string
          details?: string | null
          status?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
      }
      webrtc_signals: {
        Row: {
          id:  string
          conversation_id: string
          from_user_id:  string
          to_user_id: string
          type: string
          sdp: string | null
          candidate: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          from_user_id: string
          to_user_id: string
          type: string
          sdp?: string | null
          candidate?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          from_user_id?: string
          to_user_id?: string
          type?: string
          sdp?: string | null
          candidate?: Json | null
          created_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          granted_by: string | null
          granted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          granted_by?: string | null
          granted_at?: string | null
        }
        Update: {
          id?: string
          user_id?:  string
          role?: string
          granted_by?: string | null
          granted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      start_conversation: {
        Args: {
          other_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT INITIALIZATION WITH TYPE BYPASS
// ═══════════════════════════════════════════════════════════════════════════

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create untyped client first
const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken:  true,
  },
})

// Export as any to bypass TypeScript inference issues
export const supabase = client as any as SupabaseClient<Database>

