import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

export type ChatBackgroundType = 'solid' | 'gradient' | 'pattern' | 'custom';

export interface ChatBackground {
  id: string;
  type: ChatBackgroundType;
  value: string; // CSS color, gradient, svg data-uri, or custom data-url
  name: string;
  preview?: string;
  blur?: number; // 0 to 20px
  dim?: number;  // 0 to 80%
}

// Telegram-grade curated, subtle patterns with low opacity and balanced pastel/ambient tones
const DOODLE_PATTERN_SVG = `data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.08' fill-rule='evenodd'%3E%3Cpath d='M25 25c2-4 8-4 10 0l2 4 4 1c4 1 4 7 0 9l-4 2-1 4c-1 4-7 4-9 0l-2-4-4-1c-4-1-4-7 0-9l4-2 1-4zm70 50c2-4 8-4 10 0l2 4 4 1c4 1 4 7 0 9l-4 2-1 4c-1 4-7 4-9 0l-2-4-4-1c-4-1-4-7 0-9l4-2 1-4zm-45 35c1.5-3 6-3 7.5 0l1.5 3 3 .8c3 .8 3 5.2 0 6.8l-3 1.5-.8 3c-.8 3-5.2 3-6.8 0l-1.5-3-3-.8c-3-.8-3-5.2 0-6.8l3-1.5.8-3zM95 20a6 6 0 1 1-12 0 6 6 0 0 1 12 0zm-75 75a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm95 20a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM50 15a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm60 50a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM20 50a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'/%3E%3C/g%3E%3C/svg%3E`;

const CELESTIAL_STARS_SVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='30,12 32,24 45,26 34,33 38,46 27,38 15,44 21,32 13,24 26,23'/%3E%3Cpolygon points='88,70 89.5,78 98,79.5 91,84 93,92.5 86.5,87 79,91 83,83.5 77.5,78 86,77'/%3E%3Ccircle cx='88' cy='24' r='2'/%3E%3Ccircle cx='24' cy='88' r='2.5'/%3E%3Ccircle cx='60' cy='52' r='1.5'/%3E%3Ccircle cx='100' cy='48' r='1.2'/%3E%3Ccircle cx='42' cy='100' r='1.8'/%3E%3C/g%3E%3C/svg%3E`;

const GEOMETRIC_HEX_SVG = `data:image/svg+xml,%3Csvg width='90' height='90' viewBox='0 0 90 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23ffffff' stroke-width='1.2' stroke-opacity='0.09' fill='none'%3E%3Cpolygon points='45,6 78,25 78,65 45,84 12,65 12,25'/%3E%3Cpolygon points='45,20 67,33 67,55 45,68 23,55 23,33'/%3E%3Ccircle cx='45' cy='45' r='5' fill='%23ffffff' fill-opacity='0.08'/%3E%3C/g%3E%3C/svg%3E`;

const CYBER_GRID_SVG = `data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.07'%3E%3Cpath d='M25 0v50M0 25h50'/%3E%3Ccircle cx='25' cy='25' r='6' stroke-dasharray='2,2'/%3E%3Ccircle cx='25' cy='25' r='1.5' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/g%3E%3C/svg%3E`;

export const CHAT_BACKGROUNDS: ChatBackground[] = [
  {
    id: 'solid-default',
    type: 'solid',
    value: 'var(--color-surface-container)',
    name: 'solid',
    preview: 'var(--color-surface-container)',
  },
  {
    id: 'pattern-telegram-classic',
    type: 'pattern',
    value: `url("${DOODLE_PATTERN_SVG}"), linear-gradient(145deg, #719ec2 0%, #87a7c7 50%, #9cbacf 100%)`,
    name: 'telegram-classic',
    preview: 'linear-gradient(145deg, #719ec2, #9cbacf)',
  },
  {
    id: 'pattern-warm-sand',
    type: 'pattern',
    value: `url("${DOODLE_PATTERN_SVG}"), linear-gradient(145deg, #cfc5b8 0%, #d8cfc4 50%, #e2dcd4 100%)`,
    name: 'warm-sand',
    preview: 'linear-gradient(145deg, #cfc5b8, #e2dcd4)',
  },
  {
    id: 'gradient-soft-slate',
    type: 'gradient',
    value: 'linear-gradient(160deg, #334155 0%, #1e293b 60%, #0f172a 100%)',
    name: 'soft-slate',
    preview: 'linear-gradient(160deg, #334155, #0f172a)',
  },
  {
    id: 'pattern-sage',
    type: 'pattern',
    value: `url("${DOODLE_PATTERN_SVG}"), linear-gradient(145deg, #5b8276 0%, #466b5f 100%)`,
    name: 'sage-forest',
    preview: 'linear-gradient(145deg, #5b8276, #466b5f)',
  },
  {
    id: 'pattern-stars',
    type: 'pattern',
    value: `url("${CELESTIAL_STARS_SVG}"), linear-gradient(145deg, #1e2538 0%, #151a27 100%)`,
    name: 'midnight-stars',
    preview: 'linear-gradient(145deg, #1e2538, #151a27)',
  },
  {
    id: 'pattern-hex',
    type: 'pattern',
    value: `url("${GEOMETRIC_HEX_SVG}"), linear-gradient(145deg, #2a2e3f 0%, #1c202d 100%)`,
    name: 'charcoal-hex',
    preview: 'linear-gradient(145deg, #2a2e3f, #1c202d)',
  },
  {
    id: 'gradient-twilight',
    type: 'gradient',
    value: 'linear-gradient(145deg, #475569 0%, #374151 50%, #1f2937 100%)',
    name: 'twilight',
    preview: 'linear-gradient(145deg, #475569, #1f2937)',
  },
  {
    id: 'pattern-cyber',
    type: 'pattern',
    value: `url("${CYBER_GRID_SVG}"), linear-gradient(145deg, #111827 0%, #030712 100%)`,
    name: 'dark-cyber',
    preview: 'linear-gradient(145deg, #111827, #030712)',
  },
];

@Injectable({ providedIn: 'root' })
export class ChatBackgroundService {
  readonly currentBg = signal<ChatBackground>(this.getInitialBackground());
  readonly bg$ = toObservable(this.currentBg);

  readonly blur = signal<number>(0);
  readonly dim = signal<number>(0);

  constructor() {
    const initial = this.currentBg();
    this.blur.set(initial.blur || 0);
    this.dim.set(initial.dim || 0);
  }

  private getInitialBackground(): ChatBackground {
    if (typeof localStorage === 'undefined') return CHAT_BACKGROUNDS[0];
    const saved = localStorage.getItem('chat_bg');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatBackground;
        if (parsed.value) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return CHAT_BACKGROUNDS[0];
  }

  get current(): ChatBackground {
    return this.currentBg();
  }

  setBackground(bg: ChatBackground): void {
    const updated: ChatBackground = {
      ...bg,
      blur: this.blur(),
      dim: this.dim(),
    };
    this.currentBg.set(updated);
    this.saveToStorage(updated);
  }

  setBlur(val: number): void {
    this.blur.set(val);
    const updated = { ...this.currentBg(), blur: val };
    this.currentBg.set(updated);
    this.saveToStorage(updated);
  }

  setDim(val: number): void {
    this.dim.set(val);
    const updated = { ...this.currentBg(), dim: val };
    this.currentBg.set(updated);
    this.saveToStorage(updated);
  }

  setCustomImage(dataUrl: string): void {
    const customBg: ChatBackground = {
      id: 'custom-upload',
      type: 'custom',
      value: `url("${dataUrl}")`,
      name: 'custom',
      preview: `url("${dataUrl}")`,
      blur: this.blur(),
      dim: this.dim(),
    };
    this.currentBg.set(customBg);
    this.saveToStorage(customBg);
  }

  private saveToStorage(bg: ChatBackground): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('chat_bg', JSON.stringify(bg));
      } catch (err) {
        console.warn('Could not save wallpaper to localStorage (exceeded quota?)', err);
      }
    }
  }
}
