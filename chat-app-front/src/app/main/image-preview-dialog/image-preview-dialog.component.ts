import { Component, Inject, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { copyImageToClipboard } from '../../helpers/clipboard.helper';
import { SnackbarService } from '../../helpers/snackbar/snackbar.service';

export interface ImagePreviewDialogData {
  imageUrl: string;
}

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, FontAwesomeModule, I18nPipe],
  template: `
    <div class="image-lightbox-wrapper" (click)="close()">
      <div class="image-lightbox-toolbar" (click)="$event.stopPropagation()">
        <button type="button" class="lightbox-btn" (click)="copyImage()" [attr.title]="'actions.copy' | i18n">
          <fa-icon [icon]="['fas', 'copy']"></fa-icon>
        </button>
        <button type="button" class="lightbox-btn" (click)="downloadImage()" [attr.title]="'actions.download' | i18n">
          <fa-icon [icon]="['fas', 'download']"></fa-icon>
        </button>
        <button type="button" class="lightbox-btn close-btn" (click)="close()" [attr.title]="'actions.cancel' | i18n">
          <fa-icon [icon]="['fas', 'times']"></fa-icon>
        </button>
      </div>
      <div class="image-lightbox-body" (click)="$event.stopPropagation()">
        <img [src]="data.imageUrl" class="lightbox-image" alt="Preview" />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .image-lightbox-wrapper {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.18s ease-out both;
    }

    .image-lightbox-toolbar {
      position: absolute;
      top: 1.5rem;
      right: 1.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 10001;
    }

    .lightbox-btn {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.15rem;
      transition: background 0.15s ease, transform 0.15s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.32);
        transform: scale(1.08);
      }

      &.close-btn:hover {
        background: #ef4444;
        border-color: #ef4444;
      }
    }

    .image-lightbox-body {
      max-width: 94vw;
      max-height: 88vh;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .lightbox-image {
      max-width: 94vw;
      max-height: 88vh;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75);
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImagePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImagePreviewDialogData,
    private snackbar: SnackbarService,
  ) {}

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }

  close() {
    this.dialogRef.close();
  }

  copyImage() {
    if (!this.data?.imageUrl) return;
    copyImageToClipboard(this.data.imageUrl).then((success) => {
      if (success) {
        this.snackbar.success('actions.copied', 2000);
      }
    });
  }

  downloadImage() {
    if (!this.data?.imageUrl) return;
    const a = document.createElement('a');
    a.href = this.data.imageUrl;
    a.download = this.data.imageUrl.split('/').pop() || 'image.png';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
