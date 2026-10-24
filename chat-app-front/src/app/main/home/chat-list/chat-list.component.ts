import { Component, EventEmitter, Output, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, take, takeUntil } from 'rxjs';
import { ChatListItem } from '../../../models/chat-list-item.model';
import { I18nPipe } from '../../../helpers/i18n.pipe';

export interface ChatContextMenuTarget {
  chat: ChatListItem;
  x: number;
  y: number;
}

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, FontAwesomeModule, FormsModule, I18nPipe],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent implements OnInit, OnDestroy {
  @Output() selectChat = new EventEmitter<void>();
  searchQuery = '';
  searchResults: any[] = [];
  searchTypeFilter: 'all' | 'users' | 'groups' | 'channels' = 'all';
  brokenAvatars = new Set<string>();
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  showChatContextMenu = false;
  chatContextMenuX = 0;
  chatContextMenuY = 0;
  chatContextMenuTarget: ChatListItem | null = null;

  constructor(
    public mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((query) => this.performSearch(query));
  }

  ngOnInit() {
    this.mainService.getChatList();

    this.mainService.chatListUpdated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });

    this.mainService.chatOpened$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showChatContextMenu = false;
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (!query.trim()) {
      this.searchResults = [];
      this.cdr.markForCheck();
      return;
    }
    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe(
        (results: any[]) => {
          this.searchResults = (results || []).filter((r) => r._id !== this.mainService.authService.getUserId());
          this.cdr.markForCheck();
        },
        () => {
          this.searchResults = [];
          this.cdr.markForCheck();
        }
      );
  }

  async selectSearchResult(user: any) {
    this.searchResults = [];
    this.searchQuery = '';
    const chatItem = await this.mainService.startDirectChat(user);
    this.mainService.openChat(chatItem);
    this.selectChat.emit();
    this.cdr.markForCheck();
  }

  openChat(chat: ChatListItem) {
    this.mainService.openChat(chat);
    this.selectChat.emit();
    this.cdr.markForCheck();
  }

  filteredSearchResults(): any[] {
    if (this.searchTypeFilter === 'all') return this.searchResults;
    if (this.searchTypeFilter === 'users') return this.searchResults.filter((r) => !r.isGroup && !r.isChannel);
    if (this.searchTypeFilter === 'groups') return this.searchResults.filter((r) => r.isGroup);
    if (this.searchTypeFilter === 'channels') return this.searchResults.filter((r) => r.isChannel);
    return this.searchResults;
  }

  displayName(chat: ChatListItem): string {
    if (chat.isSavedMessages) return 'پیام‌های ذخیره‌شده';
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    if (chat.firstName || chat.lastName) return `${chat.firstName || ''} ${chat.lastName || ''}`.trim();
    return chat.name || '';
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

  openChatContextMenu(event: MouseEvent, chat: ChatListItem) {
    event.preventDefault();
    event.stopPropagation();
    this.chatContextMenuTarget = chat;
    this.chatContextMenuX = event.clientX;
    this.chatContextMenuY = event.clientY;
    this.showChatContextMenu = true;
    this.cdr.markForCheck();
  }

  closeChatContextMenu() {
    this.showChatContextMenu = false;
    this.chatContextMenuTarget = null;
    this.cdr.markForCheck();
  }

  onChatContextMenuAction(action: string) {
    if (!this.chatContextMenuTarget) return;
    switch (action) {
      case 'delete':
        if (confirm('آیا از حذف این گفتگو مطمئن هستید؟')) {
          this.mainService.deleteChat(this.chatContextMenuTarget!._id as string).pipe(take(1)).subscribe({
            next: () => {
              if (this.mainService.currentChat?._id === this.chatContextMenuTarget!._id) {
                this.mainService.closeCurrentChat();
              }
              this.mainService.getChatList();
            },
            error: () => {
              this.mainService.snackbar.error('خطا در حذف گفتگو', 3000);
            },
          });
        }
        break;
      case 'leave':
        if (confirm('آیا از خروج از این گروه مطمئن هستید؟')) {
          this.mainService.leaveChat(this.chatContextMenuTarget!._id as string).pipe(take(1)).subscribe({
            next: () => {
              if (this.mainService.currentChat?._id === this.chatContextMenuTarget!._id) {
                this.mainService.closeCurrentChat();
              }
              this.mainService.getChatList();
            },
            error: () => {
              this.mainService.snackbar.error('خطا در خروج از گروه', 3000);
            },
          });
        }
        break;
    }
    this.closeChatContextMenu();
  }
}
