import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

export type Language = 'en' | 'fa';

export interface TranslationData {
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private translations: TranslationData = {};
  private translationsSubject = new BehaviorSubject<TranslationData>({});
  translations$ = this.translationsSubject.asObservable();
  private currentLangSubject = new BehaviorSubject<Language>(this.getInitialLanguage());
  currentLang$ = this.currentLangSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  private activeLoadPromise: Promise<void> | null = null;
  private activeLoadLang: Language | null = null;

  constructor(private http: HttpClient) {
    const initialLang = this.currentLangSubject.value;
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

  get currentLang(): Language {
    return this.currentLangSubject.value;
  }

  get isRTL(): boolean {
    return this.currentLangSubject.value === 'fa';
  }

  async loadLanguage(lang: Language): Promise<void> {
    if (this.activeLoadPromise && this.activeLoadLang === lang) {
      return this.activeLoadPromise;
    }

    this.activeLoadLang = lang;
    this.loadingSubject.next(true);

    this.activeLoadPromise = (async () => {
      try {
        const res = await firstValueFrom(
          this.http.get<TranslationData>(`assets/i18n/${lang}.json`)
        );
        this.translations = res;
        this.currentLangSubject.next(lang);
        this.translationsSubject.next(res);
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
        this.loadingSubject.next(false);
        this.activeLoadPromise = null;
        this.activeLoadLang = null;
      }
    })();

    return this.activeLoadPromise;
  }

  switchLanguage(): Language {
    const next: Language = this.currentLang === 'en' ? 'fa' : 'en';
    this.loadLanguage(next);
    return next;
  }

  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = this.translations;
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