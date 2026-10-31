import {
  Component,
  HostListener,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SideBarComponent } from './side-bar/side-bar.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatAreaComponent } from './chat-area/chat-area.component';
import { CallDialogComponent } from '../call-dialog/call-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MainService } from '../main.service';
import { SocketService } from '../socket.service';
import { ThemeService } from '../../helpers/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FontAwesomeModule,
    SideBarComponent,
    ChatListComponent,
    ChatAreaComponent,
    CallDialogComponent,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly mobileMenuOpen = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth <= 768);
  private readonly destroyRef = inject(DestroyRef);
  readonly mainService = inject(MainService);
  readonly themeService = inject(ThemeService);
  private readonly socketService = inject(SocketService);

  constructor() {
    this.mainService.closeCurrentChat();
    this.socketService.init();
    this.mainService.listenToMessages();
    this.mainService.loadAgentStatus();
    this.mainService.listenToAgentEvents();

    this.mainService.chatOpened$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.mobileMenuOpen.set(false);
    });
  }

  @HostListener('window:resize')
  onResize() {
    const mobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    this.isMobile.set(mobile);
    if (!mobile) {
      this.mobileMenuOpen.set(false);
    }
  }

  @HostListener('window:orientationchange')
  onOrientationChange() {
    this.onResize();
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.mainService.currentChat) {
      this.mainService.closeCurrentChat();
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }
}
