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

  agentConfigured = false;
  botUserId: string | null = null;
  botFirstName = 'دستیار';
  botLastName = 'هوشمند';
  agentWorking = false;
  agentStreamingMessage: Message = null;

  private messagesSubscription: any;

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
    if (this.messagesSubscription) return;
    this.messagesSubscription = this.socketService
      .receiveMessages()
      .subscribe(async (message: { sender: string; msg: Message }) => {
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

  stopListening() {
    this.messagesSubscription?.unsubscribe();
    this.messagesSubscription = null;
  }

  isAgentChat(chat: any): boolean {
    return !!chat && !!this.botUserId && chat._id === this.botUserId;
  }

  loadAgentStatus() {
    this.httpRequestService
      .get('agent/status')
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.agentConfigured = res.configured;
          this.botUserId = res.botUserId;
          const names = (res.botName ?? '').split(' ');
          this.botFirstName = names[0] || 'دستیار';
          this.botLastName = names.slice(1).join(' ') || '';
        },
        error: () => {
          this.agentConfigured = false;
        },
      });
  }

  openAgentChat() {
    if (!this.botUserId) this.loadAgentStatus();
    const existing = this.chatItems.find((x) => x._id === this.botUserId);
    const chatItem: ChatListItem = existing ?? {
      _id: this.botUserId,
      firstName: this.botFirstName,
      lastName: this.botLastName,
      lastMessage: null,
      messageCount: 0,
      messages: [],
      avatar: 'default_profile.jpg',
    };
    if (!existing) this.chatItems.unshift(chatItem);
    this.currentChat = chatItem;
    this.loadMessages().pipe(take(1)).subscribe();
  }

  listenToAgentEvents() {
    this.socketService.onAgentEvent('agentStart', () => {
      this.agentWorking = true;
      const streaming: Message = {
        _id: null,
        content: '',
        sender: {
          _id: this.botUserId,
          firstName: this.botFirstName,
          lastName: this.botLastName,
        },
        receiver: this.authService.getUserId(),
        avatar: 'default_profile.jpg',
        createdAt: new Date(),
        isStreaming: true,
        toolCalls: [],
      } as any;
      this.agentStreamingMessage = streaming;
      this.currentChat?.messages.push(streaming);
    });

    this.socketService.onAgentEvent('agentChunk', (data: { chunk: string }) => {
      if (!this.agentStreamingMessage) return;
      this.agentStreamingMessage.content += data.chunk;
      this.scrollChatToBottom();
    });

    this.socketService.onAgentEvent('agentToolCall', (data: { name: string; arguments: any }) => {
      if (!this.agentStreamingMessage) return;
      (this.agentStreamingMessage as any).toolCalls.push({
        name: data.name,
        arguments: data.arguments,
      });
    });

    this.socketService.onAgentEvent('agentNotice', (data: { message: string }) => {
      if (this.agentStreamingMessage) {
        this.agentStreamingMessage.content = data.message;
      }
    });

    this.socketService.onAgentEvent('agentSaved', (data: { messageId: string }) => {
      if (this.agentStreamingMessage) {
        this.agentStreamingMessage._id = data.messageId;
        (this.agentStreamingMessage as any).isStreaming = false;
        const chatItem = this.chatItems.find((x) => x._id === this.botUserId);
        if (chatItem) chatItem.lastMessage = this.agentStreamingMessage;
      }
      this.agentStreamingMessage = null;
      this.agentWorking = false;
      this.scrollChatToBottom();
    });

    this.socketService.onAgentEvent('agentError', (data: { message: string }) => {
      if (this.agentStreamingMessage) {
        this.agentStreamingMessage.content = data.message || 'خطا در دستیار هوشمند';
        (this.agentStreamingMessage as any).isStreaming = false;
      }
      this.agentStreamingMessage = null;
      this.agentWorking = false;
    });
  }

  sendAgentMessage(content: string) {
    if (!content?.trim()) return;
    const chatItem = this.chatItems.find((x) => x._id === this.botUserId);
    const userMessage: Message = {
      _id: null,
      sender: {
        _id: this.authService.getUserId(),
        firstName: this.authService.getFirstName(),
        lastName: this.authService.getLastName(),
      },
      receiver: this.botUserId,
      content: content.trim(),
      avatar: this.pictureSrc,
      createdAt: new Date(),
    };
    chatItem?.messages.push(userMessage);
    if (chatItem) chatItem.lastMessage = userMessage;
    this.socketService.sendAgentMessage({ content: content.trim() });
    this.scrollChatToBottom();
  }

  agentQuickAction(action: 'summarize' | 'tasks' | 'reply') {
    const chat = this.currentChat;
    const withName = chat ? `${chat.firstName ?? ''} ${chat.lastName ?? ''}`.trim() : '';
    const prompts = {
      summarize: withName
        ? `گفتگو من با ${withName} را خلاصه کن`
        : 'گفتگوهای اخیر من را خلاصه کن',
      tasks: withName
        ? `از پیام‌های اخیر من با ${withName} تسک‌های عملیاتی استخراج کن`
        : 'از پیام‌های اخیرم تسک‌های عملیاتی استخراج کن',
      reply: withName
        ? `برای آخرین پیام ${withName} یک پیشنهاد پاسخ کوتاه بنویس`
        : 'برای آخرین پیام‌هایم یک پیشنهاد پاسخ کوتاه بنویس',
    };
    this.sendAgentMessage(prompts[action]);
  }

  private scrollChatToBottom() {
    setTimeout(() => {
      const messagesDiv = document.querySelector('.chat-messages');
      if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 50);
  }

  openEditProfileModal(): void {
    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: '500px',
      data: {
        firstName: this.authService.getFirstName(),
        lastName: this.authService.getLastName(),
        bio: localStorage.getItem('user-bio') || '',
        pictureSrc: this.pictureSrc,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;
        this.pictureSrc = result.pictureSrc || this.pictureSrc;
        this.file = result.file;

        this.httpRequestService
          .post('user/updateUserNames', {
            firstName: result.firstName,
            lastName: result.lastName,
            bio: result.bio,
          })
          .pipe(take(1))
          .subscribe({
            next: () => {
              localStorage.setItem('user-firstName', result.firstName || '');
              localStorage.setItem('user-lastName', result.lastName || '');
              localStorage.setItem('user-bio', result.bio || '');
            },
            error: (err) => console.error('Error updating profile:', err),
          });

        if (this.file) this.saveAvatar();
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
    return this.httpRequestService.get('search?query=' + encodeURIComponent(query));
  }

  sendMessage(currentChat: ChatListItem, input: HTMLTextAreaElement) {
    const content = input.value;
    if (!content?.trim()) return;

    if (this.isAgentChat(currentChat)) {
      input.value = '';
      this.sendAgentMessage(content);
      return;
    }

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
        // بک‌اند جدیدترین‌ها را اول می‌دهد؛ برای نمایش کرونولوژیک برمی‌گردانیم
        const ordered = [...newMessages].reverse();
        if (response.currentPage <= 1) {
          this.currentChat.messages = [...this.currentChat.messages, ...ordered];
        } else {
          this.currentChat.messages = [...ordered, ...this.currentChat.messages];
        }
        this.currentChat.messages.forEach(async (msg) => {
          const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
          if (!senderId) return;
          msg.avatar = await this.getAvatar(senderId);
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
