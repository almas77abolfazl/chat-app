name: 🖼️ Resize آواتار با sharp
about: کاهش اندازه تصویر آواتار قبل از ذخیره با sharp
title: "[ENHANCEMENT] Resize avatar with sharp"
labels: ["enhancement"]
assignees: ""

## توضیحات
عکس‌های آواتار قبل از ذخیره resize شوند تا فضای ذخیره‌سازی کمتری بگیرند و بارگذاری سریع‌تر شود.

## چرا لازم است
جلوگیری از ذخیره عکس‌های بزرگ و بهینه‌سازی bandwidth.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] نصب `sharp` در بک‌اند
- [ ] middleware resize قبل از ذخیره آواتار (مثلاً ۲۰۰×۲۰۰)
- [ ] حفظ نسبت ابعاد و کیفیت قابل قبول

## فایل‌های مربوطه
- `chat-app-back/src/user/user.service.ts`
- `chat-app-back/src/auth/auth.controller.ts`

## good first issue
خیر
