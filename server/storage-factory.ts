import { minimalStorage } from './storage-minimal';
import type { IStorage } from './storage';

export function createStorage(): IStorage {
  console.log('💾 Using minimal storage for server startup');
  return minimalStorage;
}

export const storage = createStorage();