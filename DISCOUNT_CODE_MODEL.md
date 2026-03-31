# Docelowy model kodu rabatowego

Ten plik definiuje uzgodniony model domenowy kodu rabatowego dla `seller`, `api` i bazy danych.
Zastepuje obecny tymczasowy model oparty o `ruleType` + `configJson` w `seller_discount_rules`.

## 1. Cel modelu

- Jeden rekord oznacza jeden kod rabatowy wpisywany przez klienta.
- Model dotyczy konfiguracji i walidacji kodu po stronie `seller` i `api`.
- Egzekucja kodu w storefront `app` moze byc wdrazana etapowo, ale musi opierac sie o ten sam kontrakt.

## 2. Docelowy ksztalt rekordu

```json
{
  "id": 123,
  "sellerId": 45,
  "name": "Wiosna 2026",
  "description": "Kod dla nowych zamowien powyzej 300 zl",
  "code": "WIOSNA2026",
  "isActive": true,
  "validFrom": "2026-04-01T00:00:00.000Z",
  "validTo": "2026-04-30T23:59:59.000Z",
  "minimumCartValueGross": 300,
  "usageLimit": 100,
  "usageCount": 0,
  "isUnlimited": false,
  "restrictedProductIds": [101, 102],
  "freeShipping": false,
  "discountPercent": 10,
  "discountAmount": null,
  "excludePromotedProducts": false,
  "giftProductId": null,
  "createdAt": "2026-03-31T10:00:00.000Z",
  "updatedAt": "2026-03-31T10:00:00.000Z"
}
```

## 3. Znaczenie pol

### Dane podstawowe

- `name`: nazwa wewnetrzna widoczna dla sellera.
- `description`: opcjonalny opis wewnetrzny lub marketingowy.
- `code`: kod wpisywany przez klienta; przechowywany i porownywany w wersji znormalizowanej do uppercase i trim.
- `isActive`: reczne wlaczenie lub wylaczenie kodu niezaleznie od dat.

### Warunki

- `validFrom`: poczatek aktywnosci kodu; `null` oznacza brak dolnej granicy.
- `validTo`: koniec aktywnosci kodu; `null` oznacza brak gornej granicy.
- `minimumCartValueGross`: minimalna wartosc brutto koszyka dla pozycji kwalifikowanych do kodu; `null` oznacza brak progu.
- `usageLimit`: maksymalna liczba skutecznych uzyc kodu, gdy `isUnlimited = false`.
- `usageCount`: liczba skutecznie zrealizowanych uzyc kodu; pole utrzymywane przez backend, nie edytowane recznie w UI.
- `isUnlimited`: jesli `true`, `usageLimit` musi byc `null`.
- `restrictedProductIds`: opcjonalna lista produktow sellera, do ktorych kod moze sie zastosowac; pusta lista oznacza brak ograniczenia produktowego.

### Akcje

- `freeShipping`: kod zeruje koszt dostawy dla przesylki tego sellera.
- `discountPercent`: procentowy rabat na kwalifikowane pozycje koszyka.
- `discountAmount`: kwotowy rabat brutto na kwalifikowane pozycje koszyka.
- `excludePromotedProducts`: flaga przygotowana pod przyszly mechanizm wykluczania produktow objetych aktywna promocja.
- `giftProductId`: opcjonalny produkt gratisowy dodawany w ramach kodu; musi nalezec do tego samego sellera.

## 4. Zasady domenowe

### 4.1 Jedna glowna akcja rabatowa

- `discountPercent` i `discountAmount` sa wzajemnie wykluczajace.
- W danym kodzie mozna ustawic najwyzej jedna glowna akcje z zestawu:
  - `discountPercent`
  - `discountAmount`
  - `giftProductId`
- Kod bez zadnej glownej akcji jest dopuszczalny tylko wtedy, gdy `freeShipping = true`.

### 4.2 Darmowa dostawa

- `freeShipping` moze byc laczone z jedna glowna akcja rabatowa.
- Oznacza to, ze kod moze rownoczesnie dawac:
  - sama darmowa dostawe
  - darmowa dostawe + rabat procentowy
  - darmowa dostawe + rabat kwotowy
  - darmowa dostawe + prezent

### 4.3 Prezent

- `giftProductId` nie moze byc laczony z `discountPercent`.
- `giftProductId` nie moze byc laczony z `discountAmount`.
- `giftProductId` moze byc laczony z `freeShipping`.
- Na obecnym etapie `giftProductId` wskazuje produkt, nie wariant. Jesli produkt ma warianty, sposob wyboru wariantu trzeba dopiac w kolejnym etapie API/app.

### 4.4 Limit uzyc

- Limit liczony jest per skutecznie zlozone i nieanulowane zamowienie, w ktorym kod zostal faktycznie zaakceptowany.
- Sama walidacja kodu w koszyku nie podnosi `usageCount`.
- `usageCount` zwieksza sie dopiero przy finalizacji zamowienia.
- Jesli zamowienie zostanie anulowane przed realizacja biznesowa kodu, potrzebna bedzie decyzja w Ticket 8, czy licznik cofamy. Na potrzeby modelu bazowego przyjmujemy, ze pierwsza implementacja nie cofa licznika automatycznie.

### 4.5 Produkty w promocji

- Na teraz system nie ma finalnego, jawnego modelu promocji katalogowej.
- Dlatego `excludePromotedProducts` pozostaje flaga kontraktowa na przyszlosc, ale w pierwszej implementacji egzekucji powinna byc traktowana jako:
  - zapisywalna i zwracana przez API
  - niewymuszajaca jeszcze zlozonej logiki, dopoki nie powstanie source of truth dla "produktu w promocji"
- Do czasu wdrozenia docelowego modelu promocji storefront nie powinien komunikowac tej flagi jako w pelni dzialajacej reguly naliczania.

### 4.6 Ograniczenia produktowe

- `restrictedProductIds` ogranicza kwalifikowalne pozycje koszyka do wskazanych produktow danego sellera.
- Jesli lista jest pusta, kod moze obejmowac wszystkie produkty sellera.
- `giftProductId` nie powinien jednoczesnie nalezec do `restrictedProductIds` jako warunek wymagany do aktywacji kodu; prezent jest akcja, nie warunkiem.

## 5. Reguly walidacji

- `code` musi byc unikalny w obrebie `sellerId`.
- `code` po normalizacji nie moze byc pusty.
- `validFrom` nie moze byc pozniejsze niz `validTo`.
- `minimumCartValueGross`, `discountPercent`, `discountAmount`, `usageLimit` musza byc >= 0.
- `discountPercent` musi miescic sie w zakresie `0 < x <= 100`.
- `discountAmount` musi byc dodatnia kwota brutto.
- Gdy `isUnlimited = true`, `usageLimit = null`.
- Gdy `isUnlimited = false`, `usageLimit` jest wymagane i musi byc liczba calkowita dodatnia.
- `restrictedProductIds` musi zawierac unikalne ID produktow nalezacych do biezacego sellera.
- `giftProductId`, jesli ustawione, musi wskazywac produkt nalezacy do biezacego sellera i nie moze wskazywac produktu usunietego lub nieaktywnego.

## 6. Konsekwencje dla UI, API i bazy

- UI `seller` przechodzi z modelu `ruleType/configJson` na jeden formularz:
  - `Dane podstawowe`
  - `Warunki`
  - `Akcje`
- API dostaje osobny feature `discounts`, zamiast zapisywania rabatow przez `PATCH /seller/me/settings`.
- Baza odchodzi od ogolnej tabeli `seller_discount_rules` na rzecz jawnego modelu kodow rabatowych i relacji produktowych.

## 7. Status decyzji

- Ten dokument zamyka Ticket 1 jako uzgodniony model docelowy.
- Kolejne tickety powinny implementowac API i baze zgodnie z tym kontraktem.
