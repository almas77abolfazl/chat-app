import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { ThemeService } from '../../../helpers/theme.service';
import { TranslationService } from '../../../helpers/translation.service';
import { I18nPipe } from '../../../helpers/i18n.pipe';
@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [FontAwesomeModule, I18nPipe],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  @Input() mobileOpen = false;
  @Output() close = new EventEmitter<void>();
  customItems: { icon: string; titleKey: string; id: string }[] = [];
  navItems = [
    { icon: 'comment-dots', titleKey: 'sidebar.chats', id: 'all' },
    { icon: 'users', titleKey: 'sidebar.groups', id: 'groups' },
    { icon: 'broadcast-tower', titleKey: 'sidebar.channels', id: 'channels' },
    { icon: 'address-book', titleKey: 'contacts.title', id: 'contacts' },
  ];
  constructor(
    public mainService: MainService,
    public themeService: ThemeService,
    public translationService: TranslationService
  ) {}

  toggleTheme() {
    this.themeService.toggleTheme();
    if (this.mobileOpen) this.close.emit();
  }

  toggleLanguage() {
    this.translationService.switchLanguage();
    if (this.mobileOpen) this.close.emit();
  }

  selectNav(id: string) {
    if (id === 'contacts') this.mainService.showContacts();
    else this.mainService.setChatFilter(id as any);
    if (this.mobileOpen) this.close.emit();
  }
}
