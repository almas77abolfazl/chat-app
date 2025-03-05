import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, take } from 'rxjs';
import { ChatListItem } from '../../../models/chat-list-item.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-chat-list',
  imports: [FontAwesomeModule, FormsModule, DatePipe],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  searchQuery: string = '';
  searchResults: any[] = [];
  searchSubject: Subject<string> = new Subject();
  constructor(public mainService: MainService) {
    this.mainService.getChatList();
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.performSearch(query);
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  // متد برای جستجو از طریق API
  performSearch(query: string) {
    if (query.trim() === '') {
      this.searchResults = [];
      return;
    }

    this.mainService
      .search(query)
      .pipe(take(1))
      .subscribe(
        (results: any) => {
          this.searchResults = results;
        },
        (error) => {
          console.error('Search error:', error);
        }
      );
  }

  selectChat(user: ChatListItem) {
    this.mainService.currentChat = user;
    this.mainService
      .loadMessages()
      .pipe(take(1))
      .subscribe(async (res) => {
        if (!this.mainService.chatItems?.length) {
          this.mainService.chatItems = [
            {
              _id: user._id,
              lastMessage: null,
              messageCount: 0,
              messages: [],
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: await this.mainService.getAvatar(user._id),
            },
          ];
        }
        const chatItem = this.mainService.chatItems.find((x) => x._id === user._id);
        chatItem.messageCount = 0;
        setTimeout(() => {
          const messagesDiv = document.querySelector('.chat-messages');
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 500);
      });
  }
}
