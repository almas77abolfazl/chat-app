import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB() {
    return openDB('ChatCacheDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
      },
    });
  }

  async setItem(storeName: string, data: any) {
    const db = await this.dbPromise;
    const tx = db.transaction(storeName, 'readwrite');
    tx.store.put(data);
    return tx.done;
  }

  async getItem(storeName: string, id: string) {
    const db = await this.dbPromise;
    return db.transaction(storeName, 'readonly').store.get(id);
  }

  async deleteItem(storeName: string, id: string) {
    const db = await this.dbPromise;
    return db.transaction(storeName, 'readwrite').store.delete(id);
  }
}
