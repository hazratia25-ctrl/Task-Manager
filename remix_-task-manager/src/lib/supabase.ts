import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function initializeSupabase(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) {
    supabaseClient = null;
    return null;
  }
  try {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    return supabaseClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    supabaseClient = null;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

export function loadSavedCredentials() {
  const url = localStorage.getItem("supabase_url") || "";
  const anonKey = localStorage.getItem("supabase_anon_key") || "";
  if (url && anonKey) {
    return { url, anonKey };
  }
  return null;
}

export function saveCredentials(url: string, anonKey: string) {
  localStorage.setItem("supabase_url", url);
  localStorage.setItem("supabase_anon_key", anonKey);
  initializeSupabase(url, anonKey);
}

export function clearSavedCredentials() {
  localStorage.removeItem("supabase_url");
  localStorage.removeItem("supabase_anon_key");
  supabaseClient = null;
}
