import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';

export interface PermissionDialogData {
  type: 'microphone' | 'camera' | 'media';
  errorReason?: 'insecure_context' | 'denied' | 'not_supported' | 'device_not_found';
}

@Component({
  selector: 'app-permission-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FontAwesomeModule, I18nPipe],
  templateUrl: './permission-dialog.component.html',
  styleUrl: './permission-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionDialogComponent {
  readonly dialogRef = inject(MatDialogRef<PermissionDialogComponent>);
  readonly data: PermissionDialogData = inject(MAT_DIALOG_DATA);
  readonly translationService = inject(TranslationService);

  readonly requesting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  get isInsecureContext(): boolean {
    if (this.data.errorReason === 'insecure_context') return true;
    if (typeof window !== 'undefined') {
      return !window.isSecureContext && window.location.protocol !== 'https:';
    }
    return false;
  }

  get isBlocked(): boolean {
    return this.data.errorReason === 'denied';
  }

  switchToHttps(): void {
    if (typeof window !== 'undefined') {
      const url = window.location.href.replace(/^http:/, 'https:');
      window.location.href = url;
    }
  }

  async requestPermission(): Promise<void> {
    if (this.isInsecureContext) {
      this.switchToHttps();
      return;
    }

    this.requesting.set(true);
    this.errorMessage.set(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: this.data.type === 'camera' || this.data.type === 'media',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((t) => t.stop());
      this.requesting.set(false);
      this.dialogRef.close(true);
    } catch (err: any) {
      this.requesting.set(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.data.errorReason = 'denied';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        this.data.errorReason = 'device_not_found';
      } else {
        this.errorMessage.set(err?.message || 'Permission request failed');
      }
    }
  }

  dismiss(): void {
    this.dialogRef.close(false);
  }
}

