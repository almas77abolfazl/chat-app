import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private dbPromise: Promise<IDBPDatabase | null>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase | null> {
    if (typeof indexedDB === 'undefined') {
      return null;
    }
    return openDB('ChatCacheDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('avatars', { keyPath: 'id' });
        }
      },
    });
  }

  async setItem(storeName: string, data: any) {
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(storeName, 'readwrite');
    tx.store.put(data);
    return tx.done;
  }

  async getItem(storeName: string, id: string) {
    const db = await this.dbPromise;
    if (!db) return null;
    return db.transaction(storeName, 'readonly').store.get(id);
  }

  async deleteItem(storeName: string, id: string) {
    const db = await this.dbPromise;
    if (!db) return;
    return db.transaction(storeName, 'readwrite').store.delete(id);
  }

  async clearCache() {
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(db.objectStoreNames, 'readwrite');

    for (const storeName of db.objectStoreNames) {
      tx.objectStore(storeName).clear();
    }

    return tx.done;
  }
}
