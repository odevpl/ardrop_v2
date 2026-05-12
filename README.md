# ArDrop v2

Marketplace B2B e-commerce. Klient kupuje, sprzedawca zarządza ofertą i logistyką, admin nadzoruje platformę.

## Stack

| Warstwa | Technologie |
|---|---|
| Backend | Node.js, Express 5, Knex, MySQL 8 / MariaDB 10.4 |
| Frontendy | React 19, Vite 7, React Router 7, Axios, Formik, SASS |
| Auth | JWT (Bearer token w nagłówku) |
| Upload | Multer + Jimp (obrazy produktów/kategorii) |
| Email | Nodemailer |
| Rejestry B2B | CEIDG v3 API, GUS BIR API (lookup po NIP) |

## Struktura

```
ardrop_v2/
├── api/        Backend (port 8000)
├── app/        Panel klienta (port 3001)
├── seller/     Panel sprzedawcy (port 3002)
├── admin/      Panel admina (port 3003)
└── landing/    Statyczny landing (src + dist/)
```

## Uruchomienie lokalne

Wymagane env w `api/.env`:

```
PORT=8000
DB_HOST=...
DB_USER=...
DB_NAME=...
DB_PASSWORD=...
JWT_SECRET=...
```

Opcjonalne env (integracje zewnętrzne):

```
CEIDG_API_TOKEN=
CEIDG_API_BASE_URL=
GUS_BIR_USER_KEY=
GUS_BIR_API_URL=
BUSINESS_REGISTRY_TIMEOUT_MS=
```

Każdy projekt uruchamiany osobno:

```bash
cd api && npm install && npm run dev
cd app && npm install && npm start
cd seller && npm install && npm start
cd admin && npm install && npm start
```

Frontendy używają `VITE_API_BASE_URL` (fallback: `http://localhost:8000`).

## Główne funkcjonalności

**Klient (`app`)**
- Rejestracja B2B z weryfikacją NIP przez CEIDG/GUS
- Katalog produktów z wariantami
- Koszyk z automatycznym naliczaniem rabatów i wyborem metody dostawy per sprzedawca
- Checkout grupowy — jedno zamówienie może obejmować produkty od wielu sprzedawców
- Historia zamówień z widokiem grupy (blok ala proforma)

**Sprzedawca (`seller`)**
- Zarządzanie produktami i wariantami (draft/active)
- Zamówienia przychodzące
- Metody dostawy z progami darmowej dostawy
- Reguły rabatowe (progi koszyka, ilościowe, kody kuponów)
- Historia finansowa (wpisy per zamówienie, miesięczne rozliczenia)
- Ustawienia konta (godziny pracy, urlopy, polityka zwrotów, dane do przelewu)

**Admin (`admin`)**
- Zarządzanie klientami, sprzedawcami, produktami, kategoriami
- Marketing (kampanie banerowe na home)
- Ceny specjalne per klient/wariant
- Pełny podgląd zamówień
