import { Injectable } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ContactsComponent } from './contacts/contacts.component';
import { HttpRequestService } from '../helpers/http-request.service';
import { Observable, take } from 'rxjs';
import { ChatListItem } from '../models/chat-list-item.model';
import { SocketService } from './socket.service';
import { HttpParams } from '@angular/common/http';
import { Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class MainService {
  currentChat: ChatListItem = null;
  chatItems: ChatListItem[] = [];
  currentPage: number;
  totalPages: number;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private httpRequestService: HttpRequestService,
    private socketService: SocketService
  ) {}

  listenToMessages() {
    this.socketService
      .receiveMessages()
      .subscribe((message: { sender: string; msg: Message }) => {
        const chatItem = this.chatItems.find((x) => x._id === message.sender);
        if (chatItem) {
          message.msg.sender = {
            firstName: chatItem.firstName,
            lastName: chatItem.lastName,
          };
          chatItem.messages.push(message.msg);
          chatItem.lastMessage = message.msg;
          ++chatItem.messageCount;
        } else this.getChatList();
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

  sendMessage(currentChat: ChatListItem, input: HTMLInputElement) {
    const messageData: Message = {
      sender: this.authService.getUserId(),
      receiver: currentChat._id,
      content: input.value,
      avatar: null,
      createdAt: new Date(),
    };
    this.socketService.sendMessage(messageData);
    messageData.sender = {
      firstName: currentChat.firstName,
      lastName: currentChat.lastName,
    };
    this.currentChat.messages.push(messageData);
    input.value = '';
    const chatItem = this.chatItems.find((x) => x._id === currentChat._id);
    if (!chatItem) {
      this.chatItems.unshift({
        _id: currentChat._id,
        firstName: currentChat.firstName,
        lastName: currentChat.lastName,
        lastMessage: messageData,
        messages: [messageData],
      });
    }
    setTimeout(() => {
      const messagesDiv = document.querySelector('.chat-messages');
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 100);
  }

  getMessages(
    receiverId: string,
    page: number = 1,
    limit: number = 20
  ): Observable<any> {
    const params = new HttpParams()
      .set('receiverId', receiverId)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpRequestService.get('message', null, params);
  }

  loadMessages(page: number = 1) {
    this.getMessages(this.currentChat._id, page).subscribe(
      (response) => {
        this.currentChat.messages = [
          ...this.currentChat.messages,
          ...response.messages,
        ];
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
      },
      (error) => {
        console.error('Error loading messages:', error);
      }
    );
  }

  getChatList() {
    this.httpRequestService.get('chat/list').subscribe(
      (response) => {
        this.chatItems = response;
      },
      (error) => {
        console.error('Error loading chat list:', error);
      }
    );
  }
}
