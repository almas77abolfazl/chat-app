name: 👥 کنترلر و گارد گروه و کانال
about: اضافه کردن کنترلر، DTO و گارد عضویت برای گروه و کانال
title: "[FEATURE] Group and channel controller + guard"
labels: ["feature"]
assignees: ""

## توضیvements
سرویس‌های گروه و کانال وجود دارند اما کنترلر/API و گارد عضویت ناقص است. نیاز به CRUD کامل گروه و کانال و اعتبارسنجی عضویت.

## چرا لازم است
یک ویژگی پایه برای چت گروهی و کانالهای newscast.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] کنترلر گروه (create, add member, remove member, leave)
- [ ] کنترلر کانال (create, subscribe, unsubscribe)
- [ ] گارد عضویت برای چت/group/channel
- [ ] DTOهای مربوطه با validation

## فایل‌های مربوطه
- `chat-app-back/src/group/`
- `chat-app-back/src/channel/`
- `chat-app-back/src/chat/chat.controller.ts`

## good first issue
خیر
