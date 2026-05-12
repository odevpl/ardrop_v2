# Roadmap ArDrop v2

## Co jest zrobione

### Core
- [x] Auth (rejestracja B2B z CEIDG/GUS, aktywacja emailem, reset hasła, JWT)
- [x] Role: ADMIN / SELLER / CLIENT
- [x] Produkty z wariantami (draft/active, stany magazynowe, jednostki: pcs/g/l)
- [x] Kategorie hierarchiczne z obrazami
- [x] Koszyk wielosprzedawcowy (pozycje, shipments per sprzedawca)
- [x] Checkout grupowy (order_group z numerem YYYYMMDDNNN)
- [x] Snapshoty danych w zamówieniach (adres, klient, produkt, rabat)
- [x] Metody dostawy per sprzedawca (progi darmowej dostawy, ETA, wykluczenia produktów)
- [x] Rabaty MVP: `cart_threshold`, `quantity_threshold`, `coupon_code`
- [x] Śledzenie użyć kuponów per klient (`seller_discount_rule_usages`)
- [x] Ceny specjalne per klient+wariant (admin)
- [x] Historia finansowa sprzedawcy (ledger per zamówienie, miesięczne widoki)
- [x] Ustawienia sprzedawcy: godziny pracy, urlopy, polityka zwrotów, dane do przelewu, ustawienia wysyłki
- [x] Marketing: kampanie banerowe (`home_hero`) z harmonogramem i układami
- [x] Uploady obrazów (Multer + Jimp)

### Panele
- [x] `app` — pełny flow klienta (koszyk, checkout, zamówienia, konto, adresy)
- [x] `seller` — produkty, zamówienia, wysyłki, rabaty, finanse, ustawienia
- [x] `admin` — klienci, sprzedawcy, produkty, kategorie, marketing, zamówienia, ceny specjalne

---

## Co warto zrobić dalej

### Priorytet wysoki

**Płatności**
Brak integracji bramki płatniczej. `paymentStatus` istnieje w DB (`pending/paid/failed`) ale nie ma flow online. Kandydaci: Przelewy24, Stripe, PayU.

**Migracje bazy danych**
Schemat zarządzany ręcznie przez SQL i `DB_STRUCTURE.md`. Warto wdrożyć Knex migrations (`knex migrate:make`) żeby zmiany były wersjonowane i powtarzalne na środowiskach.

**Powiadomienia email dla zamówień**
Nodemailer jest w stacku, ale nie wiadomo czy flow email (potwierdzenie zamówienia, zmiana statusu) jest wdrożony. Do weryfikacji i dokończenia.

### Priorytet średni

**Zarządzanie zapasami**
`stockQuantity` istnieje w DB, ale brak mechanizmu rezerwacji przy złożeniu zamówienia i automatycznego cofnięcia przy anulowaniu. Ryzyko oversellingu.

**Statusy zamówień — flow po stronie sprzedawcy**
`orders.status` ma wartości `new/processing/shipped/completed/cancelled`, ale brak widoku seller do ręcznej zmiany statusu i powiadamiania klienta.

**Zwroty i reklamacje**
`seller_return_policies` istnieje w DB (instrukcja, okno zwrotu, kto płaci za przesyłkę), ale brak flow obsługi zwrotu (formularz klienta → sprzedawca → refund).

**Oceny i opinie produktów**
Brak tabel i UI. Typowy wymóg marketplace.

**SEO dla kategorii**
`categories.seoTitle` i `seoDescription` są w DB, ale landing/app to SPA — potrzebny SSR lub prerendering żeby Google to zaindeksował.

### Priorytet niższy / dług techniczny

**Shared package**
Typy, stałe i helpery są kopiowane między frontendami. Przy większej skali warto wydzielić `packages/shared`.

**CDN dla obrazów**
Obrazy na dysku (`api/uploads/`) nie skalują się horyzontalnie. Migracja do S3/Cloudflare R2 przy wdrożeniu wieloinstancyjnym.

**Rate limiting**
`rateLimiter.js` jest w middlewares — sprawdzić pokrycie (czy chroni tylko auth czy też inne endpointy).

**Testy**
Brak widocznych testów (unit/integration). Przynajmniej testy serwisów API (logika koszyka, rabaty, przeliczenia cen) zmniejszyłyby ryzyko regresji.

**Paginacja w admin**
Listy klientów/sprzedawców/produktów przy dużych danych mogą być wolne bez server-side pagination — sprawdzić czy jest wdrożona konsekwentnie.
