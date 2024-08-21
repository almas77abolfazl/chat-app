import { Injectable } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ContactsComponent } from './contacts/contacts.component';

@Injectable({ providedIn: 'root' })
export class MainService {
  currentChat: {
    title?: string;
    info?: string;
    messages?: {
      avatar: string;
      author: string;
      text: string;
      time: string;
    }[];
  } = null;

  constructor(private dialog: MatDialog, private authService: AuthService) {}

  openEditProfileModal(): void {
    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: '500px',
      data: {
        firstName: localStorage.getItem('user-firstName') || '',
        lastName: localStorage.getItem('user-lastName') || '',
        bio: localStorage.getItem('user-bio') || '',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Profile updated:', result);
        // اینجا می‌توانید اطلاعات جدید را ذخیره کنید یا صفحه را به‌روزرسانی کنید
      }
    });
  }

  showContacts() {
    const dialogRef = this.dialog.open(ContactsComponent, {
      width: '300px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Profile updated:', result);
        // اینجا می‌توانید اطلاعات جدید را ذخیره کنید یا صفحه را به‌روزرسانی کنید
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
