# Mobil (Flutter) — Müşteri uygulaması

[canli-muzik-backend](../canli-muzik-backend) NestJS API’sine bağlanan **müşteri** istemcisi. Web’deki ile aynı sözleşme: taban URL’nin sonunda `/` olmaz; kimlik doğrulamada `Authorization: Bearer …`.

## Kapsam

Bu uygulama yalnızca müşteri deneyimini hedefler:

- **Giriş yapmadan:** yayınlanmış etkinlikleri listeleme ve detay görüntüleme (web ile aynı filtreler)
- **Giriş / kayıt:** müşteri hesabı (`CUSTOMER` rolü)
- **Hesabım:** profil bilgisi, çıkış, hesap silme

Kapsam dışı: işletme/grup panelleri, mesajlaşma, ayrı kafe/grup dizin sayfaları, yorum yazma.

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

## Oturum

- Kayıt: `POST /auth/register/customer`
- Giriş: `POST /auth/login`
- Token `flutter_secure_storage` içinde saklanır; açılışta `GET /auth/me` ile doğrulanır.
- İşletme veya grup hesabıyla giriş reddedilir.

## Etkinlik keşfi

Ana ekranda web `/events` ile uyumlu filtreler:

| UI | API parametresi |
|----|-----------------|
| Mekân arama | `q` |
| İl / ilçe | `provinceId`, `districtId` |
| Grup | `bandId` |
| Tarih aralığı | `startAtFrom`, `startAtTo` |
| Min / max fiyat | `minPrice`, `maxPrice` |
| Kafe UUID | `cafeId` |

İl/ilçe tercihi `shared_preferences` ile saklanır. “Konumumu kullan” `geolocator` + `GET /geocoding/reverse` kullanır.

## Yerel HTTP (geliştirme)

- **Android:** `debug` derlemesinde `usesCleartextTraffic` açıktır; **release** için production’da HTTPS kullanın.
- **iOS:** `Info.plist` içinde `NSAppTransportSecurity` / `NSAllowsLocalNetworking` yerel ağ HTTP’sine izin verir.

## Test

```bash
cd mobil
flutter test
```

## CORS

Tarayıcı CORS’u yalnızca web istemcilerini etkiler; iOS/Android native bu uygulamada API çağrıları `FRONTEND_ORIGIN` nedeniyle bloklanmaz.
