name: 📁 پوشه‌بندی سفارشی گفتگوها (Chat Folders)
about: امکان ساخت پوشه‌های دلخواه مانند «کاری»، «دوستان» و مدیریت تب‌های بالای لیست چت
title: "[FEATURE] User-defined custom chat folders & tabs"
labels: ["feature", "ui/ux"]
assignees: ""

## توضیحات
کاربر باید بتواند پوشه‌های دلخواه بسازد، نام و آیکون برای آن‌ها انتخاب کند و مشخص کند چه چت‌هایی (شخصی، گروهی، کانال یا کاربران خاص) در آن پوشه قرار گیرند. تب‌های بالای لیست چت به صورت داینامیک این پوشه‌ها را همراه با بج پیام‌های خوانده‌نشده همان پوشه نمایش دهند.

## چرا لازم است
با افزایش تعداد چت‌ها، کانال‌ها و گروه‌ها، محیط چت به شدت شلوغ می‌شود و پوشه‌بندی یکی از کلیدی‌ترین امکانات تلگرام برای دسته‌بندی و ساماندهی پیام‌هاست.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فیلد `folders: [{ _id, name, icon, includedChatIds, includedTypes }]` در مدل User
- [ ] اندپوئینت‌های CRUD پوشه‌ها: `POST /user/folders`، `PUT /user/folders/:id`، `DELETE /user/folders/:id`
- [ ] مودال ساخت و ویرایش پوشه در فرانت‌اند با قابلیت انتخاب چت‌ها
- [ ] رندر داینامیک تب‌های پوشه در بالای لیست گفتگوها (`chat-list.component`)
- [ ] محاسبه نشانگر خوانده‌نشده‌ها (Unread Badge) به تفکیک هر پوشه

## فایل‌های مربوطه
- `chat-app-back/src/user/entities/user.entity.ts`
- `chat-app-back/src/user/user.service.ts`
- `chat-app-back/src/user/user.controller.ts`
- `chat-app-front/src/app/main/home/chat-list/chat-list.component.html`
- `chat-app-front/src/app/main/home/chat-list/chat-list.component.ts`

## good first issue
خیر
