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
  file: any;
  constructor(
    public dialogRef: MatDialogRef<EditProfileComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      firstName: string;
      lastName: string;
      bio: string;
      status: string;
      pictureSrc: string;
    }
  ) {}

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
    this.file = event.target.files[0];
    if (this.file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.data.pictureSrc = reader.result as string;
      };
      reader.readAsDataURL(this.file);
    }
  }
}
