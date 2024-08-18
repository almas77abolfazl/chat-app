import { Component } from '@angular/core';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
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
} from '@fortawesome/free-solid-svg-icons';
import { SideBarComponent } from './side-bar/side-bar.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatAreaComponent } from './chat-area/chat-area.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { MainService } from '../main.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FontAwesomeModule,
    SideBarComponent,
    ChatListComponent,
    ChatAreaComponent,
    MatDialogModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(
    library: FaIconLibrary,

    public mainService: MainService
  ) {
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
      faCamera
    );
  }
}
