import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket: Socket;

  constructor(private authService: AuthService) {}

  init(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      query: {
        token: this.authService.getAuthToken(),
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  sendMessage(message: any): void {
    this.socket?.emit('sendMessage', message);
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

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }
}
