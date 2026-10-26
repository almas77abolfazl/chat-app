name: 🔗 پیش‌نمایش خودکار پیوندها (OpenGraph Link Preview)
about: استخراج تصویر، عنوان و توضیحات لینک‌های اینترنتی داخل پیام و نمایش کارت پیش‌نمایش
title: "[FEATURE] Automatic URL link preview with OpenGraph metadata"
labels: ["feature", "chat"]
assignees: ""

## توضیحات
وقتی در متن پیام یک لینک وب (مانند یوتیوب، آپارات، سایت‌های خبری، گیت‌هاب و...) وجود دارد، سرور باید با خواندن تگ‌های OpenGraph (`og:title`, `og:description`, `og:image`) یا تگ‌های پایه HTML متادیتای صفحه را خوانده و یک کارت پیش‌نمایش تمیز زیر پیام رندر کند.

## چرا لازم است
کاربران پیش از کلیک روی لینک، متوجه محتوای آن می‌شوند و ظاهر پیام‌ها شبیه تلگرام و شبکه‌های اجتماعی مدرن و غنی می‌شود.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] سرویس اسکرپ و کَش متادیتا در بک‌اند با پشتیبانی از کتابخانه کم‌حجم مانند `open-graph-scraper`
- [ ] افزودن فیلد `linkPreview?: { url, title, description, image, siteName }` به مدل Message
- [ ] ذخیره متادیتا در دیتابیس برای جلوگیری از ارسال مکرر ریکوئست به سایت مقصد
- [ ] پیش‌نمایش آنی حین تایپ یا دکمه حذف پیش‌نمایش (Dismiss preview) قبل از فشردن دکمه ارسال پیام
- [ ] طراحی کارت زیبا در فرانت شامل تصویر بندانگشتی، عنوان بولد و دامنه سایت

## فایل‌های مربوطه
- `chat-app-back/src/message/message.service.ts`
- `chat-app-back/src/message/entities/message.entity.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.html`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.scss`

## good first issue
بله

