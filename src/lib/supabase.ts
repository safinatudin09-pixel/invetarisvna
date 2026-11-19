import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qakmyyomjudakhnmortu.supabase.co";

const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || "";

/**
 * Supabase Client (Public / Publishable Key)
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

/**
 * Supabase Admin / Server Client (Menggunakan SUPABASE_SECRET_KEY di sisi server)
 */
export function getSupabaseServerClient() {
  return createClient(
    supabaseUrl,
    supabaseSecretKey || supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
