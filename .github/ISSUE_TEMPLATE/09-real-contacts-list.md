name: 👥 مخاطبین واقعی
about: جایگزینی لیست mock contacts با مخاطبین واقعی از دیتابیس
title: "[FEATURE] Real contacts list"
labels: ["feature"]
assignees: ""

## توضیحات
در حال حاضر لیست مخاطبین در ContactsComponent mock است. نیاز به دریافت مخاطبین واقعی از بک‌اند (کاربران که با کاربر چت داشته‌اند یا مخاطبین ذخیره شده).

## چرا لازم است
یک ویژگی پایه برای پیدا کردن و چت با مخاطبین.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] API `/user/contacts` برای دریافت مخاطبین
- [ ] ذخیره مخاطبین در دیتابیس (مثلاً مدل Contact یا استفاده از چت‌های وجود داشته)
- [ ] نمایش مخاطبین در UI
- [ ] جستجو در مخاطبین

## فایل‌های مربوطه
- `chat-app-back/src/user/user.controller.ts`
- `chat-app-front/src/app/main/contacts/contacts.component.ts`

## good first issue
خیر
