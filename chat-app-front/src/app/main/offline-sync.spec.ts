import { TestBed } from '@angular/core/testing';
import { MainService, OutboxItem } from './main.service';
import { SocketService } from './socket.service';
import { AuthService } from '../auth/auth.service';
import { HttpRequestService } from '../helpers/http-request.service';
import { MatDialog } from '@angular/material/dialog';
import { CacheService } from '../helpers/cache.service';
import { SnackbarService } from '../helpers/snackbar/snackbar.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Message } from '../models/message.model';
import { ChatListItem } from '../models/chat-list-item.model';

describe('Offline Message Recovery & Auto-Sync (Issue #85)', () => {
  let mainService: MainService;
  let socketService: SocketService;
  let sentMessages: any[] = [];
  let emittedEvents: { event: string; payload: any }[] = [];

  beforeEach(() => {
    sentMessages = [];
    emittedEvents = [];
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            getUserId: () => 'user-test-1',
            getFirstName: () => 'Test',
            getLastName: () => 'User',
            getAuthToken: () => 'fake-token',
          },
        },
        {
          provide: HttpRequestService,
          useValue: {
            get: () => of([]),
            post: () => of({}),
            delete: () => of({}),
          },
        },
        {
          provide: MatDialog,
          useValue: { open: () => {} },
        },
        {
          provide: CacheService,
          useValue: { getItem: () => Promise.resolve(null), setItem: () => Promise.resolve() },
        },
        {
          provide: SnackbarService,
          useValue: { show: () => {}, error: () => {}, success: () => {}, info: () => {} },
        },
      ],
    });

    socketService = TestBed.inject(SocketService);
    // Mock socket emission
    socketService.sendMessage = ((msg: any) => {
      sentMessages.push(msg);
    }) as any;
    socketService.syncMissedMessages = ((payload: any) => {
      emittedEvents.push({ event: 'syncMissedMessages', payload });
    }) as any;
    socketService.emit = ((event: string, payload: any) => {
      emittedEvents.push({ event, payload });
    }) as any;

    mainService = TestBed.inject(MainService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should track and persist lastMessageTimestamp for chats', () => {
    const chatId = 'chat-100';
    const time1 = '2026-10-31T10:00:00.000Z';
    const time2 = '2026-10-31T11:00:00.000Z';

    mainService.updateLastMessageTimestamp(chatId, time1);
    expect(mainService.getLastKnownMessageTimestamp(chatId)).toBe(time1);

    // Later timestamp updates it
    mainService.updateLastMessageTimestamp(chatId, time2);
    expect(mainService.getLastKnownMessageTimestamp(chatId)).toBe(time2);

    // Earlier timestamp should not overwrite a newer one
    mainService.updateLastMessageTimestamp(chatId, time1);
    expect(mainService.getLastKnownMessageTimestamp(chatId)).toBe(time2);
  });

  it('should queue outgoing message in outbox and assign _tempId', async () => {
    const chat: ChatListItem = {
      _id: 'chat-200',
      messages: [],
      messageCount: 0,
      avatar: null,
      lastMessage: null as any,
    };
    mainService.currentChat = chat;
    mainService.chatItems = [chat];

    socketService.isConnected = () => false; // Offline

    const textarea = document.createElement('textarea');
    textarea.value = 'Offline test message';

    await mainService.sendMessage(chat, textarea);

    // Textarea cleared
    expect(textarea.value).toBe('');

    // Message placed in chat with _pending: true and _tempId
    expect(chat.messages?.length).toBe(1);
    const pendingMsg = chat.messages![0];
    expect(pendingMsg._pending).toBe(true);
    expect(pendingMsg._tempId).toBeDefined();
    expect(pendingMsg._tempId).toContain('temp_');
    expect(pendingMsg.content).toBe('Offline test message');

    // Queued in outbox
    const outbox = mainService.getOutboxQueue();
    expect(outbox.length).toBe(1);
    expect(outbox[0].chatId).toBe('chat-200');
    expect(outbox[0].content).toBe('Offline test message');
    expect(outbox[0].tempId).toBe(pendingMsg._tempId);

    // Because it was offline, sendMessage was not emitted via socket yet
    expect(sentMessages.length).toBe(0);
  });

  it('should flush outbox queue when reconnected', async () => {
    const item: OutboxItem = {
      tempId: 'temp_123',
      chatId: 'chat-300',
      content: 'Queued item',
      createdAt: new Date().toISOString(),
    };
    mainService.enqueueOutbox(item);
    expect(mainService.getOutboxQueue().length).toBe(1);

    socketService.isConnected = () => true; // Now connected

    mainService.flushOutboxQueue();

    expect(sentMessages.length).toBe(1);
    expect(sentMessages[0].chatId).toBe('chat-300');
    expect(sentMessages[0].content).toBe('Queued item');
    expect(sentMessages[0].tempId).toBe('temp_123');
  });

  it('should request syncMissedMessages on socket reconnect with last known timestamps', () => {
    const chat: ChatListItem = {
      _id: 'chat-400',
      messages: [
        {
          _id: 'm-old-1',
          content: 'Old msg',
          createdAt: new Date('2026-10-31T09:00:00Z'),
          avatar: '',
          receiver: '',
          sender: 'u2',
        },
      ],
      messageCount: 0,
      avatar: null,
      lastMessage: null as any,
    };
    mainService.currentChat = chat;
    mainService.chatItems = [chat];
    mainService.updateLastMessageTimestamp('chat-400', '2026-10-31T09:00:00.000Z');

    mainService.syncOfflineMessages();

    expect(emittedEvents.length).toBeGreaterThan(0);
    const syncEvent = emittedEvents.find((e) => e.event === 'syncMissedMessages');
    expect(syncEvent).toBeDefined();
    expect(syncEvent?.payload.chats).toBeDefined();
    const chatRequest = syncEvent?.payload.chats.find((c: any) => c.chatId === 'chat-400');
    expect(chatRequest).toBeDefined();
    expect(chatRequest.lastMessageTimestamp).toBe('2026-10-31T09:00:00.000Z');
  });

  it('should seamlessly merge missed messages without duplicates in chronological order', () => {
    const chat: ChatListItem = {
      _id: 'chat-500',
      messages: [
        {
          _id: 'm1',
          content: 'First',
          createdAt: new Date('2026-10-31T08:00:00Z'),
          avatar: '',
          receiver: '',
          sender: 'u1',
        },
        {
          _id: 'm2',
          content: 'Second',
          createdAt: new Date('2026-10-31T08:30:00Z'),
          avatar: '',
          receiver: '',
          sender: 'u2',
        },
        {
          _id: null as any,
          _pending: true,
          _tempId: 'temp_local',
          content: 'Pending outgoing',
          createdAt: new Date('2026-10-31T09:30:00Z'),
          avatar: '',
          receiver: '',
          sender: 'u1',
        },
      ],
      messageCount: 0,
      avatar: null,
      lastMessage: null as any,
    };
    mainService.currentChat = chat;
    mainService.chatItems = [chat];

    const missedFromServer: Message[] = [
      // Duplicate of m2: should be ignored
      {
        _id: 'm2',
        content: 'Second duplicate',
        createdAt: new Date('2026-10-31T08:30:00Z'),
        avatar: '',
        receiver: '',
        sender: 'u2',
      },
      // New missed message between m2 and pending:
      {
        _id: 'm3',
        content: 'Third (missed during disconnect)',
        createdAt: new Date('2026-10-31T09:00:00Z'),
        avatar: '',
        receiver: '',
        sender: 'u2',
      },
    ];

    mainService.handleMissedMessagesSynced([
      {
        chatId: 'chat-500',
        messages: missedFromServer,
      },
    ]);

    // Expected order: m1 -> m2 -> m3 -> pending
    expect(chat.messages?.length).toBe(4);
    expect(chat.messages![0]._id).toBe('m1');
    expect(chat.messages![1]._id).toBe('m2');
    expect(chat.messages![2]._id).toBe('m3');
    expect(chat.messages![2].content).toBe('Third (missed during disconnect)');
    expect(chat.messages![3]._pending).toBe(true);
    expect(chat.messages![3]._tempId).toBe('temp_local');
  });
});
