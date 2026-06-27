// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client - Instantiation Only
// ═══════════════════════════════════════════════════════════════════════════

// src/lib/supabaseClient.ts
// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client - Instantiation Only
// ═══════════════════════════════════════════════════════════════════════════

// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database"; // adjust path if needed

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);


// Optional: Export helper functions for common queries
export const supabaseHelpers = {
  // Example helper
  getProfileWithCovensMemberships: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        *,
        coven_members (
          *,
          covens (*)
        )
      `
      )
      .eq('user_id', userId)
      .single();

    return { data, error };
  },
};