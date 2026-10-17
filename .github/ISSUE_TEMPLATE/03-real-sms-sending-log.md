name: 📱 لاگ واقعی ارسال SMS
about: اتصال به درگاه پیامک و لاگ واقعی ارسال به جای کد ثابت ۱۲۳۴۵۶
title: "[FEATURE] Real SMS sending log"
labels: ["feature"]
assignees: ""

## توضیحات
فعلا کد TOTP ثابت `123456` است و در لاگ سرور نمایش داده می‌شود. نیاز به اتصال به درگاه پیامک واقعی و لاگ-safe ارسال کد.

## چرا لازم است
برای استفاده در محیط Production نیاز به سرویس پیامک واقعی و لاگ seguro است.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] تنظیمات درگاه SMS در `.env` (API_KEY, BASE_URL, SENDER)
- [ ] سرویس `SmsService` با integrate به درگاه پیامک
- [ ] لاگ واقعی ارسال (بدون نمایش کد در پاسخ API)
- [ ] حالت شبیه‌سازی (test mode) برای توسعه بدون پرداخت هزینه

## فایل‌های مربوطه
- `chat-app-back/src/auth/auth.service.ts`
- `chat-app-back/src/auth/dto/send-code.dto.ts`
- `chat-app-back/.env.example`

## good first issue
خیر
