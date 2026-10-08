# اقلیم‌نما

رصدخانه همراه برای متخصصان تغییر اقلیم. وضعیت جو، کیفیت هوا، تبخیر-تعرق، دبی رودخانه و چشم‌انداز مدل‌های اقلیمی را برای هر نقطه از زمین نشان می‌دهد.

سازنده و توسعه‌دهنده: [alirezafazeli@live.cim](mailto:alirezafazeli@live.cim)

## اجرا در مرورگر

```bash
npm install
npm run dev
```

سپس نشانی [http://127.0.0.1:47231](http://127.0.0.1:47231) را باز کنید.

## ساخت APK

خروجی آماده در `release/EghlimNama.apk` است. برای ساخت دوباره، JDK ۲۱ و Android SDK (سطح API ۳۶) لازم است:

```bash
export ANDROID_HOME="$HOME/android-sdk"
npm run apk
```

فایل امضاشده در `android/app/build/outputs/apk/release/` ساخته می‌شود. رمز کلید محلی ساخت در `android/keystore.properties` است و فقط برای نصب همین نسخه به کار می‌رود.

## داده

- پیش‌بینی، کیفیت هوا، مدل اقلیمی و دبی: [Open-Meteo](https://open-meteo.com/)
- CO₂، متان، N₂O، ناهنجاری دمای GISS و یخ دریا: [global-warming.org](https://global-warming.org/)
- نقشه: OpenStreetMap و CARTO

مقایسه اقلیمی، میانگین سه مدل HighResMIP بین ۱۹۹۱–۲۰۰۰ و ۲۰۴۱–۲۰۵۰ است و جایگزین سناریوهای CMIP6 یا گزارش IPCC برای تصمیم رسمی نیست.
