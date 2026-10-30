import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService, Theme } from '../../helpers/theme.service';
import { TranslationService, Language } from '../../helpers/translation.service';
import { MainService } from '../main.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { PrivacyRule, UserPrivacy } from '../../models/chat-list-item.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, MatButtonModule, I18nPipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  readonly notificationsEnabledSignal = signal<boolean>(true);
  get notificationsEnabled(): boolean { return this.notificationsEnabledSignal(); }
  set notificationsEnabled(v: boolean) { this.notificationsEnabledSignal.set(v); }

  readonly userAvatarSignal = signal<string>('');
  get userAvatar(): string { return this.userAvatarSignal(); }
  set userAvatar(v: string) { this.userAvatarSignal.set(v); }

  readonly userNameSignal = signal<string>('');
  get userName(): string { return this.userNameSignal(); }
  set userName(v: string) { this.userNameSignal.set(v); }

  readonly userPhoneSignal = signal<string>('');
  get userPhone(): string { return this.userPhoneSignal(); }
  set userPhone(v: string) { this.userPhoneSignal.set(v); }

  readonly blockedUsersSignal = signal<any[]>([]);
  get blockedUsers(): any[] { return this.blockedUsersSignal(); }
  set blockedUsers(v: any[]) { this.blockedUsersSignal.set(v); }

  readonly loadingBlockedSignal = signal<boolean>(false);
  get loadingBlocked(): boolean { return this.loadingBlockedSignal(); }
  set loadingBlocked(v: boolean) { this.loadingBlockedSignal.set(v); }

  readonly privacySignal = signal<UserPrivacy>({ lastSeen: 'everybody', profilePhoto: 'everybody' });
  get privacy(): UserPrivacy { return this.privacySignal(); }

  constructor(
    public dialogRef: MatDialogRef<SettingsComponent>,
    public themeService: ThemeService,
    public translationService: TranslationService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.userAvatar = this.mainService.getAvatarUrl(this.mainService.pictureSrc) || '';
    const first = this.mainService.authService.getFirstName() || '';
    const last = this.mainService.authService.getLastName() || '';
    this.userName = `${first} ${last}`.trim() || this.translationService.t('profile.unknownUser');
    this.userPhone = this.mainService.authService.getPhoneNumber() || '';

    this.mainService.getNotificationSettings().pipe(take(1)).subscribe({
      next: (res: any) => {
        this.notificationsEnabled = res?.enabled ?? true;
      },
      error: () => {
        this.notificationsEnabled = true;
      },
    });

    this.mainService.getPrivacySettings().pipe(take(1)).subscribe({
      next: (res) => {
        if (res) {
          this.privacySignal.set({
            lastSeen: res.lastSeen || 'everybody',
            profilePhoto: res.profilePhoto || 'everybody',
          });
        }
      },
    });

    this.loadBlockedUsers();
  }

  setLastSeenPrivacy(rule: PrivacyRule): void {
    const updated: UserPrivacy = { ...this.privacy, lastSeen: rule };
    this.privacySignal.set(updated);
    this.mainService.updatePrivacySettings({ lastSeen: rule }).pipe(take(1)).subscribe({
      next: () => {
        this.mainService.snackbar.success(this.translationService.t('privacy.saved'), 2500);
      },
      error: () => {
        this.mainService.snackbar.error(this.translationService.t('privacy.saveError'), 3000);
      },
    });
  }

  setProfilePhotoPrivacy(rule: PrivacyRule): void {
    const updated: UserPrivacy = { ...this.privacy, profilePhoto: rule };
    this.privacySignal.set(updated);
    this.mainService.updatePrivacySettings({ profilePhoto: rule }).pipe(take(1)).subscribe({
      next: () => {
        this.mainService.snackbar.success(this.translationService.t('privacy.saved'), 2500);
      },
      error: () => {
        this.mainService.snackbar.error(this.translationService.t('privacy.saveError'), 3000);
      },
    });
  }

  loadBlockedUsers(): void {
    this.loadingBlocked = true;
    this.mainService.getBlockedUsers().pipe(take(1)).subscribe({
      next: (users) => {
        this.blockedUsers = users || [];
        this.loadingBlocked = false;
      },
      error: () => {
        this.loadingBlocked = false;
      },
    });
  }

  unblock(user: any): void {
    this.mainService.unblockUser(user._id).pipe(take(1)).subscribe({
      next: () => {
        this.blockedUsers = this.blockedUsers.filter((u) => u._id !== user._id);
        this.mainService.snackbar.success('کاربر از مسدودیت خارج شد', 3000);
      },
      error: () => {
        this.mainService.snackbar.error('خطا در رفع مسدودیت', 3000);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  selectLanguage(lang: Language): void {
    if (this.translationService.currentLang() !== lang) {
      this.translationService.loadLanguage(lang);
    }
  }

  toggleNotifications(): void {
    this.notificationsEnabled = !this.notificationsEnabled;
    this.mainService.updateNotificationSettings(this.notificationsEnabled).pipe(take(1)).subscribe({
      error: () => {
        this.notificationsEnabled = !this.notificationsEnabled;
        this.mainService.snackbar.error('خطا در ذخیره تنظیمات', 3000);
      },
    });
  }

  openEditProfile(): void {
    this.close();
    this.mainService.openEditProfileModal();
  }

  getUserInitials(): string {
    const first = (this.mainService.authService.getFirstName() || '').trim();
    const last = (this.mainService.authService.getLastName() || '').trim();
    if (first && last) return `${first.charAt(0)}${last.charAt(0)}`;
    if (first) return first.charAt(0);
    return '?';
  }
}
