name: 🔔 سنackbar در فرانت‌اند
about: جایگزینی console.error با سنackbar برای نمایش خطا به کاربر
title: "[FEATURE] Snackbar in frontend"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
در حال حاضر خطاها با `console.error` نمایش داده می‌شوند. نیاز به سنackbar (Material Snackbar) برای نمایش خطا و پیام‌های موفقیت به کاربر.

## چرا لازم است
تجربه کاربری بهتر و نمی‌بایست کاربر به کنسول مرورگر دسترسی داشته باشد تا خطا ببیند.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] سرویس Snackbar در Angular اضافه شود
- [ ] جایگزینی تمام `console.error` در فرانت‌اند با Snackbar
- [ ] نمایش خطای شبکه، احراز هویت، و ارسال پیام
- [ ] انعطاف‌پذیری برای پیام‌های سفارشی

## فایل‌های مربوطه
- `chat-app-front/src/app/helpers/`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
بله
