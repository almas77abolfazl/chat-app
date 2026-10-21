import { Pipe, PipeTransform, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { TranslationService } from './translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'i18n',
  pure: false,
  standalone: true,
})
export class I18nPipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private langSubscription: Subscription;

  constructor() {
    this.langSubscription = this.translationService.translations$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translationService.t(key, params);
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }
}