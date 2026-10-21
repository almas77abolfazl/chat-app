import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ChatListItem } from '../../models/chat-list-item.model';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { MainService } from '../main.service';
import { TranslationService } from '../../helpers/translation.service';
import { I18nPipe } from '../../helpers/i18n.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, FontAwesomeModule, I18nPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  constructor(
    public dialogRef: MatDialogRef<ProfileComponent>,
    private dialog: MatDialog,
    public mainService: MainService,
    public translationService: TranslationService,
    @Inject(MAT_DIALOG_DATA)
    public data: ChatListItem
  ) {}

  get isGroup() {
    return !!this.data?.isGroup;
  }

  get isChannel() {
    return !!this.data?.isChannel;
  }

  get isMobile() {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  get coverColor() {
    return this.isChannel
      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
      : this.isGroup
      ? 'linear-gradient(135deg, #a855f7, #6366f1)'
      : 'linear-gradient(135deg, #4f46e5, #6366f1)';
  }

  initials(chat: ChatListItem): string {
    if (!chat) return '?';
    const first = (chat.firstName ?? '').trim();
    const last = (chat.lastName ?? '').trim();
    if (first && last) return `${first.charAt(0)}${last.charAt(0)}`;
    if (first) return first.charAt(0);
    if (last) return last.charAt(0);
    return '?';
  }

  displayName(chat: ChatListItem): string {
    if (!chat) return '';
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    if (chat.firstName || chat.lastName)
      return `${chat.firstName ?? ''} ${chat.lastName ?? ''}`.trim();
    return this.translationService.t('profile.unknownUser');
  }

  subtitle(chat: ChatListItem): string {
    if (!chat) return '';
    if (chat.isChannel) return this.translationService.t('profile.publicChannel');
    if (chat.isGroup) {
      const count = (chat.participants || []).length;
      return this.translationService.t('profile.membersCount', { count });
    }
    return this.translationService.t('profile.directChat');
  }

  membersCount(chat: ChatListItem): number {
    return chat?.participants?.length ?? 0;
  }

  memberInitials(p: any): string {
    if (!p) return '?';
    const first = (p.firstName ?? '').trim();
    const last = (p.lastName ?? '').trim();
    if (first && last) return `${first.charAt(0)}${last.charAt(0)}`;
    if (first) return first.charAt(0);
    if (last) return last.charAt(0);
    return '?';
  }

  editProfile(): void {
    this.dialogRef.close();
    this.dialog.open(EditProfileComponent, {
      width: '420px',
      data: {
        firstName: this.data?.firstName ?? '',
        lastName: this.data?.lastName ?? '',
        pictureSrc: this.data?.avatar ?? '',
      },
    });
  }

  openChat() {
    this.dialogRef.close();
    if (this.data?._id) {
      this.mainService.openChat(this.data);
    }
  }

  previewAvatar(): void {
    if (!this.data?.avatar) return;
    window.open(this.data.avatar, '_blank');
  }
}
