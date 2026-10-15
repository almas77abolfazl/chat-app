# لیست کارها، باگ‌ها و بهبودهای چت‌اپ

> حاصل بازبینی کامل کدبیس (بک‌اند NestJS 10 + MongoDB + Socket.io، فرانت‌اند Angular 19) — وضعیت: ۲۰۲۶-۱۰-15

## معماری

- **بک‌اند**: NestJS 10، MongoDB/Mongoose، احراز هویت JWT با OTP تلفنی، WebSocket با Socket.io، آپلود آواتار با Multer + ServeStatic
- **فرانت‌اند**: Angular 19 + Material، Socket.io-client، کش آواتار با IndexedDB
- **جریان ورود**: login (شماره تلفن) → OTP → fill-names → home (chat-list + chat-area + side-bar)
- **Agentic**: ماژول `chat-app-back/src/agent` — دستیار هوشمند با ابزارهای tool-calling روی داده‌های خود کاربر

---

## ✅ انجام‌شده در این بازبینی

### نصب و بیلد (قبلاً Fail می‌شد)
- [x] بک‌اند: `@nestjs/serve-static@5` به Nest 11 نیاز داشت → پین به ۴.۰.۱
- [x] فرانت‌اند: `fontawesome@0.15` و `ngx-socket-io@4.7` با Angular 19 ناسازگار بودند → fontawesome به ۱.۰.۰، حذف `ngx-socket-io` (استفاده نمی‌شد) و افزودن صریح `socket.io-client`
- [x] محیط‌های Angular (`environment.ts` + fileReplacements به‌جای IP هاردکد)
- [x] پرچم `.env` در ریشه ریپو به `.gitignore` اضافه شد (فایل `.env` واقعی محافظت نمی‌شد)

### باگ‌های P0 احراز هویت و امنیت
- [x] B1: کد OTP هاردکد `123456` و برگردانده شدن در پاسخ API → کد تصادفی ۶ رقمی، TTL ۲ دقیقه، فقط در لاگ سرور
- [x] B2: `new BadRequestException()` بدون throw → اکنون با throw واقعی (۴۰۰)
- [x] B5: `createUser` بدون await → await شد (رفع رِیس)
- [x] S2: payload توکن شامل کد تأیید → اکنون فقط `{ phoneNumber, sub }`
- [x] B7: logout بدون گارد + هویت از هدر کلاینت → JwtAuthGuard + `request.user._id`
- [x] B6: ErrorInterceptor همه خطاها را ۵۰۰ می‌کرد → بازنویسی: HttpException دست‌نخورده، خطاهای ناشناخته ۵۰۰، CastError/ValidationError → ۴۰۰
- [x] S3: `GET /user/:id/avatar` بدون گارد → JwtAuthGuard
- [x] S4: جستجوی کاربران با RegExp خام (ReDoS) → Escape + limit + ٹریم
- [x] کنترلرهای اسكافولد گروه/کانال که کاملاً بدون احراز هویت و غیرکاربردی بودند → حذف شدند (سرویس‌ها باقی ماندند)
- [x] import اشتباه `Channel` از `diagnostics_channel` نود → entity واقعی

### باگ‌های P0 چت و پیام
- [x] B3: `GET /chat/list` همیشه کرش می‌کرد (`participants[0]` روی آبجکت) → بازنویسی chat.service/controller با shape سازگار با فرانت
- [x] B4: `unreadCounts.get()` روی آبجکت ساده → بررسی نوع Map/object
- [x] S5: `unreadCounts` می‌توانست NaN شود → محاسبه امن
- [x] WS بدون اعتبارسنجی: گارد `WsJwtGuard`، رد اتصال بدون توکن، اعتبارسنجی receiver/content، خطا به کلاینت برگردانده می‌شود
- [x] F9: `message.controller` خطا را با ۲۰۰۰ برمی‌گرداند → اکنون exception واقعی
- [x] فایل `message.getaway.ts` (تایپو) → `message.gateway.ts`

### باگ‌های P0 فرانت‌اند
- [x] F1: کرش `chatItem.messageCount = 0` روی چت جدید از جستجو
- [x] F2: هر رفتن به /home یک socket و لیسنر جدید → چرخه حیات با OnDestroy + `listenToMessages` یک‌بار
- [x] F3: ذخیره نشدن نام/بیو در ادیت پروفایل → فراخوانی `user/updateUserNames` + افزودن `bio` به DTO و سرویس
- [x] F4: صفحه‌بندی پیام‌ها برعکس (ابتدا قدیمی‌ترین) → سورت نزولی بک‌اند + حفظ موقعیت scroll + بارگذاری فقط با اسکرول به بالا
- [x] F5: `alert()` روی هر خطا → حذف (TODO: اسنک‌بار)
- [x] F6: guard باعث ناوبری عارضه → `createUrlTree`
- [x] F7: جستجو با string concat → `encodeURIComponent`
- [x] تایپو `user-firsName` در localStorage → `user-firstName`
- [x] `isLoggedIn` همیشه truthy (async Promise) → همگام‌سازی

### قابلیت Agentic (جدید)
- [x] ماژول `agent`: `AgentService` با حلقه tool-calling (حداکثر ۶ تکرار)، `LlmService` سازگار با OpenAI (base URL + key قابل تنظیم)
- [x] ابزارها: `get_chat_list`، `get_chat_history`، `search_messages`، `get_current_time` — همه محدود به داده‌های خود کاربر
- [x] دکمه‌های سریع در UI: خلاصه گفتگو / استخراج tasks / پیشنهاد پاسخ
- [x] استریم پاسخ token به token + نمایش badge ابزارها روی WS
- [x] ربات سیستمی (`BotService`) به‌عنوان کاربر واقعی → تاریخچه چت با دستیار ذخیره و load می‌شود
- [x] حالت بدون کلید: پیام راهنمای تنظیم به‌جای کرش
- [x] `POST /agent/message` (غیراستریم) + `GET /agent/status`

### تست و کیفیت
- [x] ۱۵ تست واحد عبور دادند (auth: ۸، agent: ۷) — اولین تست‌های پروژه
- [x] ESLint بک‌اند: از ۸۶ خطا → صفر
- [x] بیلد پروداکشن هر دو سمت موفق

### پولیش UI
- [x] دیزاین سیستم در `styles.scss` (توکن رنگ/سایه/شعاع، انیمیشن ورود پیام، اسکرول‌بار)
- [x] بازطراحی: لاگین/تأیید کد/تکمیل پروفایل (کارت گرادیانی)، سایدبار (برند + آیتم دستیار)، لیست چت (آواتار، فعال،بَج خوانده‌نشده)، ناحیه چت (حباب‌های مدرن، نوار ابزار دستیار، تایپینگ)، دیالوگ پروفایل/ادیت/مخاطبان
- [x] فارسی‌سازی fill-names و contacts

---

## 🔜 کارهای باقی‌مانده (به ترتیب اولویت)

### P0
- [ ] تست end-to-end جریان کامل: send-code → verify → chat list → ارسال پیام (نیاز به MongoDB — نصب در CI)
- [ ] فایل‌های آپلود committed شده (`chat-app-back/uploads/avatars/*.jpg`) را از گیت خارج کنید: `git rm -r --cached chat-app-back/uploads`
- [ ] Rate limit روی `auth/send-code` (جلوگیری از اسپم) + لاگ واقعی ارسال SMS (درگاه پیامک)

### P1
- [ ] توکن در localStorage (XSS) → انتقال به حافظه یا HttpOnly cookie + مسیر واقعی refresh token (اندที่ไม่ `/auth/refreshToken` وجود ندارد پیاده شود: ذخیره‌شده در DB است ولی استفاده نمی‌شود)
- [ ] typing indicator / delivered / read receipt روی WS
- [ ] آنلاین و last-seen
- [ ] اسنک‌بار به جای console.error در فرانت (تجربه خطای بهتر)
- [ ] تایمر ارسال مجدد کد در صفحه verify-code
- [ ] مخاطبین واقعی به‌جای لیست mock در contacts
- [ ] تاریخچه چت دستیار در سایدبار (الان فقط از چت لیست)

### P2
- [ ] گروه و کانال: مدل‌ها و سرویس‌ها هستند؛ کنترلر/واسط/گارد عضویت نیاز است
- [ ] `main.service` به استور سیگنال‌محور (signals) refractor شود
- [ ] ویرایش/حذف پیام، پیام رسانه‌ای (فایل/عکس)
- [ ] ایندکس‌های MongoDB: `participants`، `{sender, receiver, createdAt}`
- [ ] resize آواتار با sharp قبل از ذخیره
- [ ] CI/CD (GitHub Actions: install + lint + test + build)
- [ ] PWA/نوتیفیکیشن
