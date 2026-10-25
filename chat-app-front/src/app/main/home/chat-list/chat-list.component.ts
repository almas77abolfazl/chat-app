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

  readonly showChatContextMenu = signal<boolean>(false);
  readonly chatContextMenuX = signal<number>(0);
  readonly chatContextMenuY = signal<number>(0);
  readonly chatContextMenuTarget = signal<ChatListItem | null>(null);

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
    private dialog: MatDialog
  ) {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => this.performSearch(query));
  }

  ngOnInit() {
    this.mainService.getChatList();
    this.mainService.loadStories().pipe(take(1)).subscribe();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showChatContextMenu.set(false);
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
    if (chat.isSavedMessages) return 'پیام‌های ذخیره‌شده';
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    if (chat.firstName || chat.lastName) return `${chat.firstName || ''} ${chat.lastName || ''}`.trim();
    return chat.name || '';
  }

  avatarBg(chat: ChatListItem): string {
    if (!chat) return '#0088cc';
    const hue = chat._id ? (Number(String(chat._id).charCodeAt(0)) % 60) + 240 : 264;
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
    this.chatContextMenuTarget.set(chat);
    this.chatContextMenuX.set(event.clientX);
    this.chatContextMenuY.set(event.clientY);
    this.showChatContextMenu.set(true);
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
}
