name: 🔄 GitHub Actions CI (بدون دیپلوی)
about: تنظیم CI برای بیلد، لینت و تست بدون دیپلوی
title: "[DOCS] GitHub Actions CI"
labels: ["docs", "good first issue"]
assignees: ""

## توضیحات
ایجاد فایل `.github/workflows/ci.yml` که در هر push و PR مراحل زیر را اجرا کند:
1. نصب وابستگی بک‌اند و فرانت‌اند
2. `npm run lint` بک‌اند (باید صفر خطا باشد)
3. `npm test` بک‌اند (تست‌ها باید عبور کنند)
4. `npm run build` بک‌اند
5. `npm run build` فرانت‌اند
6. `docker compose up` برای تست کلی استک

## چرا لازم است
اطمینان از اینکه هر تغییر کد، تست و بیلد را می‌گذرد و خطا ایجاد نمی‌کند.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] فایل `.github/workflows/ci.yml` ایجاد شود
- [ ] در هر push به main اجرا شود
- [ ] در هر PR اجرا شود
- [ ] بدون دیپلوی (فقط بررسی خطا)

## فایل‌های مربوطه
- `.github/workflows/ci.yml`
- `docker-compose.yml`

## good first issue
بله
