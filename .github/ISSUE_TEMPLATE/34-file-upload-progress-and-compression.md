name: 📊 نوار درصد پیشرفت آپلود و فشرده‌سازی تصاویر قبل از ارسال
about: نمایش درصد آپلود فایل‌ها و فشرده‌سازی هوشمند تصاویر در کلاینت برای افزایش سرعت
title: "[ENHANCEMENT] Client-side image compression and upload progress indicator"
labels: ["enhancement", "performance", "media"]
assignees: ""

## توضیحات
هنگام ارسال عکس‌ها و ویدیوهای حجیم، کاربر هیچ فیدبکی از درصد پیشرفت ارسال ندارد. با استفاده از رویدادهای `HttpEventType.UploadProgress` در آنگولار، نوار پیشرفت حلقوی یا درصدی روی تصویر در حال ارسال نمایش داده شود. همچنین تصاویر دوربین یا گالری قبل از آپلود در مرورگر با ابعاد بهینه و فرمت WebP فشرده شوند تا حجم آن‌ها تا ۷۰٪ بدون افت کیفیت کاهش یابد.

## چرا لازم است
صرفه‌جویی بالا در پهنای باند سرور و اینترنت کاربر و جلوگیری از سردرگمی کاربر حین آپلود فایل‌های سنگین در اینترنت‌های با سرعت پایین.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فعال کردن `reportProgress: true` در درخواست‌های HTTP آپلود فایل
- [ ] اضافه شدن نوار پیشرفت حلقوی/خطی به کارت پیام حین آپلود
- [ ] امکان لغو آپلود با زدن دکمه ضربدر روی فایل در حال ارسال
- [ ] فشرده‌سازی خودکار تصاویر بزرگتر از ۲ مگابایت با Canvas مرورگر قبل از اضافه شدن به FormData
- [ ] هندلینگ خطای قطع اینترنت وسط آپلود با دکمه تلاش مجدد (Retry)

## فایل‌های مربوطه
- `chat-app-front/src/app/main/main.service.ts`
- `chat-app-front/src/app/helpers/http-request.service.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.html`

## good first issue
بله

