# ArDrop v2 - Zajawka Kontekstu

## 1. Co to jest
Monorepo e-commerce z 4 aplikacjami:
- `api` - backend Node.js + Express + MySQL (Knex)
- `app` - frontend klienta (React + Vite)
- `seller` - panel sprzedawcy (React + Vite)
- `admin` - panel super-admina (React + Vite)

Dodatkowo istnieje katalog `landing`, ale obecnie jest pusty.

## 2. Stack techniczny
- Backend: `express@5`, `knex`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `multer`, `jimp`, `nodemailer`
- Frontendy: `react@19`, `react-router-dom@7`, `axios`, `formik`, `sass`, Vite 7
- Auth: JWT w `Authorization: Bearer <token>`

## 3. Jak uruchomic lokalnie
W osobnych terminalach:

1. API
- `cd api`
- `npm install`
- `npm run dev`
- API nasluchuje na `PORT` z `.env` (domyslnie zwykle `8000` w frontendach)

2. Front klienta
- `cd app`
- `npm install`
- `npm start`
- Vite: `http://localhost:3001`

3. Panel sprzedawcy
- `cd seller`
- `npm install`
- `npm start`
- Vite: `http://localhost:3002`

4. Panel admin
- `cd admin`
- `npm install`
- `npm start`
- Vite: `http://localhost:3003`

Frontendy uzywaja `VITE_API_BASE_URL` albo fallback `http://localhost:8000`.

## 4. Backend - kluczowe fakty
Pliki startowe:
- `api/app.js` - laduje `.env`, startuje serwer
- `api/src/app.js` - konfiguracja Express/CORS, middleware, kontrolery

Wymagane env (walidowane):
- `PORT`, `DB_HOST`, `DB_USER`, `DB_NAME`, `JWT_SECRET`

Publiczne endpointy:
- `POST /auth/register`
- `POST /auth/activate`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/login`
- `GET /auth/me` (technicznie w kontrolerze z auth middleware)
- `GET /health`

Chronione endpointy (globalny auth middleware + role):
- produkty: `GET/POST/PUT/DELETE /products...`, obrazy produktu
- koszyk: `GET /carts/current`, operacje na pozycjach i metadanych koszyka
- zamowienia: `POST /orders`, `GET /orders`, `GET /orders/:id`, admin `PUT/DELETE`
- konto klienta: `GET/PATCH /account/me`
- adresy dostawy klienta: `GET/POST/PATCH/DELETE /account/delivery-addresses...`
- dostawa biezaca klienta: `GET/PUT /deliveries/current`
- admin only: `users`, `clients`, `sellers`

## 5. Frontendy - podzial odpowiedzialnosci
- `app`: flow klienta (logowanie/rejestracja/aktywacja/reset hasla, produkty, koszyk, konto, adresy, zamowienia)
- `seller`: produkty i zamowienia sprzedawcy, logowanie tylko dla roli `SELLER`
- `admin`: klienci, sprzedawcy, produkty, zamowienia; ma `ConfigProvider`, ktory probuje pobrac `/configs`, a fallback trzyma w `admin/stories/apiConfigs.json`

## 6. Baza danych
Glowne tabele z `DB_STRUCTURE.md`:
- `users` (role: `ADMIN`, `SELLER`, `CLIENT`)
- `clients`, `sellers`
- `products`, `products_image`
  - `products` zawiera teraz takze: `unit` (`pcs`/`g`/`l`) oraz `stockQuantity`
- `carts`, `cart_items`
- `orders`, `order_items`
- `clients_delivery_address`
- `wallets`, `wallet_ledger`

`DB_STRUCTURE.md` to dump SQL (MariaDB), wygenerowany 2026-03-08.

## 7. Aktualny stan dokumentacji
- `api/API_BACKLOG.md` istnieje, ale jest pusty (0 B)
- `api/src/services/endpoints.md` jest historyczny i nie odpowiada obecnemu routingowi 1:1
- README w `app/admin/seller` sa domyslne z Vite (bez opisu biznesowego)

## 8. Rekomendowany prompt startowy do nowego chatu
"Pracujemy w `ardrop_v2`. Traktuj `CONTEXT_ZAJAWKA.md` jako source of truth na start. Najpierw sprawdz aktualny kod endpointow i serwisow, bo czesc dokumentacji moze byc nieaktualna."

## 9. Utrzymanie pliku
`CONTEXT_ZAJAWKA.md` aktualizujemy po kazdej wiekszej zmianie, szczegolnie gdy zmienia sie:
- architektura aplikacji lub podzial odpowiedzialnosci modulow
- routing/API (nowe endpointy, zmiana sciezek, zmiana autoryzacji)
- model danych/baza (nowe tabele, relacje, istotne pola)
- sposob uruchamiania (porty, env, komendy startowe)
