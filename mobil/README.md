# Mobil (Flutter)

[canli-muzik-backend](../canli-muzik-backend) NestJS API’sine bağlanan istemci. Web’deki ile aynı sözleşme: taban URL’nin sonunda `/` olmaz; kimlik doğrulamada `Authorization: Bearer …`.

## Proje

Canlı Müzik Nerede, canlı müzik etkinliklerini tek platformda toplayarak kafe işletmecileri, müzik grupları ve müşteriler arasında iletişim ile planlamayı kolaylaştırmayı hedefler; roller profil ve içerik yönetimi, görünür etkinlikler ve müşteriler için korunan (telefon, ayrıntılı fiyat gibi) alanları ayırır. Ana giriş ekranındaki tam metin `lib/content/app_copy.dart` dosyasında tutulur; web ana sayfadaki kahraman başlık ve kısa tanıtımla paraleldir.

## Gereksinimler

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (PATH’e `flutter/bin` ekleyin)
- `flutter doctor`

## Kurulum

```bash
cd mobil
flutter pub get
```

## API tabanı (`API_BASE_URL`)

Varsayılan derleme değeri `http://localhost:3000`. Farklı adres için:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

- **Android emülatör:** genelde `http://10.0.2.2:3000` (bilgisayardaki `localhost:3000`).
- **iOS simülatör:** genelde `http://localhost:3000`.
- **Fiziksel cihaz:** aynı Wi‑Fi’da bilgisayarın yerel IP’si, örn. `http://192.168.1.10:3000`.

İlk açılışta uygulama `GET /auth/me` (tokensız) çağırır; **401 veya 403** “giriş yok” için beklenen yanıtlardır (Next.js arayüzündeki kontrol ile uyumlu).

## Yerel HTTP (geliştirme)

- **Android:** `debug` derlemesinde `usesCleartextTraffic` açıktır; **release** için production’da HTTPS kullanın.
- **iOS:** `Info.plist` içinde `NSAppTransportSecurity` / `NSAllowsLocalNetworking` yerel ağ HTTP’sine izin verir.

## Test

```bash
cd mobil
flutter test
```

## Yol haritası (vizyon metniyle uyum)

1. **Müşteri MVP:** etkinlik keşfi (`GET /events`, `GET /events/:id`), şehir / tarih / mekân araması; kamuya açık yanıtlarda işletme telefonunun gelmemesi backend tarafında uygulanır.
2. **Sonraki adımlar:** işletme ve grup için oturum akışı, profil düzenleme, sohbet (REST mesaj gönderimi veya Socket.IO ile canlı dinleme).

## CORS

Tarayıcı CORS’u yalnızca web istemcilerini etkiler; iOS/Android native bu uygulamada API çağrıları `FRONTEND_ORIGIN` nedeniyle bloklanmaz.
