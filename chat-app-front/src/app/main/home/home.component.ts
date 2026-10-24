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
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MainService } from '../main.service';
import { SocketService } from '../socket.service';
import { ThemeService } from '../../helpers/theme.service';
import { I18nPipe } from '../../helpers/i18n.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FontAwesomeModule,
    SideBarComponent,
    ChatListComponent,
    ChatAreaComponent,
    MatDialogModule,
    MatSnackBarModule,
    I18nPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly mobileMenuOpen = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth <= 768);
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    socketService: SocketService,
    public mainService: MainService,
    public themeService: ThemeService
  ) {
    socketService.init();
    mainService.listenToMessages();
    mainService.loadAgentStatus();
    mainService.listenToAgentEvents();

    mainService.chatOpened$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
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

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }
}
