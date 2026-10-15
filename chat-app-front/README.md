# چت‌اپ — فرانت‌اند

فرانت‌اند Angular 19 (standalone components + Material) برای اپلیکیشن چت.

## اجرا

```bash
npm install
npm start        # ng serve روی پورت ۵۵۰۰ با host 0.0.0.0 → http://localhost:5500
```

## آدرس سرور

ادرس بک‌اند در `src/environments/environment.development.ts`:

```ts
export const environment = {
  apiUrl: 'http://localhost:3000/v1',
  socketUrl: 'http://localhost:3000',
};
```

- `environment.development.ts` در حالت توسعه (`ng serve`) استفاده می‌شود
- `environment.ts` در بیلد پروداکشن (`ng build`) استفاده می‌شود
- برای تست روی موبایل در شبکه لوکال، مقادیر را به IP کامپیوتر خودتان (مثل `http://192.168.1.x:3000`) تغییر دهید

## بیلد

```bash
npm run build    # خروجی در dist/chat-app-front
```

## ساختار

| مسیر | توضیح |
|------|-------|
| `src/app/auth/` | صفحات ورود: login، verify-code، fill-names + سرویس/گارد/interceptor |
| `src/app/main/home/` | صفحه اصلی: sidebar، chat-list، chat-area |
| `src/app/main/socket.service.ts` | اتصال WebSocket و رویدادهای دستیار |
| `src/app/main/main.service.ts` | state مرکزی: چت‌ها، پیام‌ها، دستیار هوشمند |
| `src/app/helpers/` | HttpRequestService (آدرس پایه) + CacheService (IndexedDB) |
| `src/app/icons.ts` | ثبت سراسری آیکون‌های FontAwesome |
| `src/environments/` | تنظیمات محیط توسعه و پروداکشن |

## تست

```bash
ng test          # Karma/Jasmine (تست واحدی)
```

تست‌های خود را کنار فایل‌ها با پسوند `.spec.ts` اضافه کنید.
