import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';

@Component({
  selector: 'app-story-create-dialog',
  standalone: true,
  imports: [MatDialogModule, FormsModule, FontAwesomeModule, I18nPipe],
  templateUrl: './story-create-dialog.component.html',
  styleUrl: './story-create-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryCreateDialogComponent {
  readonly modeSignal = signal<'image' | 'text'>('image');
  get mode(): 'image' | 'text' { return this.modeSignal(); }
  set mode(v: 'image' | 'text') { this.modeSignal.set(v); }

  readonly captionSignal = signal<string>('');
  get caption(): string { return this.captionSignal(); }
  set caption(v: string) { this.captionSignal.set(v); }

  readonly selectedFileSignal = signal<File | null>(null);
  get selectedFile(): File | null { return this.selectedFileSignal(); }
  set selectedFile(v: File | null) { this.selectedFileSignal.set(v); }

  readonly imagePreviewUrlSignal = signal<string | null>(null);
  get imagePreviewUrl(): string | null { return this.imagePreviewUrlSignal(); }
  set imagePreviewUrl(v: string | null) { this.imagePreviewUrlSignal.set(v); }

  readonly textContentSignal = signal<string>('');
  get textContent(): string { return this.textContentSignal(); }
  set textContent(v: string) { this.textContentSignal.set(v); }

  readonly selectedBgSignal = signal<string>('linear-gradient(135deg, #6366f1, #a855f7)');
  get selectedBg(): string { return this.selectedBgSignal(); }
  set selectedBg(v: string) { this.selectedBgSignal.set(v); }

  bgGradients = [
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #1e293b, #0f172a)',
  ];

  constructor(public dialogRef: MatDialogRef<StoryCreateDialogComponent>) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  submit() {
    if (this.mode === 'image' && this.selectedFile) {
      const formData = new FormData();
      formData.append('media', this.selectedFile);
      formData.append('mediaType', 'image');
      if (this.caption.trim()) {
        formData.append('caption', this.caption.trim());
      }
      this.dialogRef.close({ formData });
    } else if (this.mode === 'text' && this.textContent.trim()) {
      const formData = new FormData();
      formData.append('mediaType', 'text');
      formData.append('mediaUrl', this.selectedBg);
      formData.append('backgroundColor', this.selectedBg);
      formData.append('caption', this.textContent.trim());
      this.dialogRef.close({ formData });
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
