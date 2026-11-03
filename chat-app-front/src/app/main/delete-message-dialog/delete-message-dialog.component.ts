import { Component, Inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';

export interface DeleteMessageDialogData {
  count?: number;
  canDeleteForEveryone?: boolean;
  peerName?: string;
  isGroupOrChannel?: boolean;
  isSavedMessages?: boolean;
}

export interface DeleteMessageDialogResult {
  confirmed: boolean;
  forEveryone: boolean;
}

@Component({
  selector: 'app-delete-message-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './delete-message-dialog.component.html',
  styleUrl: './delete-message-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteMessageDialogComponent {
  readonly forEveryoneSignal = signal<boolean>(false);
  get forEveryone(): boolean { return this.forEveryoneSignal(); }
  set forEveryone(v: boolean) { this.forEveryoneSignal.set(v); }

  constructor(
    public dialogRef: MatDialogRef<DeleteMessageDialogComponent, DeleteMessageDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteMessageDialogData,
    public translationService: TranslationService,
  ) {}

  get confirmText(): string {
    const count = this.data.count || 1;
    if (count > 1) {
      return this.translationService.t('deleteMessageDialog.confirmMultiple', { count });
    }
    return this.translationService.t('deleteMessageDialog.confirmSingle');
  }

  get alsoDeleteLabel(): string {
    if (this.data.isGroupOrChannel) {
      return this.translationService.t('deleteMessageDialog.deleteForAll');
    }
    const name = this.data.peerName || this.translationService.t('chat.user');
    return this.translationService.t('deleteMessageDialog.alsoDeleteFor', { name });
  }

  confirm() {
    this.dialogRef.close({ confirmed: true, forEveryone: this.forEveryone });
  }

  cancel() {
    this.dialogRef.close({ confirmed: false, forEveryone: false });
  }
}
