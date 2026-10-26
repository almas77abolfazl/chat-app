# چت‌اپ — Chat App

اپلیکیشن چت Real-time با **NestJS 11** و **Angular 22** و **دستیار هوشمند Agentic**.

[English below](#english)

## امکانات

- **چت Real-time** با WebSocket (Socket.io) و بازیابی هوشمند در نوسانات شبکه
- **ورود بین‌المللی با شماره تلفن** با انتخاب پیش‌شماره کشورها، خمیرکردن هوشمند کد ۶ رقمی OTP و احراز هویت JWT
- **لیست گفتگوها و پوشه‌بندی** (گروه‌ها، کانال‌ها، ربات‌ها، پیام‌های ذخیره‌شده دائمی)
- **ارسال انواع مدیا**: پیام‌های متنی، تصاویر، ویدیو، استیکر، گیف و پیام صوتی (Voice Recorder)
- **ارسال مستقیم عکس از کلیپ‌بورد با Ctrl+V** در محیط چت
- **سیستم استوری‌های ۲۴ ساعته**: متن و مدیا، آمار بازدید، مکث با نگه‌داشتن دست، حفظ حریم خصوصی فقط برای مخاطبین و باز شدن مستقیم پروفایل فرد با کلیک روی نام او
- **حفظ حریم خصوصی پیشرفته شماره تلفن**: عدم افشای شماره تلفن به غریبه‌ها و کنترل خودکار نمایش بر اساس آگاهی قبلی مخاطب
- **نمایه و پروفایل کاربری مدرن تلگرامی** با گرادیان‌های داینامیک، امکان افزودن به مخاطبین و مدیریت آواتارها
- **ری‌اکشن‌های انیمیشنی به پیام‌ها** با شناوری نرم در بالای حباب پیام
- **پشتیبانی کامل از دو زبانه (فارسی و انگلیسی)** با چیدمان استاندارد RTL و LTR و تم‌های تیره/روشن تلگرامی
- **اتصال آسان از شبکه محلی (LAN)** با تنظیم خودکار CORS و تشخیص هاست از مرورگر موبایل یا سیستم‌های دیگر
- **دستیار هوشمند**: خلاصه‌سازی گفتگو، استخراج تسک، پیشنهاد پاسخ و جستجو در پیام‌ها با معماری tool-calling — پاسخ به‌صورت استریم

## راه‌اندازی سریع

### بک‌اند

```bash
cd chat-app-back
npm install
cp .env.example .env   # مقادیر را ویرایش کنید
npm run start:dev      # http://localhost:3000 (پیشوند v1)
```

پیش‌نیاز: Node 20+ و MongoDB (محلی یا Docker).

### اجرا با Docker (بدون نصب MongoDB محلی)

```bash
cp chat-app-back/.env.example chat-app-back/.env
docker compose up --build
# بک‌اند: http://localhost:3000/v1   فرانت‌اند: http://localhost   دیتابیس: 27017
```

سرویس‌ها: `mongo` (7)، `api` (NestJS)، `web` (Angular در nginx).

### راه‌اندازی در VS Code (F5)

دو لانچر آماده‌اند:

- **F5: Full Stack (Mongo+Backend+Frontend) - Debug** — Mongo را در docker بالا می‌آورد و بک‌اند را با دیباگ TS + فرانت‌اند در Chrome اجرا می‌کند (برای برنامه‌نویسی).
- **F5: Docker Full Stack (test only)** — کل استک را در Docker بالا می‌آورد و Chrome را باز می‌کند.

### فرانت‌اند

```bash
cd chat-app-front
npm install
npm start              # http://localhost:5500
```

> اتصال به بک‌اند به صورت خودکار از روی Host مرورگر تشخیص داده می‌شود و بدون هیچ کانفیگی روی شبکه محلی (LAN) و موبایل به درستی کار می‌کند.

### دستیار هوشمند (اختیاری)

کلید رایگان از [Google AI Studio](https://aistudio.google.com/apikey) بگیرید و در `.env` بگذارید:

```env
LLM_API_KEY=your-key
LLM_MODEL=gemini-2.5-flash
```

هر سرویس سازگار با OpenAI (OpenRouter، Groq، Ollama) با تغییر `LLM_BASE_URL` کار می‌کند. بدون کلید، برنامه کامل کار می‌کند و دستیار پیام راهنما نشان می‌دهد.

## تست و بیلد

```bash
# بک‌اند (۷۷ تست واحد Jest در ۹ مجموعه تست)
cd chat-app-back && npm test && npm run lint && npm run build

# فرانت‌اند (تست واحد Vitest و بیلد پروداکشن)
cd chat-app-front && npm test && npm run build
```

## ساختار

```
chat-app-back/src/     NestJS: auth, user, chat, message, agent, search, story, reaction, sms
chat-app-front/src/    Angular: auth pages + home (chat-list, chat-area, side-bar)
TASK_LIST.md           باگ‌های یافت‌شده، کارهای انجام‌شده و نقشه راه
AGENTS.md              راهنمای دستورها برای عامل‌های هوشمند
```

## مجوز

[MIT](LICENSE)

---

<a id="english"></a>

## English

Real-time chat application built with **NestJS 11**, **Angular 22**, and an **agentic AI assistant**.

### Features

- Real-time messaging over WebSocket (Socket.io)
- Phone-number + OTP authentication with JWT
- Chat list, paginated messages, unread counters
- Avatar uploads with IndexedDB caching
- User search
- **AI assistant** with tool-calling (summarize, extract tasks, draft replies, search messages) streamed token by token

### Prerequisites

- Node.js 20+
- MongoDB

### Quick start

```bash
cd chat-app-back && npm install && cp .env.example .env && npm run start:dev
cd chat-app-front && npm install && npm start
```

- Backend: http://localhost:3000 (global prefix `v1`)
- Frontend: http://localhost:5500

### Agentic assistant (optional)

Get a free key from [Google AI Studio](https://aistudio.google.com/apikey), set `LLM_API_KEY` in `chat-app-back/.env`. Any OpenAI-compatible endpoint works via `LLM_BASE_URL`. Without a key the app runs normally and the assistant shows setup instructions.

### Tests

```bash
cd chat-app-back && npm test   # 73 unit tests in 9 suites (Jest)
cd chat-app-front && npm test  # Vitest unit tests
```

## License

[MIT](LICENSE)
