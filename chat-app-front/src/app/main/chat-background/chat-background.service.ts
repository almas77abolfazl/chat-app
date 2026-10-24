import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

export type ChatBackgroundType = 'solid' | 'gradient' | 'wallpaper';

export interface ChatBackground {
  type: ChatBackgroundType;
  value: string;
  name: string;
}

export const CHAT_BACKGROUNDS: ChatBackground[] = [
  { type: 'solid', value: 'var(--color-surface-container)', name: 'solid' },
  { type: 'gradient', value: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-deep) 100%)', name: 'gradient' },
  { type: 'gradient', value: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, var(--color-bg)) 0%, var(--color-bg) 100%)', name: 'telegram-subtle' },
  { type: 'gradient', value: 'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 70%), linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-deep) 100%)', name: 'ambient' },
  { type: 'wallpaper', value: 'radial-gradient(ellipse at top left, color-mix(in srgb, var(--color-primary) 15%, transparent), transparent 50%), radial-gradient(ellipse at bottom right, color-mix(in srgb, #6366f1 12%, transparent), transparent 50%), var(--color-bg)', name: 'modern-mesh' },
];

@Injectable({ providedIn: 'root' })
export class ChatBackgroundService {
  readonly currentBg = signal<ChatBackground>(this.getInitialBackground());
  readonly bg$ = toObservable(this.currentBg);

  constructor() {
    this.applyBackground(this.currentBg());
  }

  private getInitialBackground(): ChatBackground {
    if (typeof localStorage === 'undefined') return CHAT_BACKGROUNDS[0];
    const saved = localStorage.getItem('chat_bg');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatBackground;
        if (parsed.type && parsed.value && !parsed.value.includes('chat-bg-')) return parsed;
      } catch (e) {
        // fallback to default
      }
    }
    return CHAT_BACKGROUNDS[0];
  }

  get current(): ChatBackground {
    return this.currentBg();
  }

  setBackground(bg: ChatBackground): void {
    this.currentBg.set(bg);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chat_bg', JSON.stringify(bg));
    }
    this.applyBackground(bg);
  }

  applyCurrent(): void {
    this.applyBackground(this.currentBg());
  }

  private applyBackground(bg: ChatBackground): void {
    if (typeof document === 'undefined') return;
    const container = document.querySelector('.chat-area-container') as HTMLElement | null;
    if (!container) return;
    const el = container as HTMLElement;

    if (bg.type === 'solid') {
      el.style.removeProperty('background-image');
      el.style.backgroundColor = bg.value;
    } else if (bg.type === 'gradient') {
      el.style.backgroundImage = bg.value;
      el.style.removeProperty('background-color');
    } else if (bg.type === 'wallpaper') {
      el.style.backgroundImage = bg.value;
      el.style.backgroundRepeat = 'repeat';
      el.style.backgroundSize = 'auto';
    }
  }
}
