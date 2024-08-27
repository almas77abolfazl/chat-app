import { Injectable } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ContactsComponent } from './contacts/contacts.component';
import { HttpRequestService } from '../helpers/http-request.service';
import { take } from 'rxjs';

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

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private httpRequestService: HttpRequestService
  ) {}

  openEditProfileModal(): void {
    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: '500px',
      data: {
        firstName: localStorage.getItem('user-firstName') || '',
        lastName: localStorage.getItem('user-lastName') || '',
        bio: localStorage.getItem('user-bio') || '',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
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

  search(query: string) {
    return this.httpRequestService.get('search?query=' + query);
  }
}
