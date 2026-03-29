# TODO

## Cel

Wdrozyc po stronie klienta wybor metody dostawy per sprzedawca tak, aby:

1. W koszyku dla kazdego sprzedawcy byla lista metod dostawy do wyboru.
2. Koszt dostawy reagowal na prog darmowej dostawy.
3. Koszty dostaw byly widoczne i poprawnie sumowane w podsumowaniu koszyka i zamowienia.

## Stan obecny

### Frontend klienta

- [`app/src/modules/Cart/index.jsx`](c:/Projects/ardrop_v2/app/src/modules/Cart/index.jsx)
  pokazuje dla kazdego shipmentu tylko tekstowe pola:
  - `shipment.shippingMethodName || "Do ustalenia"`
  - `shipment.shippingGross`
- Nie ma pobierania listy metod dostawy sprzedawcy.
- Nie ma UI do wyboru metody dostawy.
- Podsumowanie koszyka liczy dostawe z:
  - `shipments.reduce((sum, shipment) => sum + Number(shipment?.shippingGross || 0), 0)`
- To znaczy: frontend tylko odczytuje koszty dostawy, ale ich nie wylicza.

### API koszyka

- [`api/src/controllers/carts.js`](c:/Projects/ardrop_v2/api/src/controllers/carts.js)
  ma endpoint:
  - `PATCH /carts/shipments/:sellerId`
- [`api/src/services/carts.js`](c:/Projects/ardrop_v2/api/src/services/carts.js)
  pozwala recznie zapisac do shipmentu:
  - `deliveryAddressId`
  - `shippingMethodName`
  - `shippingNet`
  - `shippingGross`
  - `estimatedDeliveryFrom`
  - `estimatedDeliveryTo`
- Obecnie backend nie dobiera metody dostawy sam.
- Obecnie backend nie liczy progu darmowej dostawy.
- Obecnie backend nie zapisuje `shippingMethodId` na poziomie shipmentu.

### API metod dostawy sprzedawcy

- Metody dostawy sa juz wydzielone do osobnych endpointow:
  - `GET /seller/me/shipping-methods`
  - `GET /seller/me/shipping-methods/:id`
  - `POST /seller/me/shipping-methods`
  - `PUT /seller/me/shipping-methods/:id`
  - `DELETE /seller/me/shipping-methods/:id`
- Brakuje endpointu klienta do pobrania aktywnych metod dostawy dla danego sprzedawcy w checkout/koszyku.

### Tworzenie zamowienia

- [`api/src/services/orders.js`](c:/Projects/ardrop_v2/api/src/services/orders.js)
  bierze wartosci dostawy z `cart_shipments`:
  - `shippingGross`
  - `shippingMethodName`
  - `estimatedDeliveryFrom`
  - `estimatedDeliveryTo`
- To jest dobre jako snapshot zamowienia.
- Ale dane do snapshotu musza byc najpierw policzone poprawnie w koszyku.

## Co jest potrzebne

## 1. Endpoint klienta do metod dostawy sprzedawcy

Potrzebny nowy endpoint publiczny dla klienta, np.:

- `GET /sellers/:sellerId/shipping-methods`

Powinien zwracac tylko aktywne metody dostawy danego sprzedawcy, potrzebne do checkoutu:

- `id`
- `name`
- `priceNet`
- `priceGross`
- `freeShippingAmountGross`
- `etaMinDays`
- `etaMaxDays`

Na ten moment mozna pominac:

- `regions`
- `countries`

Powod:

- regiony i kraje sa obecnie ukryte w `ShippingEditForm`
- klient nie ma jeszcze logiki wyboru regionu shipmentu

To musi byc endpoint klienta per sprzedawca, bo koszyk jest rozbity na shipmenty sprzedawcow.

## 1a. Endpointy klienta do wyboru dostawy per sprzedawca

Potrzebujemy jasno wydzielonego API checkoutowego dla klienta, osobno dla kazdego sprzedawcy w koszyku.

Minimalny zestaw:

- `GET /checkout/shipments/:sellerId/shipping-methods`
  - zwraca aktywne metody dostawy dla konkretnego sprzedawcy
  - zwraca dane potrzebne do pokazania opcji klientowi
- `PATCH /carts/shipments/:sellerId`
  - powinien przyjmowac tylko identyfikator wybranej metody, np. `shippingMethodId`
  - nie powinien przyjmowac recznie wyliczonych cen dostawy z frontu

Frontend ma tylko:

- pobrac opcje
- wyslac wybor
- odswiezyc koszyk

## 2. Przechowywanie wybranej metody w cart shipment

Na poziomie `cart_shipments` trzeba zapisywac nie tylko nazwe, ale tez identyfikator metody:

- `shippingMethodId`

To pozwoli:

- odtworzyc zaznaczenie checkbox/radio po odswiezeniu koszyka
- przeliczyc koszty po zmianie ilosci produktow
- miec stabilne powiazanie z metoda, zamiast samego tekstu `shippingMethodName`

Do sprawdzenia:

- w [`api/src/services/carts.js`](c:/Projects/ardrop_v2/api/src/services/carts.js) sa juz slady `shippingMethodId` na poziomie `carts`, ale nie sa wykorzystywane per shipment
- trzeba przeniesc to jednoznacznie na `cart_shipments`

## 3. Backendowy kalkulator dostawy per shipment

Koszt dostawy nie powinien byc wysylany z frontu jako finalna prawda.

Potrzebna funkcja backendowa, ktora dla jednego shipmentu:

1. pobiera wybrana metode dostawy
2. liczy wartosc produktow dla danego sprzedawcy
3. sprawdza prog darmowej dostawy
4. ustawia:
   - `shippingMethodId`
   - `shippingMethodName`
   - `shippingNet`
   - `shippingGross`
   - `estimatedDeliveryFrom`
   - `estimatedDeliveryTo`

Minimalna logika MVP:

- jesli `itemsGross >= freeShippingAmountGross`, to:
  - `shippingGross = 0`
  - `shippingNet = 0`
- jesli w przyszlosci aktywne beda tez:
  - `freeShippingQuantity`
  - `freeShippingWeight`
  to kalkulator powinien je uwzgledniac, bo pola te istnieja juz w bazie i w modelu metody dostawy
- w przeciwnym razie:
  - `shippingGross = method.priceGross`
  - `shippingNet = method.priceNet`

Wazne:

- to liczenie musi uruchamiac sie nie tylko po wyborze metody dostawy
- musi tez uruchamiac sie po:
  - dodaniu produktu do koszyka
  - zmianie ilosci
  - usunieciu produktu
  - wyczyszczeniu koszyka

Inaczej prog darmowej dostawy nie bedzie aktualny.

## 3a. Osobny endpoint backendowy do liczenia wartosci shipmentu i kosztu dostawy

Poza endpointem wyboru metody potrzebujemy tez backendowego miejsca, ktore liczy wartosci shipmentu na podstawie danych juz zapisanych w systemie.

To moze byc:

- osobna funkcja serwisowa wywolywana wewnetrznie z koszyka
- albo osobny endpoint techniczny, jesli chcemy jawnie rozdzielic wybor metody od przeliczenia

Najwazniejsze zalozenie:

- frontend nie liczy kosztu dostawy
- frontend nie liczy progu darmowej dostawy jako source of truth
- frontend tylko pokazuje wynik policzony po stronie backendu

Backend powinien liczyc na podstawie:

- produktow w shipment
- wartosci `itemsGross`
- wybranej metody dostawy
- ustawien metody dostawy zapisanych w backendzie

## 3b. Przeniesienie pelnego przeliczania koszyka do backendu

To powinno isc szerzej niz sama dostawa.

Potrzebny jest jeden backendowy source of truth dla calego koszyka, ktory liczy:

- wartosc pozycji
- wartosc shipmentow per sprzedawca
- koszt dostawy per shipment
- sume dostaw
- total koszyka
- w przyszlosci takze rabaty i inne reguly

Frontend nie powinien sam liczyc finalnych wartosci finansowych.

Frontend powinien tylko:

- wysylac akcje uzytkownika
- pobierac wynik przeliczenia
- wyswietlac to, co policzyl backend

Minimalny kierunek:

- po kazdej zmianie koszyka backend uruchamia jedno spojne przeliczenie
- `GET /carts/current` zwraca juz gotowy, finalny stan koszyka
- shipmenty i summary w UI sa tylko prezentacja danych z backendu

## 4. Zmiana kontraktu endpointu PATCH /carts/shipments/:sellerId

Obecny kontrakt pozwala wysylac z frontu:

- `shippingMethodName`
- `shippingNet`
- `shippingGross`
- `estimatedDeliveryFrom`
- `estimatedDeliveryTo`

To nalezy uproscic.

Docelowo frontend powinien wysylac tylko:

- `deliveryAddressId`
- `shippingMethodId`
- `clientNote`

Backend powinien sam uzupelnic reszte na podstawie:

- metody dostawy sprzedawcy
- zawartosci shipmentu

## 5. Rozszerzenie odpowiedzi koszyka

Odpowiedz z `GET /carts/current` powinna zwracac dla kazdego shipmentu:

- `shippingMethodId`
- `shippingMethodName`
- `shippingGross`
- `shippingNet`
- `estimatedDeliveryFrom`
- `estimatedDeliveryTo`

Opcjonalnie, zeby frontend byl prostszy, mozna tez zwracac:

- `availableShippingMethods`

ale lepiej tego nie duplikowac w payloadzie koszyka, tylko pobierac osobno per seller albo jednym zbiorczym endpointem.

Lepszy kierunek:

- jeden endpoint koszyka
- jeden endpoint listujacy aktywne metody per sprzedawca

## 6. Frontend koszyka: UI wyboru metody dostawy

W [`app/src/modules/Cart/index.jsx`](c:/Projects/ardrop_v2/app/src/modules/Cart/index.jsx) trzeba dodac dla kazdego shipmentu sekcje wyboru dostawy.

Wymagania UI:

- lista aktywnych metod dostawy danego sprzedawcy
- wybor jednej metody na shipment
- prezentacja:
  - nazwy
  - ceny
  - ETA
  - informacji o darmowej dostawie po progu

Technicznie:

- nie checkboxy, tylko radio
- klient ma wybrac jedna metode dostawy dla jednego sprzedawcy

Obsługa:

- zaznaczenie metody wywoluje `PATCH /carts/shipments/:sellerId` z `shippingMethodId`
- po odpowiedzi odswiezamy koszyk i podsumowanie

## 7. Reakcja na prog darmowej wysylki

Frontend powinien tylko wyswietlac wynik, ale nie liczyc go jako source of truth.

Do pokazania w UI:

- jesli dostawa darmowa:
  - cena metody `0.00 zl`
  - komunikat typu `Darmowa dostawa od 200.00 zl - osiagnieto`
- jesli prog jeszcze nieosigniety:
  - opcjonalny komunikat `Brakuje X zl do darmowej dostawy`

Do tego backend musi zwracac dane pozwalajace to pokazac, np.:

- `freeShippingAmountGross`
- `shipment.totals.itemsGross`

albo wyliczone pole pomocnicze:

- `isFreeShippingApplied`

Na MVP wystarczy:

- frontend sam porowna `shipment.totals.itemsGross` z `freeShippingAmountGross`

## 8. Podsumowanie kosztow w koszyku

To juz w zasadzie jest gotowe konstrukcyjnie.

W [`app/src/modules/Cart/index.jsx`](c:/Projects/ardrop_v2/app/src/modules/Cart/index.jsx):

- koszt dostawy w summary bierze sie z `shipment.shippingGross`
- suma zamowienia bierze sie z `cart.totalGross`

Czyli po backendowym poprawnym przeliczeniu shipmentow:

- per sprzedawca ceny dostawy beda poprawne
- suma dostaw bedzie poprawna
- total koszyka bedzie poprawny

Tu nie trzeba rewolucji, tylko poprawnego source of truth po stronie API.

## 9. Snapshot zamowienia

Po wdrozeniu kalkulatora w koszyku zamowienie bedzie automatycznie dzialac lepiej, bo:

- [`api/src/services/orders.js`](c:/Projects/ardrop_v2/api/src/services/orders.js)
  juz kopiuje do orders:
  - `shippingMethodName`
  - `totalShipping`
  - `estimatedDeliveryFrom`
  - `estimatedDeliveryTo`

Warto jednak rozszerzyc snapshot zamowienia o:

- `shippingMethodId`

To nie jest konieczne dla samego UI klienta, ale bedzie porzadniejsze historycznie.

## 10. Minimalny zakres MVP

Zeby uruchomic to sensownie, minimalny zakres jest taki:

1. Dodac endpoint klienta/listy metod dostawy sprzedawcy.
2. Dodac `shippingMethodId` do `cart_shipments`.
3. Przebudowac `PATCH /carts/shipments/:sellerId`, zeby przyjmowal `shippingMethodId`.
4. Dodac backendowe przeliczanie kosztu dostawy per shipment z progiem `freeShippingAmountGross`.
5. Uruchamiac przeliczenie po kazdej zmianie koszyka.
6. Dodac w `app/src/modules/Cart/index.jsx` radio-listy metod dostawy per sprzedawca.
7. Pokazac koszt i ETA dla wybranej metody oraz sume dostaw w summary.

## 11. Rzeczy do swiadomego odlozenia

Na pozniej:

- regiony i kraje
- ograniczenia metod dostawy dla wybranych produktow

Te elementy dzisiaj nie sa gotowe po stronie checkoutu klienta.

Nie planujemy roznych adresow dostawy per shipment. Adres dostawy ma pozostac wspolny dla calego koszyka.

## 12. Ryzyka i uwagi

- Obecny koszyk jest zbudowany per shipment sprzedawcy, co jest dobre i wystarczajace do tego feature.
- Najwiekszy brak nie jest w UI, tylko w backendzie:
  klient nie ma dzis zadnego wiarygodnego endpointu do pobrania i wyboru metod dostawy.
- Koszt dostawy nie powinien byc liczony na froncie i wysylany jako finalna wartosc.
- Jesli zostawimy aktualny model recznego wpisywania `shippingGross` do shipmentu, to backend i frontend beda mogly rozjechac sie co do realnego kosztu dostawy po zmianie koszyka lub konfiguracji metody.
