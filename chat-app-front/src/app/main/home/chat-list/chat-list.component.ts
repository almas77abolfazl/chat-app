import {
  Component,
  HostListener,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  output,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../main.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, take } from 'rxjs';
import { ChatListItem, TypingUser } from '../../../models/chat-list-item.model';
import { ChatFolder } from '../../../models/chat-folder.model';
import { StoryGroup } from '../../../models/story.model';
import { I18nPipe } from '../../../helpers/i18n.pipe';
import { TranslationService } from '../../../helpers/translation.service';
import { DeleteChatDialogComponent } from '../../delete-chat-dialog/delete-chat-dialog.component';
import { FolderDialogComponent } from '../../folder-dialog/folder-dialog.component';
import { StoryCreateDialogComponent } from '../../story-create/story-create-dialog.component';
import { StoryViewerDialogComponent } from '../../story-viewer/story-viewer-dialog.component';
import { getTelegramGradient, getInitials } from '../../../helpers/avatar.helper';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface ChatContextMenuTarget {
  chat: ChatListItem;
  x: number;
  y: number;
}

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, I18nPipe],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListComponent implements OnInit {
  readonly selectChat = output<void>();

  readonly searchQuery = signal<string>('');
  readonly searchResults = signal<any[]>([]);
  readonly searchTypeFilter = signal<'all' | 'users' | 'groups' | 'channels'>('all');
  readonly brokenAvatars = new Set<string>();

  private readonly searchSubject = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);
  readonly typingMap = signal<Map<string, TypingUser[]>>(new Map());

  readonly showChatContextMenu = signal<boolean>(false);
  readonly chatContextMenuX = signal<number>(0);
  readonly chatContextMenuY = signal<number>(0);
  readonly chatContextMenuTarget = signal<ChatListItem | null>(null);

  readonly showFolderContextMenu = signal<boolean>(false);
  readonly folderContextMenuX = signal<number>(0);
  readonly folderContextMenuY = signal<number>(0);
  readonly folderContextMenuTarget = signal<ChatFolder | null>(null);

  readonly filteredSearchResults = computed(() => {
    const filter = this.searchTypeFilter();
    const results = this.searchResults();
    if (filter === 'all') return results;
    if (filter === 'users') return results.filter((r) => !r.isGroup && !r.isChannel);
    if (filter === 'groups') return results.filter((r) => r.isGroup);
    if (filter === 'channels') return results.filter((r) => r.isChannel);
    return results;
  });

  readonly userOwnStory = computed<StoryGroup | undefined>(() => {
    return this.mainService.storiesSignal().find((s) => s.isCurrentUser);
  });

  readonly otherStories = computed<StoryGroup[]>(() => {
    return this.mainService.storiesSignal().filter((s) => !s.isCurrentUser);
  });

  constructor(
    public mainService: MainService,
    public translationService: TranslationService,
    private dialog: MatDialog
  ) {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => this.performSearch(query));

    this.mainService.typingUsers$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((m) => this.typingMap.set(m));
  }

  getChatTypingText(chat: ChatListItem): string {
    const users = this.typingMap().get(chat._id);
    if (!users || users.length === 0) return '';
    const isGroup = !!chat.isGroup;
    const isRtl = this.translationService.isRTL();
    if (!isGroup) {
      return this.translationService.t('chat.typingDirect');
    }
    const names = users.map((u) => u.userName || (isRtl ? 'یک کاربر' : 'A user'));
    if (names.length === 1) {
      return this.translationService.t('chat.typingSingle', { name: names[0] });
    } else if (names.length === 2) {
      return this.translationService.t('chat.typingDouble', { name1: names[0], name2: names[1] });
    } else {
      return this.translationService.t('chat.typingMultiple', {
        name1: names[0],
        name2: names[1],
        count: names.length - 2,
      });
    }
  }

  ngOnInit() {
    this.mainService.getChatList();
    this.mainService.loadUserFolders().pipe(take(1)).subscribe();
    this.mainService.loadStories().pipe(take(1)).subscribe();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showChatContextMenu.set(false);
    this.showFolderContextMenu.set(false);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (!query.trim()) {
      this.searchResults.set([]);
      return;
    }
    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe({
        next: (results: any[]) => {
          this.searchResults.set(
            (results || []).filter((r) => r._id !== this.mainService.authService.getUserId())
          );
        },
        error: () => {
          this.searchResults.set([]);
        },
      });
  }

  async selectSearchResult(user: any) {
    this.searchResults.set([]);
    this.searchQuery.set('');
    const chatItem = await this.mainService.startDirectChat(user);
    this.mainService.openChat(chatItem);
    this.selectChat.emit();
  }

  openChat(chat: ChatListItem) {
    this.mainService.openChat(chat);
    this.selectChat.emit();
  }

  displayName(chat: ChatListItem): string {
    if (chat.isSavedMessages) return this.translationService.t('chat.savedMessages');
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    if (chat.firstName || chat.lastName) return `${chat.firstName || ''} ${chat.lastName || ''}`.trim();
    return chat.name || '';
  }

  searchResultGradient(r: any): string {
    return getTelegramGradient(r?._id || r?.firstName);
  }

  avatarBg(chat: ChatListItem): string {
    if (!chat) return '#0088cc';
    return getTelegramGradient(chat._id || chat.name || chat.firstName);
  }

  initials(chat: ChatListItem): string {
    if (!chat) return '؟';
    if (chat.isGroup || chat.isChannel) return '';
    return getInitials(chat.firstName, chat.lastName, '؟');
  }

  myInitials(): string {
    const fn = this.mainService.authService.getFirstName();
    const ln = this.mainService.authService.getLastName();
    return getInitials(fn, ln, '؟');
  }

  myAvatarBg(): string {
    return getTelegramGradient(this.mainService.authService.getUserId() || 'me');
  }

  storyUserInitials(sg: StoryGroup): string {
    return getInitials(sg.user.firstName, sg.user.lastName, sg.user.name?.charAt(0) || '؟');
  }

  storyUserAvatarBg(sg: StoryGroup): string {
    return getTelegramGradient(sg.user._id || sg.user.name);
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
    this.chatContextMenuTarget.set(chat);

    const menuEstimatedWidth = 200;
    const menuEstimatedHeight = 160;
    const padding = 12;

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuEstimatedWidth > window.innerWidth - padding) {
      x = Math.max(padding, x - menuEstimatedWidth);
    }
    if (y + menuEstimatedHeight > window.innerHeight - padding) {
      y = Math.max(padding, y - menuEstimatedHeight);
    }

    this.chatContextMenuX.set(Math.max(padding, Math.min(x, window.innerWidth - menuEstimatedWidth - padding)));
    this.chatContextMenuY.set(Math.max(padding, Math.min(y, window.innerHeight - menuEstimatedHeight - padding)));
    this.showChatContextMenu.set(true);

    requestAnimationFrame(() => {
      const el = document.querySelector('.chat-list-container .context-menu, div.context-menu') as HTMLElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        let adjX = this.chatContextMenuX();
        let adjY = this.chatContextMenuY();

        if (rect.right > window.innerWidth - padding) {
          adjX -= (rect.right - (window.innerWidth - padding));
        }
        if (rect.left < padding) {
          adjX = padding;
        }
        if (rect.bottom > window.innerHeight - padding) {
          adjY -= (rect.bottom - (window.innerHeight - padding));
        }
        if (rect.top < padding) {
          adjY = padding;
        }

        this.chatContextMenuX.set(Math.round(adjX));
        this.chatContextMenuY.set(Math.round(adjY));
      }
    });
  }

  closeChatContextMenu() {
    this.showChatContextMenu.set(false);
    this.chatContextMenuTarget.set(null);
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
    const dialogRef = this.dialog.open(StoryViewerDialogComponent, {
      width: '420px',
      maxWidth: '100vw',
      panelClass: 'story-viewer-dialog-panel',
      data: {
        group,
        currentUserId: this.mainService.authService.getUserId(),
      },
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
      this.mainService.loadStories().pipe(take(1)).subscribe();
    });
  }

  onChatContextMenuAction(action: string) {
    const chat = this.chatContextMenuTarget();
    if (!chat) return;
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
          this.mainService
            .deleteChat(chat._id as string, result.deleteForBoth)
            .pipe(take(1))
            .subscribe({
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
      case 'clearHistory': {
        if (confirm(this.translationService.t('chat.clearHistoryConfirm'))) {
          this.mainService
            .clearChatHistory(chat._id as string)
            .pipe(take(1))
            .subscribe({
              next: () => {
                if (this.mainService.currentChat?._id === chat._id) {
                  this.mainService.currentChat.messages = [];
                }
                this.mainService.getChatList();
                this.mainService.snackbar.success('پیام‌های ذخیره‌شده پاک شدند', 3000);
              },
              error: () => {
                this.mainService.snackbar.error('خطا در پاک کردن پیام‌ها', 3000);
              },
            });
        }
        break;
      }
      case 'leave':
        if (confirm('آیا از خروج از این گروه مطمئن هستید؟')) {
          this.mainService
            .leaveChat(chat._id as string)
            .pipe(take(1))
            .subscribe({
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

  getFolderIcon(iconName?: string): IconProp {
    switch (iconName) {
      case 'briefcase':
        return ['fas', 'briefcase'];
      case 'star':
        return ['fas', 'star'];
      case 'heart':
        return ['fas', 'heart'];
      case 'comments':
        return ['fas', 'comments'];
      case 'users':
        return ['fas', 'users'];
      case 'broadcast-tower':
        return ['fas', 'broadcast-tower'];
      case 'robot':
        return ['fas', 'robot'];
      case 'book':
        return ['fas', 'book'];
      case 'bookmark':
        return ['fas', 'bookmark'];
      case 'tag':
        return ['fas', 'tag'];
      default:
        return ['fas', 'folder'];
    }
  }

  openFolderContextMenu(event: MouseEvent, folder: ChatFolder) {
    event.preventDefault();
    event.stopPropagation();
    this.showChatContextMenu.set(false);
    this.folderContextMenuTarget.set(folder);

    let x = event.clientX;
    let y = event.clientY;
    const menuWidth = 160;
    const menuHeight = 90;
    const padding = 12;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (x < padding) x = padding;
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    if (y < padding) y = padding;

    this.folderContextMenuX.set(Math.round(x));
    this.folderContextMenuY.set(Math.round(y));
    this.showFolderContextMenu.set(true);
  }

  closeFolderContextMenu() {
    this.showFolderContextMenu.set(false);
    this.folderContextMenuTarget.set(null);
  }

  openCreateFolderDialog() {
    this.closeFolderContextMenu();
    const dialogRef = this.dialog.open(FolderDialogComponent, {
      width: '480px',
      maxWidth: '94vw',
      panelClass: 'rtl-dialog',
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe((res) => {
      if (res) {
        this.mainService.loadUserFolders().subscribe();
      }
    });
  }

  openEditFolderDialog(folder: ChatFolder) {
    this.closeFolderContextMenu();
    const dialogRef = this.dialog.open(FolderDialogComponent, {
      width: '480px',
      maxWidth: '94vw',
      panelClass: 'rtl-dialog',
      data: { folder },
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe((res) => {
      if (res) {
        this.mainService.loadUserFolders().subscribe();
      }
    });
  }

  deleteFolder(folder: ChatFolder) {
    this.closeFolderContextMenu();
    if (!folder._id) return;
    if (confirm(this.translationService.t('folders.deleteConfirm'))) {
      this.mainService.deleteFolder(folder._id).pipe(take(1)).subscribe({
        next: () => {
          this.mainService.snackbar.success(this.translationService.t('folders.deletedSuccess'), 3000);
        },
      });
    }
  }
}
