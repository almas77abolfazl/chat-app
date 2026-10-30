import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';

export interface MediaSendDialogData {
  file: File;
}

export interface MediaSendDialogResult {
  file: File;
  caption: string;
  compress: boolean;
}

@Component({
  selector: 'app-media-send-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, FontAwesomeModule, I18nPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="media-dialog-container">
      <div class="dialog-header">
        <div class="header-title">
          <fa-icon [icon]="['fas', isImage ? 'image' : (isMusic ? 'music' : (isCode ? 'code' : 'file'))]" class="header-icon"></fa-icon>
          <h3>{{ (isImage ? 'chat.sendImage' : 'chat.sendFile') | i18n }}</h3>
        </div>
        <button type="button" class="close-btn" (click)="dialogRef.close()" [attr.title]="'actions.cancel' | i18n">
          <fa-icon [icon]="['fas', 'times']"></fa-icon>
        </button>
      </div>

      <div class="dialog-body">
        @if (isImage && previewUrl()) {
        <div class="image-preview-container">
          <img [src]="previewUrl()" alt="Preview" class="preview-img" />
        </div>
        } @else {
        <div class="file-preview-card">
          <fa-icon [icon]="['fas', isMusic ? 'music' : (isCode ? 'code' : 'file')]" class="large-file-icon"></fa-icon>
          <div class="file-card-details">
            <span class="file-card-name" [attr.title]="data.file.name">{{ data.file.name }}</span>
            <span class="file-card-size">{{ formatFileSize(data.file.size) }}</span>
          </div>
        </div>
        }

        <div class="file-meta-bar">
          <span class="meta-size">{{ formatFileSize(data.file.size) }}</span>
          @if (isImage) {
          <label class="compress-checkbox-label">
            <input type="checkbox" [(ngModel)]="compress" />
            <fa-icon [icon]="['fas', 'compress']"></fa-icon>
            <span>{{ 'chat.compressImage' | i18n }} (WebP)</span>
          </label>
          }
        </div>

        <div class="caption-container">
          <textarea
            [(ngModel)]="caption"
            (keydown)="onKeyDown($event)"
            [placeholder]="'chat.addCaption' | i18n"
            rows="2"
            class="caption-input"
            autofocus
          ></textarea>
        </div>
      </div>

      <div class="dialog-footer">
        <button type="button" class="btn-cancel" (click)="dialogRef.close()">
          {{ 'actions.cancel' | i18n }}
        </button>
        <button type="button" class="btn-send" (click)="confirmSend()">
          <fa-icon [icon]="['fas', 'paper-plane']"></fa-icon>
          <span>{{ 'actions.send' | i18n }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .media-dialog-container {
      direction: rtl;
      display: flex;
      flex-direction: column;
      max-height: 85vh;
      width: min(92vw, 32rem);
      background: var(--color-surface-solid);
      color: var(--color-text);
      border-radius: var(--radius-2xl);
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.6rem;

        .header-icon {
          color: var(--color-primary);
          font-size: 1.1rem;
        }

        h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
        }
      }

      .close-btn {
        width: 2rem;
        height: 2rem;
        border-radius: var(--radius-full);
        border: none;
        background: transparent;
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background var(--transition-fast);

        &:hover {
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-text);
        }
      }
    }

    .dialog-body {
      padding: 1rem 1.25rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      overflow-y: auto;
    }

    .image-preview-container {
      display: flex;
      justify-content: center;
      align-items: center;
      max-height: 45vh;
      background: rgba(0, 0, 0, 0.05);
      border-radius: var(--radius-xl);
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);

      .preview-img {
        max-width: 100%;
        max-height: 45vh;
        object-fit: contain;
        display: block;
      }
    }

    .file-preview-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg));
      border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
      border-radius: var(--radius-xl);

      .large-file-icon {
        font-size: 2.2rem;
        color: var(--color-primary);
      }

      .file-card-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;

        .file-card-name {
          font-weight: 700;
          font-size: 0.95rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-card-size {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }
      }
    }

    .file-meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.82rem;
      color: var(--color-text-secondary);
      padding: 0 0.25rem;

      .compress-checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        user-select: none;
        color: var(--color-text);
        font-size: 0.82rem;

        input[type="checkbox"] {
          accent-color: var(--color-primary);
          cursor: pointer;
        }
      }
    }

    .caption-container {
      .caption-input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.65rem 0.85rem;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        color: var(--color-text);
        font-family: inherit;
        font-size: 0.9rem;
        resize: none;
        outline: none;
        transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

        &:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
        }
      }
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.6rem;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);

      .btn-cancel {
        padding: 0.5rem 1rem;
        background: transparent;
        border: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
        color: var(--color-text-secondary);
        border-radius: var(--radius-md);
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background var(--transition-fast), color var(--transition-fast);

        &:hover {
          background: color-mix(in srgb, var(--color-text) 8%, transparent);
          color: var(--color-text);
        }
      }

      .btn-send {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.5rem 1.25rem;
        background: var(--color-primary);
        color: #fff;
        border: none;
        border-radius: var(--radius-md);
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: opacity var(--transition-fast), transform var(--transition-fast);

        &:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }
      }
    }
  `],
})
export class MediaSendDialogComponent implements OnInit, OnDestroy {
  previewUrl = signal<string | null>(null);
  caption = '';
  compress = true;

  get isImage(): boolean {
    return this.data.file.type.startsWith('image/');
  }

  get isMusic(): boolean {
    const ext = this.getFileExtension(this.data.file.name);
    return this.data.file.type.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext);
  }

  get isCode(): boolean {
    const ext = this.getFileExtension(this.data.file.name);
    return ['.html', '.htm', '.js', '.ts', '.json', '.css', '.py', '.cpp', '.c', '.java'].includes(ext);
  }

  constructor(
    public dialogRef: MatDialogRef<MediaSendDialogComponent, MediaSendDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: MediaSendDialogData,
  ) {}

  ngOnInit(): void {
    if (this.isImage) {
      const url = URL.createObjectURL(this.data.file);
      this.previewUrl.set(url);
    }
  }

  ngOnDestroy(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  private getFileExtension(name: string): string {
    const idx = name.lastIndexOf('.');
    return idx !== -1 ? name.substring(idx).toLowerCase() : '';
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = 2;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.confirmSend();
    }
  }

  confirmSend(): void {
    this.dialogRef.close({
      file: this.data.file,
      caption: this.caption.trim(),
      compress: this.compress && this.isImage,
    });
  }
}

