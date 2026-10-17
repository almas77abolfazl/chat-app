name: 🗄️ اندیس‌های MongoDB
about: اضافه کردن اندیس مناسب برای بهین‌بُن dancer کوئری‌های دیتابیس
title: "[ENHANCEMENT] MongoDB indexes"
labels: ["enhancement"]
assignees: ""

## توضیحات
اضافه کردن اندیس به فیلدهای مهم برای بهینه‌سازی کوئری‌ها: `participants` در چت، `{sender, receiver, createdAt}` در پیام.

## چرا لازم است
بهبود عملکرد در حجم داده زیاد و سرعت کوئری‌های चت و پیام.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] اندیس `participants` در مدل Chat
- [ ] اندیس `{sender, receiver, createdAt}` در مدل Message
- [ ] اندیس `phoneNumber` در مدل User (unique)
- [ ] تست عملکرد کوئری‌ها

## فایل‌های مربوطه
- `chat-app-back/src/chat/entities/chat.entity.ts`
- `chat-app-back/src/message/entities/message.entity.ts`
- `chat-app-back/src/user/entities/user.entity.ts`

## good first issue
خیر
