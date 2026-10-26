name: 📞 تماس صوتی و تصویری نفر-به-نفر با WebRTC
about: پیاده‌سازی تماس صوتی و تصویری P2P با سیگنالینگ از طریق Socket.io
title: "[FEATURE] WebRTC 1-on-1 voice and video calling"
labels: ["feature", "webrtc", "audio/video"]
assignees: ""

## توضیحات
امکان برقراری تماس صوتی یا تصویری مستقیم بین دو کاربر بدون فشار به ترافیک سرور (Peer-to-Peer). سرور NestJS به عنوان سرور سیگنالینگ عمل کرده و تبادل SDP Offer/Answer و ICE Candidates را میان دو کلاینت انجام می‌دهد و استریم صدا/تصویر مستقیماً بین مرورگرها برقرار می‌شود.

## چرا لازم است
تماس تلفنی و تصویری داخل برنامه ویژگی حیاتی برای تبدیل این پروژه از یک چت ساده به یک ابزار ارتباطی کامل و مستقل (مانند واتساپ و تلگرام) است.

## شرط‌های پذیرش (Acceptance Criteria)
- [ ] رویدادهای سیگنالینگ در Socket.io بک‌اند: `call:initiate`، `call:accept`، `call:reject`، `call:end`، `call:ice-candidate`
- [ ] باز شدن پنجره زنگ‌خوردن (Incoming Call Modal) با صدای زنگ، عکس و نام تماس‌گیرنده
- [ ] رابط کاربری صفحه تماس فعال: زمان‌سنج تماس، دکمه میوت میکروفون، دکمه خاموش کردن دوربین، تغییر دوربین (سلفی/پشت)، دکمه قطع تماس
- [ ] مدیریت دسترسی‌های مرورگر (`navigator.mediaDevices.getUserMedia`)
- [ ] ثبت پیام سیستمی تماس در تاریخچه چت (مانند «تماس صوتی پایان‌یافت - ۲ دقیقه و ۴۰ ثانیه» یا «تماس بی‌پاسخ»)

## فایل‌های مربوطه
- `chat-app-back/src/message/message.gateway.ts`
- `chat-app-front/src/app/helpers/webrtc.service.ts`
- `chat-app-front/src/app/main/call-dialog/call-dialog.component.ts`
- `chat-app-front/src/app/main/home/chat-area/chat-area.component.ts`

## good first issue
خیر
