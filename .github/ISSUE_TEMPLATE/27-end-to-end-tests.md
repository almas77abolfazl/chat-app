name: 🧪 تست end-to-end
about: اضافه کردن تست یکپارچه برای جریان کامل برنامه
title: "[TEST] End-to-end tests"
labels: ["test"]
assignees: ""

## توضیحات
تست جریان کامل: ارسال کد → تأیید → لاگین → لیست چت → ارسال پیام. نیاز به MongoDB در CI.

## چرا لازم است
اطمینان از که تمام بخش‌های برنامه با هم صحیح کار می‌کنند.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فایل تست e2e برای جریان کامل
- [ ] تنظیم MongoDB در CI (docker-compose یا memdown)
- [ ] تست ارسال و دریافت پیام از طریق WebSocket
- [ ] تست احراز هویت کامل

## فایل‌های مربوطه
- `chat-app-back/test/`
- `chat-app-back/.env.example`

## good first issue
خیر
