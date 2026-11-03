import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket: Socket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  readonly reconnected$ = new Subject<number>();
  private readonly authService = inject(AuthService);
  readonly connectionStatus$ = new BehaviorSubject<boolean>(false);

  constructor() {}

  private isRefreshingToken = false;

  init(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getAuthToken();
    if (!token) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      query: { token },
      auth: (cb) => {
        cb({ token: this.authService.getAuthToken() });
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      this.isRefreshingToken = false;
      this.connectionStatus$.next(true);
    });
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.connectionStatus$.next(false);
      if (reason === 'io server disconnect') {
        // Server disconnected the socket (possibly token expired), refresh token and reconnect
        this.handleTokenExpirationOrDisconnect();
      }
    });
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.connectionStatus$.next(false);
      this.reconnectAttempts++;
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('token') || error?.message?.includes('jwt')) {
        this.handleTokenExpirationOrDisconnect();
      }
    });
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
      const freshToken = this.authService.getAuthToken();
      if (this.socket && freshToken) {
        (this.socket.io.opts as any).query = { token: freshToken };
      }
    });
    this.socket.on('reconnect', (attemptNumber?: any) => {
      console.log('Reconnected to WebSocket server');
      this.reconnectAttempts = 0;
      this.isRefreshingToken = false;
      this.connectionStatus$.next(true);
      this.reconnected$.next(typeof attemptNumber === 'number' ? attemptNumber : 1);
    });
    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed, attempting manual reconnect');
      this.handleTokenExpirationOrDisconnect();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Browser came online, reconnecting socket...');
        this.reconnectNow();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          console.log('App visible again and socket disconnected, reconnecting...');
          this.reconnectNow();
        }
      });
    }
  }

  private handleTokenExpirationOrDisconnect(): void {
    if (this.isRefreshingToken) return;
    this.isRefreshingToken = true;
    const refreshToken = this.authService.getRefreshToken();
    if (refreshToken) {
      this.authService.refreshToken().pipe(take(1)).subscribe({
        next: (res) => {
          if (res?.access_token) {
            localStorage.setItem('auth_token', res.access_token);
            if (res.refreshToken) localStorage.setItem('refresh_token', res.refreshToken);
          }
          this.isRefreshingToken = false;
          this.reconnectNow();
        },
        error: () => {
          this.isRefreshingToken = false;
          setTimeout(() => this.reconnectNow(), 3000);
        },
      });
    } else {
      this.isRefreshingToken = false;
      setTimeout(() => this.reconnectNow(), 2000);
    }
  }

  public reconnectNow(): void {
    if (this.socket?.connected) return;
    const token = this.authService.getAuthToken();
    if (!token) return;
    if (this.socket) {
      (this.socket.io.opts as any).query = { token };
      this.socket.connect();
    } else {
      this.init();
    }
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  sendMessage(message: any): void {
    this.socket?.emit('sendMessage', message);
  }

  syncMissedMessages(payload: {
    chats?: { chatId: string; lastMessageTimestamp?: string; lastMessageId?: string }[];
    chatId?: string;
    lastMessageTimestamp?: string;
    lastMessageId?: string;
  }): void {
    this.socket?.emit('syncMissedMessages', payload);
  }

  emit(event: string, payload: any): void {
    this.socket?.emit(event, payload);
  }

  on(event: string, handler: (data: any) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (data: any) => void): void {
    this.socket?.off(event, handler);
  }

  receiveMessages(): Observable<any> {
    return new Observable((observer) => {
      const handler = (message: any) => observer.next(message);
      this.socket?.on('receiveMessage', handler);
      return () => this.socket?.off('receiveMessage', handler);
    });
  }

  onAgentEvent(eventName: string, handler: (data: any) => void): void {
    this.socket?.on(eventName, handler);
  }

  sendAgentMessage(payload: { content: string; chatId?: string }): void {
    this.socket?.emit('agentMessage', payload);
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
