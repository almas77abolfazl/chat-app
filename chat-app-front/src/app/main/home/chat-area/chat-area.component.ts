import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { Message } from '../../../models/message.model';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [FontAwesomeModule, DatePipe, NgClass],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent {
  userId = '';
  constructor(public mainService: MainService) {
    this.userId = this.mainService.authService.getUserId()
  }

  onScroll() {
    if (this.mainService.currentPage < this.mainService.totalPages) {
      this.mainService.loadMessages(this.mainService.currentPage + 1);
    }
  }
}
