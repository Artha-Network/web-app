/**
 * @module SupabaseClient
 * @description Creates and exports a typed Supabase client instance for frontend use.
 */
import { createClient } from "@supabase/supabase-js";

const env = (import.meta as any).env ?? {};
const url = (env.VITE_SUPABASE_URL ?? env.SUPABASE_URL) as string | undefined;
const anon = (env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY) as string | undefined;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env missing: SUPABASE_URL / SUPABASE_ANON_KEY");
}

export const supabase = createClient(url ?? "", anon ?? "");

export default supabase;
