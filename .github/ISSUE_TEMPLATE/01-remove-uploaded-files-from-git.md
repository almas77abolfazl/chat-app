name: 🗑️ حذف فایل‌های آپلودی از تاریخچه گیت
about: فایل‌های آپلودی (آواتار) را از تاریخچه گیت خارج کنید تا در مخزن عمومی نباشند
title: "[BUG] Remove uploaded files from git history"
labels: ["bug", "good first issue"]
assignees: ""

## توضیحات
فایل‌های آپلودی در `chat-app-back/uploads/avatars/*.jpg` در تاریخچه گیت commit شده‌اند و باید از ریپو عمومی حذف شوند تا حجم ریپو کاهش یابد و حریم کاربران حفظ شود.

## چرا لازم است
فایل‌های آپلودی کاربر نباید در تاریخچه گیت ذخیره شوند. این فایل‌ها باید فقط در سرور/دیسک ذخیره شوند و در `.gitignore` باشند.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فایل `chat-app-back/uploads/avatars` از tracked فایل‌های گیت حذف شود (`git rm -r --cached`)
- [ ] پوشه `uploads/` به `.gitignore` اضافه شود
- [ ] تاریخچه گیت پاکسازی شود (ب este BFG یا git filter-repo)
- [ ] به `/v1/chat-app-back/.gitignore` بررسی شود که `uploads/` ingest شده است

## فایل‌های مربوطه
- `chat-app-back/uploads/`
- `chat-app-back/.gitignore`
- `chat-app-back/src/user/user.service.ts`

## good first issue
بله
