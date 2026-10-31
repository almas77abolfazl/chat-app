import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { WebRtcService } from '../../helpers/webrtc.service';
import { MainService } from '../main.service';
import { I18nPipe } from '../../helpers/i18n.pipe';
import { TranslationService } from '../../helpers/translation.service';

@Component({
  selector: 'app-call-dialog',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, I18nPipe],
  templateUrl: './call-dialog.component.html',
  styleUrl: './call-dialog.component.scss',
})
export class CallDialogComponent {
  webrtc = inject(WebRtcService);
  mainService = inject(MainService);
  translationService = inject(TranslationService);

  @ViewChild('localVideo') localVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef?: ElementRef<HTMLVideoElement>;

  avatarBroken = false;

  constructor() {
    effect(() => {
      const state = this.webrtc.callState();
      const localStream = this.webrtc.localStream;
      const remoteStream = this.webrtc.remoteStream;

      if (state === 'connected' || state === 'calling') {
        setTimeout(() => {
          if (this.localVideoRef?.nativeElement && localStream) {
            if (this.localVideoRef.nativeElement.srcObject !== localStream) {
              this.localVideoRef.nativeElement.srcObject = localStream;
            }
          }
          if (this.remoteVideoRef?.nativeElement && remoteStream) {
            if (this.remoteVideoRef.nativeElement.srcObject !== remoteStream) {
              this.remoteVideoRef.nativeElement.srcObject = remoteStream;
            }
          }
        }, 50);
      }
    });
  }

  get partner() {
    return this.webrtc.partnerInfo();
  }

  getInitial(name?: string): string {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  getAvatarBg(name?: string): string {
    if (!name) return '#0088cc';
    const colors = ['#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
