name: 🟢 وضعیت آنلاین و last-seen کاربران
about: نمایش وضعیت آنلاین و آخرین زمان seen کاربر در چت و پروفایل
title: "[FEATURE] Online status and last-seen"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
افزودن فیلد `isOnline` و `lastSeen` به مدل کاربر، و نمایش آن در لیست چت و پروفایل. وقتی کاربر فعال است،zeigt است "آنلاین" و در غیر این صورت "آخرین seen: X".

## چرا لازم است
یک ویژگی بسیار پایه در برنامه‌های چت مثل تلگرام. کاربران می‌دانند contrasting-side فعال است یا خیر.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فیلد `isOnline` و `lastSeen` به مدل User اضافه شود
- [ ] WebSocket `connected` / `disconnected` وضعیت آنلاین را آپدیت کند
- [ ] نمایش "آنلاین" یا "آخرین seen" در لیست چت و پروفایل
- [ ] API `/user/:id/status` برای دریافت وضعیت

## فایل‌های مربوطه
- `chat-app-back/src/user/user.entity.ts`
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
بله
