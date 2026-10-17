name: 🔄 Refresh token و کوکی HTTP-only
about: جایگزینی localStorage با توکن در کوکی HTTP-only و اضافه کردن refresh token
title: "[FEATURE] Refresh token + HTTP-only cookie"
labels: ["feature"]
assignees: ""

## توضیحات
فعالاً توکن JWT در localStorage ذخیره می‌شود که در برابر XSS درpaired است. نیاز به انتقال به کوکی HTTP-only و اضافه کردن refresh token برای تمدید جلسه.

## چرا لازم است
جلوگیری از دزدidine توکن از طریق اسکریپت‌های悪意‌آمیز و امنیت بیشتر.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] کوکی HTTP-only برای.accessToken
- [ ] endpoint `/auth/refresh` برای refresh token
- [ ] حذف توکن از localStorage
- [ ] گاردها برای کوکی و refresh token

## فایل‌های مربوطه
- `chat-app-back/src/auth/auth.controller.ts`
- `chat-app-back/src/auth/auth.service.ts`
- `chat-app-front/src/app/auth/auth.service.ts`

## good first issue
خیر
