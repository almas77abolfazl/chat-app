name: ⚡ اسکرول مجازی برای پیام‌ها و چت‌های سنگین (Virtual Scrolling)
about: بهینه‌سازی رندر تاریخچه چت با Angular CDK Virtual Scroll برای جلوگیری از افت فریم
title: "[PERFORMANCE] Virtual scrolling for heavy chat history"
labels: ["performance", "frontend"]
assignees: ""

## توضیحات
در چت‌هایی با صدها یا هزاران پیام، رندر هم‌زمان تمام نودهای DOM باعث افت شدید FPS، کندی اسکرول و مصرف بالای حافظه رم مرورگر می‌شود. با بهره‌گیری از `@angular/cdk/scrolling` (CdkVirtualScrollViewport)، فقط پیام‌های حاضر در کادر دید کاربر رندر شده و بقیه پیام‌ها در حافظه نگهداری می‌شوند.

## چرا لازم است
تضمین عملکرد ۶۰ فریم بر ثانیه (Smooth Scrolling) حتی در گروه‌های شلوغ و چت‌های طولانی چند ماهه بر روی دستگاه‌های ضعیف و موبایل.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] نصب و پیاده‌سازی `ScrollingModule` در کامپوننت `chat-area`
- [ ] مدیریت ابعاد متغیر پیام‌ها (ارتفاع پیام‌های متنی، ویدیویی، عکس‌ها و ویس‌ها)
- [ ] حفظ موقعیت دقیق اسکرول هنگام لود پیام‌های قدیمی‌تر (Infinite Scroll Upwards)
- [ ] عملکرد صحیح دکمه «پرش به پایین» (Scroll to bottom)
- [ ] باز شدن و اسکرول نرم به پیام ریپلای شده یا نتیجه جستجو

## فایل‌های مربوطه
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.html`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.scss`

## good first issue
خیر
