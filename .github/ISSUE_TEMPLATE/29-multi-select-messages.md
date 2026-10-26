name: ☑️ انتخاب چندتایی پیام‌ها برای حذف و فوروارد گروهی
about: حالت Multi-select پیام‌ها با نوار ابزار پایین برای انجام عملیات دسته‌جمعی
title: "[FEATURE] Multi-select messages for bulk delete and bulk forward"
labels: ["feature", "ui/ux"]
assignees: ""

## توضیحات
امکان انتخاب چندین پیام به صورت هم‌زمان با کلیک راست و زدن «انتخاب پیام‌ها» یا کلیک روی چک‌باکس کنار حباب پیام. پس از ورود به حالت انتخاب، یک نوار شناور در پایین یا بالای صفحه فعال می‌شود که تعداد پیام‌های انتخاب شده را نشان می‌دهد و دکمه‌های «حذف انتخاب‌شده‌ها» و «فوروارد انتخاب‌شده‌ها» را ارائه می‌کند.

## چرا لازم است
حذف یا انتقال پیام‌ها به صورت تک‌تک بسیار زمان‌بر و خسته‌کننده است و این قابلیت تجربه کاربری چت را کاملاً متحول و روان می‌کند.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فعال‌سازی حالت Selection Mode با منوی کلیک‌راست یا دابل‌کلیک/انتخاب پیام
- [ ] نمایش دایره/چک‌باکس انیمیشنی کنار هر پیام در حالت انتخاب
- [ ] نوار عملیات شناور (Bottom Action Bar) با گزینه‌های: لغو انتخاب، تعداد انتخاب‌شده‌ها، دکمه سطل زباله (حذف گروهی)، دکمه فوروارد
- [ ] پشتیبانی از خروج از حالت انتخاب با زدن کلید Esc یا دکمه ضربدر
- [ ] اتصال به API حذف گروهی پیام‌ها (`deleteMany`) در بک‌اند

## فایل‌های مربوطه
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.html`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.scss`
- `chat-app-back/src/message/message.controller.ts`
- `chat-app-back/src/message/message.service.ts`

## good first issue
بله
