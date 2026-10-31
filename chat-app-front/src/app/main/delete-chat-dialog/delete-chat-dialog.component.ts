import { Component, Inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ChatListItem } from '../../models/chat-list-item.model';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';

export interface DeleteChatDialogData {
  chat: ChatListItem;
  isOwner?: boolean;
}

@Component({
  selector: 'app-delete-chat-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './delete-chat-dialog.component.html',
  styleUrl: './delete-chat-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteChatDialogComponent {
  readonly deleteForBothSignal = signal<boolean>(false);
  get deleteForBoth(): boolean { return this.deleteForBothSignal(); }
  set deleteForBoth(v: boolean) { this.deleteForBothSignal.set(v); }

  constructor(
    public dialogRef: MatDialogRef<DeleteChatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteChatDialogData,
    public translationService: TranslationService,
  ) {}

  get peerName(): string {
    const c = this.data.chat;
    if (c.isGroup || c.isChannel) return c.name || '';
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || this.translationService.t('chat.user');
  }

  get alsoDeleteLabel(): string {
    if (this.data.chat.isGroup || this.data.chat.isChannel) {
      return this.translationService.t('deleteDialog.deleteForAll');
    }
    return this.translationService.t('deleteDialog.alsoDeleteFor', { name: this.peerName });
  }

  confirm() {
    this.dialogRef.close({ confirmed: true, deleteForBoth: this.deleteForBoth });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
