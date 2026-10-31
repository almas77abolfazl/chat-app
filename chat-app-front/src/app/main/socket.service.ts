import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
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

  init(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getAuthToken();
    if (!token) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      query: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
      this.connectionStatus$.next(true);
    });
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.connectionStatus$.next(false);
      if (reason === 'io server disconnect') {
        this.reconnectAttempts = this.maxReconnectAttempts;
      }
    });
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.connectionStatus$.next(false);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
    });
    this.socket.on('reconnect', (attemptNumber?: any) => {
      console.log('Reconnected to WebSocket server');
      this.reconnectAttempts = 0;
      this.connectionStatus$.next(true);
      this.reconnected$.next(typeof attemptNumber === 'number' ? attemptNumber : 1);
    });
    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      this.connectionStatus$.next(false);
    });
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
