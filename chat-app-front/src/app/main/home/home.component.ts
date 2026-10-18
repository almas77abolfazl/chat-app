import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SideBarComponent } from './side-bar/side-bar.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatAreaComponent } from './chat-area/chat-area.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MainService } from '../main.service';
import { SocketService } from '../socket.service';
import { ThemeService } from '../../helpers/theme.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, SideBarComponent, ChatListComponent, ChatAreaComponent, MatDialogModule, MatSnackBarModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnDestroy {
  mobileMenuOpen = false;
  isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  private destroy$ = new Subject<void>();

  constructor(
    socketService: SocketService,
    public mainService: MainService,
    public themeService: ThemeService
  ) {
    socketService.init();
    mainService.listenToMessages();
    mainService.loadAgentStatus();
    mainService.listenToAgentEvents();

    mainService.chatOpened$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.mobileMenuOpen = false;
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile === false) this.mobileMenuOpen = false;
  }

  @HostListener('window:orientationchange')
  onOrientationChange() {
    setTimeout(() => {
      this.isMobile = window.innerWidth <= 768;
    }, 100);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  goBackToChatList() {
    if (this.isMobile) {
      this.mainService.closeCurrentChat();
    }
  }

  ngOnDestroy(): void {
    this.mainService.stopListening();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
