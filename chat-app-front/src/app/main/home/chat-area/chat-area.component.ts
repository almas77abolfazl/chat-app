import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MainService } from '../../main.service';
import { DatePipe, NgClass } from '@angular/common';
import { take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProfileComponent } from '../../profile/profile.component';

@Component({
  selector: 'app-chat-area',
  imports: [FontAwesomeModule, DatePipe, NgClass, MatButtonModule],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent {
  userId = '';
  constructor(public mainService: MainService, private dialog: MatDialog) {
    this.userId = this.mainService.authService.getUserId();
  }

  senderId(message: any): string {
    return typeof message?.sender === 'string' ? message.sender : message?.sender?._id ?? '';
  }

  onScroll(event?: Event) {
    const el = event?.target as HTMLElement;
    if (el && el.scrollTop > 50) return;

    if (this.mainService.currentPage < this.mainService.totalPages) {
      const previousHeight = el?.scrollHeight ?? 0;
      this.mainService
        .loadMessages(this.mainService.currentPage + 1)
        .pipe(take(1))
        .subscribe(() => {
          if (el) el.scrollTop = el.scrollHeight - previousHeight;
        });
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
