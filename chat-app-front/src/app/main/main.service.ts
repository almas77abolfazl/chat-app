import { Injectable } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class MainService {
  constructor(private dialog: MatDialog) {}

  openEditProfileModal(): void {
    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: '500px',
      data: {
        name: 'Current User',
        bio: 'Current Bio',
        status: 'Available',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Profile updated:', result);
        // اینجا می‌توانید اطلاعات جدید را ذخیره کنید یا صفحه را به‌روزرسانی کنید
      }
    });
  }
}
