import { PostgresStorage } from './postgres-storage.js';
import { SupabaseStorage } from './supabase-storage.js';
import type { IStorage } from './storage.js';

export function createStorage(): IStorage {
  const useSupabase = process.env.USE_SUPABASE === 'true';
  
  if (useSupabase) {
    console.log('💚 Usando Supabase como storage');
    return new SupabaseStorage();
  } else {
    console.log('💾 Usando PostgreSQL como storage');
    return new PostgresStorage();
  }
}

export const storage = createStorage();