import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AdminPermissions, ChatParticipant } from '../../models/chat-list-item.model';
import { I18nPipe } from '../../helpers/i18n.pipe';

export interface AdminManagementDialogData {
  chatId: string;
  member: ChatParticipant;
  isChannel?: boolean;
  existingPermissions?: AdminPermissions;
  customTitle?: string;
  isOwner?: boolean;
  isCurrentAdmin?: boolean;
}

@Component({
  selector: 'app-admin-management-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './admin-management-dialog.component.html',
  styleUrl: './admin-management-dialog.component.scss',
})
export class AdminManagementDialogComponent {
  customTitle = '';
  permissions: AdminPermissions = {
    canChangeInfo: true,
    canPostMessages: true,
    canEditMessages: false,
    canDeleteMessages: true,
    canInviteUsers: true,
    canPinMessages: true,
    canManageAdmins: false,
  };

  constructor(
    public dialogRef: MatDialogRef<AdminManagementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdminManagementDialogData,
  ) {
    if (data.customTitle) {
      this.customTitle = data.customTitle;
    }
    if (data.existingPermissions) {
      this.permissions = { ...this.permissions, ...data.existingPermissions };
    }
  }

  save() {
    this.dialogRef.close({
      action: 'save',
      targetUserId: this.data.member._id,
      permissions: this.permissions,
      customTitle: this.customTitle,
    });
  }

  dismiss() {
    this.dialogRef.close({
      action: 'dismiss',
      targetUserId: this.data.member._id,
    });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
