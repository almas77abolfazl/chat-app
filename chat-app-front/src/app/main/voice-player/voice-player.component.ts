import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VoicePlayerService } from './voice-player.service';
import { I18nPipe } from '../../helpers/i18n.pipe';

@Component({
  selector: 'app-voice-player',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, I18nPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="voice-player-container" [class.is-sent]="isSent" [class.is-playing]="isPlaying">
      <button
        type="button"
        class="play-toggle-btn"
        (click)="togglePlay(); $event.stopPropagation()"
        [attr.title]="(isPlaying ? 'actions.pause' : 'actions.play') | i18n"
      >
        <fa-icon [icon]="['fas', isPlaying ? 'pause' : 'play']" class="play-icon"></fa-icon>
      </button>

      <div class="voice-details">
        <div
          #waveformContainer
          class="waveform-track"
          (click)="onWaveformClick($event); $event.stopPropagation()"
          (mousemove)="onWaveformMouseMove($event)"
          (mouseleave)="hoverRatio.set(null)"
        >
          @for (bar of waveformBars(); track $index) {
          <div
            class="waveform-bar"
            [class.is-passed]="$index <= currentBarIndex()"
            [style.height.%]="bar"
          ></div>
          }
        </div>

        <div class="voice-meta">
          <span class="voice-time">{{ displayTime() }}</span>
          <button
            type="button"
            class="speed-toggle-btn"
            (click)="toggleSpeed(); $event.stopPropagation()"
            [attr.title]="('voice.playbackSpeed' | i18n) + ': ' + playbackRate + 'x'"
          >
            {{ playbackRate }}X
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .voice-player-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.35rem 0.45rem;
      border-radius: var(--radius-lg);
      min-width: 14rem;
      max-width: 22rem;
      user-select: none;
      direction: ltr; /* audio timelines flow LTR naturally */

      .play-toggle-btn {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: var(--radius-full);
        border: none;
        background: var(--color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: transform var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
        box-shadow: var(--shadow-sm);

        &:hover {
          transform: scale(1.06);
        }

        &:active {
          transform: scale(0.95);
        }

        .play-icon {
          font-size: 1.05rem;
          margin-inline-start: 1px; /* visual center for triangle */
        }
      }

      .voice-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;

        .waveform-track {
          display: flex;
          align-items: center;
          gap: 2.5px;
          height: 1.9rem;
          cursor: pointer;
          position: relative;
          padding: 0.1rem 0;

          .waveform-bar {
            flex: 1;
            min-width: 2px;
            max-width: 4px;
            border-radius: var(--radius-full);
            background: color-mix(in srgb, var(--color-text-faint) 50%, transparent);
            transition: background var(--transition-fast), transform var(--transition-fast);

            &.is-passed {
              background: var(--color-primary);
            }
          }

          &:hover .waveform-bar {
            transform: scaleY(1.08);
          }
        }

        .voice-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--color-text-secondary);
          font-variant-numeric: tabular-nums;

          .voice-time {
            font-weight: 600;
          }

          .speed-toggle-btn {
            background: color-mix(in srgb, var(--color-primary) 12%, transparent);
            color: var(--color-primary);
            border: none;
            border-radius: var(--radius-xs);
            padding: 0.1rem 0.35rem;
            font-size: 0.68rem;
            font-weight: 700;
            cursor: pointer;
            transition: background var(--transition-fast);

            &:hover {
              background: color-mix(in srgb, var(--color-primary) 22%, transparent);
            }
          }
        }
      }

      /* Sent bubble contrast adaptations */
      &.is-sent {
        .play-toggle-btn {
          background: #fff;
          color: var(--color-primary);

          &:hover {
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
          }
        }

        .waveform-track .waveform-bar {
          background: rgba(255, 255, 255, 0.35);

          &.is-passed {
            background: #ffffff;
          }
        }

        .voice-meta {
          color: rgba(255, 255, 255, 0.88);

          .speed-toggle-btn {
            background: rgba(255, 255, 255, 0.22);
            color: #ffffff;

            &:hover {
              background: rgba(255, 255, 255, 0.35);
            }
          }
        }
      }
    }
  `],
})
export class VoicePlayerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) audioUrl!: string;
  @Input() fileName?: string;
  @Input() waveform?: number[];
  @Input() isSent: boolean = false;

  private voicePlayerService = inject(VoicePlayerService);
  waveformContainer = viewChild<ElementRef<HTMLDivElement>>('waveformContainer');

  private audio: HTMLAudioElement | null = null;
  isPlayingSignal = signal<boolean>(false);
  currentTimeSignal = signal<number>(0);
  durationSignal = signal<number>(0);
  hoverRatio = signal<number | null>(null);

  get isPlaying(): boolean {
    return this.isPlayingSignal();
  }

  get playbackRate(): number {
    return this.voicePlayerService.playbackRateSignal();
  }

  waveformBars = computed<number[]>(() => {
    if (this.waveform && this.waveform.length >= 10) {
      return this.waveform;
    }
    return this.voicePlayerService.generatePseudoWaveform(this.audioUrl || 'seed', 38);
  });

  currentBarIndex = computed<number>(() => {
    const bars = this.waveformBars();
    const dur = this.durationSignal();
    const curr = this.currentTimeSignal();
    if (!dur || dur <= 0) return -1;
    const ratio = Math.max(0, Math.min(1, curr / dur));
    return Math.floor(ratio * bars.length);
  });

  displayTime = computed<string>(() => {
    const isPlaying = this.isPlayingSignal();
    const curr = this.currentTimeSignal();
    const dur = this.durationSignal();

    if (isPlaying || curr > 0) {
      if (dur > 0) {
        return `${this.voicePlayerService.formatTime(curr)} / ${this.voicePlayerService.formatTime(dur)}`;
      }
      return this.voicePlayerService.formatTime(curr);
    }

    if (dur > 0) {
      return this.voicePlayerService.formatTime(dur);
    }
    return this.fileName || '0:00';
  });

  constructor() {
    // Listen to global voice player stops
    effect(() => {
      const activeUrl = this.voicePlayerService.currentPlayingUrlSignal();
      if (activeUrl !== this.audioUrl && this.isPlayingSignal()) {
        this.pauseAudio();
      }
    });

    // Listen to speed changes
    effect(() => {
      const rate = this.voicePlayerService.playbackRateSignal();
      if (this.audio) {
        this.audio.playbackRate = rate;
      }
    });
  }

  ngOnInit(): void {
    this.initAudio();
  }

  ngOnDestroy(): void {
    this.destroyAudio();
  }

  private initAudio(): void {
    if (!this.audioUrl) return;
    this.audio = new Audio(this.audioUrl);
    this.audio.preload = 'metadata';
    this.audio.playbackRate = this.playbackRate;

    this.audio.onloadedmetadata = () => {
      if (this.audio) {
        this.durationSignal.set(this.audio.duration || 0);
      }
    };

    this.audio.ontimeupdate = () => {
      if (this.audio) {
        this.currentTimeSignal.set(this.audio.currentTime || 0);
      }
    };

    this.audio.onended = () => {
      this.isPlayingSignal.set(false);
      this.currentTimeSignal.set(0);
      this.voicePlayerService.stop(this.audioUrl);
    };

    this.audio.onpause = () => {
      this.isPlayingSignal.set(false);
    };

    this.audio.onplay = () => {
      this.isPlayingSignal.set(true);
      this.voicePlayerService.play(this.audioUrl);
    };
  }

  private destroyAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.voicePlayerService.stop(this.audioUrl);
  }

  togglePlay(): void {
    if (!this.audio) {
      this.initAudio();
    }
    if (!this.audio) return;

    if (this.isPlayingSignal()) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  private playAudio(): void {
    if (!this.audio) return;
    this.audio.playbackRate = this.playbackRate;
    this.audio
      .play()
      .then(() => {
        this.isPlayingSignal.set(true);
      })
      .catch((err) => {
        console.warn('Audio playback error:', err);
      });
  }

  private pauseAudio(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.isPlayingSignal.set(false);
    this.voicePlayerService.stop(this.audioUrl);
  }

  toggleSpeed(): void {
    const newRate = this.voicePlayerService.cyclePlaybackRate();
    if (this.audio) {
      this.audio.playbackRate = newRate;
    }
  }

  onWaveformClick(event: MouseEvent): void {
    const container = this.waveformContainer()?.nativeElement;
    if (!container || !this.audio) return;

    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));

    const dur = this.audio.duration || this.durationSignal();
    if (dur > 0) {
      this.audio.currentTime = ratio * dur;
      this.currentTimeSignal.set(this.audio.currentTime);
      if (!this.isPlayingSignal()) {
        this.playAudio();
      }
    }
  }

  onWaveformMouseMove(event: MouseEvent): void {
    const container = this.waveformContainer()?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.hoverRatio.set(ratio);
  }
}
