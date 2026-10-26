import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { ThemeService } from '../../../helpers/theme.service';
import { TranslationService } from '../../../helpers/translation.service';
import { I18nPipe } from '../../../helpers/i18n.pipe';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [FontAwesomeModule, I18nPipe],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarComponent {
  readonly mobileOpen = input<boolean>(false);
  readonly close = output<void>();

  readonly navItems = [
    { icon: 'comment-dots', titleKey: 'sidebar.chats', id: 'all' },
    { icon: 'address-book', titleKey: 'contacts.title', id: 'contacts' },
  ];

  readonly notificationsEnabled = signal(true);
  readonly agentHistory = signal<{ chatId: string; summary: string }[]>([]);

  constructor(
    public mainService: MainService,
    public themeService: ThemeService,
    public translationService: TranslationService
  ) {
    this.loadNotificationSettings();
    this.loadAgentHistory();
  }

  openProfile() {
    const myId = this.mainService.authService.getUserId();
    if (myId) {
      this.mainService.openUserProfileModal(myId);
    } else {
      this.mainService.openEditProfileModal();
    }
    if (this.mobileOpen()) this.close.emit();
  }

  openSettings() {
    this.mainService.openSettingsModal();
    if (this.mobileOpen()) this.close.emit();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    if (this.mobileOpen()) this.close.emit();
  }

  toggleLanguage() {
    this.translationService.switchLanguage();
    if (this.mobileOpen()) this.close.emit();
  }

  selectNav(id: string) {
    if (id === 'contacts') this.mainService.showContacts();
    else if (id === 'saved-messages') this.mainService.openSavedMessages();
    else this.mainService.setChatFilter(id as any);
    if (this.mobileOpen()) this.close.emit();
  }

  loadNotificationSettings() {
    this.mainService.getNotificationSettings().pipe(take(1)).subscribe({
      next: (res: any) => {
        this.notificationsEnabled.set(res?.enabled ?? true);
      },
      error: () => {
        this.notificationsEnabled.set(true);
      },
    });
  }

  toggleNotifications() {
    const next = !this.notificationsEnabled();
    this.notificationsEnabled.set(next);
    this.mainService.updateNotificationSettings(next).pipe(take(1)).subscribe({
      error: () => {
        this.notificationsEnabled.set(!next);
        this.mainService.snackbar.error('خطا در ذخیره تنظیمات', 3000);
      },
    });
  }

  loadAgentHistory() {
    if (!this.mainService.agentConfigured) return;
    this.mainService.getAgentHistory().pipe(take(1)).subscribe({
      next: (res: any) => {
        if (res.messages && res.messages.length > 0) {
          const botName = res.botName || 'دستیار';
          this.agentHistory.set([
            {
              chatId: res.chatId,
              summary: this.summarizeHistory(res.messages, botName),
            },
          ]);
        }
      },
      error: () => {},
    });
  }

  summarizeHistory(messages: any[], _botName: string): string {
    const firstUserMsg = messages.find((m) => m.content && m.sender?.firstName)?.content || '';
    if (firstUserMsg) {
      const truncated = firstUserMsg.length > 50 ? firstUserMsg.substring(0, 50) + '...' : firstUserMsg;
      return truncated;
    }
    return messages[0]?.content || 'مکالمه کنونی';
  }

  openAgentHistory(chatId: string) {
    const chatItem = this.mainService.findChatById(chatId);
    if (chatItem) {
      this.mainService.openChat(chatItem);
    } else {
      this.mainService.openAgentHistoryChat();
    }
  }
}
