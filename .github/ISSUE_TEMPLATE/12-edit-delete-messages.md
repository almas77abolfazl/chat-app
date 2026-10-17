name: ✏️🗑️ ویرایش و حذف پیام
about: امکان ویرایش و حذف پیام‌های ارسالی
title: "[FEATURE] Edit and delete messages"
labels: ["feature"]
assignees: ""

## توضیحات
کاربران باید بتوانند پیام‌های خود را Edit کنند یا Delete کنند. پیام‌های حذف شده باید با علامت "این پیام حذف شد" نمایش داده شوند.

## چرا لازم است
واحد از ویژگی‌های مهم هر برنامه چت.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فیلد `editedAt` و `deletedAt` به مدل Message
- [ ] API `/message/:id/edit` و `/message/:id/delete`
- [ ] فقط فرستنده می‌تواند Edit/Delete کند
- [ ] نمایش "Edit" یا "Deleted" در UI
- [ ] WebSocket رویداد برای broadcast Edit/Delete

## فایل‌های مربوطه
- `chat-app-back/src/message/message.entity.ts`
- `chat-app-back/src/message/message.controller.ts`
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
خیر
