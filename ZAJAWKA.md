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

Dodatkowe env opcjonalne:

- `CEIDG_API_TOKEN` - bearer token do API CEIDG v3
- `CEIDG_API_BASE_URL` - override URL lookupu CEIDG
- `GUS_BIR_USER_KEY` - klucz uzytkownika do API REGON BIR
- `GUS_BIR_API_URL` - override URL lookupu GUS BIR
- `BUSINESS_REGISTRY_TIMEOUT_MS` - timeout lookupu rejestrow

Publiczne endpointy:

- `POST /auth/register`
- `GET /auth/company-lookup?nip=...`
- `POST /auth/activate`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/login`
- `GET /auth/me` (technicznie w kontrolerze z auth middleware)
- `GET /health`

Chronione endpointy (globalny auth middleware + role):

- produkty: `GET/POST/PUT/DELETE /products...`, obrazy produktu
- kategorie: `GET /categories...` dla `ADMIN/SELLER/CLIENT`, CRUD + obrazy kategorii tylko dla `ADMIN`
- koszyk: `GET /carts/current`, operacje na pozycjach i metadanych koszyka
  - backend nalicza tez aktywne `discountRules` sellera per shipment/sprzedawca i zwraca wynik w odpowiedzi koszyka
- checkout klienta: `GET /checkout/shipments/:sellerId/shipping-methods` oraz `PATCH /carts/shipments/:sellerId` z `shippingMethodId`; koszt dostawy i prog darmowej dostawy sa liczone po stronie backendu
- zamowienia: `POST /orders`, `GET /orders`, `GET /orders/:id`, `GET /orders/groups/:orderGroupId`, admin `PUT/DELETE`
  - nowy zakup grupowy moze miec biznesowy numer `orderGroupNumber` w formacie `YYYYMMDDNNN`, wspolny dla wszystkich rekordow `orders` z tej samej grupy
  - jesli schema bazy ma kolumne `orders.appliedDiscountSnapshotJson`, backend zapisuje tam snapshot zastosowanej promocji per `order`
- konto klienta: `GET/PATCH /account/me`
- adresy dostawy klienta: `GET/POST/PATCH/DELETE /account/delivery-addresses...`
- dostawa biezaca klienta: `GET/PUT /deliveries/current`
- seller settings i historia finansowa: `GET/PATCH /seller/me/settings`, `GET /seller/me/financial-history`
- admin only: `users`, `clients`, `sellers`

## 5. Frontendy - podzial odpowiedzialnosci

- `app`: flow klienta (logowanie/rejestracja/aktywacja/reset hasla, produkty, koszyk, konto, adresy, zamowienia)
  - rejestracja klienta jest B2B: NIP jest wymagany, a dane firmy sa pobierane z CEIDG/GUS
  - koszyk klienta ma wybor metody dostawy per sprzedawca; frontend tylko wysyla `shippingMethodId`, a finalne kwoty wracaja z API
  - koszyk klienta pokazuje tez automatycznie naliczone rabaty z `discountRules` per sprzedawca
  - po checkoutcie klient trafia na wspolny widok zakupu `/zamowienia/grupa/:orderGroupId`, ktory grupuje zamowienia per sprzedawca i pokazuje bloki ala proforma
  - widoki zamowienia i grupy zamowien potrafia pokazac snapshot zastosowanej promocji, jesli backend go zwroci
- `seller`: produkty i zamowienia sprzedawcy, logowanie tylko dla roli `SELLER`
  - seller ma tez widok historii finansowej oparty o `seller_financial_entries`; nowe zakupy klienta dopisuja wpis `order_income`
  - ustawienia sprzedawcy trzymaja takze dane do przelewu i termin platnosci wykorzystywany na blokach ala proforma klienta
  - `discounts` nadal korzysta z tymczasowego modelu `discountRules` w `seller/me/settings`, ale `api` i `app` konsumuje juz te reguly w koszyku i checkoutcie
- `admin`: klienci, sprzedawcy, produkty, zamowienia; ma `ConfigProvider`, ktory probuje pobrac `/configs`, a fallback trzyma w `admin/stories/apiConfigs.json`

## 5a. Frontend - konwencje struktury

- Dla widokow formularzowych w frontendach (`app`, `seller`, `admin`) preferowany wzorzec to:
  - `page` w `src/pages/...` jest cienka warstwa routingu i layoutu; tylko osadza modul i naglowek
  - `module` w `src/modules/...` trzyma wlasciwy widok, formularz i logike submitu
  - `initialValues.js` i `validation.js` sa wydzielone obok modulu, zamiast trzymac te rzeczy inline w jednym pliku
  - fetch danych wejsciowych idzie przez `FetchWrapper`, jesli formularz wymaga zaladowania danych z API
- Referencyjne przyklady tego wzorca:
  - `seller/src/modules/ShippingEditForm`
  - `seller/src/modules/PayoutSettingsForm`

## 5b. Statusy produktu i wariantow

- Obecna semantyka wdrozona w `seller` i `api`:
  - `product.status = draft` wymusza `draft` na wszystkich wariantach
  - ustawienie dowolnego `variant.status = active` podnosi `product.status` do `active`
  - jesli produkt nie ma zadnego aktywnego wariantu, backend zrzuca produkt do `draft`
- Dla storefront oznacza to praktycznie widocznosc oparta o:
  - produkt aktywny
  - oraz co najmniej jeden aktywny wariant

## 5c. Rabaty MVP w checkoutcie

- Obecne MVP nie korzysta jeszcze z osobnego feature API `discounts`.
- `api` konsumuje tymczasowe `seller_discount_rules` i obsluguje w koszyku / checkoutcie typy:
  - `cart_threshold`
  - `quantity_threshold`
  - `first_purchase`
  - `loyal_customer`
  - `free_bonus`
- Dla `quantity_threshold` przyjeta semantyka jest taka:
  - liczymy ilosc lacznie dla calego zaznaczonego zbioru `selectedVariantIds`
  - rabat obejmuje tylko pozycje z tego zaznaczonego zbioru
- Promocje sa przypisywane do konkretnego `order` per sprzedawca, a nie do calego `orderGroupId`.

## 6. Baza danych

Szczegolowy i aktualny schemat bazy danych znajduje sie w `DB_STRUCTURE.md`.
Ten plik nalezy traktowac jako source of truth dla tabel, relacji i kolumn.
Jeśli trzeba coś poprawić w bazie, podaj mi sql query we wiadomości pod phpmyadmin.
Jeśli poprawka się uda, zamieść ją również w `DB_STRUCTURE.md`. Pamiętaj, że baza działa na 10.4.32-MariaDB

## 7. Aktualny stan dokumentacji

- README w `app/admin/seller` sa domyslne z Vite (bez opisu biznesowego)

## 8. Rekomendowany prompt startowy do nowego chatu

"Pracujemy w `ardrop_v2`. Traktuj `ZAJAWKA.md` jako source of truth na start. Najpierw sprawdz aktualny kod endpointow i serwisow, bo czesc dokumentacji moze byc nieaktualna. `TODO.md` powinien zawierać listę aktualnych zadań do wykonania. Jeśli wykonasz jakiś podpunkt, dopisz do niego wartość `- zrobione`"

## 9. Utrzymanie pliku

`ZAJAWKA.md` aktualizujemy po kazdej wiekszej zmianie, szczegolnie gdy zmienia sie:

- architektura aplikacji lub podzial odpowiedzialnosci modulow
- routing/API (nowe endpointy, zmiana sciezek, zmiana autoryzacji)
- model danych/baza (nowe tabele, relacje, istotne pola)
- sposob uruchamiania (porty, env, komendy startowe)
