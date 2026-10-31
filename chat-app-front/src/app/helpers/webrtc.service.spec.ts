import { TestBed } from '@angular/core/testing';
import { WebRtcService } from './webrtc.service';
import { SocketService } from '../main/socket.service';
import { SnackbarService } from './snackbar/snackbar.service';
import { TranslationService } from './translation.service';

describe('WebRtcService', () => {
  let service: WebRtcService;
  let socketHandlers: Map<string, (payload: any) => void>;
  let emittedEvents: { event: string; payload: any }[];

  beforeEach(() => {
    socketHandlers = new Map();
    emittedEvents = [];

    const mockSocketService = {
      on: (event: string, handler: (payload: any) => void) => {
        socketHandlers.set(event, handler);
      },
      emit: (event: string, payload: any) => {
        emittedEvents.push({ event, payload });
      },
    };

    const mockSnackbar = {
      info: () => {},
      error: () => {},
      success: () => {},
    };

    const mockTranslationService = {
      t: (key: string) => key,
    };

    TestBed.configureTestingModule({
      providers: [
        WebRtcService,
        { provide: SocketService, useValue: mockSocketService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    });

    service = TestBed.inject(WebRtcService);
  });

  it('should initialize with idle state and 00:00 duration', () => {
    expect(service.callState()).toBe('idle');
    expect(service.callType()).toBe('audio');
    expect(service.isMuted()).toBe(false);
    expect(service.isCameraOff()).toBe(false);
    expect(service.durationFormatted()).toBe('00:00');
  });

  it('should format duration correctly as MM:SS', () => {
    service.durationSeconds.set(0);
    expect(service.durationFormatted()).toBe('00:00');

    service.durationSeconds.set(65);
    expect(service.durationFormatted()).toBe('01:05');

    service.durationSeconds.set(160);
    expect(service.durationFormatted()).toBe('02:40');
  });

  it('should handle incoming call correctly', () => {
    const handler = socketHandlers.get('call:incoming');
    expect(handler).toBeDefined();

    handler!({
      chatId: 'chat-1',
      caller: { _id: 'user-2', firstName: 'John', lastName: 'Doe', profilePicture: 'pic.png' },
      callType: 'video',
      offer: { type: 'offer', sdp: 'dummy' },
    });

    expect(service.callState()).toBe('incoming');
    expect(service.callType()).toBe('video');
    expect(service.partnerInfo()).toEqual({
      chatId: 'chat-1',
      partnerId: 'user-2',
      partnerName: 'John Doe',
      partnerAvatar: 'pic.png',
      isCaller: false,
    });
  });

  it('should reject incoming call automatically if already busy', () => {
    service.callState.set('connected');

    const handler = socketHandlers.get('call:incoming');
    handler!({
      chatId: 'chat-2',
      caller: { _id: 'user-3', firstName: 'Alice' },
      callType: 'audio',
      offer: {},
    });

    const rejectEvent = emittedEvents.find((e) => e.event === 'call:reject');
    expect(rejectEvent).toBeDefined();
    expect(rejectEvent?.payload).toEqual({
      chatId: 'chat-2',
      callerId: 'user-3',
      reason: 'busy',
      callType: 'audio',
    });
  });

  it('should toggle mute and camera state', () => {
    expect(service.isMuted()).toBe(false);
    service.toggleMute();
    expect(service.isMuted()).toBe(true);
    service.toggleMute();
    expect(service.isMuted()).toBe(false);

    expect(service.isCameraOff()).toBe(false);
    service.toggleCamera();
    expect(service.isCameraOff()).toBe(true);
    service.toggleCamera();
    expect(service.isCameraOff()).toBe(false);
  });

  it('should handle call:ended by resetting to idle', () => {
    service.callState.set('connected');
    const handler = socketHandlers.get('call:ended');
    handler!({});
    expect(service.callState()).toBe('idle');
  });
});
