import { Injectable, inject } from '@angular/core';
import { HttpRequestService } from './http-request.service';
import { firstValueFrom } from 'rxjs';

interface StoredKeyRecord {
  publicKeyJwk: string;
  privateKey: CryptoKey;
}

@Injectable({ providedIn: 'root' })
export class E2eeService {
  private static readonly DB_NAME = 'chat_app_e2ee';
  private static readonly STORE_NAME = 'identity_keys';

  private readonly http = inject(HttpRequestService);
  private privateKeyCache = new Map<string, CryptoKey>();
  private peerPublicKeyCache = new Map<string, string>();
  private sharedAesKeyCache = new Map<string, CryptoKey>();

  isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.crypto?.subtle && typeof indexedDB !== 'undefined';
  }

  async ensureIdentityKeys(userId: string): Promise<string | null> {
    if (!this.isSupported() || !userId) return null;
    try {
      let record = await this.loadKeyRecord(userId);
      if (!record) {
        const keyPair = await window.crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          ['deriveKey'],
        );
        const jwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
        record = {
          publicKeyJwk: JSON.stringify(jwk),
          privateKey: keyPair.privateKey,
        };
        await this.saveKeyRecord(userId, record);
      }
      this.privateKeyCache.set(userId, record.privateKey);
      await firstValueFrom(this.http.post('e2ee/keys', { publicKey: record.publicKeyJwk }));
      return record.publicKeyJwk;
    } catch {
      return null;
    }
  }

  async getPeerPublicKey(peerUserId: string, knownKey?: string | null): Promise<string | null> {
    if (knownKey) {
      this.peerPublicKeyCache.set(peerUserId, knownKey);
      return knownKey;
    }
    const cached = this.peerPublicKeyCache.get(peerUserId);
    if (cached) return cached;
    try {
      const res: any = await firstValueFrom(
        this.http.get(`e2ee/keys/${peerUserId}`),
      );
      if (res?.publicKey) {
        this.peerPublicKeyCache.set(peerUserId, res.publicKey);
        return res.publicKey;
      }
      return null;
    } catch {
      return null;
    }
  }

  async encryptForPeer(
    myUserId: string,
    peerUserId: string,
    peerPublicKeyJwk: string | null | undefined,
    plaintext: string,
  ): Promise<{ ciphertext: string; iv: string } | null> {
    if (!this.isSupported() || !plaintext) return null;
    try {
      const aesKey = await this.getSharedAesKey(myUserId, peerUserId, peerPublicKeyJwk);
      if (!aesKey) return null;

      const ivBytes = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(plaintext);
      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: ivBytes },
        aesKey,
        encoded,
      );
      return {
        ciphertext: this.arrayBufferToBase64(cipherBuffer),
        iv: this.arrayBufferToBase64(ivBytes.buffer),
      };
    } catch {
      return null;
    }
  }

  async decryptFromPeer(
    myUserId: string,
    peerUserId: string,
    peerPublicKeyJwk: string | null | undefined,
    ciphertextBase64: string,
    ivBase64: string,
  ): Promise<string> {
    if (!this.isSupported() || !ciphertextBase64 || !ivBase64) {
      return '🔒 Encrypted message';
    }
    try {
      const aesKey = await this.getSharedAesKey(myUserId, peerUserId, peerPublicKeyJwk);
      if (!aesKey) return '🔒 Encrypted message';

      const cipherBytes = this.base64ToArrayBuffer(ciphertextBase64);
      const ivBytes = new Uint8Array(this.base64ToArrayBuffer(ivBase64));
      const plainBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        aesKey,
        cipherBytes,
      );
      return new TextDecoder().decode(plainBuffer);
    } catch {
      return '🔒 Encrypted message';
    }
  }

  private async getSharedAesKey(
    myUserId: string,
    peerUserId: string,
    knownPeerKey?: string | null,
  ): Promise<CryptoKey | null> {
    const cacheKey = `${myUserId}_${peerUserId}`;
    const cached = this.sharedAesKeyCache.get(cacheKey);
    if (cached) return cached;

    let privateKey = this.privateKeyCache.get(myUserId);
    if (!privateKey) {
      await this.ensureIdentityKeys(myUserId);
      privateKey = this.privateKeyCache.get(myUserId);
    }
    const peerKeyStr = await this.getPeerPublicKey(peerUserId, knownPeerKey);
    if (!privateKey || !peerKeyStr) return null;

    const peerJwk = JSON.parse(peerKeyStr) as JsonWebKey;
    const peerPublicKey = await window.crypto.subtle.importKey(
      'jwk',
      peerJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      [],
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: peerPublicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    this.sharedAesKeyCache.set(cacheKey, aesKey);
    return aesKey;
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(E2eeService.DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(E2eeService.STORE_NAME)) {
          db.createObjectStore(E2eeService.STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadKeyRecord(userId: string): Promise<StoredKeyRecord | null> {
    const db = await this.openDb();
    try {
      return await new Promise<StoredKeyRecord | null>((resolve, reject) => {
        const tx = db.transaction(E2eeService.STORE_NAME, 'readonly');
        const req = tx.objectStore(E2eeService.STORE_NAME).get(userId);
        req.onsuccess = () => resolve((req.result as StoredKeyRecord) || null);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  }

  private async saveKeyRecord(userId: string, record: StoredKeyRecord): Promise<void> {
    const db = await this.openDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(E2eeService.STORE_NAME, 'readwrite');
        tx.objectStore(E2eeService.STORE_NAME).put(record, userId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
