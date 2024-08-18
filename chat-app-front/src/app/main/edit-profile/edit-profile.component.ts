import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule, MatButtonModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss',
})
export class EditProfileComponent {
  pictureSrc = 'default_profile.jpg';
  constructor(
    public dialogRef: MatDialogRef<EditProfileComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      firstName: string;
      lastName: string;
      bio: string;
      status: string;
    }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // فرض کنید تغییرات را ذخیره کنید و سپس مودال را ببندید
    this.dialogRef.close({
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      bio: this.data.bio
    });
  }

  onProfilePictureChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // اینجا می‌توانید تصویر جدید را آپلود کنید و نمایش دهید
      console.log('New profile picture selected:', file);
    }
  }
}
