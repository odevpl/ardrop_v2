# Architektura ArDrop v2

## Ogólny podział

```
[React app/seller/admin]
        |  Axios + Bearer JWT
        v
[Express API :8000]
        |  Knex query builder
        v
[MySQL 8 / MariaDB 10.4]
```

Trzy frontendy są niezależnymi aplikacjami Vite. Nie współdzielą kodu — każdy ma własne `src/services/`, `src/providers/`, `src/pages/`, `src/modules/`, `src/components/`.

## Auth flow

```
POST /auth/login
    → API waliduje credentials, zwraca JWT
    → frontend zapisuje token w localStorage
    → każdy request: Authorization: Bearer <token>
    → api/middlewares/auth.js dekoduje JWT → req.user
    → api/middlewares/role.js odrzuca złą rolę (ADMIN / SELLER / CLIENT)
```

Publiczne endpointy (bez JWT): `register`, `login`, `activate`, `forgot-password`, `reset-password`, `company-lookup`, `health`.

Tokeny aktywacyjne i reset hasła są haszowane w DB (`user_activation_tokens`, `user_password_reset_tokens`).

## Przepływ koszyka → zamówienie

```
1. GET /carts/current
   → backend nalicza discount_rules per sprzedawca
   → zwraca pozycje + wyliczone rabaty + koszty dostawy

2. PATCH /carts/shipments/:sellerId  { shippingMethodId }
   → backend liczy koszt dostawy i sprawdza próg darmowej dostawy

3. PATCH /carts/current  { couponCode }
   → backend dopasowuje kupon per sprzedawca, sprawdza limit użyć

4. POST /orders
   → tworzy order_group z numerem YYYYMMDDNNN
   → per sprzedawca: osobny rekord orders + order_items
   → snapshot adresu i klienta w JSON (niezmienialny w czasie)
   → snapshot zastosowanego rabatu w appliedDiscountSnapshotJson
   → dopisuje wpis order_income do seller_financial_entries
   → koszyk przechodzi do statusu converted
```

## Kluczowe moduły API

**`api/src/app.js`** — konfiguracja Express: CORS, parsowanie JSON, static `/uploads`, globalny auth middleware, rejestracja routerów.

**`api/src/controllers/`** — cienka warstwa HTTP: walidacja inputu, wywołanie serwisu, zwrot response. Jeden plik per zasób.

**`api/src/services/`** — cała logika biznesowa i zapytania Knex. Serwisy nie wiedzą o req/res.

**`api/src/middlewares/`**
- `auth.js` — weryfikacja JWT, ustawienie `req.user`
- `role.js` — sprawdzenie `req.user.role` vs wymagana rola
- `upload.js` — Multer + Jimp (resize/kompresja obrazów)
- `rateLimiter.js` — ochrona endpointów publicznych

## Model danych — ważne rzeczy

**Wielodostępność (multi-seller):** produkty, metody dostawy, reguły rabatowe i ustawienia są zawsze powiązane z `sellerId`. Koszyk i zamówienia mogą zawierać pozycje od wielu sprzedawców — dlatego istnieje poziom `order_group` (jeden checkout → wiele `orders`).

**Snapshoty w zamówieniach:** `orders.deliveryAddressSnapshotJson`, `orders.clientSnapshotJson`, `orders.appliedDiscountSnapshotJson`, `order_items.productSnapshotJson` — dane kopiowane w momencie złożenia zamówienia, żeby historia była niezmienialna.

**Warianty produktów:** produkt może mieć warianty (`product_variants`) z własnym SKU, ceną i stanem magazynowym. Jeśli `hasVariants = true`, sprzedaż odbywa się przez warianty. Widoczność na storefront: `product.status = active` + co najmniej jeden `variant.status = active`.

**Rabaty MVP:** `seller_discount_rules` przechowuje konfigurację w `configJson` (elastyczny JSON). Obsługiwane typy: `cart_threshold`, `quantity_threshold`, `coupon_code`. Użycia kuponów są śledzone w `seller_discount_rule_usages`.

**Ceny specjalne:** `client_special_prices` pozwala adminowi ustawić indywidualną cenę per klient+wariant (kwotowo lub procentowo).

**Finanse sprzedawcy:** `seller_financial_entries` to ledger — każde zamówienie tworzy wpis `order_income`. Widok historii finansowej agreguje wpisy per `settlementMonth`.

## Konwencja frontend (seller/app/admin)

```
src/pages/X/        ← cienka warstwa: layout + osadzenie modułu
src/modules/X/      ← właściwy widok + logika submitu
  ├── index.jsx
  ├── initialValues.js
  └── validation.js
src/services/       ← funkcje Axios per zasób
src/providers/      ← konteksty (auth, config)
src/components/     ← współdzielone UI
```

Dane do formularzy ładowane przez `FetchWrapper` (patrz `app/src/components/FetchWrapper`).

## Ważne decyzje techniczne

- **Knex bez ORM** — zapytania pisane ręcznie w serwisach. Daje kontrolę nad złożonymi joinami i transakcjami, ale nie ma automatycznych migracji schematów w tym projekcie — schemat zarządzany ręcznie przez `DB_STRUCTURE.md`.
- **Brak wspólnego `packages/shared`** — każdy frontend kopiuje typy i helpery. Świadoma decyzja na tym etapie (trzy niezależne zespoły/panele).
- **Obrazy na dysku** — Multer zapisuje do `api/uploads/`, serwowane statycznie. Brak CDN.
- **Express 5** — async/await w handlerach bez dodatkowego `try/catch` wrappera (Express 5 propaguje błędy automatycznie).
