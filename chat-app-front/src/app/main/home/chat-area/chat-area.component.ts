import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { NgClass } from '@angular/common';
import { take, takeUntil } from 'rxjs';
import { Subscription, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from '../../profile/profile.component';
import { Message } from '../../../models/message.model';
import { ChatListItem } from '../../../models/chat-list-item.model';
import { ChatBackgroundService, ChatBackground, CHAT_BACKGROUNDS } from '../../chat-background/chat-background.service';
import { I18nPipe } from '../../../helpers/i18n.pipe';
import { environment } from '../../../../environments/environment';

export interface ContextMenuAction {
  label: string;
  icon: string;
  action: 'edit' | 'delete' | 'reply' | 'forward' | 'copy' | 'cancel';
  danger?: boolean;
}

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [FontAwesomeModule, NgClass, MatButtonModule, FormsModule, I18nPipe],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(public mainService: MainService, private dialog: MatDialog, public chatBgService: ChatBackgroundService) {}
  showScrollBottom = false;
  private destroy$ = new Subject<void>();
  private typingSubscription: Subscription;
  typingUsers: string[] = [];
  editMessageId: string | null = null;
  editContent = '';
  brokenAvatars = new Set<string>();
  showBgSelector = false;
  showChatActions = false;
  showEmojiPicker = false;
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
  userReactions: Map<string, string> = new Map();

  ngOnInit() {
    this.mainService.chatOpened$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.markCurrentChatMessagesRead();
      this.replyingToId = null;
    });

    this.mainService.messagesLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.scrollToBottom();
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
    this.showContextMenu = false;
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
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    return `${chat.firstName ?? ''} ${chat.lastName ?? ''}`.trim();
  }

  headerSubtitle(chat: ChatListItem): string {
    if (chat?.isChannel) return 'کانال عمومی';
    if (chat?.isGroup) {
      const count = (chat.participants || []).length;
      return `${count} عضو`;
    }
    if (chat?.isOnline) return 'آنلاین';
    return '';
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
    const dialogRef = this.dialog.open(ProfileComponent, {
      width: '500px',
      data: this.mainService.currentChat,
      panelClass: 'rtl-dialog',
    });
    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => {});
  }

  trackByIdx(index: number, _item: any): number {
    return index;
  }

  isEditing(messageId: string): boolean {
    return this.editMessageId === messageId;
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

  toggleReaction(message: Message, emoji: string) {
    const messageId = message._id;
    const currentEmoji = this.userReactions.get(messageId);

    if (currentEmoji === emoji) {
      this.mainService.removeReaction(messageId).pipe(take(1)).subscribe({
        next: () => {
          this.userReactions.delete(messageId);
        },
        error: () => {},
      });
    } else {
      this.mainService.addReaction(messageId, emoji).pipe(take(1)).subscribe({
        next: () => {
          this.userReactions.set(messageId, emoji);
        },
        error: () => {
          this.mainService.snackbar.error('امکان اضافه کردن reacción وجود ندارد', 3000);
        },
      });
    }
  }

  isReactedWith(message: Message, emoji: string): boolean {
    return this.userReactions.get(message._id) === emoji;
  }

  openContextMenu(event: MouseEvent, message: Message) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuTarget = message;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.showContextMenu = true;
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

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
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
      this.onTyping();
    }
    this.showEmojiPicker = false;
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
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    if (fileUrl.startsWith('/uploads/')) {
      const base = environment.apiUrl.replace('/v1', '');
      return `${base}${fileUrl}`;
    }
    if (fileUrl.startsWith('/')) return `${environment.uploadUrl}${fileUrl}`;
    return `${environment.uploadUrl}/${fileUrl}`;
  }
}