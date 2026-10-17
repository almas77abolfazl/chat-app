import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, take } from 'rxjs';
import { ChatListItem } from '../../../models/chat-list-item.model';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  searchQuery = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  constructor(public mainService: MainService) {
    this.mainService.getChatList();
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => this.performSearch(query));
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
  }

  openChat(chat: ChatListItem) {
    this.mainService.openChat(chat);
  }

  displayName(chat: ChatListItem): string {
    if (chat.isGroup || chat.isChannel) return chat.name || '';
    if (chat.firstName || chat.lastName) return `${chat.firstName || ''} ${chat.lastName || ''}`.trim();
    return '';
  }
}
