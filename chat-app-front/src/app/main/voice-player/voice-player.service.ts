import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VoicePlayerService {
  readonly currentPlayingUrlSignal = signal<string | null>(null);
  readonly playbackRateSignal = signal<number>(1);

  play(url: string): void {
    this.currentPlayingUrlSignal.set(url);
  }

  stop(url?: string): void {
    if (!url || this.currentPlayingUrlSignal() === url) {
      this.currentPlayingUrlSignal.set(null);
    }
  }

  cyclePlaybackRate(): number {
    const rates = [1, 1.5, 2];
    const current = this.playbackRateSignal();
    const nextIdx = (rates.indexOf(current) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    this.playbackRateSignal.set(nextRate);
    return nextRate;
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  generatePseudoWaveform(seed: string, count = 38): number[] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }

    const waveform: number[] = [];
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random peak using sine and hash
      const val = Math.abs(Math.sin((i + 1) * 0.45 + (hash % 100)) * 0.65 + Math.cos(i * 0.2) * 0.35);
      const normalized = Math.round(18 + val * 78);
      waveform.push(Math.max(15, Math.min(95, normalized)));
    }
    return waveform;
  }
}
