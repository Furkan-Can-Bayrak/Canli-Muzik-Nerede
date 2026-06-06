# Canlı Müzik Nerede — Frontend (Next.js)

Next.js App Router tabanlı arayüz. REST API ve Socket.IO için [canli-muzik-backend](../canli-muzik-backend/) ile birlikte çalışır.

## Gereksinimler

- Node.js (LTS önerilir)
- Çalışan NestJS backend (varsayılan [http://localhost:3000](http://localhost:3000))

## Kurulum

```bash
cd frontend
npm install
cp .env.example .env.local
```

`.env.local` içinde `NEXT_PUBLIC_API_URL` değerinin backend adresiyle eşleştiğinden emin olun (sonunda `/` olmasın).

## Geliştirme

İki terminal kullanın: biri backend, biri frontend.

**Backend:**

```bash
cd canli-muzik-backend
npm run start:dev
```

**Frontend** (Nest ile port çakışmaması için **3001**):

```bash
cd frontend
npm run dev
```

Uygulama: [http://localhost:3001](http://localhost:3001)

## CORS

Backend, tarayıcıdan gelen isteklere izin vermek için `FRONTEND_ORIGIN` kullanır (varsayılan `http://localhost:3001`). Bkz. [canli-muzik-backend/.env.example](../canli-muzik-backend/.env.example).

## Sayfalar

- Ana sayfa: etkinlik arama (şehir, tarih aralığı, adres/kafe adı, grup, fiyat bandı, isteğe bağlı kafe UUID).
- `/bands`, `/bands/[id]`: grup keşfi ve vitrin (kamuya açık medya ve tanıtım).
- `/events/[id]`: etkinlik detayı; giriş yaptıysanız yetkiye göre işletme telefonu gösterilir.
- `/messages`, `/messages/[id]`: işletme ↔ grup sohbetleri (REST + Socket.IO; JWT `CAFE` veya `BAND`).
- `/panel/cafe`: işletme profili ve etkinlik CRUD (JWT `CAFE`); gruplu etkinlikler taslak olarak oluşur.
- `/panel/band`: grup profili, taslak etkinlikleri yayına alma ve mesajlara yönlendirme (JWT `BAND`).

## Mobil yol haritası

- **Kısa vadede (MVP):** Responsive web + bu depodaki **PWA** köprüsü (`manifest.webmanifest`, tema rengi). Tarayıcıdan “Ana ekrana ekle” ile uygulama benzeri kullanım; backend ile aynı `NEXT_PUBLIC_API_URL` kullanılır.
- **Uzun vadede:** İstenirse **Expo (React Native)** ile mağaza dağıtımı; ortak TypeScript tipleri ve `NEXT_PUBLIC_API_URL` ile REST + `socket.io-client` aynı backend’e bağlanır. İkisinden birini seçerek ilerlemek iş yükünü netleştirir.

## API istemcisi

`src/lib/api.ts` içindeki `apiFetch` Bearer token ve `NEXT_PUBLIC_API_URL` tabanını kullanır.

## Socket.IO

Sohbet için istemci tarafında `socket.io-client` ile `NEXT_PUBLIC_API_URL` adresine bağlanın; token’ı gateway’in beklediği gibi (`Authorization: Bearer …` veya Socket.IO `auth` alanı) iletin.

## Üretim

```bash
npm run build
npm run start
```

Production’da da `NEXT_PUBLIC_API_URL` ve backend’deki `FRONTEND_ORIGIN` dağıtım URL’lerinizle uyumlu olmalıdır.
