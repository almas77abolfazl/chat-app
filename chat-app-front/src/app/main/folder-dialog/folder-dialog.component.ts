import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ChatFolder } from '../../models/chat-folder.model';
import { ChatListItem } from '../../models/chat-list-item.model';
import { MainService } from '../main.service';
import { TranslationService } from '../../helpers/translation.service';
import { I18nPipe } from '../../helpers/i18n.pipe';

export interface FolderDialogData {
  folder?: ChatFolder;
}

interface IconOption {
  id: string;
  icon: IconProp;
  label: string;
}

@Component({
  selector: 'app-folder-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, FontAwesomeModule, I18nPipe],
  templateUrl: './folder-dialog.component.html',
  styleUrl: './folder-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderDialogComponent implements OnInit {
  isEdit = false;
  folderId?: string;

  name = signal<string>('');
  selectedIcon = signal<string>('folder');
  includedTypes = signal<('direct' | 'groups' | 'channels' | 'bots')[]>([]);
  includedChatIds = signal<string[]>([]);
  excludedChatIds = signal<string[]>([]);

  activeTab = signal<'include' | 'exclude'>('include');
  chatSearchQuery = signal<string>('');

  readonly iconsList: IconOption[] = [
    { id: 'folder', icon: ['fas', 'folder'], label: 'Folder' },
    { id: 'briefcase', icon: ['fas', 'briefcase'], label: 'Work' },
    { id: 'star', icon: ['fas', 'star'], label: 'Starred' },
    { id: 'heart', icon: ['fas', 'heart'], label: 'Personal' },
    { id: 'comments', icon: ['fas', 'comments'], label: 'Chats' },
    { id: 'users', icon: ['fas', 'users'], label: 'Groups' },
    { id: 'broadcast-tower', icon: ['fas', 'broadcast-tower'], label: 'Channels' },
    { id: 'robot', icon: ['fas', 'robot'], label: 'Bots' },
    { id: 'book', icon: ['fas', 'book'], label: 'Study' },
    { id: 'bookmark', icon: ['fas', 'bookmark'], label: 'Saved' },
    { id: 'tag', icon: ['fas', 'tag'], label: 'Label' },
  ];

  readonly chatTypes: { id: 'direct' | 'groups' | 'channels' | 'bots'; labelKey: string; icon: IconProp }[] = [
    { id: 'direct', labelKey: 'folders.direct', icon: ['fas', 'user'] },
    { id: 'groups', labelKey: 'folders.groups', icon: ['fas', 'users'] },
    { id: 'channels', labelKey: 'folders.channels', icon: ['fas', 'broadcast-tower'] },
    { id: 'bots', labelKey: 'folders.bots', icon: ['fas', 'robot'] },
  ];

  readonly allChats = computed(() => {
    return this.mainService.chatItemsSignal().filter((c) => !c.isSavedMessages);
  });

  readonly filteredChats = computed(() => {
    const q = this.chatSearchQuery().trim().toLowerCase();
    const chats = this.allChats();
    if (!q) return chats;
    return chats.filter((c) => {
      const name = (c.isGroup || c.isChannel ? c.name : `${c.firstName || ''} ${c.lastName || ''}`) || '';
      return name.toLowerCase().includes(q);
    });
  });

  constructor(
    public dialogRef: MatDialogRef<FolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FolderDialogData | null,
    public mainService: MainService,
    public translationService: TranslationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.mainService.chatItemsSignal().length === 0) {
      this.mainService.getChatList();
    }

    if (this.data?.folder) {
      this.isEdit = true;
      this.folderId = this.data.folder._id;
      this.name.set(this.data.folder.name || '');
      this.selectedIcon.set(this.data.folder.icon || 'folder');
      this.includedTypes.set([...(this.data.folder.includedTypes || [])]);
      this.includedChatIds.set([...(this.data.folder.includedChatIds || [])]);
      this.excludedChatIds.set([...(this.data.folder.excludedChatIds || [])]);
    }
    this.cdr.markForCheck();
  }

  setActiveTab(tab: 'include' | 'exclude'): void {
    this.activeTab.set(tab);
    this.cdr.markForCheck();
  }

  onSearchChange(q: string): void {
    this.chatSearchQuery.set(q);
    this.cdr.markForCheck();
  }

  getChatDisplayName(chat: ChatListItem): string {
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    const full = `${chat.firstName || ''} ${chat.lastName || ''}`.trim();
    return full || chat.name || 'Chat';
  }

  isTypeIncluded(type: 'direct' | 'groups' | 'channels' | 'bots'): boolean {
    return this.includedTypes().includes(type);
  }

  toggleType(type: 'direct' | 'groups' | 'channels' | 'bots'): void {
    const current = this.includedTypes();
    if (current.includes(type)) {
      this.includedTypes.set(current.filter((t) => t !== type));
    } else {
      this.includedTypes.set([...current, type]);
    }
    this.cdr.markForCheck();
  }

  isChatIncluded(chatId: string): boolean {
    return this.includedChatIds().includes(chatId);
  }

  toggleChatIncluded(chatId: string): void {
    const current = this.includedChatIds();
    if (current.includes(chatId)) {
      this.includedChatIds.set(current.filter((id) => id !== chatId));
    } else {
      this.includedChatIds.set([...current, chatId]);
      this.excludedChatIds.set(this.excludedChatIds().filter((id) => id !== chatId));
    }
    this.cdr.markForCheck();
  }

  isChatExcluded(chatId: string): boolean {
    return this.excludedChatIds().includes(chatId);
  }

  toggleChatExcluded(chatId: string): void {
    const current = this.excludedChatIds();
    if (current.includes(chatId)) {
      this.excludedChatIds.set(current.filter((id) => id !== chatId));
    } else {
      this.excludedChatIds.set([...current, chatId]);
      this.includedChatIds.set(this.includedChatIds().filter((id) => id !== chatId));
    }
    this.cdr.markForCheck();
  }

  save(): void {
    const folderName = this.name().trim();
    if (!folderName) return;

    const payload: Partial<ChatFolder> = {
      name: folderName,
      icon: this.selectedIcon(),
      includedTypes: this.includedTypes(),
      includedChatIds: this.includedChatIds(),
      excludedChatIds: this.excludedChatIds(),
    };

    if (this.isEdit && this.folderId) {
      this.mainService.updateFolder(this.folderId, payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Failed to update folder', err),
      });
    } else {
      this.mainService.createFolder(payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Failed to create folder', err),
      });
    }
  }

  deleteFolder(): void {
    if (!this.folderId) return;
    if (confirm(this.translationService.t('folders.deleteConfirm'))) {
      this.mainService.deleteFolder(this.folderId).subscribe({
        next: () => this.dialogRef.close({ deleted: true }),
        error: (err) => console.error('Failed to delete folder', err),
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
