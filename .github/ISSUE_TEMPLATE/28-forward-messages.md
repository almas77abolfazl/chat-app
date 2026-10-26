name: ↗️ فوروارد پیام‌ها (فردی و گروهی)
about: امکان فوروارد کردن یک یا چند پیام به سایر چت‌ها، گروه‌ها و پیام‌های ذخیره‌شده
title: "[FEATURE] Forward messages (single & multi) to chats, groups, and saved messages"
labels: ["feature", "chat"]
assignees: ""

## توضیحات
کاربران باید بتوانند یک یا چند پیام را انتخاب کرده و به چت دیگر، گروه، کانال یا «پیام‌های ذخیره‌شده» فوروارد کنند. بالای پیام فوروارد شده باید نام فرستنده اصلی با تگ «فوروارد شده از ...» نمایش داده شود و با کلیک روی نام فرستنده، پروفایل یا چت او باز شود.

## چرا لازم است
یکی از اساسی‌ترین و پرکاربردترین قابلیت‌های هر پلتفرم پیام‌رسان استاندارد (مانند تلگرام). اشتراک‌گذاری سریع اطلاعات بین گفتگوها بدون نیاز به کپی یا دانلود مجدد فایل‌ها.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] افزودن فیلد `forwardFrom: { user: ObjectId, originalSenderName: string }` به مدل Message در بک‌اند
- [ ] اضافه شدن دکمه «فوروارد» به منوی اکشن پیام و کلیک راست
- [ ] باز شدن مودال انتخاب مقصد (لیست مخاطبین و گروه‌ها با قابلیت جستجو)
- [ ] قابلیت فوروارد هم‌زمان چند پیام انتخابی با ترتیب زمانی درست
- [ ] عدم نیاز به آپلود مجدد فایل‌ها و مدیاها در فوروارد (ارجاع به URL موجود)
- [ ] نمایش کادر بالای حباب پیام: "فوروارد شده از [نام فرستنده]" با آیکون فلش

## فایل‌های مربوطه
- `chat-app-back/src/message/entities/message.entity.ts`
- `chat-app-back/src/message/message.service.ts`
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.html`
- `chat-app-front/src/app/main/main.service.ts`

## good first issue
خیر

