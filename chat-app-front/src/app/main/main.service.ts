import { Injectable } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ContactsComponent } from './contacts/contacts.component';
import { HttpRequestService } from '../helpers/http-request.service';
import { take } from 'rxjs';
import { CurrentChat } from '../models/current-chat.model';
import { ChatListItem } from '../models/chat-list-item.model';
import { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class MainService {
  currentChat: CurrentChat = null;
  chatItems: ChatListItem[] = [];

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private httpRequestService: HttpRequestService,
    private socketService: SocketService
  ) {}

  listenToMessages() {
    this.socketService.receiveMessages().subscribe((message: string) => {
      const chatItem = this.chatItems.find((x) => x);
      chatItem.messages.push(null);
    });
  }

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

  logout() {
    this.authService.logout();
  }

  search(query: string) {
    return this.httpRequestService.get('search?query=' + query);
  }

  sendMessage(receiverId: string, input: HTMLInputElement) {
    const messageData = {
      sender: this.authService.getUserId(), // آی‌دی کاربر فرستنده
      receiver: receiverId, // آی‌دی دریافت‌کننده (کاربر یا چنل)
      content: input.value, // محتوای پیام
    };
    this.socketService.sendMessage(messageData);
    input.value = '';
  }
}
