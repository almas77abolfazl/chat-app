import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { DatePipe, NgClass } from '@angular/common';
import { take, takeUntil } from 'rxjs';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from '../../profile/profile.component';
import { Message } from '../../../models/message.model';
import { ChatListItem } from '../../../models/chat-list-item.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [FontAwesomeModule, DatePipe, NgClass, MatButtonModule, FormsModule],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent implements OnInit, OnDestroy {
  constructor(public mainService: MainService, private dialog: MatDialog) {}
  showScrollBottom = false;
  private destroy$ = new Subject<void>();
  private typingSubscription: Subscription;
  typingUsers: string[] = [];
  editMessageId: string | null = null;
  editContent = '';
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  userReactions: Map<string, string> = new Map();

  ngOnInit() {
    // Mark messages as read when chat is opened
    this.mainService.chatOpened$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.markCurrentChatMessagesRead();
    });

    this.typingSubscription = this.mainService.typingUsers$.subscribe((typingMap) => {
      const chatId = this.mainService.currentChat?._id;
      this.typingUsers = chatId ? typingMap.get(chatId) || [] : [];
    });
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
    return '';
  }

  avatarBg(chat: ChatListItem): string {
    if (!chat) return '#6366f1';
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

  onScroll(event?: Event) {
    const el = event?.target as HTMLElement;
    if (!el || !this.mainService.currentChat) return;

    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 8;
    this.showScrollBottom = !atBottom;

    if (el.scrollTop > 50) return;

    if (this.mainService.currentPage < this.mainService.totalPages) {
      const previousHeight = el.scrollHeight;
      this.mainService
        .loadMessages(this.mainService.currentPage + 1)
        .pipe(take(1))
        .subscribe(() => {
          if (el) el.scrollTop = el.scrollHeight - previousHeight;
        });
    }
  }

  scrollToBottom() {
    const el = document.querySelector('.chat-messages') as HTMLElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    this.showScrollBottom = false;
  }

  goBack() {
    this.mainService.closeCurrentChat();
  }

  showProfile() {
    const dialogRef = this.dialog.open(ProfileComponent, {
      width: '500px',
      data: this.mainService.currentChat,
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
      // Remove reaction
      this.mainService.removeReaction(messageId).pipe(take(1)).subscribe({
        next: () => {
          this.userReactions.delete(messageId);
        },
        error: () => {},
      });
    } else {
      // Add/change reaction
      this.mainService.addReaction(messageId, emoji).pipe(take(1)).subscribe({
        next: () => {
          this.userReactions.set(messageId, emoji);
        },
        error: () => {},
      });
    }
  }

  isReactedWith(message: Message, emoji: string): boolean {
    return this.userReactions.get(message._id) === emoji;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const chatId = this.mainService.currentChat?._id;
    if (!chatId) return;

    // Reset input to allow same file selection
    input.value = '';

    this.mainService.sendMedia(chatId, file).pipe(take(1)).subscribe({
      next: (res) => {
        console.log('Media sent:', res);
      },
      error: (err) => {
        console.error('Media send error:', err);
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
}
