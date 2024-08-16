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
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(library: FaIconLibrary) {
    // اضافه کردن آیکون‌های مورد نیاز به کتابخانه
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
    );
  }
}
