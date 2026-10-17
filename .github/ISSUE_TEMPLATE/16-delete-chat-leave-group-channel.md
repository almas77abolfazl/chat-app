name: ❌ حذف چت (۱-به-۱) و خروج از گروه/کانال
about: امکان حذف چت 개인 و خروج از گروه یا کانال
title: "[FEATURE] Delete chat + leave group/channel"
labels: ["feature", "good first issue"]
assignees: ""

## توضیحات
کاربران باید بتوانند چت ۱-به-۱ را حذف کنند (delete for me) و از گروه/کانال خارج شوند (leave).

## چرا لازم است
مدیریت لیست چت و خروج از گروه‌ها که کاربر دیگر علاقه‌مند نیست.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] API `/chat/:id/delete` برای حذف چت ۱-به-۱
- [ ] API `/chat/:id/leave` برای خروج از گروه/کانال
- [ ] فقط ادمین می‌تواند عضو را حذف کند (گروه)
- [ ] نمایش/پنهان‌سازی چت در لیست بعد از حذف
- [ ] WebSocket رویداد برای broadcast leave/delete

## فایل‌های مربوطه
- `chat-app-back/src/chat/chat.controller.ts`
- `chat-app-back/src/chat/chat.service.ts`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
بله
