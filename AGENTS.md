# AGENTS.md

راهنمای دستورهای پروژه برای عامل‌های هوشمند (Kilo و غیره).

## ساختار

- `chat-app-back/` — بک‌اند NestJS 11 (MongoDB + Mongoose + Socket.io + JWT). پورت پیش‌فرض ۳۰۰۰، پیشوند global `v1`.
- `chat-app-front/` — فرانت‌اند Angular 22.2 (Material + socket.io-client). پورت dev: ۵۵۰۰.

## دستورها

### بک‌اند (`chat-app-back/`)
```bash
npm install        # نصب وابستگی‌ها (lockfile هماهنگ است)
npm run start:dev  # اجرای توسعه با watch
npm run build      # بیلد پروداکشن → dist/
npm run lint       # ESLint با --fix (باید تمیز باشد)
npm test           # Jest (تست‌های واحد، بدون نیاز به MongoDB)
npm run test:e2e   # Jest E2E (نیاز به MongoDB روی پورت ۲۷۰۱۸)
```
برای E2E تست: ابتدا `npm run test:e2e:up` و بعد `npm run test:e2e` و در نهایت `npm run test:e2e:down`.
برای اجرا فایل `.env` از روی `.env.example` بسازید. MongoDB روی `MONGO_URI` باید در دسترس باشد.

### فرانت‌اند (`chat-app-front/`)
```bash
npm install
npm start          # ng serve روی پورت ۵۵۰۰ با host 0.0.0.0
npm run build      # بیلد پروداکشن
```
تنظیمات آدرس سرور در `src/environments/environment.development.ts`.

## قواعد کد

- بک‌اند: import مسیرها با پیشوند `src/...` (baseUrl در tsconfig). تست‌ها کنار فایل‌ها با پسوند `.spec.ts`. خطاها را throw کنید و به `handleException` وابسته نباشید (الان بازthrow می‌کند).
- فرانت‌اند: کامپوننت‌های standalone با `imports` صریح. سرویس‌های `providedIn: 'root'`. از `take(1)` برای subscribe‌های تک‌باره و مدیریت چرخه حیات برای اشتراک‌های زنده استفاده شود.
- ابتدا `npm test` و `npm run lint` بک‌اند و `npm run build` فرانت‌اند را اجرا و پاس کنید. برای E2E تست‌ها ابتدا `npm run test:e2e:up` و سپس `npm run test:e2e` را اجرا کنید.
- استایل با توکن‌های `styles.scss` (CSS custom properties) نوشته شود، نه رنگ هاردکد.

## قابلیت Agentic

- ماژول `src/agent/` در بک‌اند: `AgentService` (حلقه tool-calling)، `LlmService` (کلاینت سازگار OpenAI)، `AgentTools` (ابزارها)، `BotService` (کاربر ربات).
- هر ابزار جدید باید در `AgentTools.definitions` و `execute` ثبت شود؛ ابزارها فقط از طریق `ToolContext.user` به داده دسترسی دارند.
- کلید LLM رایگان: Google AI Studio (Gemini) — `LLM_API_KEY` در `.env`. راهنمای کامل در `.env.example`.
