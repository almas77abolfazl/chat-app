import { Component, Inject, ChangeDetectionStrategy, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { MainService } from '../main.service';
import { getTelegramGradient, getInitials } from '../../helpers/avatar.helper';
import { ImageCropDialogComponent } from '../image-crop-dialog/image-crop-dialog.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, MatButtonModule, I18nPipe],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfileComponent {
  file: any;
  readonly imageError = signal(false);
  readonly previewUrl = signal<string | null>(null);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  constructor(
    public dialogRef: MatDialogRef<EditProfileComponent>,
    public mainService: MainService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      firstName: string;
      lastName: string;
      bio: string;
      status: string;
      pictureSrc: string;
    }
  ) {}

  get avatarDisplaySrc(): string | null {
    if (this.previewUrl()) return this.previewUrl();
    if (this.imageError() || !this.data?.pictureSrc) return null;
    return this.mainService.getAvatarUrl(this.data.pictureSrc);
  }

  get initials(): string {
    return getInitials(this.data?.firstName, this.data?.lastName, '؟');
  }

  get avatarBg(): string {
    const id = this.mainService.authService.getUserId() || this.data?.firstName || 'user';
    return getTelegramGradient(id);
  }

  onImageError(): void {
    this.imageError.set(true);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close({
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      bio: this.data.bio,
      file: this.file,
      pictureSrc: this.previewUrl() || this.data.pictureSrc,
    });
  }

  onProfilePictureChange(event: any): void {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const rawSrc = reader.result as string;
        const cropDialogRef = this.dialog.open(ImageCropDialogComponent, {
          width: '380px',
          maxWidth: '96vw',
          data: { imageSrc: rawSrc },
          autoFocus: false,
        });

        cropDialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
          if (result) {
            this.file = result.file;
            this.previewUrl.set(result.previewUrl);
            this.data.pictureSrc = result.previewUrl;
            this.imageError.set(false);
            this.cdr.markForCheck();
          }
        });
      };
      reader.readAsDataURL(selectedFile);
      // Reset input value so re-selecting same file triggers change
      event.target.value = '';
    }
  }
}
