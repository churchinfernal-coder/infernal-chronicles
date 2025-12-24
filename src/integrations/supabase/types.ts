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
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string | null
          avatar_url: string | null
          mood_status: string | null
          prime_level: number
          spirit_tone_preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          avatar_url?: string | null
          mood_status?: string | null
          prime_level?: number
          spirit_tone_preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          avatar_url?: string | null
          mood_status?: string | null
          prime_level?: number
          spirit_tone_preference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          post_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          post_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          post_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: string
          created_at?: string
        }
      }
      coven_members: {
        Row: {
          id: string
          coven_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          coven_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          coven_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          media_url: string | null
          media_type: string | null
          tone: string
          encrypted: boolean
          visibility: string
          is_system_message: boolean
          admin_injected: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          media_url?: string | null
          media_type?: string | null
          tone?: string
          encrypted?: boolean
          visibility?: string
          is_system_message?: boolean
          admin_injected?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          media_url?: string | null
          media_type?: string | null
          tone?: string
          encrypted?: boolean
          visibility?: string
          is_system_message?: boolean
          admin_injected?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          reaction_type?: string
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      gallery_photos: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string | null
          width: number | null
          height: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title?: string | null
          width?: number | null
          height?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string | null
          width?: number | null
          height?: number | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      start_conversation: {
        Args: {
          other_user_id: string
        }
        Returns: string
      }
    }
    Enums: {}
  }
}

export type GalleryPhoto = Database['public']['Tables']['gallery_photos']['Row']