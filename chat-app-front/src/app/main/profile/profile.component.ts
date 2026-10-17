import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ChatListItem } from '../../models/chat-list-item.model';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule, FontAwesomeModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  constructor(
    public dialogRef: MatDialogRef<ProfileComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: ChatListItem
  ) {}

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
    return 'کاربر ناشناس';
  }

  subtitle(chat: ChatListItem): string {
    if (!chat) return '';
    if (chat.isChannel) return 'کانال عمومی';
    if (chat.isGroup) {
      const count = (chat.participants || []).length;
      return `${count} عضو`;
    }
    return 'مکالمه مستقیم';
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
}
