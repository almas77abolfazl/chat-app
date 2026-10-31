import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export type Language = 'en' | 'fa' | 'ar' | string;

export interface TranslationData {
  [key: string]: any;
}

const RTL_LANGUAGES = new Set(['fa', 'ar', 'he', 'ur']);

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly currentLang = signal<Language>(this.getInitialLanguage());
  readonly translations = signal<TranslationData>({});
  readonly loading = signal<boolean>(true);
  readonly isRTL = computed(() => RTL_LANGUAGES.has(this.currentLang()));

  readonly translations$ = toObservable(this.translations);
  readonly currentLang$ = toObservable(this.currentLang);
  readonly loading$ = toObservable(this.loading);

  private activeLoadPromise: Promise<void> | null = null;
  private activeLoadLang: Language | null = null;

  constructor(private http: HttpClient) {
    const initialLang = this.currentLang();
    if (typeof document !== 'undefined') {
      document.documentElement.dir = RTL_LANGUAGES.has(initialLang) ? 'rtl' : 'ltr';
      document.documentElement.lang = initialLang;
    }
    this.loadLanguage(initialLang);
  }

  private getInitialLanguage(): Language {
    const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('lang') as Language | null) : null;
    if (saved) return saved;
    const browserLang = typeof navigator !== 'undefined' ? (navigator.language || (navigator as any).userLanguage) : null;
    if (browserLang?.startsWith('fa')) return 'fa';
    if (browserLang?.startsWith('ar')) return 'ar';
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
          const isRtl = RTL_LANGUAGES.has(lang);
          document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }
      } catch (e) {
        console.error(`Failed to load translations for ${lang}`, e);
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
    if (!key) return '';
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
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
    }
    return value;
  }

  translate(key: string, params?: Record<string, string | number>): string {
    return this.t(key, params);
  }

  translateError(error: any): string {
    if (!error) return this.t('errors.COMMON_INTERNAL_ERROR') || 'Error occurred';

    // 1. Check for structured errorCode
    const errorCode = error?.error?.errorCode || error?.errorCode;
    if (errorCode) {
      const translationKey = `errors.${errorCode}`;
      const translated = this.t(translationKey, error?.error?.args || error?.args);
      if (translated && translated !== translationKey) {
        return translated;
      }
    }

    // 2. Check for class-validator array
    if (Array.isArray(error?.error?.errors) && error.error.errors.length > 0) {
      return error.error.errors[0];
    }
    if (Array.isArray(error?.error?.message) && error.error.message.length > 0) {
      return error.error.message[0];
    }

    // 3. Check for error message
    const message = error?.error?.message || error?.message;
    if (typeof message === 'string' && message.trim()) {
      const translated = this.t(message);
      if (translated && translated !== message) {
        return translated;
      }
      return message;
    }

    return this.t('errors.COMMON_INTERNAL_ERROR') || 'Error occurred';
  }
}
