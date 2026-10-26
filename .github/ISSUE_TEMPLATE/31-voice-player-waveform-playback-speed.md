name: 🎙️ پخش‌کننده ویس پیشرفته همراه با شکل‌موج (Waveform) و سرعت ۲x
about: پلیر مدرن پیام‌های صوتی با قابلیت اسکراب، شکل‌موج فرکانس و تغییر سرعت پخش
title: "[FEATURE] Advanced voice message player with waveform and 1.5x/2x speed control"
labels: ["feature", "media", "ui/ux"]
assignees: ""

## توضیحات
جایگزینی تگ صوتی معمولی مرورگر با یک پخش‌کننده تلگرامی مدرن برای پیام‌های صوتی. هنگام ضبط یا دریافت، دیتای دامنه فرکانسی (Peak values / Waveform) ذخیره و به شکل میله‌های صوتی زیبا کشیده شود. کاربر باید بتواند روی میله‌ها کلیک کند تا به زمان مورد نظر بپرد و دکمه تغییر سرعت (۱x / ۱.۵x / ۲x) برای شنیدن سریع‌تر ویس‌ها در دسترس باشد.

## چرا لازم است
پیام‌های صوتی طولانی در چت بسیار رایج هستند و امکان شنیدن با سرعت ۲x و دیدن نوار موجی صدا یکی از محبوب‌ترین امکانات پیام‌رسان‌های مطرح است.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] استخراج آرایه Waveform (مثلاً ۳۰ الی ۵۰ میله دامنه عددی بین ۰ تا ۱۰۰) حین ضبط ویس در فرانت‌اند با Web Audio API
- [ ] ذخیره آرایه `waveform?: number[]` در فیلد مدیا دیتابیس
- [ ] رندر میله‌های صوتی (Waveform Bars) با رنگ دوگانه برای زمان طی‌شده و زمان باقی‌مانده
- [ ] دکمه سرعت پخش `1x` -> `1.5x` -> `2x` با تغییر خصیصه `playbackRate` المان Audio
- [ ] زمان‌سنج دقیق (مثلاً `0:14 / 1:28`)

## فایل‌های مربوطه
- `chat-app-front/src/app/main/voice-recorder/voice-recorder.component.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.html`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.scss`
- `chat-app-back/src/message/entities/message.entity.ts`

## good first issue
خیر
