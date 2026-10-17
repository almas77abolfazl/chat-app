name: 📬 نوتیفیکیشن
about: اضافه کردن نوتیفیکیشن برای پیام‌های جدید
title: "[FEATURE] Notifications"
labels: ["feature"]
assignees: ""

## توضیحات
نوتیفیکیشن برای پیام‌های جدید وقتی کاربر در برنامه نیست یا چت بسته است. می‌تواند push notification یا نوتیفیکیشن داخل‌برنامه باشد.

## چرا لازم است
آگاه کردن کاربر از پیام‌های جدید بدون اینکه برنامه باز باشد.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] نوتیفیکیشن داخل‌برنامه (in-app) برای پیام جدید
- [ ] تنظیمات نوتیفیکیشن (روشن/خاموش)
- [ ] (اختیاری) push notification با Firebase یا یک سرویس similear

## فایل‌های مربوطه
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
خیر
