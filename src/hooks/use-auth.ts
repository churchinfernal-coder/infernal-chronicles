// src/hooks/use-auth.ts
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // `data` contains `{ subscription }` — extract and unsubscribe safely
    const subscription = (data as { subscription?: { unsubscribe?: () => void } })?.subscription;

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  return { user };
};
