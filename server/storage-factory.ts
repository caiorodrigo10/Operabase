import { postgresStorage } from './postgres-storage.js';
import type { IStorage } from './storage.js';

export function createStorage(): IStorage {
  // Por enquanto, mantemos PostgreSQL até a migração estar completa
  console.log('💾 Usando PostgreSQL como storage');
  return postgresStorage;
}

export const storage = createStorage();