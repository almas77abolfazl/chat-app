import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { NgClass } from '@angular/common';
import { take, takeUntil } from 'rxjs';
import { Subscription, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from '../../profile/profile.component';
import { ContentPickerComponent } from './content-picker/content-picker.component';
import { Message } from '../../../models/message.model';
import { ChatListItem } from '../../../models/chat-list-item.model';
import { ChatBackgroundService, ChatBackground, CHAT_BACKGROUNDS } from '../../chat-background/chat-background.service';
import { I18nPipe } from '../../../helpers/i18n.pipe';
import { TranslationService } from '../../../helpers/translation.service';
import { environment } from '../../../../environments/environment';

export interface ContextMenuAction {
  label: string;
  icon: string;
  action: 'edit' | 'delete' | 'reply' | 'forward' | 'copy' | 'cancel' | 'pin';
  danger?: boolean;
}

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [FontAwesomeModule, NgClass, MatButtonModule, FormsModule, I18nPipe, ContentPickerComponent],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(
    public mainService: MainService,
    private dialog: MatDialog,
    public chatBgService: ChatBackgroundService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService
  ) {}
  showScrollBottom = false;
  private destroy$ = new Subject<void>();
  private typingSubscription: Subscription;
  typingUsers: string[] = [];
  editMessageId: string | null = null;
  editContent = '';
  brokenAvatars = new Set<string>();
  showBgSelector = false;
  showChatActions = false;
  showContentPicker = false;
  get showEmojiPicker(): boolean { return this.showContentPicker; }
  set showEmojiPicker(v: boolean) { this.showContentPicker = v; }
  showContextMenu = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuTarget: Message | null = null;
  bgOptions = CHAT_BACKGROUNDS;
  replyingToId: string | null = null;
  replyingToPreview = '';
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chatMessages') chatMessages!: ElementRef<HTMLElement>;
  @ViewChild('element') element!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('inChatSearchInput') inChatSearchInput?: ElementRef<HTMLInputElement>;
  userReactions: Map<string, string> = new Map();

  showInChatSearch = false;
  inChatSearchQuery = '';
  searchMatches: string[] = [];
  currentMatchIndex = -1;

  ngOnInit() {
    this.mainService.chatOpened$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeInChatSearch();
      this.markCurrentChatMessagesRead();
      this.replyingToId = null;
      this.cdr.markForCheck();
    });

    this.mainService.messagesLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.scrollToBottom();
      this.cdr.markForCheck();
    });

    this.typingSubscription = this.mainService.typingUsers$.subscribe((typingMap) => {
      const chatId = this.mainService.currentChat?._id;
      this.typingUsers = chatId ? typingMap.get(chatId) || [] : [];
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeContextMenu();
    this.showChatActions = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.showInChatSearch) {
      this.closeInChatSearch();
    }
    this.closeContextMenu();
    this.showContentPicker = false;
    this.showBgSelector = false;
    this.showChatActions = false;
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      if (this.mainService.currentChat) {
        event.preventDefault();
        this.showInChatSearch = true;
        setTimeout(() => {
          this.inChatSearchInput?.nativeElement?.select();
          this.inChatSearchInput?.nativeElement?.focus();
        }, 50);
        this.cdr.markForCheck();
      }
    }
  }

  scrollToBottom() {
    const el = this.chatMessages?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
      this.showScrollBottom = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.typingSubscription?.unsubscribe();
  }

  onTyping() {
    const chatId = this.mainService.currentChat?._id;
    if (chatId) {
      this.mainService.sendTypingStart(chatId);
    }
  }

  private markCurrentChatMessagesRead() {
    const chatId = this.mainService.currentChat?._id;
    if (!chatId) return;

    this.mainService.httpRequestService
      .post(`message/chat-read`, { chatId })
      .pipe(take(1))
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }

  ownId(): string {
    return this.mainService.authService.getUserId();
  }

  ownMessage(message: any): boolean {
    const senderId = typeof message?.sender === 'string' ? message.sender : message?.sender?._id ?? message?.senderId;
    return senderId?.toString() === this.ownId();
  }

  senderName(message: any): string {
    if (this.ownMessage(message)) return '';
    const s = message.sender || {};
    if (s.firstName || s.lastName) return `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
    return '';
  }

  headerName(chat: ChatListItem): string {
    if (!chat) return '';
    if (chat.isSavedMessages) return this.translationService.t('chat.savedMessages');
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    return `${chat.firstName ?? ''} ${chat.lastName ?? ''}`.trim();
  }

  headerSubtitle(chat: ChatListItem): string {
    if (!chat) return '';
    if (chat.isSavedMessages) return this.translationService.t('chat.cloudStorage');
    if (chat?.isChannel) return this.translationService.t('profile.publicChannel');
    if (chat?.isGroup) {
      const count = (chat.participants || []).length;
      return this.translationService.t('profile.membersCount', { count });
    }
    if (chat?.isOnline) return this.translationService.t('status.online');
    return '';
  }

  toggleInChatSearch() {
    this.showInChatSearch = !this.showInChatSearch;
    if (this.showInChatSearch) {
      setTimeout(() => {
        this.inChatSearchInput?.nativeElement?.select();
        this.inChatSearchInput?.nativeElement?.focus();
      }, 50);
      if (this.inChatSearchQuery.trim()) {
        this.performInChatSearch();
      }
    } else {
      this.closeInChatSearch();
    }
    this.cdr.markForCheck();
  }

  closeInChatSearch() {
    this.showInChatSearch = false;
    this.inChatSearchQuery = '';
    this.searchMatches = [];
    this.currentMatchIndex = -1;
    this.cdr.markForCheck();
  }

  onInChatSearchChange() {
    this.performInChatSearch();
  }

  performInChatSearch() {
    const q = this.inChatSearchQuery.trim().toLowerCase();
    if (!q || !this.mainService.currentChat?.messages) {
      this.searchMatches = [];
      this.currentMatchIndex = -1;
      return;
    }

    const matches: string[] = [];
    for (const msg of this.mainService.currentChat.messages) {
      if (msg.isDeleted) continue;
      const contentMatch = msg.content?.toLowerCase().includes(q);
      const fileMatch = msg.fileName?.toLowerCase().includes(q);
      if (contentMatch || fileMatch) {
        if (msg._id) {
          matches.push(msg._id);
        }
      }
    }
    this.searchMatches = matches;
    if (matches.length > 0) {
      this.currentMatchIndex = matches.length - 1;
      this.scrollToMatch(this.searchMatches[this.currentMatchIndex]);
    } else {
      this.currentMatchIndex = -1;
    }
    this.cdr.markForCheck();
  }

  goToNextMatch() {
    if (this.searchMatches.length === 0) return;
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
    this.scrollToMatch(this.searchMatches[this.currentMatchIndex]);
    this.cdr.markForCheck();
  }

  goToPrevMatch() {
    if (this.searchMatches.length === 0) return;
    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
    this.scrollToMatch(this.searchMatches[this.currentMatchIndex]);
    this.cdr.markForCheck();
  }

  private scrollToMatch(messageId: string) {
    if (!messageId) return;
    setTimeout(() => {
      const el = document.getElementById('msg-' + messageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 40);
  }

  isSearchHighlighted(message: Message): boolean {
    if (!this.showInChatSearch || !this.inChatSearchQuery.trim() || !message._id) return false;
    return this.searchMatches.includes(message._id);
  }

  isCurrentSearchMatch(message: Message): boolean {
    if (!this.showInChatSearch || this.currentMatchIndex < 0 || !message._id) return false;
    return this.searchMatches[this.currentMatchIndex] === message._id;
  }

  avatarBg(chat: ChatListItem): string {
    if (!chat) return '#0088cc';
    const hue = chat._id ? Number(String(chat._id).charCodeAt(0)) % 60 + 240 : 264;
    return `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue - 10) % 360} 65% 50%))`;
  }

  initials(chat: ChatListItem): string {
    if (!chat) return '?';
    if (chat.isGroup || chat.isChannel) return '';
    const first = (chat.firstName ?? '').trim();
    const last = (chat.lastName ?? '').trim();
    if (first && last) return `${first.charAt(0)}${last.charAt(0)}`;
    if (first) return first.charAt(0);
    if (last) return last.charAt(0);
    return '?';
  }

  avatarBroken(chatId: string): boolean {
    return this.brokenAvatars.has(chatId);
  }

  markAvatarBroken(chatId: string): void {
    this.brokenAvatars.add(chatId);
  }

  onScroll(event?: Event) {
    const el = event?.target as HTMLElement;
    if (!el || !this.mainService.currentChat) return;

    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 8;
    this.showScrollBottom = !atBottom;

    if (el.scrollTop > 50) return;

    if (this.mainService.currentPage < this.mainService.totalPages) {
      const previousHeight = el.scrollHeight;
      const currentScrollTop = el.scrollTop;
      this.mainService
        .loadMessages(this.mainService.currentPage + 1)
        .pipe(take(1))
        .subscribe({
          next: () => {
            requestAnimationFrame(() => {
              const diff = el.scrollHeight - previousHeight;
              el.scrollTop = currentScrollTop + diff;
            });
          },
          error: () => {},
        });
    }
  }

  goBack() {
    this.mainService.closeCurrentChat();
    this.replyingToId = null;
  }

  showProfile() {
    this.dialog.open(ProfileComponent, {
      width: '520px',
      maxWidth: '96vw',
      data: {
        chat: this.mainService.currentChat,
      },
      panelClass: 'rtl-dialog',
    });
  }

  openSenderProfile(message: Message) {
    const senderId = message.senderId || (message.sender as any)?._id;
    if (senderId) {
      this.mainService.openUserProfileModal(senderId);
    }
  }

  trackByIdx(index: number, _item: any): number {
    return index;
  }

  isEditing(messageId: string): boolean {
    return !!this.editMessageId && !!messageId && this.editMessageId === messageId;
  }

  startEdit(message: Message) {
    if (!this.ownMessage(message) || message.isDeleted) return;
    this.editMessageId = message._id;
    this.editContent = message.content;
    this.showContextMenu = false;
  }

  cancelEdit() {
    this.editMessageId = null;
    this.editContent = '';
  }

  saveEdit() {
    if (!this.editMessageId || !this.editContent.trim()) {
      this.cancelEdit();
      return;
    }
    this.mainService.editMessage(this.editMessageId, this.editContent.trim()).pipe(take(1)).subscribe({
      next: () => {
        this.cancelEdit();
      },
      error: () => {
        this.cancelEdit();
      },
    });
  }

  deleteMessage(message: Message) {
    if (!this.ownMessage(message)) return;
    if (confirm('آیا از حذف این پیام اطمینان دارید؟')) {
      this.mainService.deleteMessage(message._id).pipe(take(1)).subscribe({
        next: () => {},
        error: () => {},
      });
    }
  }

  getUserReaction(message: Message): string | undefined {
    const own = this.ownId();
    const found = (message.reactions || []).find((r) => r.users?.includes(own));
    return found?.emoji || this.userReactions.get(message._id);
  }

  isReactedWith(message: Message, emoji: string): boolean {
    return this.getUserReaction(message) === emoji;
  }

  toggleReaction(message: Message, emoji: string) {
    const messageId = message._id;
    if (!messageId) return;

    this.mainService.addReaction(messageId, emoji).pipe(take(1)).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          message.reactions = res;
        }
      },
      error: () => {
        this.mainService.snackbar.error('امکان ثبت واکنش وجود ندارد', 3000);
      },
    });
  }

  pinMessage(message: Message) {
    const chatId = this.mainService.currentChat?._id;
    if (!chatId || !message?._id) return;
    this.mainService.pinMessage(chatId, message._id);
    this.closeContextMenu();
  }

  unpinMessage() {
    const chatId = this.mainService.currentChat?._id;
    if (!chatId) return;
    this.mainService.unpinMessage(chatId);
  }

  scrollToMessage(messageId: string) {
    if (!messageId) return;
    const el = document.getElementById('msg-' + messageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-pinned');
      setTimeout(() => el.classList.remove('highlight-pinned'), 2000);
    }
  }

  openContextMenu(event: MouseEvent, message: Message) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuTarget = message;
    const menuWidth = 190;
    const menuHeight = 280;
    this.contextMenuX = Math.max(10, Math.min(event.clientX, window.innerWidth - menuWidth - 10));
    this.contextMenuY = Math.max(10, Math.min(event.clientY, window.innerHeight - menuHeight - 10));
    this.showContextMenu = true;
    this.showContentPicker = false;
  }

  onChatAreaContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.closeContextMenu();
  }

  isMessagePinned(message: Message): boolean {
    if (!message) return false;
    const pinned = this.mainService.currentChat?.pinnedMessage;
    if (!pinned) return false;
    const pinnedId = typeof pinned === 'string' ? pinned : (pinned as any)._id;
    return pinnedId === message._id;
  }

  addContextMenuReaction(emoji: string) {
    if (!this.contextMenuTarget) return;
    this.toggleReaction(this.contextMenuTarget, emoji);
    this.closeContextMenu();
  }

  closeContextMenu() {
    this.showContextMenu = false;
    this.contextMenuTarget = null;
  }

  onContextMenuAction(action: string) {
    if (!this.contextMenuTarget) return;
    switch (action) {
      case 'edit':
        this.startEdit(this.contextMenuTarget!);
        break;
      case 'pin':
        if (this.isMessagePinned(this.contextMenuTarget!)) {
          this.unpinMessage();
          this.mainService.snackbar.info(this.translationService.t('actions.unpin'), 2000);
        } else {
          this.pinMessage(this.contextMenuTarget!);
          this.mainService.snackbar.success(this.translationService.t('actions.pin'), 2000);
        }
        break;
      case 'delete':
        this.deleteMessage(this.contextMenuTarget!);
        break;
      case 'reply':
        this.replyToMessage(this.contextMenuTarget!);
        break;
      case 'forward':
        this.mainService.snackbar.info('ارسال به forwarded soon', 2000);
        break;
      case 'copy':
        navigator.clipboard.writeText(this.contextMenuTarget!.content || '');
        this.mainService.snackbar.success('کپی شد', 2000);
        break;
    }
    this.closeContextMenu();
  }

  replyToMessage(message: Message) {
    this.replyingToId = message._id;
    this.replyingToPreview = message.content?.substring(0, 60) || '';
    const textarea = this.element?.nativeElement as HTMLTextAreaElement | null;
    if (textarea) textarea.focus();
  }

  cancelReply() {
    this.replyingToId = null;
    this.replyingToPreview = '';
  }

  getMessageDate(message: Message): string {
    const d = new Date(message.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    if (diffDays < 7) return d.toLocaleDateString('fa-IR', { weekday: 'long' });
    return d.toLocaleDateString('fa-IR');
  }

  isNewDay(prev: Message | undefined, curr: Message): boolean {
    if (!prev) return true;
    const p = new Date(prev.createdAt);
    const c = new Date(curr.createdAt);
    return p.toDateString() !== c.toDateString();
  }

  shouldShowDateSeparator(index: number): boolean {
    const messages = this.mainService.currentChat?.messages || [];
    if (index === 0) return true;
    return this.isNewDay(messages[index - 1], messages[index]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const chatId = this.mainService.currentChat?._id;
    if (!chatId) return;

    input.value = '';

    this.mainService.sendMedia(chatId, file, file.name).pipe(take(1)).subscribe({
      next: (res) => {},
      error: (err) => {
        this.mainService.snackbar.error('خطا در ارسال فایل', 3000);
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = 3;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  toggleBgSelector() {
    this.showBgSelector = !this.showBgSelector;
  }

  selectBg(bg: ChatBackground) {
    this.chatBgService.setBackground(bg);
    this.showBgSelector = false;
  }

  getBgPreview(bg: ChatBackground): string {
    if (bg.type === 'solid') return 'var(--color-surface-container)';
    if (bg.type === 'gradient') return 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-deep) 100%)';
    return 'linear-gradient(135deg, #0088cc, #0077b6)';
  }

  toggleChatActions() {
    this.showChatActions = !this.showChatActions;
  }

  deleteCurrentChat() {
    const chat = this.mainService.currentChat;
    if (!chat) return;
    if (confirm('آیا از حذف این گفتگو مطمئن هستید؟')) {
      this.mainService.deleteChat(chat._id as string).pipe(take(1)).subscribe({
        next: () => {
          this.mainService.closeCurrentChat();
          this.mainService.getChatList();
        },
        error: () => {
          this.mainService.snackbar.error('خطا در حذف گفتگو', 3000);
        },
      });
    }
  }

  leaveCurrentChat() {
    const chat = this.mainService.currentChat;
    if (!chat) return;
    if (confirm('آیا از خروج از این گفتگو مطمئن هستید؟')) {
      this.mainService.leaveChat(chat._id as string).pipe(take(1)).subscribe({
        next: () => {
          this.mainService.closeCurrentChat();
          this.mainService.getChatList();
        },
        error: () => {
          this.mainService.snackbar.error('خطا در خروج از گفتگو', 3000);
        },
      });
    }
  }

  onChatInputKeyDown(event: KeyboardEvent, textarea: HTMLTextAreaElement) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const content = textarea.value.trim();
      if (content && this.mainService.currentChat) {
        this.mainService.sendMessage(this.mainService.currentChat, textarea);
        textarea.value = '';
        textarea.style.height = 'auto';
      }
    }
  }

  sendFromButton(textarea: HTMLTextAreaElement) {
    const content = textarea.value.trim();
    if (content && this.mainService.currentChat) {
      this.mainService.sendMessage(this.mainService.currentChat, textarea);
      textarea.value = '';
      textarea.style.height = 'auto';
    }
  }

  toggleContentPicker() {
    this.showContentPicker = !this.showContentPicker;
    if (this.showContentPicker) {
      this.closeContextMenu();
      this.showBgSelector = false;
      this.showChatActions = false;
    }
  }

  toggleEmojiPicker() {
    this.toggleContentPicker();
  }

  insertEmoji(emoji: string) {
    const textarea = this.element?.nativeElement as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      textarea.value = textarea.value.substring(0, start) + emoji + textarea.value.substring(end);
      const newPos = start + emoji.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
      this.onTyping();
    }
  }

  onStickerSelected(sticker: { url: string; name: string }) {
    if (!this.mainService.currentChat) return;
    this.mainService.sendSticker(this.mainService.currentChat, sticker.url, sticker.name);
    this.showContentPicker = false;
  }

  onGifSelected(gif: { url: string; caption?: string }) {
    if (!this.mainService.currentChat) return;
    this.mainService.sendGif(this.mainService.currentChat, gif.url, gif.caption || '');
    this.showContentPicker = false;
  }

  onGifFileSelected(file: File) {
    const chatId = this.mainService.currentChat?._id;
    if (!chatId) return;
    this.mainService.sendMedia(chatId, file, file.name).pipe(take(1)).subscribe({
      next: (res) => {
        if (res && this.mainService.currentChat) {
          this.mainService.currentChat.messages = this.mainService.currentChat.messages || [];
          if (!this.mainService.currentChat.messages.some((m) => m._id === res._id)) {
            this.mainService.currentChat.messages.push(res);
            this.mainService.currentChat.lastMessage = res;
            this.mainService.refreshItem(this.mainService.currentChat);
            this.scrollToBottom();
          }
        }
      },
      error: () => {
        this.mainService.snackbar.error('خطا در ارسال گیف', 3000);
      },
    });
    this.showContentPicker = false;
  }

  emojiCategories: { name: string; emojis: string[] }[] = [
    { name: 'Smileys', emojis: ['😀', '😊', '😎', '😍', '😂', '🥰', '😉', '😘', '😅', '😄', '😁', '😆', '😅', '🤔', '🙂', '🥹'] },
    { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙏', '👋', '🤝', '👏', '👐', '👏', '👌', '✌️', '🙏'] },
    { name: 'Objects', emojis: ['🎉', '❤️', '🔥', '⭐', '✨', '💯', '🎯', '🎁', '🎈', '🌟', '⚡', '☀️'] },
  ];

  getShortTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  getMediaUrl(fileUrl?: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:') || fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    if (fileUrl.startsWith('/uploads/')) {
      const base = environment.apiUrl.replace('/v1', '');
      return `${base}${fileUrl}`;
    }
    if (fileUrl.startsWith('/')) return `${environment.uploadUrl}${fileUrl}`;
    return `${environment.uploadUrl}/${fileUrl}`;
  }

  formatSystemMessage(message: Message): string {
    const content = message.content || '';
    const myName = `${this.mainService.authService.getFirstName() || ''} ${this.mainService.authService.getLastName() || ''}`.trim();

    if (myName && content.includes(myName) && content.includes('اضافه کرد')) {
      const parts = content.split('،');
      const author = parts[0] || 'مدیر';
      return `شما توسط ${author} به گروه اضافه شدید`;
    }
    return content;
  }
}