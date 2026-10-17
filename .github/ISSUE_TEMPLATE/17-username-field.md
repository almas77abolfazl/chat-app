name: 👤 یوزرنیم (username)
about: اضافه کردن فیلد یوزرنیم به پروفایل کاربر
title: "[FEATURE] Username field"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
افزودن فیلد `username` به مدل کاربر تا کاربران بتوانند یوزرنیم منحصر به فرد داشته باشند و با آن جستجو شوند.

## چرا لازم است
مثل تلگرام، کاربران می‌توانند با یوزرنیم پیدا شوند نه فقط با شماره تلفن.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فیلد `username` به مدل User (unique, optional)
- [ ] API تنظیم یوزرنیم
- [ ] جستجو بر اساس یوزرنیم
- [ ] نمایش یوزرنیم در پروفایل و لیست چت

## فایل‌های مربوطه
- `chat-app-back/src/user/user.entity.ts`
- `chat-app-back/src/user/user.controller.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
بله
