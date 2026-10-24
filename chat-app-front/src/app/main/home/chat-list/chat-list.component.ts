import { Component, EventEmitter, Output, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../main.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, take, takeUntil } from 'rxjs';
import { ChatListItem } from '../../../models/chat-list-item.model';
import { StoryGroup } from '../../../models/story.model';
import { I18nPipe } from '../../../helpers/i18n.pipe';
import { DeleteChatDialogComponent } from '../../delete-chat-dialog/delete-chat-dialog.component';
import { StoryCreateDialogComponent } from '../../story-create/story-create-dialog.component';
import { StoryViewerDialogComponent } from '../../story-viewer/story-viewer-dialog.component';

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
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((query) => this.performSearch(query));
  }

  ngOnInit() {
    this.mainService.getChatList();
    this.mainService.loadStories().pipe(take(1)).subscribe();

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

  get userOwnStory(): StoryGroup | undefined {
    return this.mainService.stories.find((s) => s.isCurrentUser);
  }

  get otherStories(): StoryGroup[] {
    return this.mainService.stories.filter((s) => !s.isCurrentUser);
  }

  openStoryCreate() {
    const dialogRef = this.dialog.open(StoryCreateDialogComponent, {
      width: '420px',
      maxWidth: '92vw',
      panelClass: 'rtl-dialog',
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
      if (result?.formData) {
        this.mainService.createStory(result.formData).pipe(take(1)).subscribe({
          next: () => {
            this.mainService.snackbar.success('استوری با موفقیت ثبت شد', 3000);
          },
        });
      }
    });
  }

  openStoryViewer(group: StoryGroup) {
    this.dialog.open(StoryViewerDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      panelClass: 'story-viewer-dialog-panel',
      data: {
        group,
        currentUserId: this.mainService.authService.getUserId(),
      },
    });
  }

  onChatContextMenuAction(action: string) {
    if (!this.chatContextMenuTarget) return;
    const chat = this.chatContextMenuTarget;
    switch (action) {
      case 'delete': {
        const isOwner = chat.ownerId === this.mainService.authService.getUserId();
        const dialogRef = this.dialog.open(DeleteChatDialogComponent, {
          width: '380px',
          maxWidth: '92vw',
          panelClass: 'rtl-dialog',
          data: {
            chat,
            isOwner,
          },
        });
        dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
          if (!result?.confirmed) return;
          this.mainService.deleteChat(chat._id as string, result.deleteForBoth).pipe(take(1)).subscribe({
            next: () => {
              if (this.mainService.currentChat?._id === chat._id) {
                this.mainService.closeCurrentChat();
              }
              this.mainService.getChatList();
            },
            error: () => {
              this.mainService.snackbar.error('خطا در حذف گفتگو', 3000);
            },
          });
        });
        break;
      }
      case 'leave':
        if (confirm('آیا از خروج از این گروه مطمئن هستید؟')) {
          this.mainService.leaveChat(chat._id as string).pipe(take(1)).subscribe({
            next: () => {
              if (this.mainService.currentChat?._id === chat._id) {
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
