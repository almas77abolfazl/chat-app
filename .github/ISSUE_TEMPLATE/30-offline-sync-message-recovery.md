name: 🔄 همگام‌سازی خودکار و بازیابی پیام‌ها پس از قطع و وصل اینترنت
about: بازیابی پیام‌های از دست رفته در زمان قطعی سوکت با ارسال آخرین پیام دریافتی
title: "[ENHANCEMENT] Real-time offline message recovery & auto-sync"
labels: ["enhancement", "socket", "reliability"]
assignees: ""

## توضیحات
در صورت قطعی چند ثانیه‌ای اینترنت یا بسته شدن اتصال وب‌سوکت، پیام‌هایی که در این فاصله ارسال شده‌اند به دست کلاینت نمی‌رسند مگر آنکه صفحه Refresh شود. سیستم باید بلافاصله پس از رویداد `reconnect` سوکت، آیدی یا زمان آخرین پیام دریافتی (`lastMessageTimestamp` یا `lastMessageId`) را به سرور ارسال کند تا سرور تمام پیام‌های جدیدتر را به شکل یکجا تحویل دهد.

## چرا لازم است
قابلیت اطمینان (Reliability) ستون فقرات هر چت‌اپ است؛ از دست رفتن پیام‌ها به دلیل نوسان اتصال اینترنت باعث بی‌اعتمادی کاربران می‌شود.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] ذخیره شناسه/تایم‌استمپ آخرین پیام در حافظه کلاینت برای هر گفتگوی فعال
- [ ] رویداد هندلر `reconnect` در `SocketService` فرانت‌اند
- [ ] هندلر `syncMissedMessages` در `MessageGateway` بک‌اند برای بازگرداندن پیام‌های `createdAt > lastKnownTime`
- [ ] به‌روزرسانی بدون چشمک زدن (flicker-free) لیست پیام‌ها در UI
- [ ] مدیریت صف پیام‌های خروجی فرانت در زمان قطعی (Optimistic UI) با استیت `pending` و ارسال خودکار پس از وصل شدن

## فایل‌های مربوطه
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-back/src/message/message.service.ts`
- `chat-app-front/src/app/helpers/socket.service.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
خیر
