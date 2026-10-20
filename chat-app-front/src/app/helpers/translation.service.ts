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

  constructor(private http: HttpClient) {
    this.loadLanguage(this.currentLangSubject.value);
  }

  private getInitialLanguage(): Language {
    const saved = localStorage.getItem('lang') as Language | null;
    if (saved === 'en' || saved === 'fa') return saved;
    const browserLang = navigator.language || (navigator as any).userLanguage;
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
    this.loadingSubject.next(true);
    try {
      const res = await firstValueFrom(
        this.http.get<TranslationData>(`assets/i18n/${lang}.json`)
      );
      this.translations = res;
      this.translationsSubject.next(res);
      this.currentLangSubject.next(lang);
      localStorage.setItem('lang', lang);
      document.documentElement.dir = this.isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    } catch (e) {
      console.error('Failed to load translations', e);
    } finally {
      this.loadingSubject.next(false);
    }
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