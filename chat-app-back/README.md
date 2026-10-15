# چت‌اپ — بک‌اند

بک‌اند NestJS 10 با MongoDB، احراز هویت JWT (OTP تلفنی)، WebSocket (Socket.io) و دستیار هوشمند Agentic.

## اجرا

```bash
npm install
cp .env.example .env      # سپس مقادیر را ویرایش کنید
npm run start:dev         # http://localhost:3000  (پیشوند v1)
```

نیازمند‌ها: Node 20+ و یک نمونه MongoDB قابل‌دسترس (محلی یا ریموت) در `MONGO_URI`.

## دستورها

```bash
npm test           # تست‌های واحد Jest (بدون نیاز به MongoDB)
npm run lint       # ESLint با --fix
npm run build      # بیلد پروداکشن → dist/
```

## ساختار

| مسیر | توضیح |
|------|-------|
| `src/auth/` | ورود با کد یک‌بارمصرف، JWT، گاردها (HTTP + WS)، strategy ها |
| `src/user/` | کاربر، نام‌ها، آواتار (Multer + ServeStatic) |
| `src/chat/` | لیست گفتگوهای خصوصی |
| `src/message/` | پیام‌ها؛ `message.gateway.ts` رویدادهای WebSocket |
| `src/agent/` | دستیار هوشمند: حلقه tool-calling، کلاینت LLM، ابزارها، ربات |
| `src/search/` | جستجوی کاربران |
| `src/helpers/` | اینترسپتور خطا (حفظ کد وضعیت HTTP) |

## API خلاصه

- `POST /v1/auth/send-code` — `{ phoneNumber }` → کد ۶ رقمی (لاگ سرور، نه پاسخ)
- `POST /v1/auth/verify-code` — `{ phoneNumber, code }` → `{ access_token, userId, firstName, lastName }`
- `POST /v1/auth/logout` — نیازمند Bearer token
- `GET /v1/chat/list` — نیازمند Bearer token
- `GET /v1/message?receiverId&page&limit` — نیازمند Bearer token
- `GET /v1/agent/status` — نیازمند Bearer token → `{ configured, model, botUserId }`
- `POST /v1/agent/message` — نیازمند Bearer token → `{ content }`
- WS: رویدادهای `sendMessage` / `receiveMessage` و `agentMessage` (+ استریم `agentChunk`, `agentToolCall`, `agentDone`, `agentSaved`, `agentError`) — توکن در `handshake.query.token`

## دستیار هوشمند (Agentic)

دستیار یک ابزارمحور است: درخواست کاربر → تصمیم ابزار (`AgentTools`) → اجرای ابزار روی داده‌های همان کاربر → پاسخ نهایی. حداکثر تکرار: `AGENT_MAX_ITERATIONS`.

کلید رایگان: [Google AI Studio](https://aistudio.google.com/apikey) — مقادیر `LLM_*` در `.env` قابل تنظیم هستند و هر سرویس سازگار با OpenAI (OpenRouter/Groq/Ollama) کار می‌کند. بدون کلید، دستیار پیام راهنما برمی‌گرداند و سرور از کار نمی‌افتد.
