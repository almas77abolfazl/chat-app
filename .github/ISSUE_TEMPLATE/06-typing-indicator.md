name: ⌨️ تایپینگ ایندیکاتور
about: نمایش "در حال تایپ..." وقتی کاربر در حال نوشتن پیام است
title: "[FEATURE] Typing indicator"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
هنگامی که کاربر در یک چت پیام تایپ می‌کند، سایر اعضا می‌بینند "در حال تایپ..." یا نام کاربر + "در حال تایپ...".

## چرا لازم است
تجربه چت بهتر و آگاه‌بودن از فعالیت طرف مقابل در لحظه.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] رویداد WebSocket `typingStart` و `typingStop`
- [ ] debounce برای جلوگیری از ارسال تکراری (مثلاً ۵۰۰ms)
- [ ] نمایش "در حال تایپ..." در UI چت
- [ ] پاک کردن تایپینگ وقتی پیام ارسال شد

## فایل‌های مربوطه
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
بله
