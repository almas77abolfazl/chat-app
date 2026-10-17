name: 🐳 داکرایزه کردن همه بخش‌ها
about: اطمینان از اینکه همه بخش‌های برنامه (بک‌اند، فرانت‌اند، MongoDB) در Docker هستند
title: "[ENHANCEMENT] Dockerize all parts"
labels: ["enhancement"]
assignees: ""

## توضیحات
بررسی و بهینه‌سازی docker-compose.yml و Dockerfileها تا همه خدمات به درستی در داکر اجرا شوند.

## چرا لازم است
راه‌اندازی سریع و آسان برای سایر توسعه‌دهندگان و CI.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] docker-compose.yml تنظیم شده است (Mongo + API + Web)
- [ ] Dockerfile بک‌اند و فرانت‌اند بهینه شده است
- [ ] `docker compose up --build` بدون خطا اجرا شود
- [ ] محیط‌های dev و prod جداگانه (اختیاری)

## فایل‌های مربوطه
- `docker-compose.yml`
- `chat-app-back/Dockerfile`
- `chat-app-front/Dockerfile`

## good first issue
خیر
