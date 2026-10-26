# لیست کارها، باگ‌ها و بهبودهای چت‌اپ

> حاصل بازبینی کامل کدبیس (بک‌اند NestJS 11 + MongoDB + Socket.io، فرانت‌اند Angular 22.2) — آخرین بروزرسانی: ۲۰۲۶-۱۰-۲۶

## معماری

- **بک‌اند**: NestJS 11، MongoDB/Mongoose، احراز هویت JWT با OTP تلفنی و Refresh Token، WebSocket با Socket.io، آپلود آواتار با Multer + Sharp + ServeStatic
- **فرانت‌اند**: Angular 22.2 + Material، Socket.io-client، کش آواتار با IndexedDB
- **جریان ورود**: login (شماره تلفن) → OTP → fill-names → home (chat-list + chat-area + side-bar)
- **Agentic**: ماژول `chat-app-back/src/agent` — دستیار هوشمند با ابزارهای tool-calling روی داده‌های خود کاربر

---

## ✅ انجام‌شده در این بازبینی

### نصب، بیلد و راه‌اندازی (رفع مشکلات راه‌اندازی)
- [x] رفع خطای سینتکس (کامای جامانده) در `chat-app-front/angular.json` که مانع هرگونه بیلد یا اجرای فرانت می‌شد
- [x] اصلاح `chat-app-front/Dockerfile` برای اشاره به دایرکتوری خروجی واقعی Angular 22 (`dist/chat-app-front/browser`)
- [x] اصلاح `.vscode/tasks.json` و همگام‌سازی problemMatcher با خروجی جدید `@angular/build` (Vite/esbuild) برای جلوگیری از Hang در F5
- [x] اصلاح `.vscode/launch.json` جهت اجرای cross-platform با `npm run start:debug` به‌جای مسیر مستقیم شل یونیکس
- [x] پیکربندی runner تست فرانت‌اند با Vitest و jsdom در Angular 22 و پیاده‌سازی تست پایه `app.component.spec.ts`
- [x] حذف پکیج منسوخ `crypto` از وابستگی‌های `chat-app-back/package.json` (استفاده از ماژول توکار نود)
- [x] محیط‌های Angular (`environment.ts` + fileReplacements به‌جای IP هاردکد)
- [x] محافظت کامل فایل‌های `.env` در `.gitignore` و حذف فایل‌های آپلود از گیت

### احراز هویت، امنیت و پیامک
- [x] کد OTP تصادفی ۶ رقمی، TTL ۲ دقیقه، همراه با لاگ سرور
- [x] ماژول اختصاصی `SmsModule` با پشتیبانی از Test Mode و سرویس‌دهنده پیامک واقعی
- [x] گارد `RateLimitGuard` روی مسیر `auth/send-code` جهت جلوگیری از اسپم درخواست کد
- [x] پیاده‌سازی کامل endpoint رفرش توکن `POST /auth/refresh`
- [x] اصلاح payload توکن JWT به `{ phoneNumber, sub }`
- [x] خروج امن با `JwtAuthGuard` و شناسه کاربری سرور
- [x] گارد محافظتی روی آواتار کاربر و فیلتر امنیتی ReDoS روی سرچ کاربران

### چت، پیام و ماژول‌ها
- [x] اصلاح ساختار خروجی `GET /chat/list` و شمارنده‌های خوانده‌نشده
- [x] گارد `WsJwtGuard` و اعتبارسنجی اتصالات و پیام‌های WebSocket
- [x] رویدادهای تحویل و خوانده‌شدن پیام (`messageDelivered`, `messageRead`, `chat-read`)
- [x] رویدادهای تایپینگ کاربر (`typingStart`, `typingStop`)
- [x] ماژول واکنش‌ها (Reactions) به پیام‌ها
- [x] ماژول استوری‌ها (`StoryModule`) همراه با آمار بازدیدکنندگان و فید
- [x] تغییر سایز و بهینه‌سازی آواتارها با کتابخانه Sharp قبل از ذخیره

### قابلیت Agentic
- [x] ماژول `agent`: `AgentService` با حلقه tool-calling (حداکثر ۶ تکرار)، `LlmService` سازگار با OpenAI (base URL + key قابل تنظیم)
- [x] ابزارها: `get_chat_list`، `get_chat_history`، `search_messages`، `get_current_time` — همه محدود به داده‌های خود کاربر
- [x] دکمه‌های سریع در UI: خلاصه‌سازی گفتگو / استخراج tasks / پیشنهاد پاسخ
- [x] استریم پاسخ token به token + نمایش badge ابزارها روی WS
- [x] ربات سیستمی (`BotService`) به‌عنوان کاربر واقعی → تاریخچه چت با دستیار ذخیره و load می‌شود
- [x] حالت بدون کلید: پیام راهنمای تنظیم به‌جای کرش
- [x] `POST /agent/message` (غیراستریم) + `GET /agent/status` + `GET /agent/history`

### تست و کیفیت
- [x] ۷۳ تست واحد بک‌اند در ۹ مجموعه تست Jest (عبور ۱۰۰٪)
- [x] ۲ تست واحد فرانت‌اند با Vitest (عبور ۱۰۰٪)
- [x] ESLint بک‌اند: صفر خطا
- [x] بیلد پروداکشن هر دو سمت (NestJS 11 و Angular 22) با موفقیت کامل

---

## 🔜 کارهای پیشنهادی بعدی

### اولویت بالا (P0)
- [ ] تست end-to-end جریان کامل: send-code → verify → chat list → ارسال پیام با Jest E2E (`npm run test:e2e`)

### اولویت متوسط (P1)
- [ ] انتقال توکن از localStorage به حافظه / HttpOnly Cookie
- [ ] نمایش زنده وضعیت تایپینگ (typing indicator) و خوانده‌شدن پیام‌ها در واسط کاربری فرانت‌اند
- [ ] نمایش آنلاین/آفلاین بودن و last-seen در UI
- [ ] کامپوننت اسنک‌بار به‌جای `console.error` در خطاهای فرانت
- [ ] تایمر شمارش معکوس ارسال مجدد کد در صفحه verify-code

### اولویت عمومی (P2)
- [ ] واسط کاربری گروه و کانال در فرانت‌اند
- [ ] ریفکتور `main.service` به استور سیگنال‌محور (Angular Signals)
- [ ] ویرایش/حذف پیام و ارسال فایل چندرسانه‌ای در واسط کاربری فرانت‌اند
- [ ] کانفیگ پایپ‌لاین CI/CD در GitHub Actions
