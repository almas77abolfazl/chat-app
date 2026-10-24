import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService, Theme } from '../../helpers/theme.service';
import { TranslationService, Language } from '../../helpers/translation.service';
import { MainService } from '../main.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { take } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, MatButtonModule, I18nPipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  notificationsEnabled = true;
  userAvatar = '';
  userName = '';
  userPhone = '';
  blockedUsers: any[] = [];
  loadingBlocked = false;

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
        this.notificationsEnabled = res.enabled ?? true;
      },
      error: () => {
        this.notificationsEnabled = true;
      },
    });

    this.loadBlockedUsers();
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
    if (this.translationService.currentLang !== lang) {
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
