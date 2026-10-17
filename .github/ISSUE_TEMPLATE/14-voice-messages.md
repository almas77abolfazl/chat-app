name: 🎤 پیام ویس (voice message)
about: امکان ضبط و ارسال پیام صوتی در چت
title: "[FEATURE] Voice messages"
labels: ["feature"]
assignees: ""

## توضیحات
امکان ضبط صدا و ارسال به عنوان پیام Voice (مثل تلگرام) با نمایش پلیر صوتی در چت.

## چرا لازم است
ویژگی محبوب در برنامه‌های چت مدرن.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] ضبط صدا در فرانت‌اند (MediaRecorder API)
- [ ] آپلود فایل صوتی به بک‌اند
- [ ] نمایش پلیر صوتی در UI
- [ ] 필د `mediaType: voice` در مدل Message

## فایل‌های مربوطه
- `chat-app-back/src/message/message.entity.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
خیر
