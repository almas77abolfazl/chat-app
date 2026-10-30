import { Inject, Injectable, NgZone, signal, computed } from '@angular/core';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { SettingsComponent } from './settings/settings.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { ContactsComponent } from './contacts/contacts.component';
import { CreateChatComponent } from './create-chat/create-chat.component';
import { HttpRequestService } from '../helpers/http-request.service';
import { BehaviorSubject, firstValueFrom, map, Observable, of, Subject, take, tap, catchError } from 'rxjs';
import { AdminPermissions, ChatAdmin, ChatListItem, ChatParticipant } from '../models/chat-list-item.model';
import { StoryGroup } from '../models/story.model';
import { SocketService } from './socket.service';
import { HttpParams } from '@angular/common/http';
import { Message } from '../models/message.model';
import { CacheService } from '../helpers/cache.service';
import { environment } from '../../environments/environment';
import { SnackbarService } from '../helpers/snackbar/snackbar.service';

@Injectable({ providedIn: 'root' })
export class MainService {
  readonly currentChatSignal = signal<ChatListItem | null>(null);
  get currentChat(): ChatListItem | null {
    return this.currentChatSignal();
  }
  set currentChat(value: ChatListItem | null) {
    this.currentChatSignal.set(value);
  }

  readonly chatItemsSignal = signal<ChatListItem[]>([]);
  get chatItems(): ChatListItem[] {
    return this.chatItemsSignal();
  }
  set chatItems(value: ChatListItem[]) {
    this.chatItemsSignal.set(value);
  }

  readonly chatFilterSignal = signal<'all' | 'direct' | 'groups' | 'channels' | 'bots'>('all');
  get chatFilter(): 'all' | 'direct' | 'groups' | 'channels' | 'bots' {
    return this.chatFilterSignal();
  }
  set chatFilter(value: 'all' | 'direct' | 'groups' | 'channels' | 'bots') {
    this.chatFilterSignal.set(value);
  }

  readonly storiesSignal = signal<StoryGroup[]>([]);
  get stories(): StoryGroup[] {
    return this.storiesSignal();
  }
  set stories(value: StoryGroup[]) {
    this.storiesSignal.set(value);
  }

  readonly currentPageSignal = signal<number>(1);
  get currentPage(): number {
    return this.currentPageSignal();
  }
  set currentPage(v: number) {
    this.currentPageSignal.set(v);
  }

  readonly totalPagesSignal = signal<number>(1);
  get totalPages(): number {
    return this.totalPagesSignal();
  }
  set totalPages(v: number) {
    this.totalPagesSignal.set(v);
  }

  readonly loadingMessagesSignal = signal<boolean>(false);
  get loadingMessages(): boolean {
    return this.loadingMessagesSignal();
  }
  set loadingMessages(v: boolean) {
    this.loadingMessagesSignal.set(v);
  }

  readonly pictureSrcSignal = signal<string>('');
  get pictureSrc(): string {
    return this.pictureSrcSignal();
  }
  set pictureSrc(v: string) {
    this.pictureSrcSignal.set(v);
  }

  readonly agentConfiguredSignal = signal<boolean>(false);
  get agentConfigured(): boolean {
    return this.agentConfiguredSignal();
  }
  set agentConfigured(v: boolean) {
    this.agentConfiguredSignal.set(v);
  }

  readonly botUserIdSignal = signal<string | null>(null);
  get botUserId(): string | null {
    return this.botUserIdSignal();
  }
  set botUserId(v: string | null) {
    this.botUserIdSignal.set(v);
  }

  readonly botChatIdSignal = signal<string | null>(null);
  get botChatId(): string | null {
    return this.botChatIdSignal();
  }
  set botChatId(v: string | null) {
    this.botChatIdSignal.set(v);
  }

  readonly botFirstNameSignal = signal<string>('دستیار');
  get botFirstName(): string {
    return this.botFirstNameSignal();
  }
  set botFirstName(v: string) {
    this.botFirstNameSignal.set(v);
  }

  readonly botLastNameSignal = signal<string>('هوشمند');
  get botLastName(): string {
    return this.botLastNameSignal();
  }
  set botLastName(v: string) {
    this.botLastNameSignal.set(v);
  }

  readonly agentWorkingSignal = signal<boolean>(false);
  get agentWorking(): boolean {
    return this.agentWorkingSignal();
  }
  set agentWorking(v: boolean) {
    this.agentWorkingSignal.set(v);
  }

  readonly agentStreamingMessageSignal = signal<Message | null>(null);
  get agentStreamingMessage(): Message | null {
    return this.agentStreamingMessageSignal();
  }
  set agentStreamingMessage(v: Message | null) {
    this.agentStreamingMessageSignal.set(v);
  }

  readonly filteredChatItems = computed(() => {
    const filter = this.chatFilterSignal();
    const items = this.chatItemsSignal();
    if (filter === 'all') return items;
    return items.filter((item) => {
      if (filter === 'direct') return !item.isGroup && !item.isChannel && !item.isSavedMessages;
      if (filter === 'groups') return !!item.isGroup;
      if (filter === 'channels') return !!item.isChannel;
      if (filter === 'bots') return item._id === this.botChatIdSignal();
      return true;
    });
  });

  private chatOpenedSubject = new BehaviorSubject<void>(null);
  chatOpened$ = this.chatOpenedSubject.asObservable();
  private chatListUpdatedSubject = new Subject<ChatListItem[]>();
  chatListUpdated$ = this.chatListUpdatedSubject.asObservable();
  private messagesLoadedSubject = new Subject<void>();
  messagesLoaded$ = this.messagesLoadedSubject.asObservable();

  file: any;

  private messagesSubscription: any;
  private typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>;
  private typingUsersSubject = new BehaviorSubject<Map<string, string[]>>(new Map());
  typingUsers$ = this.typingUsersSubject.asObservable();

  constructor(
    public authService: AuthService,
    public httpRequestService: HttpRequestService,
    private dialog: MatDialog,
    public socketService: SocketService,
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
      .subscribe({
        next: (response: any[]) => {
          this.chatItems = (response || []).map((chat) => this.mapChatItem(chat));
          this.chatListUpdatedSubject.next(this.chatItems);
          this.chatItems.forEach(async (item) => {
            item.avatar = await this.resolveAvatar(item);
            if (await this.isAgentChat(item)) {
              item.avatar = null;
            }
            this.chatListUpdatedSubject.next(this.chatItems);
          });
        },
        error: (error) => this.snackbar.error('خطا در بارگذاری لیست چت', 5000),
      });
  }

  private mapChatItem(chat: any): ChatListItem {
    const peer = chat.otherParticipant;
    const isDirect = !chat.isGroup && !chat.isChannel && !chat.isSavedMessages;
    const avatar = chat.avatar || peer?.profilePicture || null;
    const chatId = (chat.chatId || chat._id)?.toString();
    return {
      _id: chatId,
      peerId: isDirect ? peer?._id : (chat.isSavedMessages ? this.authService.getUserId() : undefined),
      firstName: isDirect ? peer?.firstName : undefined,
      lastName: isDirect ? peer?.lastName : undefined,
      name: chat.isSavedMessages ? 'Saved Messages' : (chat.name || null),
      avatar: this.getAvatarUrl(avatar),
      isGroup: chat.isGroup,
      isChannel: chat.isChannel,
      isSavedMessages: !!chat.isSavedMessages,
      isOwner: chat.ownerId === this.authService.getUserId(),
      ownerId: chat.ownerId,
      admins: chat.admins || [],
      participants: chat.participants,
      lastMessage: chat.lastMessage,
      pinnedMessage: chat.pinnedMessage || null,
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

  /** 1:1 from a peer (search result). Creates a draft without saving to DB until a message is sent. */
  async startDirectChat(peer: any): Promise<ChatListItem> {
    const existing = this.chatItems.find(
      (c) => !c.isGroup && !c.isChannel && !c.isSavedMessages && c.peerId === peer._id
    );
    if (existing) {
      return existing;
    }
    const draftItem: ChatListItem = this.mapChatItem({
      chatId: 'draft_' + peer._id,
      isGroup: false,
      isChannel: false,
      isDraft: true,
      otherParticipant: {
        _id: peer._id,
        firstName: peer.firstName,
        lastName: peer.lastName,
        profilePicture: peer.profilePicture,
      },
      participants: [{ _id: peer._id }],
      lastMessage: null,
    });
    draftItem.peerId = peer._id;
    draftItem.isDraft = true;
    return draftItem;
  }

  async ensureRealDirectChat(peerId: string): Promise<ChatListItem> {
    const res: any = await firstValueFrom(
      this.httpRequestService
        .post('chat', { type: 'direct', peerId })
        .pipe(take(1))
    );
    const realId = res.chatId || res._id;
    let chatItem = this.findChatById(realId);
    if (!chatItem) {
      chatItem = this.mapChatItem({
        chatId: realId,
        isGroup: false,
        isChannel: false,
        otherParticipant: res.otherParticipant || { _id: peerId },
        participants: res.participants || [{ _id: peerId }],
        lastMessage: null,
      });
      this.chatItems.unshift(chatItem);
      this.chatItemsSignal.set([...this.chatItems]);
      this.chatListUpdatedSubject.next(this.chatItems);
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

  refreshItem(item: ChatListItem) {
    const existing = this.findChatById(item._id as string);
    if (existing) {
      Object.assign(existing, item);
      this.chatItemsSignal.set([...this.chatItems]);
    } else {
      this.chatItems.unshift(item);
      this.chatItemsSignal.set([...this.chatItems]);
    }
    if (this.currentChat?._id === item._id) {
      this.currentChatSignal.set(existing || item);
    }
  }

  findChatById(chatId: string): ChatListItem | undefined {
    return this.chatItems.find((x) => x._id === chatId);
  }

  visibleChats(): ChatListItem[] {
    const filter = this.chatFilterSignal();
    const items = this.chatItemsSignal();
    if (filter === 'direct') {
      return items.filter((c) => !c.isGroup && !c.isChannel && !c.isSavedMessages && !this.isAgentChatSync(c));
    }
    if (filter === 'groups') return items.filter((c) => c.isGroup);
    if (filter === 'channels') return items.filter((c) => c.isChannel);
    if (filter === 'bots') return items.filter((c) => this.isAgentChatSync(c));
    return items;
  }

  setChatFilter(filter: 'all' | 'direct' | 'groups' | 'channels' | 'bots') {
    this.chatFilter = filter;
  }

  getFolderUnreadCount(folder: string): number {
    let list: ChatListItem[] = [];
    if (folder === 'all') list = this.chatItems;
    else if (folder === 'direct') list = this.chatItems.filter((c) => !c.isGroup && !c.isChannel && !this.isAgentChatSync(c));
    else if (folder === 'groups') list = this.chatItems.filter((c) => c.isGroup);
    else if (folder === 'channels') list = this.chatItems.filter((c) => c.isChannel);
    else if (folder === 'bots') list = this.chatItems.filter((c) => this.isAgentChatSync(c));
    return list.reduce((acc, c) => acc + (c.messageCount || 0), 0);
  }

  async openSavedMessages(): Promise<ChatListItem> {
    const res: any = await firstValueFrom(
      this.httpRequestService.get('chat/saved-messages').pipe(take(1))
    );
    let item = this.findChatById(res.chatId || res._id);
    if (!item) {
      item = this.mapChatItem({
        chatId: res.chatId || res._id,
        isGroup: false,
        isChannel: false,
        isSavedMessages: true,
        name: 'Saved Messages',
        ownerId: this.authService.getUserId(),
        participants: [{ _id: this.authService.getUserId() }],
        lastMessage: null,
      });
      this.refreshItem(item);
    }
    this.openChat(item);
    return item;
  }

  openChat(chatItem: ChatListItem) {
    if (!chatItem) return;
    const chatId = (chatItem._id || (chatItem as any).chatId)?.toString();
    if (!chatId) return;

    if (this.currentChat?._id === chatId && (this.currentChat.messages?.length || 0) > 0 && !this.loadingMessages) {
      this.scrollChatToBottom();
      return;
    }

    this.currentChat = chatItem;
    this.currentChat._id = chatId;
    this.currentChat.messages = this.currentChat.messages || [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.chatOpenedSubject.next();
    this.chatItems.forEach((item) => {
      if (item._id === chatId) item.messageCount = 0;
    });
    this.chatListUpdatedSubject.next(this.chatItems);

    this.loadingMessages = true;
    this.loadMessages().pipe(take(1)).subscribe({
      next: () => {
        this.loadingMessages = false;
        this.messagesLoadedSubject.next();
        this.scrollChatToBottom();
      },
      error: () => {
        this.loadingMessages = false;
        this.messagesLoadedSubject.next();
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
            this.messagesLoadedSubject.next();
            this.scrollChatToBottom();
          } else {
            chatItem.messageCount = (chatItem.messageCount || 0) + 1;
          }
          const itemIdx = this.chatItems.findIndex((c) => c._id === chatItem._id);
          if (itemIdx !== -1) {
            this.chatItems.splice(itemIdx, 1);
          }
          this.chatItems.unshift(chatItem);
          this.chatItemsSignal.set([...this.chatItems]);
          this.chatListUpdatedSubject.next(this.chatItems);

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
          chatItem.updatedAt = new Date(msg.createdAt);
        }
        if (this.currentChat?._id === chatItem._id) {
          this.messagesLoadedSubject.next();
          this.scrollChatToBottom();
        }
        const itemIdx = this.chatItems.findIndex((c) => c._id === chatItem._id);
        if (itemIdx !== -1) {
          this.chatItems.splice(itemIdx, 1);
        }
        this.chatItems.unshift(chatItem);
        this.chatItemsSignal.set([...this.chatItems]);
        this.chatListUpdatedSubject.next(this.chatItems);
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

      this.socketService.on('messagePinned', (payload: { chatId: string; pinnedMessage: Message | null }) => {
      this.zone.run(() => {
        const chatItem = this.findChatById(payload.chatId);
        if (chatItem) {
          chatItem.pinnedMessage = payload.pinnedMessage;
        }
        if (this.currentChat?._id === payload.chatId) {
          this.currentChat.pinnedMessage = payload.pinnedMessage;
        }
        this.chatListUpdatedSubject.next(this.chatItems);
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
        this.chatListUpdatedSubject.next(this.chatItems);
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

  openSettingsModal(): void {
    this.dialog.open(SettingsComponent, {
      width: '460px',
      maxWidth: '95vw',
      panelClass: 'rtl-dialog',
    });
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

  resetState(): void {
    this.closeCurrentChat();
    this.currentChat = null;
    this.chatItems = [];
    this.chatItemsSignal.set([]);
    this.stories = [];
    this.pictureSrc = '';
    this.botChatId = null;
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
      this.messagesSubscription = null;
    }
    this.socketService.disconnect();
  }

  logout() {
    this.resetState();
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

  addContactByPhone(phoneNumber: string, firstName?: string, lastName?: string): Observable<any> {
    return this.httpRequestService.post('user/contacts/by-phone', { phoneNumber, firstName, lastName });
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

  deleteMessagesBulk(messageIds: string[]): Observable<any> {
    return this.httpRequestService.delete('message/bulk', undefined, undefined, { messageIds });
  }

  forwardMessages(messageIds: string[], targetChatId: string): Observable<any> {
    return this.httpRequestService.post('message/forward', { messageIds, targetChatId });
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

  async sendMessage(currentChat: ChatListItem, input: HTMLTextAreaElement) {
    const content = input.value?.trim();
    if (!content) return;

    if (this.isAgentChatSync(currentChat)) {
      input.value = '';
      this.sendAgentMessage(content);
      return;
    }

    if (currentChat.isDraft || String(currentChat._id).startsWith('draft_')) {
      const realChat = await this.ensureRealDirectChat(currentChat.peerId!);
      currentChat._id = realChat._id;
      currentChat.isDraft = false;
      this.currentChat = currentChat;
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
    currentChat.updatedAt = new Date();
    input.value = '';

    const itemIdx = this.chatItems.findIndex((c) => c._id === currentChat._id);
    if (itemIdx !== -1) {
      this.chatItems.splice(itemIdx, 1);
    }
    this.chatItems.unshift(currentChat);
    this.chatItemsSignal.set([...this.chatItems]);
    this.chatListUpdatedSubject.next(this.chatItems);
    this.scrollChatToBottom();
  }

  async sendSticker(currentChat: ChatListItem, stickerUrl: string, stickerName: string = 'Sticker') {
    if (!currentChat) return;
    if (currentChat.isDraft || String(currentChat._id).startsWith('draft_')) {
      const realChat = await this.ensureRealDirectChat(currentChat.peerId!);
      currentChat._id = realChat._id;
      currentChat.isDraft = false;
      this.currentChat = currentChat;
    }
    const chatId = currentChat._id as string;
    const media = {
      mediaType: 'sticker',
      fileUrl: stickerUrl,
      fileName: stickerName,
      fileSize: 0,
    };
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
      content: '',
      avatar: this.pictureSrc,
      mediaType: 'sticker',
      fileUrl: stickerUrl,
      fileName: stickerName,
      createdAt: new Date(),
    };
    this.socketService.sendMessage({ chatId, content: '', media });
    currentChat.messages = currentChat.messages || [];
    currentChat.messages.push(messageData);
    currentChat.lastMessage = messageData;
    currentChat.updatedAt = new Date();

    const itemIdx = this.chatItems.findIndex((c) => c._id === currentChat._id);
    if (itemIdx !== -1) {
      this.chatItems.splice(itemIdx, 1);
    }
    this.chatItems.unshift(currentChat);
    this.chatItemsSignal.set([...this.chatItems]);
    this.chatListUpdatedSubject.next(this.chatItems);
    this.scrollChatToBottom();
  }

  async sendGif(currentChat: ChatListItem, gifUrl: string, caption: string = '') {
    if (!currentChat) return;
    if (currentChat.isDraft || String(currentChat._id).startsWith('draft_')) {
      const realChat = await this.ensureRealDirectChat(currentChat.peerId!);
      currentChat._id = realChat._id;
      currentChat.isDraft = false;
      this.currentChat = currentChat;
    }
    const chatId = currentChat._id as string;
    const media = {
      mediaType: 'gif',
      fileUrl: gifUrl,
      fileName: 'animation.gif',
      fileSize: 0,
    };
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
      content: caption,
      avatar: this.pictureSrc,
      mediaType: 'gif',
      fileUrl: gifUrl,
      fileName: 'animation.gif',
      createdAt: new Date(),
    };
    this.socketService.sendMessage({ chatId, content: caption, media });
    currentChat.messages = currentChat.messages || [];
    currentChat.messages.push(messageData);
    currentChat.lastMessage = messageData;
    currentChat.updatedAt = new Date();

    const itemIdx = this.chatItems.findIndex((c) => c._id === currentChat._id);
    if (itemIdx !== -1) {
      this.chatItems.splice(itemIdx, 1);
    }
    this.chatItems.unshift(currentChat);
    this.chatItemsSignal.set([...this.chatItems]);
    this.chatListUpdatedSubject.next(this.chatItems);
    this.scrollChatToBottom();
  }

  getMessages(chatId: string, page: number = 1, limit: number = 20): Observable<any> {
    const params = new HttpParams().set('chatId', chatId).set('page', String(page)).set('limit', String(limit));
    return this.httpRequestService.get('message', null, params).pipe(take(1));
  }

  loadMessages(page: number = 1) {
    const chatId = this.currentChat?._id?.toString();
    if (!chatId || chatId.startsWith('draft_')) {
      if (this.currentChat) this.currentChat.messages = [];
      this.messagesLoadedSubject.next();
      return of({ messages: [], totalMessages: 0, currentPage: 1, totalPages: 1 });
    }
    return this.getMessages(chatId, page).pipe(
      tap((response: { messages: Message[]; totalMessages: number; currentPage: number; totalPages: number }) => {
        if (!this.currentChat || this.currentChat._id !== chatId) return;
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
    if (!avatar || avatar === 'undefined' || avatar === 'null') return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
      return avatar;
    }
    const clean = avatar.replace(/^[\/\\]+/, '');
    if (clean.startsWith('uploads/avatars/')) {
      const base = environment.apiUrl.replace('/v1', '');
      return `${base}/${clean}`;
    }
    if (clean.startsWith('uploads/')) {
      const base = environment.apiUrl.replace('/v1', '');
      return `${base}/${clean}`;
    }
    if (clean.startsWith('avatars/')) {
      return `${environment.uploadUrl}/${clean}`;
    }
    return `${environment.uploadUrl}/avatars/${clean}`;
  }

  getUserProfile(userId: string): Observable<any> {
    return this.httpRequestService.get(`user/${userId}/profile`);
  }

  getUserAvatars(userId: string): Observable<string[]> {
    return this.httpRequestService.get(`user/${userId}/avatars`);
  }

  deleteAvatar(filename: string): Observable<any> {
    return this.httpRequestService.delete(`user/avatar/${filename}`);
  }

  getChatMediaSummary(chatId: string): Observable<{
    photosCount: number;
    videosCount: number;
    filesCount: number;
    voiceCount: number;
  }> {
    return this.httpRequestService.get(`message/chat/${chatId}/media-summary`);
  }

  getChatMedia(
    chatId: string,
    type: string = 'media',
    page: number = 1,
    limit: number = 30
  ): Observable<{
    items: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.httpRequestService.get(`message/chat/${chatId}/media?type=${type}&page=${page}&limit=${limit}`);
  }

  uploadChatAvatar(chatId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.httpRequestService.post(`chat/${chatId}/avatar`, formData);
  }

  async openUserProfileModal(userId: string, chat?: any): Promise<void> {
    const { ProfileComponent } = await import('./profile/profile.component');
    this.dialog.open(ProfileComponent, {
      width: '480px',
      maxWidth: '96vw',
      panelClass: 'profile-dialog-panel',
      data: {
        targetUserId: userId,
        chat: chat,
      },
    });
  }

  isAgentChatSync(chat: ChatListItem): boolean {
    return !!chat && !!this.botUserId && !chat.isGroup && !chat.isChannel && chat.peerId === this.botUserId;
  }

  pinMessage(chatId: string, messageId: string) {
    this.socketService.emit('pinMessage', { chatId, messageId });
  }

  unpinMessage(chatId: string) {
    this.socketService.emit('unpinMessage', { chatId });
  }

  deleteChat(chatId: string, deleteForBoth: boolean = false): Observable<any> {
    return this.httpRequestService.delete(`chat/${chatId}/delete?deleteForBoth=${deleteForBoth}`);
  }

  clearChatHistory(chatId: string): Observable<any> {
    return this.httpRequestService.post(`chat/${chatId}/clear`, {});
  }

  leaveChat(chatId: string): Observable<any> {
    return this.httpRequestService.post(`chat/${chatId}/leave`, {});
  }

  addAdmin(chatId: string, targetUserId: string, permissions?: AdminPermissions, customTitle?: string): Observable<any> {
    return this.httpRequestService.post(`chat/${chatId}/admins`, { targetUserId, permissions, customTitle });
  }

  removeAdmin(chatId: string, targetUserId: string): Observable<any> {
    return this.httpRequestService.delete(`chat/${chatId}/admins/${targetUserId}`);
  }

  getAdmins(chatId: string): Observable<any[]> {
    return this.httpRequestService.get(`chat/${chatId}/admins`);
  }

  blockUser(targetUserId: string): Observable<any> {
    return this.httpRequestService.post(`user/block/${targetUserId}`, {});
  }

  unblockUser(targetUserId: string): Observable<any> {
    return this.httpRequestService.delete(`user/block/${targetUserId}`);
  }

  getBlockedUsers(): Observable<any[]> {
    return this.httpRequestService.get('user/blocked');
  }

  isUserBlocked(targetUserId: string): Observable<{ isBlocked: boolean }> {
    return this.httpRequestService.get(`user/is-blocked/${targetUserId}`);
  }

  get userProfile() {
    return {
      avatar: this.getAvatarUrl(this.pictureSrc) || this.pictureSrc || '',
      name: `${this.authService.getFirstName() || ''} ${this.authService.getLastName() || ''}`.trim() || 'کاربر',
    };
  }

  loadStories(): Observable<StoryGroup[]> {
    return this.httpRequestService.get('story/feed').pipe(
      map((stories: any[]) => {
        return (stories || []).map((sg) => ({
          ...sg,
          hasUnseen: sg.hasUnviewed,
          user: {
            ...sg.user,
            name: `${sg.user?.firstName || ''} ${sg.user?.lastName || ''}`.trim() || sg.user?.username || 'کاربر',
            avatar: this.getAvatarUrl(sg.user?.profilePicture) || '',
          },
          stories: (sg.stories || []).map((s: any) => ({
            ...s,
            mediaUrl: s.mediaType === 'image' && s.mediaUrl ? (this.getAvatarUrl(s.mediaUrl) || s.mediaUrl) : s.mediaUrl,
          })),
        }));
      }),
      tap((stories: StoryGroup[]) => {
        this.stories = stories || [];
      }),
      catchError(() => {
        this.stories = [];
        return of([]);
      }),
    );
  }

  createStory(formData: FormData): Observable<any> {
    return this.httpRequestService.postFile('story', formData).pipe(
      tap(() => this.loadStories().pipe(take(1)).subscribe()),
    );
  }

  viewStory(storyId: string): Observable<any> {
    return this.httpRequestService.post(`story/${storyId}/view`, {});
  }

  deleteStory(storyId: string): Observable<any> {
    return this.httpRequestService.delete(`story/${storyId}`).pipe(
      tap(() => this.loadStories().pipe(take(1)).subscribe()),
    );
  }

  getStoryViewers(storyId: string): Observable<any[]> {
    return this.httpRequestService.get(`story/${storyId}/viewers`);
  }

  getNotificationSettings(): Observable<any> {
    return this.httpRequestService.get('user/notifications');
  }

  updateNotificationSettings(enabled: boolean): Observable<any> {
    return this.httpRequestService.post('user/notifications', { enabled });
  }
}
