import { Component } from '@angular/core';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faComments,
  faBriefcase,
  faUserFriends,
  faNewspaper,
  faArchive,
  faUserCircle,
  faSignOutAlt,
  faSearch,
  faEllipsisH,
  faPaperPlane,
  faCamera,
  faUserPlus,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
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
export class HomeComponent {
  constructor(library: FaIconLibrary, socketService: SocketService, public mainService: MainService) {
    socketService.init();
    mainService.listenToMessages();
    library.addIcons(
      faComments,
      faBriefcase,
      faUserFriends,
      faNewspaper,
      faArchive,
      faUserCircle,
      faSignOutAlt,
      faPaperPlane,
      faSearch,
      faEllipsisH,
      faCamera,
      faUserPlus,
      faCheckCircle
    );
  }
}
