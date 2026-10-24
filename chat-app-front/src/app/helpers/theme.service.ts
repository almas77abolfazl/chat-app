import { Injectable, signal, computed, effect } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.getInitialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');
  readonly theme$ = toObservable(this.theme);

  constructor() {
    this.applyTheme(this.theme());
  }

  private getInitialTheme(): Theme {
    if (typeof localStorage === 'undefined') return 'light';
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  toggleTheme(): Theme {
    const next: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    return next;
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);
  }
}
