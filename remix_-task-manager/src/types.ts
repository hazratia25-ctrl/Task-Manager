export interface Task {
  id: string;
  user_id?: string;
  title: string;
  date: string; // YYYY/MM/DD format (Jalali)
  time: string; // HH:MM format
  tag: string; // "کاری" | "شخصی" | "فوری" or Custom tags
  location: string;
  description: string;
  is_completed: boolean;
  created_at?: string;
}

export interface SupabaseConfigCredentials {
  url: string;
  anonKey: string;
}
