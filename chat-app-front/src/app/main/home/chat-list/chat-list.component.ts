import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, take } from 'rxjs';
import { ChatListItem } from '../../../models/chat-list-item.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule, DatePipe],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  searchQuery: string = ''; // رشته جستجو
  searchResults: any[] = []; // لیست نتایج جستجو
  searchSubject: Subject<string> = new Subject(); // برای دیباونس جستجو
  constructor(public mainService: MainService) {
    this.mainService.getChatList();
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.performSearch(query); // اجرای جستجو با دیباونس 300 میلی‌ثانیه
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query); // ارسال query به searchSubject
  }

  // متد برای جستجو از طریق API
  performSearch(query: string) {
    if (query.trim() === '') {
      this.searchResults = []; // اگر چیزی وارد نشده، نتایج خالی شوند
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

  selectChat(user) {
    this.mainService.currentChat = {
      Id: user._id,
      title: user.firstName + ' ' + user.lastName,
      info: user.status,
      messages: [],
    };
    this.mainService.loadMessages();
  }
}
