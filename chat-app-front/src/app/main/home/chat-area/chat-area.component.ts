import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { Message } from '../../../models/message.model';
import { DatePipe, NgClass } from '@angular/common';
import { take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ProfileComponent } from '../../profile/profile.component';

@Component({
  selector: 'app-chat-area',
  imports: [FontAwesomeModule, DatePipe, NgClass],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent {
  userId = '';
  constructor(public mainService: MainService, private dialog: MatDialog) {
    this.userId = this.mainService.authService.getUserId();
  }

  onScroll() {
    if (this.mainService.currentPage < this.mainService.totalPages) {
      this.mainService
        .loadMessages(this.mainService.currentPage + 1)
        .pipe(take(1))
        .subscribe();
    }
  }

  showProfile() {
    const dialogRef = this.dialog.open(ProfileComponent, {
      width: '500px',
      data: this.mainService.currentChat,
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (result) {
          console.log('Profile updated:', result);
        }
      });
  }
}
