import { TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { registerAppIcons } from '../../../icons';
import { ChatAreaComponent } from './chat-area.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MainService } from '../../main.service';

describe('ChatArea Context Menu & Actions', () => {
  let library: FaIconLibrary;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MainService,
          useValue: {
            authService: { getUserId: () => 'user-123' },
            currentChat: null,
            chatList$: of([]),
            getChatList: () => {},
            snackbar: { success: () => {}, info: () => {}, error: () => {} },
          },
        },
        {
          provide: MatDialog,
          useValue: { open: () => {} },
        },
      ],
    });
    library = TestBed.inject(FaIconLibrary);
    registerAppIcons(library);
  });

  it('should register faShare icon in FaIconLibrary', () => {
    const shareIcon = library.getIconDefinition('fas', 'share');
    expect(shareIcon).toBeDefined();
    expect(shareIcon?.iconName).toBe('share');
  });

  it('should correctly evaluate canEditMessage for own, received, deleted, and media messages', () => {
    const fixture = TestBed.createComponent(ChatAreaComponent);
    const comp = fixture.componentInstance;

    // Own text message
    expect(
      comp.canEditMessage({
        _id: 'm1',
        sender: 'user-123',
        content: 'Hello',
        createdAt: new Date().toISOString(),
      } as any)
    ).toBe(true);

    // Another user's message
    expect(
      comp.canEditMessage({
        _id: 'm2',
        sender: 'user-456',
        content: 'Hello from other',
        createdAt: new Date().toISOString(),
      } as any)
    ).toBe(false);

    // Deleted message
    expect(
      comp.canEditMessage({
        _id: 'm3',
        sender: 'user-123',
        content: '',
        isDeleted: true,
        createdAt: new Date().toISOString(),
      } as any)
    ).toBe(false);

    // Media message (image)
    expect(
      comp.canEditMessage({
        _id: 'm4',
        sender: 'user-123',
        content: '',
        mediaType: 'image',
        createdAt: new Date().toISOString(),
      } as any)
    ).toBe(false);

    // Null message
    expect(comp.canEditMessage(null)).toBe(false);
  });
});
