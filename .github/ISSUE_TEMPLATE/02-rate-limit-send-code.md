name: 🚫 محدودیت نرخ ارسال کد SMS
about: اضافه کردن rate limit به endpoint ارسال کد تایید برای جلوگیری از اسپم
title: "[FEATURE] Rate limit on auth/send-code"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
افزودن محدودیت نرخ (rate limit) به endpoint `auth/send-code` تا کاربران نتوانند درخواست‌های تکراری برای دریافت کد SMS بفرستند.

## چرا لازم است
جلوگیری از اسپم، تحمل barrage درخواست، و conservación هزینه ارسال پیامک.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] Rate limit روی `POST /auth/send-code` اضافه شود (مثلاً ۳ درخواست در ۱ دقیقه برای هر شماره)
- [ ] اگر محدودیت عبور شود، پاسخ 429 برگردانده شود
- [ ] لاگ laboral از درخواست‌های rate-limited ذخیره شود
- [ ] تست واحد برای rate limit اضافه شود

## فایل‌های مربوطه
- `chat-app-back/src/auth/auth.controller.ts`
- `chat-app-back/src/auth/auth.service.ts`
- `chat-app-back/src/auth/dto/send-code.dto.ts`

## good first issue
بله
