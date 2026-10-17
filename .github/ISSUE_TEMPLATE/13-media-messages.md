name: 📎 پیام رسانه‌ای (عکس/فایل/ویدیو)
about: امکان ارسال فایل، عکس، ویدیو در چت
title: "[FEATURE] Media messages"
labels: ["feature"]
assignees: ""

## توضیحات
افزودن امکان پیوست فایل، عکس، ویدیو به پیام‌ها. فایل‌ها باید در سرور ذخیره شوند و لینک قابل دانلود باشد.

## چرا لازم است
ویژگی ضروری برای تبادل محتوا در چت.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فیلد `mediaType`, `fileUrl`, `fileName`, `fileSize` به مدل Message
- [ ] آپلود فایل با Multer در بک‌اند
- [ ] نمایش عکس/فایل در UI چت
- [ ] دانلود فایل
- [ ] giới hạn حجم فایل (مثلاً ۲۵ مگابایت)

## فایل‌های مربوطه
- `chat-app-back/src/message/message.entity.ts`
- `chat-app-back/src/message/message.controller.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
خیر
