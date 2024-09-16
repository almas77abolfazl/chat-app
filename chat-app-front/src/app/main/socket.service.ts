import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  constructor() {
    this.socket = io('http://localhost:3000/message', {
      transports: ['websocket'],
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
