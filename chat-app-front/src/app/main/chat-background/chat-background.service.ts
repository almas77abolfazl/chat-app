import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ChatBackgroundType = 'solid' | 'gradient' | 'wallpaper';

export interface ChatBackground {
  type: ChatBackgroundType;
  value: string;
  name: string;
}

export const CHAT_BACKGROUNDS: ChatBackground[] = [
  { type: 'solid', value: 'var(--color-surface-container)', name: 'solid' },
  { type: 'gradient', value: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-deep) 100%)', name: 'gradient' },
  { type: 'wallpaper', value: 'url("/chat-bg-1.jpg")', name: 'wallpaper-1' },
  { type: 'wallpaper', value: 'url("/chat-bg-2.jpg")', name: 'wallpaper-2' },
  { type: 'wallpaper', value: 'url("/chat-bg-3.jpg")', name: 'wallpaper-3' },
];

@Injectable({ providedIn: 'root' })
export class ChatBackgroundService {
  private bgSubject = new BehaviorSubject<ChatBackground>(this.getInitialBackground());
  bg$ = this.bgSubject.asObservable();

  constructor() {
    this.applyBackground(this.bgSubject.value);
  }

  private getInitialBackground(): ChatBackground {
    const saved = localStorage.getItem('chat_bg');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatBackground;
        if (parsed.type && parsed.value) return parsed;
      } catch (e) {
        // fallback to default
      }
    }
    return CHAT_BACKGROUNDS[0];
  }

  get current(): ChatBackground {
    return this.bgSubject.value;
  }

  setBackground(bg: ChatBackground): void {
    this.bgSubject.next(bg);
    localStorage.setItem('chat_bg', JSON.stringify(bg));
    this.applyBackground(bg);
  }

  private applyBackground(bg: ChatBackground): void {
    const container = document.querySelector('.chat-area-container') as HTMLElement | null;
    if (!container) return;
    const el = container as HTMLElement;

    if (bg.type === 'solid') {
      el.style.removeProperty('background-image');
      el.style.backgroundColor = bg.value;
    } else if (bg.type === 'gradient') {
      el.style.removeProperty('background-color');
      el.style.backgroundImage = bg.value;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundAttachment = 'fixed';
    } else {
      el.style.removeProperty('background-color');
      el.style.backgroundImage = bg.value;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundAttachment = 'fixed';
    }
  }
}
