import { Injectable, signal, computed, inject } from '@angular/core';
import { SocketService } from '../main/socket.service';
import { SnackbarService } from './snackbar/snackbar.service';
import { TranslationService } from './translation.service';

export type CallState = 'idle' | 'calling' | 'incoming' | 'connected';
export type CallType = 'audio' | 'video';

export interface PartnerInfo {
  chatId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  isCaller: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WebRtcService {
  private socketService = inject(SocketService);
  private snackbar = inject(SnackbarService);
  private translationService = inject(TranslationService);

  readonly callState = signal<CallState>('idle');
  readonly callType = signal<CallType>('audio');
  readonly isMuted = signal<boolean>(false);
  readonly isCameraOff = signal<boolean>(false);
  readonly facingMode = signal<'user' | 'environment'>('user');
  readonly durationSeconds = signal<number>(0);
  readonly partnerInfo = signal<PartnerInfo | null>(null);

  readonly durationFormatted = computed(() => {
    const total = this.durationSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${mm}:${ss}`;
  });

  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;

  private peerConnection: RTCPeerConnection | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private incomingOffer: RTCSessionDescriptionInit | null = null;
  private timerInterval: any = null;
  private ringAudioCtx: AudioContext | null = null;
  private ringOscillators: OscillatorNode[] = [];
  private ringGain: GainNode | null = null;
  private ringToneInterval: any = null;

  private readonly iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor() {
    this.initSocketListeners();
  }

  private initSocketListeners(): void {
    this.socketService.on('call:incoming', (payload: {
      chatId: string;
      caller: { _id: string; firstName?: string; lastName?: string; profilePicture?: string | null };
      callType: CallType;
      offer: RTCSessionDescriptionInit;
    }) => {
      // If currently already on a call, automatically reject with busy
      if (this.callState() !== 'idle') {
        this.socketService.emit('call:reject', {
          chatId: payload.chatId,
          callerId: payload.caller._id,
          reason: 'busy',
          callType: payload.callType,
        });
        return;
      }

      const callerName = `${payload.caller.firstName || ''} ${payload.caller.lastName || ''}`.trim() ||
        this.translationService.t('common.user');

      this.incomingOffer = payload.offer;
      this.partnerInfo.set({
        chatId: payload.chatId,
        partnerId: payload.caller._id,
        partnerName: callerName,
        partnerAvatar: payload.caller.profilePicture || null,
        isCaller: false,
      });
      this.callType.set(payload.callType || 'audio');
      this.callState.set('incoming');
      this.startIncomingRingtone();
    });

    this.socketService.on('call:accepted', async (payload: {
      chatId: string;
      answer: RTCSessionDescriptionInit;
      fromUserId: string;
    }) => {
      if (this.callState() !== 'calling' || !this.peerConnection) return;
      this.stopAudioTones();
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
        await this.drainPendingCandidates();
        this.callState.set('connected');
        this.startTimer();
      } catch (err) {
        console.error('Failed to set remote description on call:accepted', err);
        this.endCall();
      }
    });

    this.socketService.on('call:rejected', (payload: {
      chatId: string;
      reason?: string;
      fromUserId?: string;
    }) => {
      this.stopAudioTones();
      this.playEndTone();

      let reasonKey = 'call.callDeclined';
      if (payload.reason === 'busy') reasonKey = 'call.userBusy';
      else if (payload.reason === 'offline') reasonKey = 'call.userOffline';
      else if (payload.reason === 'blocked') reasonKey = 'call.userBlocked';

      this.snackbar.info(this.translationService.t(reasonKey));
      this.cleanup();
    });

    this.socketService.on('call:ice-candidate', async (payload: {
      candidate: RTCIceCandidateInit;
      fromUserId: string;
    }) => {
      if (!payload.candidate) return;
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate', err);
        }
      } else {
        this.pendingCandidates.push(payload.candidate);
      }
    });

    this.socketService.on('call:ended', () => {
      this.stopAudioTones();
      this.playEndTone();
      this.snackbar.info(this.translationService.t('call.callEnded'));
      this.cleanup();
    });
  }

  async startCall(
    chatId: string,
    partnerId: string,
    partnerName: string,
    partnerAvatar: string | null,
    callType: CallType,
  ): Promise<void> {
    if (this.callState() !== 'idle') return;

    this.callType.set(callType);
    this.partnerInfo.set({
      chatId,
      partnerId,
      partnerName,
      partnerAvatar,
      isCaller: true,
    });
    this.isMuted.set(false);
    this.isCameraOff.set(false);

    try {
      await this.acquireUserMedia(callType);
    } catch {
      this.snackbar.error(this.translationService.t('call.mediaPermissionDenied'));
      this.cleanup();
      return;
    }

    this.createPeerConnection(partnerId);

    try {
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });
      await this.peerConnection!.setLocalDescription(offer);

      this.callState.set('calling');
      this.startRingbackTone();

      this.socketService.emit('call:initiate', {
        chatId,
        targetUserId: partnerId,
        callType,
        offer,
      });
    } catch (err) {
      console.error('Error initiating call:', err);
      this.snackbar.error(this.translationService.t('call.callFailed'));
      this.cleanup();
    }
  }

  async acceptCall(): Promise<void> {
    if (this.callState() !== 'incoming' || !this.incomingOffer || !this.partnerInfo()) return;
    this.stopAudioTones();

    const info = this.partnerInfo()!;
    try {
      await this.acquireUserMedia(this.callType());
    } catch {
      this.snackbar.error(this.translationService.t('call.mediaPermissionDenied'));
      this.rejectCall('permission_denied');
      return;
    }

    this.createPeerConnection(info.partnerId);

    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(this.incomingOffer));
      await this.drainPendingCandidates();

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.socketService.emit('call:accept', {
        chatId: info.chatId,
        callerId: info.partnerId,
        answer,
      });

      this.callState.set('connected');
      this.startTimer();
    } catch (err) {
      console.error('Failed to answer call:', err);
      this.snackbar.error(this.translationService.t('call.callFailed'));
      this.rejectCall('error');
    }
  }

  rejectCall(reason: string = 'declined'): void {
    const info = this.partnerInfo();
    this.stopAudioTones();
    if (info) {
      this.socketService.emit('call:reject', {
        chatId: info.chatId,
        callerId: info.partnerId,
        reason,
        callType: this.callType(),
      });
    }
    this.cleanup();
  }

  endCall(): void {
    const info = this.partnerInfo();
    const duration = this.durationSeconds();
    this.stopAudioTones();
    this.playEndTone();

    if (info) {
      this.socketService.emit('call:end', {
        chatId: info.chatId,
        targetUserId: info.partnerId,
        callerId: info.isCaller ? undefined : info.partnerId,
        duration,
        callType: this.callType(),
      });
    }
    this.cleanup();
  }

  toggleMute(): void {
    const next = !this.isMuted();
    this.isMuted.set(next);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
  }

  toggleCamera(): void {
    const next = !this.isCameraOff();
    this.isCameraOff.set(next);
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
  }

  async switchCamera(): Promise<void> {
    if (this.callType() !== 'video' || !this.localStream) return;
    const nextFacing = this.facingMode() === 'user' ? 'environment' : 'user';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const oldVideoTrack = this.localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        this.localStream.removeTrack(oldVideoTrack);
      }

      this.localStream.addTrack(newVideoTrack);
      this.facingMode.set(nextFacing);

      // Replace track on RTCPeerConnection sender
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
    } catch (err) {
      console.warn('Switch camera failed or not supported:', err);
    }
  }

  private async acquireUserMedia(type: CallType): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
  }

  private createPeerConnection(partnerId: string): void {
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream!.addTrack(track);
        });
      } else if (event.track) {
        this.remoteStream!.addTrack(event.track);
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socketService.emit('call:ice-candidate', {
          targetUserId: partnerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (
        this.peerConnection?.iceConnectionState === 'disconnected' ||
        this.peerConnection?.iceConnectionState === 'failed'
      ) {
        // Disconnected or failed connection
        this.endCall();
      }
    };
  }

  private async drainPendingCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding drained candidate', err);
        }
      }
    }
  }

  private startTimer(): void {
    this.durationSeconds.set(0);
    this.clearIntervals();
    this.timerInterval = setInterval(() => {
      this.durationSeconds.update((d) => d + 1);
    }, 1000);
  }

  private clearIntervals(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.ringToneInterval) {
      clearInterval(this.ringToneInterval);
      this.ringToneInterval = null;
    }
  }

  // Web Audio API Ringtone / Tone Generators
  private startIncomingRingtone(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ringAudioCtx = new AudioCtx();

      const playPulse = () => {
        if (!this.ringAudioCtx || this.ringAudioCtx.state === 'closed') return;
        const now = this.ringAudioCtx.currentTime;

        const osc1 = this.ringAudioCtx.createOscillator();
        const osc2 = this.ringAudioCtx.createOscillator();
        const gain = this.ringAudioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(853, now); // North American / European ringing dual tone
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(960, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.setValueAtTime(0.15, now + 0.8);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ringAudioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.0);
        osc2.stop(now + 1.0);
      };

      playPulse();
      this.ringToneInterval = setInterval(playPulse, 2500);
    } catch (err) {
      console.warn('Web Audio incoming ringtone error:', err);
    }
  }

  private startRingbackTone(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ringAudioCtx = new AudioCtx();

      const playRingback = () => {
        if (!this.ringAudioCtx || this.ringAudioCtx.state === 'closed') return;
        const now = this.ringAudioCtx.currentTime;

        const osc1 = this.ringAudioCtx.createOscillator();
        const osc2 = this.ringAudioCtx.createOscillator();
        const gain = this.ringAudioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
        gain.gain.setValueAtTime(0.1, now + 1.5);
        gain.gain.linearRampToValueAtTime(0, now + 1.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ringAudioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
      };

      playRingback();
      this.ringToneInterval = setInterval(playRingback, 4000);
    } catch (err) {
      console.warn('Web Audio ringback tone error:', err);
    }
  }

  private playEndTone(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      setTimeout(() => ctx.close().catch(() => {}), 300);
    } catch {}
  }

  private stopAudioTones(): void {
    if (this.ringToneInterval) {
      clearInterval(this.ringToneInterval);
      this.ringToneInterval = null;
    }
    if (this.ringAudioCtx) {
      this.ringAudioCtx.close().catch(() => {});
      this.ringAudioCtx = null;
    }
  }

  private cleanup(): void {
    this.clearIntervals();
    this.stopAudioTones();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.incomingOffer = null;
    this.pendingCandidates = [];
    this.partnerInfo.set(null);
    this.callState.set('idle');
    this.durationSeconds.set(0);
    this.isMuted.set(false);
    this.isCameraOff.set(false);
  }
}
