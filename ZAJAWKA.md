# ArDrop v2 - Zajawka Kontekstu

> Opis projektu, stack, uruchomienie → `README.md`
> Architektura, przepływ danych, moduły → `ARCHITECTURE.md`
> Schemat bazy danych → `DB_STRUCTURE.md`

---

## 1. Backend - kluczowe fakty

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
- `CONTACT_FORM_EMAIL` - opcjonalny adres odbiorcy powiadomien z formularzy kontaktowych

Publiczne endpointy:

- `POST /auth/register`
- `GET /auth/company-lookup?nip=...`
- `POST /auth/activate`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/login`
- `GET /auth/me` (technicznie w kontrolerze z auth middleware)
- `POST /contact/:formName`
- `GET /health`

Chronione endpointy (globalny auth middleware + role):

- produkty: `GET/POST/PUT/DELETE /products...`, obrazy produktu
- kategorie: `GET /categories...` dla `ADMIN/SELLER/CLIENT`, CRUD + obrazy kategorii tylko dla `ADMIN`
- koszyk: `GET /carts/current`, operacje na pozycjach i metadanych koszyka
  - backend nalicza tez aktywne `discountRules` sellera per shipment/sprzedawca i zwraca wynik w odpowiedzi koszyka
  - `PATCH /carts/current` obsluguje tez `couponCode`
- checkout klienta: `GET /checkout/shipments/:sellerId/shipping-methods` oraz `PATCH /carts/shipments/:sellerId` z `shippingMethodId`; koszt dostawy i prog darmowej dostawy sa liczone po stronie backendu
  - backend zwraca tez minimalny prog zakupu per sprzedawca i waliduje go przy tworzeniu zamowienia
- zamowienia: `POST /orders`, `GET /orders`, `GET /orders/:id`, `GET /orders/groups/:orderGroupId`, admin `PUT/DELETE`
  - nowy zakup grupowy moze miec biznesowy numer `orderGroupNumber` w formacie `YYYYMMDDNNN`, wspolny dla wszystkich rekordow `orders` z tej samej grupy
  - jesli schema bazy ma kolumne `orders.appliedDiscountSnapshotJson`, backend zapisuje tam snapshot zastosowanej promocji per `order`
- konto klienta: `GET/PATCH /account/me`
- adresy dostawy klienta: `GET/POST/PATCH/DELETE /account/delivery-addresses...`
- dostawa biezaca klienta: `GET/PUT /deliveries/current`
- seller settings i historia finansowa: `GET/PATCH /seller/me/settings`, `GET /seller/me/financial-history`
- admin only: `users`, `clients`, `sellers`
- admin formularze: `GET /admin/forms`, `GET /admin/forms/:formName`

## 2. Frontendy - podzial odpowiedzialnosci

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
  - widok `/pricing-rules` zostal odlaczony z UI; minimalna wartosc zamowienia jest teraz edytowana w `/payout-settings`
  - formularz metody dostawy ma `vatRate` oraz przeliczanie netto/brutto
- `admin`: klienci, sprzedawcy, produkty, zamowienia; ma `ConfigProvider`, ktory probuje pobrac `/configs`, a fallback trzyma w `admin/stories/apiConfigs.json`

## 2a. Frontend - konwencje struktury

- Dla widokow formularzowych w frontendach (`app`, `seller`, `admin`) preferowany wzorzec to:
  - `page` w `src/pages/...` jest cienka warstwa routingu i layoutu; tylko osadza modul i naglowek
  - `module` w `src/modules/...` trzyma wlasciwy widok, formularz i logike submitu
  - `initialValues.js` i `validation.js` sa wydzielone obok modulu, zamiast trzymac te rzeczy inline w jednym pliku
  - fetch danych wejsciowych idzie przez `FetchWrapper`, jesli formularz wymaga zaladowania danych z API
- Referencyjne przyklady tego wzorca:
  - `seller/src/modules/ShippingEditForm`
  - `seller/src/modules/PayoutSettingsForm`

## 2b. Statusy produktu i wariantow

- Obecna semantyka wdrozona w `seller` i `api`:
  - `product.status = draft` wymusza `draft` na wszystkich wariantach
  - ustawienie dowolnego `variant.status = active` podnosi `product.status` do `active`
  - jesli produkt nie ma zadnego aktywnego wariantu, backend zrzuca produkt do `draft`
- Dla storefront oznacza to praktycznie widocznosc oparta o:
  - produkt aktywny
  - oraz co najmniej jeden aktywny wariant

## 2c. Rabaty MVP w checkoutcie

- Obecne MVP nie korzysta jeszcze z osobnego feature API `discounts`.
- `api` konsumuje tymczasowe `seller_discount_rules` i obsluguje w koszyku / checkoutcie typy:
  - `cart_threshold`
  - `quantity_threshold`
  - `coupon_code`
- Dla `quantity_threshold` przyjeta semantyka jest taka:
  - liczymy ilosc lacznie dla calego zaznaczonego zbioru `selectedVariantIds`
  - rabat obejmuje tylko pozycje z tego zaznaczonego zbioru
- Dla `coupon_code`:
  - kod jest wpisywany w koszyku klienta
  - backend dopasowuje go per sprzedawca
  - liczba wykorzystan per klient jest trzymana w `seller_discount_rule_usages`
- Promocje sa przypisywane do konkretnego `order` per sprzedawca, a nie do calego `orderGroupId`.

## 3. Baza danych

Szczegolowy i aktualny schemat bazy danych znajduje sie w `DB_STRUCTURE.md`.
Ten plik nalezy traktowac jako source of truth dla tabel, relacji i kolumn.
Aktualne zmiany wymagajace SQL:
- `seller_shipping_methods.vatRate`
- nowa tabela `seller_discount_rule_usages`
Jeśli trzeba coś poprawić w bazie, podaj mi sql query we wiadomości pod phpmyadmin.
Jeśli poprawka się uda, zamieść ją również w `DB_STRUCTURE.md`. Pamiętaj, że baza działa na 10.4.32-MariaDB

## 4. Rekomendowany prompt startowy do nowego chatu

"Pracujemy w `ardrop_v2`. Traktuj `ZAJAWKA.md` jako source of truth na start. Najpierw sprawdz aktualny kod endpointow i serwisow, bo czesc dokumentacji moze byc nieaktualna. `TODO.md` powinien zawierać listę aktualnych zadań do wykonania. Jeśli wykonasz jakiś podpunkt, dopisz do niego wartość `- zrobione`"

## 5. Utrzymanie pliku

`ZAJAWKA.md` aktualizujemy po kazdej wiekszej zmianie, szczegolnie gdy zmienia sie:

- architektura aplikacji lub podzial odpowiedzialnosci modulow
- routing/API (nowe endpointy, zmiana sciezek, zmiana autoryzacji)
- model danych/baza (nowe tabele, relacje, istotne pola)
- sposob uruchamiania (porty, env, komendy startowe)
