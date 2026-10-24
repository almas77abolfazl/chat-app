import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export type Language = 'en' | 'fa';

export interface TranslationData {
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly currentLang = signal<Language>(this.getInitialLanguage());
  readonly translations = signal<TranslationData>({});
  readonly loading = signal<boolean>(true);
  readonly isRTL = computed(() => this.currentLang() === 'fa');

  readonly translations$ = toObservable(this.translations);
  readonly currentLang$ = toObservable(this.currentLang);
  readonly loading$ = toObservable(this.loading);

  private activeLoadPromise: Promise<void> | null = null;
  private activeLoadLang: Language | null = null;

  constructor(private http: HttpClient) {
    const initialLang = this.currentLang();
    if (typeof document !== 'undefined') {
      document.documentElement.dir = initialLang === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = initialLang;
    }
    this.loadLanguage(initialLang);
  }

  private getInitialLanguage(): Language {
    const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('lang') as Language | null) : null;
    if (saved === 'en' || saved === 'fa') return saved;
    const browserLang = typeof navigator !== 'undefined' ? (navigator.language || (navigator as any).userLanguage) : null;
    if (browserLang?.startsWith('fa')) return 'fa';
    return 'en';
  }

  async loadLanguage(lang: Language): Promise<void> {
    if (this.activeLoadPromise && this.activeLoadLang === lang) {
      return this.activeLoadPromise;
    }

    this.activeLoadLang = lang;
    this.loading.set(true);

    this.activeLoadPromise = (async () => {
      try {
        const res = await firstValueFrom(
          this.http.get<TranslationData>(`assets/i18n/${lang}.json`)
        );
        this.translations.set(res || {});
        this.currentLang.set(lang);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('lang', lang);
        }
        if (typeof document !== 'undefined') {
          document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }
      } catch (e) {
        console.error('Failed to load translations', e);
      } finally {
        this.loading.set(false);
        this.activeLoadPromise = null;
        this.activeLoadLang = null;
      }
    })();

    return this.activeLoadPromise;
  }

  switchLanguage(): Language {
    const next: Language = this.currentLang() === 'en' ? 'fa' : 'en';
    this.loadLanguage(next);
    return next;
  }

  t(key: string, params?: Record<string, string | number>): string {
    const data = this.translations();
    const keys = key.split('.');
    let value: any = data;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return key;
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] || ''));
    }
    return value;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    return this.t(key, params);
  }
}
