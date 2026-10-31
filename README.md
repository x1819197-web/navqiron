# Navqiron — Yunusobod yoshlar platformasi

Yunusobod tumani yoshlari uchun yagona platforma: interaktiv xaritada tadbirlar, musobaqalar va foydali joylar. Har bir tadbir o'z rangidagi pin bilan ajralib turadi. Tadbir sahifasida ro'yxatdan o'tish, ulashish va chuqur havola (deep link) ishlaydi.

Platforma ikki qismdan iborat:

- **Ommaviy frontend** — xarita + filtrlar + ro'yxat + detal panel + ro'yxatdan o'tish (`/`)
- **REST API + admin panel** — kontentni boshqarish (`/admin`), tashqi admin panel uchun Bearer token va CORS

## Texnologiyalar

| Qatlam | Texnologiya |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Stil | Tailwind CSS v4 |
| Baza | SQLite / libSQL (`@libsql/client`) — lokal fayl yoki bulutli Turso |
| Xarita | 2GIS plitkalari (kalitsiz), zaxira Esri World Street Map → OpenStreetMap; Google Maps kaliti bo'lsa Google |
| Auth | JWT (jose, HS256), httpOnly cookie + `Authorization: Bearer` |
| Parol | `scrypt` (Node `crypto`) |

## Talablar

- **Node.js 20+** (Node 24 da tekshirilgan)
- npm

## Ishga tushirish

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Sayt: <http://localhost:3000> — admin: <http://localhost:3000/admin>

Baza birinchi so'rovda `data/navqiron.db` faylida avtomatik yaratiladi va demo ma'lumotlar bilan to'ldiriladi: 6 tadbir + 6 joy kategoriyasi, 12 tadbir, 8 joy va tadbirlar bo'yicha ro'yxatdan o'tganlar (jami 1181 yozuv — admin ro'yxatlari bilan izchil). `TURSO_DATABASE_URL` berilgan bo'lsa, o'sha mantiq bulutli bazaga bir marta qo'llanadi.

### Admin kirish

```
Email:    admin@navqiron.uz
Parol:    navqiron2026
```

> Production'ga chiqarishdan oldin parolni almashtiring.

## Muhit o'zgaruvchilari

| O'zgaruvchi | Majburiy | Tavsif |
| --- | --- | --- |
| `AUTH_SECRET` | Tavsiya | JWT imzolash kaliti. Production'da albatta uzun tasodifiy qiymat qo'ying. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yo'q | Google Maps kaliti. Bo'sh bo'lsa Leaflet + 2GIS (kalitsiz) ishlatiladi. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Yo'q | Google Cloud Map ID (custom styling). `DEMO_MAP_ID` o'rniga. |
| `ADMIN_ORIGIN` | Yo'q | Tashqi admin panel domeni uchun CORS. Bo'sh bo'lsa `*`. |
| `TURSO_DATABASE_URL` | Yo'q | Turso/libSQL bazasi manzili (`libsql://...`). Bo'sh bo'lsa lokal fayl ishlatiladi. |
| `TURSO_AUTH_TOKEN` | Yo'q | Turso bazasi uchun token (`TURSO_DATABASE_URL` bilan birga). |
| `DATABASE_PATH` | Yo'q | Lokal SQLite fayl yo'li (default: `data/navqiron.db`). Bulutda ishlatilmaydi. |

`NEXT_PUBLIC_*` qiymatlar **build vaqtida** joylanadi — Google kalitini qo'shgandan keyin serverni qayta ishga tushiring (production'da qayta build qiling).

### Google Maps (ixtiyoriy)

1. Google Cloud Console'da **Maps JavaScript API** ni yoqing.
2. API kalit yarating va `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ga qo'ying.
3. Custom stil kerak bo'lsa Map ID yaratib, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` ga qo'ying.

Kalit bo'lmasa Leaflet + **2GIS** plitkalari ishlatiladi (Toshkent uchun batafsil mahalliy xarita). Plitkalar yuklanmasa, xarita avtomatik **Esri World Street Map**, undan keyin **OpenStreetMap**ga o'tadi — barcha pinlar, chegara va detallar saqlanadi.

> Ishlab chiqarish (production) muhitida 2GIS bilan rasmiy shartlarga rioya qilish uchun [dev.2gis.com](https://dev.2gis.com) orqali MapGL API kalitini olish tavsiya etiladi.

## Ommaviy sahifa (`/`)

- Yunusobod tumani chegarasi (OSM relation 2448072) GeoJSON sifatida chiziladi: tuman ichi lime rangda yoritiladi, atrofdagi hudud esa xiralashtiriladi — tuman alohida ajralib turadi.
- Tadbir pinlari — kategoriya rangidagi, ikonli markerlar; joylar — kvadrat belgilar. Pinlar klasterlashmaydi va xarita zoomiga mos kattalashadi.
- Transport bekatlari (metro va avtobus) OpenStreetMap/Overpass ma'lumotlaridan olinadi: metro belgilari doim ko'rinadi, avtobus belgilari zoom 13.5 dan boshlab chiqadi. Bekat ustiga bosilganda uning nomi va turi popup'da ko'rsatiladi.
- Qidiruv (`/` tezkor tugma), tab (Tadbirlar / Foydali joylar), kategoriya va sana filtrlari (bugun / shu hafta / 30 kun).
- Detal panel: sana-vaqt, manzil, tavsif, bandlik, "Ro'yxatdan o'tish", "Ulashish", "Yo'nalish olish" (Yandex Go orqali).
- Deep link: `/?event=tadbir-slug`, `/?place=joy-slug` — to'g'ridan-to'g'ri detal panel ochiladi.
- Mobil: xarita birinchi, panel va ro'yxat pastda; desktop: chap panel + to'liq ekran xarita.

## Admin panel (`/admin`)

- `/admin` — statistika (faol tadbirlar, ro'yxatdan o'tganlar, bepul tadbirlar, joylar), yaqin tadbirlar, qoralamalar.
- `/admin/events` — tadbir qo'shish/tahrirlash/o'chirish, holat (nashr/qoralama), qidiruv, ro'yxatdan o'tganlar ro'yxati (ism, telefon, sana).
- `/admin/places` — joy qo'shish/tahrirlash/o'chirish.
- Formalar server validatsiyasini maydon-darajada ko'rsatadi (422 `details`).
- Sessiya httpOnly cookie'da; `/admin/*` himoyalangan, login sahifasi `/admin/login`.

## REST API

Barcha javoblar JSON. Xatolar formati:

```json
{ "error": { "message": "Ma'lumotlar to'liq emas", "details": { "title": "Sarlavhani kiriting" } } }
```

Autentifikatsiya: `Authorization: Bearer <token>` yoki `navqiron_session` cookie. Token `POST /api/auth/login` javobida `data.token` sifatida qaytadi (7 kun amal qiladi).

### Endpointlar

| Metod | Yo'l | Auth | Tavsif |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | — | `{email, password}` → `{data:{admin, token}}`; 401 noto'g'ri parol; 10 daqiqada 12 urinish limiti |
| `POST` | `/api/auth/logout` | — | Cookie'ni tozalaydi |
| `GET` | `/api/auth/me` | ✔ | Joriy admin |
| `GET` | `/api/categories?kind=event\|place` | — | Kategoriyalar |
| `GET` | `/api/events` | — | `status=published` (default), `category`, `q`, `from`, `limit` |
| `GET` | `/api/events?status=all\|draft` | ✔ | Barcha holatlar |
| `POST` | `/api/events` | ✔ | Yangi tadbir (201) |
| `GET` | `/api/events/{id\|slug}` | — | Bitta tadbir |
| `PATCH` | `/api/events/{id}` | ✔ | Qismiy yangilash |
| `DELETE` | `/api/events/{id}` | ✔ | O'chirish (ro'yxatlar ham cascade) |
| `POST` | `/api/events/{id\|slug}/register` | — | `{name, phone}` → 201; 409 band/duplikat |
| `GET` | `/api/events/{id}/registrations` | ✔ | Ro'yxatdan o'tganlar |
| `GET` | `/api/places` | — | `status=published` (default), `category`, `q` |
| `GET` | `/api/places?status=all\|draft` | ✔ | Barcha holatlar |
| `POST` | `/api/places` | ✔ | Yangi joy |
| `GET`/`PATCH`/`DELETE` | `/api/places/{id\|slug}` | ✔ (yozish) | Bitta joy |
| `GET` | `/api/stats` | — | Umumiy statistika |
| `GET` | `/api/transit` | — | Yunusobod ichidagi metro/avtobus bekatlari (OSM Overpass, 6 soat kesh) |

Barcha endpointlarda `OPTIONS` (CORS preflight) qo'llab-quvvatlanadi.

### Misol

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@navqiron.uz","password":"navqiron2026"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.token))")

# Yangi tadbir
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Yoshlar uchrashuvi","categoryId":1,"startsAt":"2026-11-20T10:00:00+05:00","lat":41.343,"lng":69.287,"venue":"Yoshlar markazi","status":"published"}'

# Ommaviy ro'yxatdan o'tish
curl -X POST http://localhost:3000/api/events/kitob-muhokamasi/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Aziza Karimova","phone":"90 123 45 67"}'
```

Vaqtlar ISO 8601, Toshkent vaqti (`+05:00`) bilan yuboriladi. `lat`/`lng` Yunusobod hududida bo'lishi kerak (41.31–41.40 / 69.23–69.34).

### Tashqi admin panel uchun CORS

`ADMIN_ORIGIN=https://admin.example.uz` qo'yilsa, faqat shu domendan so'rovlar qabul qilinadi. Bo'sh bo'lsa `Access-Control-Allow-Origin: *` (Bearer token bilan ishlaydi; cookie bilan cross-origin ishlamaydi).

## Loyiha tuzilishi

```
src/
  app/
    page.tsx                 # ommaviy xarita sahifasi (server)
    layout.tsx               # shriftlar, metadata
    globals.css              # dizayn tokenlari, markerlar
    admin/
      login/page.tsx         # kirish
      (panel)/               # himoyalangan admin sahifalari
        layout.tsx           # session guard + AdminShell
        page.tsx             # dashboard
        events/page.tsx
        places/page.tsx
    api/                     # REST endpointlar (yuqoridagi jadval)
  components/
    explorer/                # xarita, filtrlar, ro'yxat, detal, registratsiya
    admin/                   # dashboard, CRUD formalar, modal
  lib/
    db.ts                    # libSQL (Turso yoki lokal fayl) ulanishi + sxema
    seed.ts                  # demo ma'lumotlar (kategoriya, tadbir, joy, ro'yxatlar)
    queries.ts               # CRUD va statistika
    validation.ts            # kiruvchi ma'lumot validatsiyasi
    auth.ts / password.ts    # JWT sessiya, scrypt
    format.ts                # Toshkent vaqti formatlash, qidiruv normalizatsiyasi
    marker.ts                # Leaflet/Google uchun umumiy pin HTML
    boundary.ts              # chegara GeoJSON
public/data/                 # yunusobod-boundary(.min).geojson
scripts/build-boundary.mjs   # OSM relation → GeoJSON
data/navqiron.db             # lokal SQLite (git'ga qo'shilmaydi)
```

## Ma'lumotlar bazasi

- Lokal rejim: `data/navqiron.db` fayli (SQLite, WAL). Birinchi ishga tushishda sxema va demo ma'lumotlar avtomatik yaratiladi.
- Bulut rejimi: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` berilsa, barcha so'rovlar Turso (libSQL) bazasiga ketadi. Sxema va seed birinchi so'rovda bir marta qo'llanadi.
- Demo ma'lumotlarni qaytadan yaratish: lokalda `data/navqiron.db*` fayllarini o'chirib qayta ishga tushiring; bulutda Turso konsolidan bazani tozalang.
- Zaxira nusxa: lokalda `data/navqiron.db` (+ `-wal`, `-shm`); bulutda Turso avtomatik zaxira (backup) imkoniyatidan foydalaning.

## Tuman chegarasini almashtirish

`yunus_relation.json` — OSM eksporti. Yangilash uchun:

```bash
node scripts/build-boundary.mjs
```

Skript `public/data/yunusobod-boundary.geojson` va minimallashtirilgan `.min.geojson` ni qayta yozadi.

## Deploy (Vercel + Turso)

1. **Turso** — [turso.tech](https://turso.tech) yoki Vercel Marketplace'da bepul baza yaratib, `TURSO_DATABASE_URL` va `TURSO_AUTH_TOKEN` ni oling.
2. Repozitoriyni GitHub'ga push qiling.
3. **Vercel** — [vercel.com/new](https://vercel.com/new) → repo'ni import qiling. Build `npm run build`, start avtomatik.
4. Environment Variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET` (uzun tasodifiy qiymat).
5. Deploy. Birinchi ochilishda sxema va demo ma'lumotlar Turso'ga avtomatik yoziladi.

Serverless muhitda lokal fayl saqlanmaydi — bulutda `TURSO_*` o'zgaruvchilari majburiy.

## Skriptlar

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run start      # production server
npm run typecheck  # TypeScript tekshiruvi
```

## Production eslatmalari

- `AUTH_SECRET` ni majburiy o'zgartiring; admin parolini almashtiring.
- Vercel kabi serverless muhitda `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` ni qo'ying; o'z serveringizda `data/` katalogini doimiy diskda (volume) saqlang.
- Reverse proxy orqasida ishlatsangiz, HTTPS va `ADMIN_ORIGIN` ni sozlang.
- Google Maps kalitini HTTP referrer bo'yicha cheklang.
