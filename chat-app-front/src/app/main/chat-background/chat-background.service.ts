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

// Telegram-inspired high-fidelity patterns using crisp SVG data-URIs
const DOODLE_PATTERN_SVG = `data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23259cd8' fill-opacity='0.16' fill-rule='evenodd'%3E%3Cpath d='M20 20c2-4 8-4 10 0l2 4 4 1c4 1 4 7 0 9l-4 2-1 4c-1 4-7 4-9 0l-2-4-4-1c-4-1-4-7 0-9l4-2 1-4zm60 40c2-4 8-4 10 0l2 4 4 1c4 1 4 7 0 9l-4 2-1 4c-1 4-7 4-9 0l-2-4-4-1c-4-1-4-7 0-9l4-2 1-4zm-40 30c1.5-3 6-3 7.5 0l1.5 3 3 .8c3 .8 3 5.2 0 6.8l-3 1.5-.8 3c-.8 3-5.2 3-6.8 0l-1.5-3-3-.8c-3-.8-3-5.2 0-6.8l3-1.5.8-3zM85 15a6 6 0 1 1-12 0 6 6 0 0 1 12 0zm-70 70a5 5 0 1 1-10 0 5 5 0 0 1 10 0zm90 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM45 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm55 45a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM15 45a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'/%3E%3C/g%3E%3C/svg%3E`;

const CELESTIAL_STARS_SVG = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2393c5fd' fill-opacity='0.22'%3E%3Cpolygon points='25,10 27,21 38,23 29,29 32,40 23,33 13,38 18,28 11,21 22,20'/%3E%3Cpolygon points='75,60 76.5,68 85,69.5 78,74 80,82.5 73.5,77 66,81 70,73.5 64.5,68 73,67'/%3E%3Ccircle cx='75' cy='20' r='2'/%3E%3Ccircle cx='20' cy='75' r='2.5'/%3E%3Ccircle cx='50' cy='45' r='1.5'/%3E%3Ccircle cx='85' cy='40' r='1.2'/%3E%3Ccircle cx='35' cy='85' r='1.8'/%3E%3C/g%3E%3C/svg%3E`;

const GEOMETRIC_HEX_SVG = `data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23818cf8' stroke-width='1.2' stroke-opacity='0.18' fill='none'%3E%3Cpolygon points='40,5 70,22.5 70,57.5 40,75 10,57.5 10,22.5'/%3E%3Cpolygon points='40,18 60,30 60,50 40,62 20,50 20,30'/%3E%3Ccircle cx='40' cy='40' r='6' fill='%23818cf8' fill-opacity='0.15'/%3E%3C/g%3E%3C/svg%3E`;

const CYBER_GRID_SVG = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2306b6d4' stroke-width='1' stroke-opacity='0.16'%3E%3Cpath d='M30 0v60M0 30h60'/%3E%3Ccircle cx='30' cy='30' r='8' stroke-dasharray='2,2'/%3E%3Ccircle cx='30' cy='30' r='2' fill='%2306b6d4' fill-opacity='0.25'/%3E%3C/g%3E%3C/svg%3E`;

export const CHAT_BACKGROUNDS: ChatBackground[] = [
  {
    id: 'solid-default',
    type: 'solid',
    value: 'var(--color-surface-container)',
    name: 'solid',
    preview: 'var(--color-surface-container)',
  },
  {
    id: 'gradient-ambient',
    type: 'gradient',
    value: 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-deep) 100%)',
    name: 'ambient',
    preview: 'linear-gradient(135deg, #1e293b, #0f172a)',
  },
  {
    id: 'gradient-telegram',
    type: 'gradient',
    value: 'linear-gradient(135deg, #0d84c7 0%, #0369a1 50%, #075985 100%)',
    name: 'telegram-sky',
    preview: 'linear-gradient(135deg, #0d84c7, #075985)',
  },
  {
    id: 'gradient-sunset',
    type: 'gradient',
    value: 'linear-gradient(135deg, #db2777 0%, #9333ea 50%, #4f46e5 100%)',
    name: 'neon-sunset',
    preview: 'linear-gradient(135deg, #db2777, #4f46e5)',
  },
  {
    id: 'gradient-emerald',
    type: 'gradient',
    value: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #115e59 100%)',
    name: 'deep-emerald',
    preview: 'linear-gradient(135deg, #059669, #115e59)',
  },
  {
    id: 'pattern-doodle',
    type: 'pattern',
    value: `url("${DOODLE_PATTERN_SVG}"), linear-gradient(135deg, #0e7490 0%, #155e75 100%)`,
    name: 'doodle-pattern',
    preview: 'linear-gradient(135deg, #0e7490, #155e75)',
  },
  {
    id: 'pattern-stars',
    type: 'pattern',
    value: `url("${CELESTIAL_STARS_SVG}"), linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e293b 100%)`,
    name: 'stars-pattern',
    preview: 'linear-gradient(135deg, #1e1b4b, #312e81)',
  },
  {
    id: 'pattern-hex',
    type: 'pattern',
    value: `url("${GEOMETRIC_HEX_SVG}"), linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%)`,
    name: 'geometric-hex',
    preview: 'linear-gradient(135deg, #3730a3, #1e1b4b)',
  },
  {
    id: 'pattern-cyber',
    type: 'pattern',
    value: `url("${CYBER_GRID_SVG}"), linear-gradient(135deg, #0f172a 0%, #082f49 100%)`,
    name: 'cyber-grid',
    preview: 'linear-gradient(135deg, #0f172a, #082f49)',
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
