import { Component, OnDestroy } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SideBarComponent } from './side-bar/side-bar.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatAreaComponent } from './chat-area/chat-area.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MainService } from '../main.service';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-home',
  imports: [FontAwesomeModule, SideBarComponent, ChatListComponent, ChatAreaComponent, MatDialogModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnDestroy {
  constructor(socketService: SocketService, public mainService: MainService) {
    socketService.init();
    mainService.listenToMessages();
    mainService.loadAgentStatus();
    mainService.listenToAgentEvents();
  }

  ngOnDestroy(): void {
    this.mainService.stopListening();
  }
}
