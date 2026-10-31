import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('TranslationService & Full-Stack i18n (Issue #94)', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TranslationService],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TranslationService);

    // Initial load from constructor
    const req = httpMock.expectOne((r) => r.url.startsWith('assets/i18n/'));
    req.flush({
      common: { close: 'Close', cancel: 'Cancel' },
      chat: { you: 'You', user: 'User' },
      system: {
        youCreatedGroup: 'You created the group',
        userCreatedGroup: '{actor} created the group',
      },
      errors: {
        CHAT_NOT_FOUND: 'Chat not found',
        CHAT_SAVED_MESSAGES_CANNOT_BE_DELETED: 'Cannot delete saved messages chat',
        COMMON_INTERNAL_ERROR: 'An error occurred',
      },
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should translate nested keys with parameter substitution', () => {
    expect(service.t('common.close')).toBe('Close');
    expect(service.t('system.userCreatedGroup', { actor: 'Alice' })).toBe('Alice created the group');
    expect(service.t('non.existent.key')).toBe('non.existent.key');
  });

  it('should correctly detect RTL and LTR languages', async () => {
    // English load
    const enPromise = service.loadLanguage('en');
    const enReq = httpMock.expectOne('assets/i18n/en.json');
    enReq.flush({ common: { close: 'Close' } });
    await enPromise;

    expect(service.isRTL()).toBe(false);
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');

    // Arabic load
    const arPromise = service.loadLanguage('ar');
    const arReq = httpMock.expectOne('assets/i18n/ar.json');
    arReq.flush({ common: { close: 'إغلاق' } });
    await arPromise;

    expect(service.isRTL()).toBe(true);
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('should translate backend error codes using errors.<errorCode>', () => {
    const errorWithCode = {
      error: {
        errorCode: 'CHAT_SAVED_MESSAGES_CANNOT_BE_DELETED',
        message: 'Cannot delete saved messages chat',
      },
    };
    expect(service.translateError(errorWithCode)).toBe('Cannot delete saved messages chat');

    const validationError = {
      error: {
        errors: ['Name should not be empty'],
      },
    };
    expect(service.translateError(validationError)).toBe('Name should not be empty');

    const unknownError = {
      error: {
        message: 'Something broke',
      },
    };
    expect(service.translateError(unknownError)).toBe('Something broke');
  });
});

