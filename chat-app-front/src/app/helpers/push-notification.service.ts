import { Injectable, inject } from '@angular/core';
import { HttpRequestService } from './http-request.service';
import { firstValueFrom } from 'rxjs';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpRequestService);
  private registration: ServiceWorkerRegistration | null = null;

  private readonly openChatSubject = new Subject<string>();
  readonly openChat$ = this.openChatSubject.asObservable();

  constructor() {
    this.listenToServiceWorkerMessages();
  }

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    if (this.registration) return this.registration;
    try {
      this.registration = await navigator.serviceWorker.register('/push-sw.js');
      return this.registration;
    } catch {
      return null;
    }
  }

  async enablePushNotifications(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const reg = await this.registerServiceWorker();
      if (!reg) return false;

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await this.syncSubscriptionToServer(existing);
        return true;
      }

      const keyRes: any = await firstValueFrom(
        this.http.get('notifications/vapid-public-key'),
      );
      if (!keyRes?.publicKey) return false;

      const applicationServerKey = this.urlBase64ToUint8Array(keyRes.publicKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      await this.syncSubscriptionToServer(subscription);
      return true;
    } catch {
      return false;
    }
  }

  async syncIfAlreadyGranted(): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    await this.enablePushNotifications();
  }

  async disablePushNotifications(): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const reg = (await this.registerServiceWorker()) || (await navigator.serviceWorker.getRegistration());
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await firstValueFrom(this.http.post('notifications/unsubscribe', { endpoint }));
      }
    } catch {
      // ignore cleanup failures
    }
  }

  private async syncSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.['p256dh'] || !json.keys?.['auth']) return;
    await firstValueFrom(
      this.http.post('notifications/subscribe', {
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys['p256dh'],
          auth: json.keys['auth'],
        },
      }),
    );
  }

  private listenToServiceWorkerMessages(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'OPEN_CHAT' && event.data?.chatId) {
        this.openChatSubject.next(event.data.chatId);
      }
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
