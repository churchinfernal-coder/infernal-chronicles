// ═══════════════════════════════════════════════════════════════════════════
// Supabase Database Types - Infernal Chronicles
// Merged:  Gallery + Covens + Core Tables
// ═══════════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING TYPES - Gallery
// ═══════════════════════════════════════════════════════════════════════════

export interface GalleryPhoto {
  id: string;
  user_id: string;
  url:  string;
  title: string | null;
  width: number | null;
  height: number | null;
  created_at:  string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW TYPES - Covens System
// ═══════════════════════════════════════════════════════════════════════════

export interface Coven {
  id: string;
  name:  string;
  description: string | null;
  subculture:  string | null;
  belief_system: string | null;
  sigil: string | null;
  avatar_url: string | null;
  header_image: string | null;
  header_image_url: string | null;
  invite_code: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
}

export interface CovenMember {
  id:  string;
  coven_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member' | 'pending';
  joined_at: string;
}

export interface CovenPost {
  id: string;
  coven_id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  parent_post_id: string | null;
  visibility: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  is_pinned:  boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  approval_status: 'approved' | 'pending' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
}

export interface CovenInviteToken {
  id:  string;
  coven_id: string;
  token_code: string;
  role: 'admin' | 'moderator' | 'member';
  created_by: string;
  created_at: string;
  expires_at: string;
  is_valid: boolean;
}

export interface CovenMedia {
  id: string;
  coven_id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  file_size_bytes:  number | null;
  mime_type: string | null;
}

export interface CovenPostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CovenPostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_emoji: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE DATABASE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

export interface Database {
  public: {
    Tables: {
      // EXISTING:  Gallery
      gallery_photos: {
        Row: GalleryPhoto;
        Insert: Omit<GalleryPhoto, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update:  Partial<Omit<GalleryPhoto, 'id' | 'created_at'>>;
      };

      // NEW: Covens
      covens: {
        Row:  Coven;
        Insert:  Omit<Coven, 'id' | 'created_at' | 'updated_at' | 'member_count'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          member_count?:  number;
        };
        Update: Partial<Omit<Coven, 'id' | 'created_at' | 'created_by'>>;
      };

      coven_members: {
        Row: CovenMember;
        Insert: Omit<CovenMember, 'id' | 'joined_at'> & {
          id?: string;
          joined_at?: string;
          role?: 'admin' | 'moderator' | 'member' | 'pending';
        };
        Update: Partial<Omit<CovenMember, 'id' | 'coven_id' | 'user_id'>>;
      };

      coven_posts: {
        Row:  CovenPost;
        Insert:  Omit<CovenPost, 'id' | 'created_at' | 'updated_at' | 'is_pinned' | 'pinned_at' | 'pinned_by' | 'approval_status' | 'approved_by' | 'approved_at'> & {
          id?:  string;
          created_at?:  string;
          updated_at?:  string;
          is_pinned?: boolean;
          pinned_at?: string | null;
          pinned_by?: string | null;
          approval_status?: 'approved' | 'pending' | 'rejected';
          approved_by?: string | null;
          approved_at?: string | null;
        };
        Update:  Partial<Omit<CovenPost, 'id' | 'coven_id' | 'user_id' | 'created_at'>>;
      };

      coven_invite_tokens: {
        Row: CovenInviteToken;
        Insert: Omit<CovenInviteToken, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
          expires_at?: string;
          is_valid?: boolean;
        };
        Update: Partial<Omit<CovenInviteToken, 'id' | 'coven_id' | 'created_by'>>;
      };

      coven_media: {
        Row: CovenMedia;
        Insert: Omit<CovenMedia, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update:  Partial<Omit<CovenMedia, 'id' | 'coven_id' | 'user_id' | 'created_at'>>;
      };

      coven_post_comments: {
        Row: CovenPostComment;
        Insert: Omit<CovenPostComment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update:  Partial<Omit<CovenPostComment, 'id' | 'post_id' | 'user_id' | 'created_at'>>;
      };

      coven_post_reactions: {
        Row: CovenPostReaction;
        Insert: Omit<CovenPostReaction, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update:  Partial<Omit<CovenPostReaction, 'id'>>;
      };

      profiles:  {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_secure_invite_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience exports
export type CovenWithMembers = Coven & {
  coven_members: Array<CovenMember & { profiles: Profile }>;
};

export type CovenPostWithAuthor = CovenPost & {
  profiles: Profile;
  coven_post_reactions?:  CovenPostReaction[];
  coven_post_comments?: CovenPostComment[];
};

export type CovenMemberWithProfile = CovenMember & {
  profiles: Profile;
};