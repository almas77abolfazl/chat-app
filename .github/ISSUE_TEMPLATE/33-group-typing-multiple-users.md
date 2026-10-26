name: ✍️ نمایش وضعیت تایپینگ چند کاربر در گروه‌ها
about: تفکیک و نمایش نام تمام افرادی که هم‌زمان در یک گروه تایپ می‌کنند
title: "[ENHANCEMENT] Granular group typing indicator for multiple participants"
labels: ["enhancement", "socket"]
assignees: ""

## توضیحات
در حال حاضر در صورت تایپ در گروه، فقط یک پیام کلی نمایش داده می‌شود. اگر چند عضو گروه به شکل هم‌زمان در حال نوشتن باشند، وضعیت باید نام آن‌ها را ترکیب کند: برای ۱ نفر: «علی در حال نوشتن است...»، برای ۲ نفر: «علی و رضا در حال نوشتن هستند...» و برای بیش از ۲ نفر: «علی، رضا و ۲ نفر دیگر در حال نوشتن هستند...».

## چرا لازم است
ارتقای حس زنده بودن و شفافیت در تعاملات گفتگوهای گروهی و جلوگیری از ارسال پیام‌های هم‌پوشان و تکراری.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] برادکست رویداد `typing` با مشخصات فرستنده شامل `userId` و `userName` به اتاق گفتگو
- [ ] نگهداری مَپ کاربران تایپ‌کننده در فرانت‌اند با تایمر ابطال ۳ ثانیه‌ای برای هر کاربر
- [ ] فرمت‌بندی هوشمند متن وضعیت در هدر یا بالای اینپوت گفتگو بر اساس زبان انتخابی (فارسی و انگلیسی)
- [ ] انیمیشن نقطه‌چین سه‌تایی متحرک کنار نام افراد

## فایل‌های مربوطه
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.html`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.scss`

## good first issue
بله
