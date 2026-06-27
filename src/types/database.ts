// src/types/database.ts
// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE DATABASE TYPES - Auto-generated from schema
// ═══════════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          online_status: boolean | null;
          last_seen: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          online_status?: boolean | null;
          last_seen?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          online_status?: boolean | null;
          last_seen?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      conversations: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          last_message_at: string | null;
          archived: boolean | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          last_message_at?: string | null;
          archived?: boolean | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          last_message_at?: string | null;
          archived?: boolean | null;
        };
        Relationships: [];
      };
      // ... include all other tables exactly as in your original file ...
      webrtc_signals: {
        Row: {
          id: string;
          conversation_id: string;
          from_user_id: string;
          to_user_id: string;
          type: string;
          sdp: string | null;
          candidate: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          from_user_id: string;
          to_user_id: string;
          type: string;
          sdp?: string | null;
          candidate?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          type?: string;
          sdp?: string | null;
          candidate?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "webrtc_signals_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webrtc_signals_from_user_id_fkey";
            columns: ["from_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webrtc_signals_to_user_id_fkey";
            columns: ["to_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          granted_by: string | null;
          granted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          granted_by?: string | null;
          granted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          granted_by?: string | null;
          granted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_granted_by_fkey";
            columns: ["granted_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      start_conversation: {
        Args: { other_user_id: string };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
