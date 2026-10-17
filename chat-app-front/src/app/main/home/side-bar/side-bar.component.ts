import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  customItems: { icon: string; title: string; id: string }[] = [];
  navItems = [
    { icon: 'comment-dots', title: 'چت‌ها', id: 'all' },
    { icon: 'users', title: 'گروه‌ها', id: 'groups' },
    { icon: 'broadcast-tower', title: 'کانال‌ها', id: 'channels' },
    { icon: 'address-book', title: 'مخاطبان', id: 'contacts' },
  ];
  constructor(public mainService: MainService) {}

  selectNav(id: string) {
    if (id === 'contacts') this.mainService.showContacts();
    else this.mainService.setChatFilter(id as any);
  }
}
