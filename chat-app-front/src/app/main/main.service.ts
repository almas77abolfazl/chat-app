import { Inject, Injectable, NgZone } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ContactsComponent } from './contacts/contacts.component';
import { CreateChatComponent } from './create-chat/create-chat.component';
import { HttpRequestService } from '../helpers/http-request.service';
import { BehaviorSubject, firstValueFrom, map, Observable, of, Subject, take, tap, catchError } from 'rxjs';
import { ChatListItem, ChatParticipant } from '../models/chat-list-item.model';
import { SocketService } from './socket.service';
import { HttpParams } from '@angular/common/http';
import { Message } from '../models/message.model';
import { CacheService } from '../helpers/cache.service';
import { environment } from '../../environments/environment';
import { SnackbarService } from '../helpers/snackbar/snackbar.service';

@Injectable({ providedIn: 'root' })
export class MainService {
  currentChat: ChatListItem = null;
  chatItems: ChatListItem[] = [];
  chatFilter: 'all' | 'groups' | 'channels' = 'all';
  currentPage: number = 1;
  totalPages: number = 1;
  loadingMessages = false;
  private chatOpenedSubject = new BehaviorSubject<void>(null);
  chatOpened$ = this.chatOpenedSubject.asObservable();
  private messagesLoadedSubject = new Subject<void>();
  messagesLoaded$ = this.messagesLoadedSubject.asObservable();

  file: any;
  pictureSrc = '';

  agentConfigured = false;
  botUserId: string | null = null;
  botChatId: string | null = null;
  botFirstName = 'دستیار';
  botLastName = 'هوشمند';
  agentWorking = false;
  agentStreamingMessage: Message = null;

  private messagesSubscription: any;
  private typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>;
  private typingUsersSubject = new BehaviorSubject<Map<string, string[]>>(new Map());
  typingUsers$ = this.typingUsersSubject.asObservable();

  constructor(
    public authService: AuthService,
    public httpRequestService: HttpRequestService,
    private dialog: MatDialog,
    private socketService: SocketService,
    private cacheService: CacheService,
    public snackbar: SnackbarService,
    private zone: NgZone
  ) {
    this.getAvatar(authService.getUserId()).then((avatar: string) => {
      if (avatar) this.pictureSrc = avatar;
    });
  }

  /** Returns a chat list item for the current user, keyed by Chat._id. */
  getChatList() {
    this.httpRequestService
      .get('chat/list')
      .pipe(take(1))
      .subscribe(
        (response: any[]) => {
          this.chatItems = (response || []).map((chat) => this.mapChatItem(chat));
          this.chatItems.forEach(async (item) => {
            item.avatar = await this.resolveAvatar(item);
            if (await this.isAgentChat(item)) {
              item.avatar = null;
            }
          });
        },
        (error) => this.snackbar.error('خطا در بارگذاری لیست چت', 5000)
      );
  }

  private mapChatItem(chat: any): ChatListItem {
    const peer = chat.otherParticipant;
    const isDirect = !chat.isGroup && !chat.isChannel;
    const avatar = chat.avatar || peer?.profilePicture || null;
      return {
        _id: chat.chatId,
        peerId: isDirect ? peer?._id : undefined,
        firstName: isDirect ? peer?.firstName : undefined,
        lastName: isDirect ? peer?.lastName : undefined,
        name: chat.name || null,
        avatar: this.getAvatarUrl(avatar),
        isGroup: chat.isGroup,
        isChannel: chat.isChannel,
        isOwner: chat.ownerId === this.authService.getUserId(),
        ownerId: chat.ownerId,
        participants: chat.participants,
        lastMessage: chat.lastMessage,
        messageCount: chat.unreadCount,
        updatedAt: chat.updatedAt,
        isOnline: isDirect ? peer?.isOnline : undefined,
        lastSeen: isDirect ? peer?.lastSeen : undefined,
      } as ChatListItem;
  }

  private async resolveAvatar(item: ChatListItem): Promise<string | null> {
    if (item.avatar) return item.avatar;
    if (item.isGroup || item.isChannel) {
      return null;
    }
    const peerId = item.peerId;
    if (!peerId) return null;
    const avatar = await this.getAvatar(peerId);
    return avatar || null;
  }

  isAgentChat(chat: ChatListItem): boolean {
    if (!this.botUserId || !chat) return false;
    return !chat.isGroup && !chat.isChannel && chat.peerId === this.botUserId;
  }

  /** 1:1 from a peer (search result). */
  async startDirectChat(peer: any): Promise<ChatListItem> {
    const res: any = await firstValueFrom(
      this.httpRequestService
        .post('chat', { type: 'direct', peerId: peer._id })
        .pipe(take(1))
    );
    const chatItem = this.findChatById(res.chatId || res._id);
    if (!chatItem) {
      const item: ChatListItem = this.mapChatItem({
        chatId: res.chatId || res._id,
        isGroup: false,
        isChannel: false,
        otherParticipant: { _id: peer._id, firstName: peer.firstName, lastName: peer.lastName, profilePicture: peer.profilePicture },
        participants: [{ _id: peer._id }],
        lastMessage: null,
      });
      this.chatItems.unshift(item);
      return item;
    }
    return chatItem;
  }

  async createGroup(name: string, memberIds: string[]): Promise<ChatListItem> {
    const res: any = await firstValueFrom(
      this.httpRequestService.post('chat', { type: 'group', name, memberIds }).pipe(take(1))
    );
    const item = this.mapChatItem({
      chatId: res.chatId || res._id,
      isGroup: true,
      isChannel: false,
      name: res.name,
      ownerId: res.owner,
      participants: (res.participants || []).map((p: any) => ({ _id: p })),
      lastMessage: null,
    });
    this.refreshItem(item);
    return item;
  }

  async createChannel(name: string): Promise<ChatListItem> {
    const res: any = await firstValueFrom(
      this.httpRequestService.post('chat', { type: 'channel', name }).pipe(take(1))
    );
    const item = this.mapChatItem({
      chatId: res.chatId || res._id,
      isGroup: false,
      isChannel: true,
      name: res.name,
      ownerId: res.owner,
      participants: (res.participants || []).map((p: any) => ({ _id: p })),
      lastMessage: null,
    });
    this.refreshItem(item);
    return item;
  }

  private refreshItem(item: ChatListItem) {
    const existing = this.findChatById(item._id as string);
    if (existing) {
      Object.assign(existing, item);
    } else {
      this.chatItems.unshift(item);
    }
  }

  findChatById(chatId: string): ChatListItem | undefined {
    return this.chatItems.find((x) => x._id === chatId);
  }

  visibleChats(): ChatListItem[] {
    if (this.chatFilter === 'groups') return this.chatItems.filter((c) => c.isGroup);
    if (this.chatFilter === 'channels') return this.chatItems.filter((c) => c.isChannel);
    return this.chatItems;
  }

  setChatFilter(filter: 'all' | 'groups' | 'channels') {
    this.chatFilter = filter;
  }

  openChat(chatItem: ChatListItem) {
    if (this.currentChat?._id === chatItem._id) return;
    this.currentChat = chatItem;
    this.currentPage = 1;
    this.totalPages = 1;
    this.chatOpenedSubject.next();
    this.chatItems.forEach((item) => {
      if (item._id === chatItem._id) item.messageCount = 0;
    });
    this.loadingMessages = true;
    this.loadMessages().pipe(take(1)).subscribe({
      next: () => {
        this.loadingMessages = false;
        this.messagesLoadedSubject.next();
        this.scrollChatToBottom();
      },
      error: () => {
        this.loadingMessages = false;
      },
    });
  }

  openAgentChat() {
    if (!this.botUserId) return this.loadAgentStatus();
    this.ensureBotChat().then(() => {
      const chatItem = this.findChatById(this.botChatId);
      if (!chatItem) return;
      this.openChat(chatItem);
    });
  }

  private async ensureBotChat(): Promise<void> {
    const existing = this.findChatById(this.botChatId);
    if (existing) return;
    try {
      const res: any = await firstValueFrom(
        this.httpRequestService
          .post('chat', { type: 'direct', peerId: this.botUserId })
          .pipe(take(1))
      );
      this.botChatId = res.chatId || res._id;
      const item: ChatListItem = {
        _id: this.botChatId,
        peerId: this.botUserId,
        firstName: this.botFirstName,
        lastName: this.botLastName,
        lastMessage: null,
        messageCount: 0,
        messages: [],
        avatar: null,
      };
      this.chatItems.unshift(item);
      this.getChatList();
    } catch (e) {
      console.error('Could not open agent chat', e);
      this.snackbar.error('خطا در باز کردن چت دستیار', 3000);
    }
  }

  listenToMessages() {
    if (this.messagesSubscription) return;
    this.messagesSubscription = this.socketService
      .receiveMessages()
      .subscribe((payload: { chatId: string; message: Message }) => {
        this.zone.run(() => {
          const chatItem = this.findChatById(payload.chatId);
          if (!chatItem) {
            this.getChatList();
            return;
          }
          const msg = payload.message;
          if (msg.sender) {
            const sender = typeof msg.sender === 'object' ? msg.sender : { _id: msg.senderId };
            msg.sender = sender;
            msg.senderId = sender?._id?.toString();
          }
          chatItem.messages = chatItem.messages || [];
          const pendingIdx = chatItem.messages.findIndex((m) => m._pending === true);
          if (pendingIdx !== -1) {
            chatItem.messages.splice(pendingIdx, 1);
          }
          chatItem.messages.push(msg);
          chatItem.lastMessage = msg;
          chatItem.updatedAt = new Date(msg.createdAt);
          if (this.currentChat?._id === chatItem._id) {
            chatItem.messageCount = 0;
            this.scrollChatToBottom();
          } else {
            chatItem.messageCount = (chatItem.messageCount || 0) + 1;
          }

          if (msg.senderId !== this.authService.getUserId() && msg.status !== 'delivered') {
            this.socketService.emit('messageDelivered', { messageId: msg._id });
          }
        });
      });

    this.socketService.on('messageSent', (payload: { chatId: string; message: Message }) => {
      this.zone.run(() => {
        const chatItem = this.findChatById(payload.chatId);
        if (!chatItem) return;
        const msg = payload.message;
        chatItem.messages = chatItem.messages || [];
        const pendingIdx = chatItem.messages.findIndex((m) => m._pending === true);
        if (pendingIdx !== -1) chatItem.messages.splice(pendingIdx, 1);
        const exists = chatItem.messages.some((m) => m._id === msg._id);
        if (!exists) {
          chatItem.messages.push(msg);
          chatItem.lastMessage = msg;
        }
      });
    });

    this.socketService.on('notification', (payload: { chatId: string; message: Message; senderId: string; senderName: string }) => {
      this.zone.run(() => {
        const isCurrentChat = this.currentChat?._id === payload.chatId;
        if (isCurrentChat) return;

        const chatItem = this.findChatById(payload.chatId);
        if (chatItem) {
          chatItem.messageCount = (chatItem.messageCount || 0) + 1;
          this.refreshItem(chatItem);
        }

        const msg = payload.message;
        const senderName = payload.senderName || 'Unknown';
        const content = msg.content?.substring(0, 50) || (msg.mediaType ? `[${msg.mediaType}]` : 'New message');
        const truncated = content.length >= 50 ? '...' : '';
        this.snackbar.show(`${senderName}: ${content}${truncated}`, 'info', 5000);
      });
    });

    this.socketService.on('messageStatusUpdated', (payload: { messageId: string; status: string; userId: string }) => {
      this.zone.run(() => {
        this.chatItems.forEach((chatItem) => {
          chatItem.messages = chatItem.messages || [];
          const msg = chatItem.messages.find((m) => m._id === payload.messageId);
          if (msg) {
            msg.status = payload.status as 'sent' | 'delivered' | 'read';
            if (payload.status === 'read') {
              msg.read = true;
              msg.readAt = new Date();
            } else if (payload.status === 'delivered') {
              msg.deliveredAt = new Date();
            }
          }
        });
        if (this.currentChat) {
          this.currentChat.messages = this.currentChat.messages || [];
          const msg = this.currentChat.messages.find((m) => m._id === payload.messageId);
          if (msg) {
            msg.status = payload.status as 'sent' | 'delivered' | 'read';
            if (payload.status === 'read') {
              msg.read = true;
              msg.readAt = new Date();
            } else if (payload.status === 'delivered') {
              msg.deliveredAt = new Date();
            }
          }
        }
      });
    });

    this.socketService.on('messageEdited', (payload: { messageId: string; message: Message }) => {
      this.zone.run(() => {
        this.chatItems.forEach((chatItem) => {
          chatItem.messages = chatItem.messages || [];
          const idx = chatItem.messages.findIndex((m) => m._id === payload.messageId);
          if (idx !== -1) {
            chatItem.messages[idx] = payload.message;
            if (this.currentChat?._id === chatItem._id) {
              this.currentChat.messages = this.currentChat.messages || [];
              const cIdx = this.currentChat.messages.findIndex((m) => m._id === payload.messageId);
              if (cIdx !== -1) {
                this.currentChat.messages[cIdx] = payload.message;
              }
            }
          }
        });
      });
    });

    this.socketService.on('messageDeleted', (payload: { messageId: string }) => {
      this.zone.run(() => {
        this.chatItems.forEach((chatItem) => {
          chatItem.messages = chatItem.messages || [];
          const idx = chatItem.messages.findIndex((m) => m._id === payload.messageId);
          if (idx !== -1) {
            chatItem.messages[idx].isDeleted = true;
            chatItem.messages[idx].content = 'این پیام حذف شد';
            if (this.currentChat?._id === chatItem._id) {
              this.currentChat.messages = this.currentChat.messages || [];
              const cIdx = this.currentChat.messages.findIndex((m) => m._id === payload.messageId);
              if (cIdx !== -1) {
                this.currentChat.messages[cIdx].isDeleted = true;
                this.currentChat.messages[cIdx].content = 'این پیام حذف شد';
              }
            }
          }
        });
      });
    });

    this.socketService.on('messageReactionUpdated', (payload: { messageId: string; reactions: any[] }) => {
      this.zone.run(() => {
        this.chatItems.forEach((chatItem) => {
          chatItem.messages = chatItem.messages || [];
          const msg = chatItem.messages.find((m) => m._id === payload.messageId);
          if (msg) {
            msg.reactions = payload.reactions;
            if (this.currentChat?._id === chatItem._id) {
              this.currentChat.messages = this.currentChat.messages || [];
              const cIdx = this.currentChat.messages.findIndex((m) => m._id === payload.messageId);
              if (cIdx !== -1) {
                this.currentChat.messages[cIdx].reactions = payload.reactions;
              }
            }
          }
        });
      });
    });

  this.socketService.on('typingStatus', (payload: { chatId: string; userId: string; userName: string; isTyping: boolean }) => {
      this.zone.run(() => {
        const current = new Map<string, string[]>(this.typingUsersSubject.value as Iterable<readonly [string, string[]]>);
        const chatUsers: string[] = current.get(payload.chatId) || [];
        if (payload.isTyping) {
          if (!chatUsers.includes(payload.userId)) {
            chatUsers.push(payload.userId);
          }
        } else {
          const idx = chatUsers.indexOf(payload.userId);
          if (idx !== -1) chatUsers.splice(idx, 1);
        }
        current.set(payload.chatId, chatUsers);
        this.typingUsersSubject.next(current);
      });
    });

    this.socketService.on('chatDeleted', (payload: { chatId: string; userId: string }) => {
      this.zone.run(() => {
        this.chatItems = this.chatItems.filter((item) => item._id !== payload.chatId);
        if (this.currentChat?._id === payload.chatId) {
          this.closeCurrentChat();
        }
      });
    });

    this.socketService.on('chatLeft', (payload: { chatId: string; userId: string }) => {
      this.zone.run(() => {
        this.chatItems = this.chatItems.filter((item) => item._id !== payload.chatId);
        if (this.currentChat?._id === payload.chatId) {
          this.closeCurrentChat();
        }
      });
    });
  }

  stopListening() {
    this.messagesSubscription?.unsubscribe();
    this.messagesSubscription = null;
    this.typingTimeouts.forEach((t) => clearTimeout(t));
    this.typingTimeouts.clear();
  }

  sendTypingStart(chatId: string) {
    this.socketService.emit('typingStart', { chatId });
    this.scheduleTypingStop(chatId);
  }

  private scheduleTypingStop(chatId: string) {
    const existing = this.typingTimeouts.get(chatId);
    if (existing) clearTimeout(existing);
    const timeout = setTimeout(() => {
      this.socketService.emit('typingStop', { chatId });
      this.typingTimeouts.delete(chatId);
    }, 2000);
    this.typingTimeouts.set(chatId, timeout);
  }

  getTypingUsers(chatId: string): string[] {
    return this.typingUsersSubject.value.get(chatId) || [];
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

  getAgentHistory(): Observable<any> {
    return this.httpRequestService.get('agent/history');
  }

  openAgentHistoryChat() {
    if (!this.botUserId) return this.loadAgentStatus();
    this.ensureBotChat().then(() => {
      const chatItem = this.findChatById(this.botChatId);
      if (chatItem) this.openChat(chatItem);
    });
  }

  listenToAgentEvents() {
    const emit = (type: string, data: any) => {
      const event: any = { type, data };
      this.handleAgentEvent(event);
    };
    this.socketService.onAgentEvent('agentStart', () => emit('start', {}));
    this.socketService.onAgentEvent('agentChunk', (data: { chunk: string }) => emit('chunk', data));
    this.socketService.onAgentEvent('agentToolCall', (data: { name: string; arguments: any }) => emit('toolCall', data));
    this.socketService.onAgentEvent('agentToolResult', (data: any) => emit('toolResult', data));
    this.socketService.onAgentEvent('agentDone', () => emit('done', {}));
    this.socketService.onAgentEvent('agentSaved', (data: { messageId: string; chatId: string }) => emit('saved', data));
    this.socketService.onAgentEvent('agentNotice', (data: { message: string }) => emit('notice', data));
    this.socketService.onAgentEvent('agentError', (data: { message: string }) => emit('error', data));
  }

  private handleAgentEvent(event: any) {
    this.zone.run(() => {
      const userId = this.authService.getUserId();
      switch (event.type) {
        case 'start':
          this.agentWorking = true;
          this.agentStreamingMessage = {
            _id: null,
            content: '',
            sender: { _id: this.botUserId, firstName: this.botFirstName, lastName: this.botLastName },
            receiver: userId,
            avatar: null,
            createdAt: new Date(),
            isStreaming: true,
            toolCalls: [],
          } as Message;
          this.ensureBotChatId();
          if (this.botChatId) {
            const chatItem = this.findChatById(this.botChatId);
            chatItem?.messages?.push(this.agentStreamingMessage as any);
            if (!chatItem) this.getChatList();
          }
          break;
        case 'chunk':
          if (this.agentStreamingMessage) {
            this.agentStreamingMessage.content += event.data.chunk;
            this.scrollChatToBottom();
          }
          break;
        case 'toolCall':
          if (this.agentStreamingMessage) {
            (this.agentStreamingMessage as any).toolCalls.push({
              name: event.data.name,
              arguments: event.data.arguments,
            });
            this.scrollChatToBottom();
          }
          break;
        case 'saved':
          if (this.agentStreamingMessage) {
            this.agentStreamingMessage._id = event.data.messageId;
            (this.agentStreamingMessage as any).isStreaming = false;
            const chatItem = this.findChatById(this.botChatId);
            if (chatItem) chatItem.lastMessage = this.agentStreamingMessage;
          }
          this.agentStreamingMessage = null;
          this.agentWorking = false;
          this.scrollChatToBottom();
          break;
        case 'error':
          if (this.agentStreamingMessage) {
            this.agentStreamingMessage.content = event.data.message || 'خطا در دستیار هوشمند';
            (this.agentStreamingMessage as any).isStreaming = false;
          }
          this.agentStreamingMessage = null;
          this.agentWorking = false;
          break;
        case 'done':
          this.agentWorking = false;
          break;
      }
    });
  }

  private ensureBotChatId() {
    if (!this.botChatId) {
      const chatItem = this.chatItems.find(
        (x) => !x.isGroup && !x.isChannel && x.peerId === this.botUserId
      );
      if (chatItem) this.botChatId = chatItem._id;
    }
  }

  sendAgentMessage(content: string) {
    if (!content?.trim()) return;
    this.ensureBotChatId();
    if (!this.botChatId) {
      this.openAgentChat();
      return;
    }
    const chatItem = this.findChatById(this.botChatId);
    if (!chatItem) return;
    this.currentChat = chatItem;
    const userMessage: Message = {
      _id: null,
      sender: { _id: this.authService.getUserId(), firstName: this.authService.getFirstName(), lastName: this.authService.getLastName() },
      receiver: this.botUserId,
      content: content.trim(),
      avatar: this.pictureSrc,
      createdAt: new Date(),
    };
    chatItem.messages = chatItem.messages || [];
    chatItem.messages.push(userMessage);
    chatItem.lastMessage = userMessage;
    this.socketService.sendAgentMessage({ content: content.trim(), chatId: this.botChatId });
    this.scrollChatToBottom();
  }

  private saveAvatar() {
    if (!this.file) return;
    const formData = new FormData();
    formData.append('avatar', this.file);
    this.httpRequestService
      .post('user/upload-avatar', formData)
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          if (res?.avatar) {
            this.pictureSrc = `${environment.uploadUrl}/${res.avatar}`;
            localStorage.setItem('user-avatar', this.pictureSrc);
          }
        },
        error: (err) => this.snackbar.error('خطا در ذخیره آواتار', 3000),
      });
  }

  agentQuickAction(action: 'summarize' | 'tasks' | 'reply') {
    const chat = this.currentChat;
    const withName = chat ? `${chat.firstName ?? ''} ${chat.lastName ?? ''}`.trim() : '';
    const groupName = chat?.name;
    const subject = withName || groupName || 'این گفتگو';
    const prompts = {
      summarize: `گفتگو من در "${subject}" را خلاصه کن`,
      tasks: `از پیام‌های "${subject}" تسک‌های عملیاتی استخراج کن`,
      reply: `برای آخرین پیام "${subject}" یک پیشنهاد پاسخ کوتاه بنویس`,
    };
    this.sendAgentMessage(prompts[action]);
  }

  private scrollChatToBottom() {
    setTimeout(() => {
      const messagesDiv = document.querySelector('.chat-messages') as HTMLElement | null;
      if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    }, 100);
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
            error: (err) => this.snackbar.error('خطا در به‌روزرسانی پروفایل', 3000),
          });

        if (this.file) this.saveAvatar();
      });
  }

  openCreateChat(): void {
    this.dialog.open(CreateChatComponent, { width: '420px', panelClass: 'rtl-dialog' });
  }

  showContacts() {
    const dialogRef = this.dialog.open(ContactsComponent, { width: '360px', panelClass: 'rtl-dialog' });
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result: any) => {
        if (result?.startChat) this.startDirectChat(result.startChat).then((item) => this.openChat(item));
      });
  }

  closeCurrentChat() {
    this.currentChat = null;
    this.agentStreamingMessage = null;
    this.agentWorking = false;
  }

  logout() {
    this.authService.logout();
  }

  search(query: string): Observable<any[]> {
    return this.httpRequestService.get('search?query=' + encodeURIComponent(query));
  }

  getContacts(): Observable<any[]> {
    return this.httpRequestService.get('user/contacts');
  }

  addContact(contactId: string): Observable<any> {
    return this.httpRequestService.post(`user/contacts/${contactId}`, {});
  }

  removeContact(contactId: string): Observable<any> {
    return this.httpRequestService.delete('user/contacts', contactId);
  }

  editMessage(messageId: string, content: string): Observable<any> {
    return this.httpRequestService.put('message', messageId, { content });
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.httpRequestService.delete('message', messageId);
  }

  sendMedia(chatId: string, file: File, content: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    formData.append('content', content);
    return this.httpRequestService.postFile('message/media', formData);
  }

  addReaction(messageId: string, emoji: string): Observable<any> {
    return this.httpRequestService.post(`message/${messageId}/reaction`, { emoji });
  }

  removeReaction(messageId: string): Observable<any> {
    return this.httpRequestService.delete(`message/${messageId}/reaction`);
  }

  getReactions(messageId: string): Observable<any> {
    return this.httpRequestService.get(`message/${messageId}/reactions`);
  }

  sendMessage(currentChat: ChatListItem, input: HTMLTextAreaElement) {
    const content = input.value?.trim();
    if (!content) return;

    if (this.isAgentChatSync(currentChat)) {
      input.value = '';
      this.sendAgentMessage(content);
      return;
    }

const messageData: Message = {
      _id: null,
      _pending: true,
      status: 'sent',
      senderId: this.authService.getUserId(),
      sender: {
        _id: this.authService.getUserId(),
        firstName: this.authService.getFirstName(),
        lastName: this.authService.getLastName(),
      },
      receiver: currentChat.peerId,
      content,
      avatar: this.pictureSrc,
      createdAt: new Date(),
    };
    const chatId = currentChat._id as string;
    this.socketService.sendMessage({ chatId, content });

    currentChat.messages = currentChat.messages || [];
    currentChat.messages.push(messageData);
    currentChat.lastMessage = messageData;
    input.value = '';
    this.refreshItem(currentChat);
    this.scrollChatToBottom();
  }

  getMessages(chatId: string, page: number = 1, limit: number = 20): Observable<any> {
    const params = new HttpParams().set('chatId', chatId).set('page', String(page)).set('limit', String(limit));
    return this.httpRequestService.get('message', null, params).pipe(take(1));
  }

  loadMessages(page: number = 1) {
    return this.getMessages(this.currentChat._id as string, page).pipe(
      tap((response: { messages: Message[]; totalMessages: number; currentPage: number; totalPages: number }) => {
        if (!this.currentChat) return;
        const serverMessages = response.messages || [];
        if (response.currentPage <= 1) {
          // Server is source of truth for first page; keep local pending messages on top
          const pending = (this.currentChat.messages || []).filter((m) => m._pending);
          this.currentChat.messages = [...serverMessages.reverse(), ...pending];
        } else {
          // Prepend older messages from server, avoiding duplicates
          const existingIds = new Set((this.currentChat.messages || []).map((m) => m._id));
          const serverNew = serverMessages.filter((m) => !existingIds.has(m._id));
          this.currentChat.messages = [...serverNew.reverse(), ...(this.currentChat.messages || [])];
        }
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
        if (response.currentPage <= 1) {
          this.messagesLoadedSubject.next();
        }
      })
    );
  }

  async getAvatar(userId: string): Promise<string | null> {
    if (!userId) return null;
    const avatar = await this.cacheService.getItem('avatars', userId);
    if (avatar?.avatar) return 'data:image/jpeg;base64,' + avatar.avatar;
    return firstValueFrom(
      this.httpRequestService.get(`user/${userId}/avatar`).pipe(
        take(1),
        tap((res) => {
          if (res.avatar) {
            this.cacheService.setItem('avatars', { id: userId, avatar: res.avatar });
          }
        }),
        map((res) => (res?.avatar ? 'data:image/jpeg;base64,' + res.avatar : null)),
        catchError(() => of(null))
      )
    );
  }

  getAvatarUrl(avatar?: string | null): string | null {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) return avatar;
    if (avatar.startsWith('/uploads/')) {
      const base = environment.apiUrl.replace('/v1', '');
      return `${base}${avatar}`;
    }
    if (avatar.startsWith('/')) return `${environment.uploadUrl}${avatar}`;
    return `${environment.uploadUrl}/${avatar}`;
  }

  isAgentChatSync(chat: ChatListItem): boolean {
    return !!chat && !!this.botUserId && !chat.isGroup && !chat.isChannel && chat.peerId === this.botUserId;
  }

  deleteChat(chatId: string): Observable<any> {
    return this.httpRequestService.delete(`chat/${chatId}/delete`);
  }

  leaveChat(chatId: string): Observable<any> {
    return this.httpRequestService.post(`chat/${chatId}/leave`, {});
  }

  getNotificationSettings(): Observable<any> {
    return this.httpRequestService.get('user/notifications');
  }

  updateNotificationSettings(enabled: boolean): Observable<any> {
    return this.httpRequestService.post('user/notifications', { enabled });
  }
}
