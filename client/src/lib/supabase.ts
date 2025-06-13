import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para TypeScript
export interface Profile {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthSession {
  user: SupabaseUser;
  session: any;
}