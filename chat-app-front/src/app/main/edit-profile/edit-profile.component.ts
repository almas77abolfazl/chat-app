import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { MainService } from '../main.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, MatButtonModule, I18nPipe],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent {
  file: any;
  imageError = false;

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
    if (this.imageError || !this.data?.pictureSrc) return null;
    return this.mainService.getAvatarUrl(this.data.pictureSrc);
  }

  get initials(): string {
    const f = (this.data?.firstName || '').trim();
    const l = (this.data?.lastName || '').trim();
    if (f && l) return `${f.charAt(0)}${l.charAt(0)}`;
    if (f) return f.charAt(0);
    if (l) return l.charAt(0);
    return '?';
  }

  onImageError(): void {
    this.imageError = true;
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
      pictureSrc: this.data.pictureSrc,
    });
  }

  onProfilePictureChange(event: any): void {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      this.file = selectedFile;
      this.imageError = false;
      const reader = new FileReader();
      reader.onload = () => {
        this.data.pictureSrc = reader.result as string;
      };
      reader.readAsDataURL(this.file);
    }
  }
}
