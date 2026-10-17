name: ✅ تیک وضعیت پیام (ارسال/رسیده/خوانده)
about: اضافه کردن تیک وضعیت به هر پیام (یک تیک=ارسال، دو تیک=رسیده، دو تیک رنگی=خوانده)
title: "[FEATURE] Message status ticks"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
هر پیام باید وضعیت `sent` / `delivered` / `read` داشته باشد که در UI به صورت تیک نمایش داده شود (یک تیک خاکستری، دو تیک خاکستری، دو تیک آبی/رنگی).

## چرا لازم است
کاربران می‌دانند پیامشان رسیده است یا خیر، و خوانده شده است یا خیر.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فیلد `status` به مدل Message اضافه شود (sent/delivered/read)
- [ ] WebSocket رویداد `messageDelivered` و `messageRead` اضافه شود
- [ ] نمایش تیک در UI پیام‌ها (فرانت‌اند)
- [ ]APi برای علامت‌گذاری پیام به عنوان خوانده

## فایل‌های مربوطه
- `chat-app-back/src/message/message.entity.ts`
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
بله
