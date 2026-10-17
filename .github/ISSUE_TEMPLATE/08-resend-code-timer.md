name: ⏱️ تایمر ارسال مجدد کد
about: اضافه کردن تایمر countdown برای ارسال مجدد کد تایید در صفحه verify-code
title: "[FEATURE] Resend code timer"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
در صفحه تأیید کد، دکمه "ارسال مجدد کد" باید برای مدتی (مثلاً ۶۰ ثانية) غیرفعال باشد و تایمر countdown نمایش دهد.

## چرا لازم است
جلوگیری از درخواست تکراری و تجربه کاربری بهتر.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] دکمه ارسال مجدد برای ۶۰ ثانية غیرفعال باشد
- [ ] نمایش تایمر countdown روی دکمه
- [ ] بعد از اتمام تایمر، دکمه فعال شود
- [ ] API بررسی کند که کد قبلی منقضی نشده باشد

## فایل‌های مربوطه
- `chat-app-front/src/app/auth/`
- `chat-app-back/src/auth/auth.controller.ts`

## good first issue
بله
