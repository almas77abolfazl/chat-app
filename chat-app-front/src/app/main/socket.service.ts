import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  constructor(private socket: Socket) {}

  sendMessage(message: any) {
    this.socket.emit('sendMessage', message);
  }

  receiveMessages() {
    return this.socket.fromEvent('receiveMessage');
  }
}
