import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  constructor(private authService: AuthService) {}

  init() {
    this.socket = io('http://localhost:3000/', {
      transports: ['websocket'],
      query: {
        token: this.authService.getAuthToken(),
      },
    });
  }

  sendMessage(message: any) {
    this.socket.emit('sendMessage', message);
  }

  receiveMessages(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('receiveMessage', (message: any) => {
        observer.next(message);
      });

      return () => this.socket.off('receiveMessage');
    });
  }
}
