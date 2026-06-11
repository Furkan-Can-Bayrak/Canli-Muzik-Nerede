# Grup kapak varsayılan görselleri

Kapak fotoğrafı olmayan gruplar için türe göre gösterilecek görselleri **yalnızca buraya** ekleyin.
Web ve mobil aynı dosyaları backend üzerinden kullanır.

URL: `{API_BASE_URL}/genres/{dosya-adı}`  
Örnek: `http://localhost:3000/genres/rock.webp`

## Dosya adları (WebP)

| Tür (veritabanı)   | Dosya adı                |
| ------------------ | ------------------------ |
| Rock               | `rock.webp`              |
| Caz                | `caz.webp`               |
| Akustik            | `akustik.webp`           |
| Elektronik         | `elektronik.webp`        |
| Türk Halk Müziği   | `turk-halk-muzigi.webp`  |
| Türk Sanat Müziği  | `turk-sanat-muzigi.webp` |
| Blues              | `blues.webp`             |
| Soul               | `soul.webp`              |
| Alternatif         | `alternatif.webp`        |
| (yedek)            | `default.webp`           |

Format: WebP. En az 800×1000 px (4:5) önerilir.

PNG/JPEG eklediyseniz dönüştürmek için:

```bash
node scripts/convert-genres-to-webp.mjs
```
