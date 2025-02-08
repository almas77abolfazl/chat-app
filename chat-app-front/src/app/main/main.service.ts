import { Injectable } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ContactsComponent } from './contacts/contacts.component';
import { HttpRequestService } from '../helpers/http-request.service';
import { firstValueFrom, map, Observable, take, tap } from 'rxjs';
import { ChatListItem } from '../models/chat-list-item.model';
import { SocketService } from './socket.service';
import { HttpParams } from '@angular/common/http';
import { Message } from '../models/message.model';
import { CacheService } from '../helpers/cache.service';

@Injectable({ providedIn: 'root' })
export class MainService {
  currentChat: ChatListItem = null;
  chatItems: ChatListItem[] = [];
  currentPage: number;
  totalPages: number;

  file: any;
  pictureSrc = 'default_profile.jpg';

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private httpRequestService: HttpRequestService,
    private socketService: SocketService,
    private cacheService: CacheService
  ) {
    this.getAvatar(authService.getUserId()).then((avatar: string) => {
      if (avatar) this.pictureSrc = avatar;
    });
  }

  listenToMessages() {
    this.socketService.receiveMessages().subscribe(async (message: { sender: string; msg: Message }) => {
      const senderId = message.msg.sender;
      const avatar = await this.getAvatar(senderId);
      const chatItem = this.chatItems.find((x) => x._id === message.sender);
      if (chatItem) {
        message.msg.avatar = avatar;
        message.msg.sender = {
          _id: senderId,
          firstName: chatItem.firstName,
          lastName: chatItem.lastName,
        };

        chatItem.messages.push(message.msg);
        chatItem.lastMessage = message.msg;
        ++chatItem.messageCount;
        if (this.currentChat?._id === message.sender) {
          setTimeout(() => {
            const messagesDiv = document.querySelector('.chat-messages');
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }, 200);
        }
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
        pictureSrc: this.pictureSrc,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (result) {
          this.pictureSrc = result.pictureSrc;
          this.file = result.file;
          this.saveAvatar();
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
      sender: {
        _id: this.authService.getUserId(),
        firstName: this.authService.getFirstName(),
        lastName: this.authService.getLastName(),
      },
      receiver: currentChat._id,
      content: input.value,
      avatar: this.pictureSrc,
      createdAt: new Date(),
      _id: null,
    };
    this.socketService.sendMessage(messageData);

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

  getMessages(receiverId: string, page: number = 1, limit: number = 20): Observable<any> {
    const params = new HttpParams().set('receiverId', receiverId).set('page', page.toString()).set('limit', limit.toString());

    return this.httpRequestService.get('message', null, params).pipe(
      take(1),
      tap((res) => {
        // this.cacheService.setItem('messages', {
        //   id: receiverId,
        //   messages: res.messages,
        //   timestamp: Date.now(),
        // });
      })
    );
  }

  loadMessages(page: number = 1) {
    return this.getMessages(this.currentChat._id, page).pipe(
      tap((response: { messages: Message[]; totalMessages: number; currentPage: number; totalPages: number }) => {
        const existIds = this.currentChat.messages.map((x) => x._id);
        const newMessages = response.messages.filter((x) => !existIds.includes(x._id));
        this.currentChat.messages = [...this.currentChat.messages, ...newMessages];
        this.currentChat.messages.forEach(async (msg) => {
          const avatar = await this.getAvatar(msg.sender._id);
          msg.avatar = avatar;
        });
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
      })
    );
  }

  getChatList() {
    this.httpRequestService
      .get('chat/list')
      .pipe(take(1))
      .subscribe(
        (response) => {
          this.chatItems = response || [];
          this.chatItems.forEach(async (item) => {
            item.avatar = 'default_profile.jpg';
            const avatar = await this.getAvatar(item._id);
            item.avatar = avatar;
          });
        },
        (error) => {
          console.error('Error loading chat list:', error);
        }
      );
  }

  saveAvatar() {
    if (this.file) {
      const formData = new FormData();
      formData.append('avatar', this.file);

      this.httpRequestService
        .post('user/upload-avatar', formData)
        .pipe(take(1))
        .subscribe({
          next: (response: any) => {
            console.log('Profile picture uploaded successfully:', response);
          },
          error: (err) => {
            console.error('Error uploading profile picture:', err);
          },
        });
    }
  }

  async getAvatar(userId: string): Promise<string> {
    const avatar = await this.cacheService.getItem('avatars', userId);
    if (avatar?.avatar) return 'data:image/jpeg;base64,' + avatar.avatar;
    return firstValueFrom(
      this.httpRequestService.get(`user/${userId}/avatar`).pipe(
        take(1),
        tap((res) => {
          if (res.avatar) {
            this.cacheService.setItem('avatars', {
              id: userId,
              avatar: res.avatar,
            });
          }
        }),
        map((res) => (res?.avatar ? 'data:image/jpeg;base64,' + res.avatar : 'default_profile.jpg'))
      )
    );
  }
}
