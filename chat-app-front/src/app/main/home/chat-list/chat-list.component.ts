import { Component, EventEmitter, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, take } from 'rxjs';
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
export class ChatListComponent {
  @Output() selectChat = new EventEmitter<void>();
  searchQuery = '';
  searchResults: any[] = [];
  brokenAvatars = new Set<string>();
  private searchSubject = new Subject<string>();
  showChatContextMenu = false;
  chatContextMenuX = 0;
  chatContextMenuY = 0;
  chatContextMenuTarget: ChatListItem | null = null;

  constructor(public mainService: MainService) {
    this.mainService.getChatList();
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => this.performSearch(query));
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
      return;
    }
    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe(
        (results: any[]) => {
          this.searchResults = (results || []).filter((r) => r._id !== this.mainService.authService.getUserId());
        },
        () => {
          this.searchResults = [];
        }
      );
  }

  async selectSearchResult(user: any) {
    this.searchResults = [];
    this.searchQuery = '';
    const chatItem = await this.mainService.startDirectChat(user);
    this.mainService.openChat(chatItem);
    this.selectChat.emit();
  }

  openChat(chat: ChatListItem) {
    this.mainService.openChat(chat);
    this.selectChat.emit();
  }

  displayName(chat: ChatListItem): string {
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    if (chat.firstName || chat.lastName) return `${chat.firstName || ''} ${chat.lastName || ''}`.trim();
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

  openChatContextMenu(event: MouseEvent, chat: ChatListItem) {
    event.preventDefault();
    event.stopPropagation();
    this.chatContextMenuTarget = chat;
    this.chatContextMenuX = event.clientX;
    this.chatContextMenuY = event.clientY;
    this.showChatContextMenu = true;
  }

  closeChatContextMenu() {
    this.showChatContextMenu = false;
    this.chatContextMenuTarget = null;
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