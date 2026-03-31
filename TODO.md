# TODO

## Stan obecny

- `seller` nie rozwija juz warstwy `configuration` jako osobnego bytu architektonicznego.
- `discounts` dzialaja w schemacie `lista -> details`.
- `pricing-rules` zostaly uproszczone do jednego formularza ustawien.
- Obecny feature rabatow w `seller` korzysta z istniejacego API:
  - `discounts` opiera sie o `discountRules` w `seller/me/settings`
  - zapis nadal idzie przez tymczasowy model `ruleType` + `configJson`
- Tymczasowy formularz `discounts` jest juz czesciowo dopasowany do typu reguly:
  - `happy_hours` zostal usuniety z UI
  - `quantity_threshold` ma wybor wariantow produktu przez popup
  - wybor wariantow jest zapisywany jako `selectedVariantIds` w `configJson`
- W `seller` wdrozono robocza logike statusow:
  - produkt `draft` zrzuca wszystkie warianty na `draft`
  - ustawienie wariantu na `active` podnosi produkt na `active`
- `app` nie konsumuje jeszcze logiki rabatow podczas zakupu.
- `api` nie egzekwuje jeszcze calej logiki rabatow na koszyku i zamowieniu.

## Priorytet teraz

- Nie robimy teraz duzego refaktoru modelu rabatow tylko po to, zeby miec "docelowa" architekture.
- Najpierw wykorzystujemy to, co juz istnieje w `seller`, i dopinamy realne dzialanie rabatow w `api` oraz `app`.
- Wiekszy refaktor modelu `discounts` wraca dopiero wtedy, gdy obecny ksztalt zacznie realnie blokowac wdrozenie checkoutu.

## Ticket 1. Zinwentaryzowac, ktore rabaty MVP wspieramy w checkoutcie

- status: do zrobienia
- Spisac, ktore typy z obecnego `discountRules` wchodza do pierwszej implementacji checkoutu.
- Dla kazdego typu okreslic:
  - warunki aktywacji
  - dane wejsciowe potrzebne w koszyku
  - sposob naliczania efektu
  - czy rabat dotyczy calego koszyka sellera, czy tylko wybranych produktow / wariantow
- Szczegolnie doprecyzowac:
  - `quantity_threshold`
  - `cart_threshold`
  - `free_bonus`
- Kryterium domkniecia:
  - istnieje krotka lista obslugiwanych typow rabatow MVP i ich semantyka w checkoutcie

## Ticket 2. Wdrozyc walidacje i naliczanie rabatow w `api`

- status: do zrobienia
- Dopic logike po stronie backendu tak, zeby koszyk i checkout potrafily:
  - odczytac aktywne `discountRules` sprzedawcy
  - sprawdzic warunki rabatu
  - obliczyc efekt rabatu
  - zwrocic wynik do `app`
- Zakres:
  - aktywnosc reguly
  - progi kwotowe i ilosciowe
  - ograniczenia do wybranych wariantow
  - ochrona przed naliczaniem rabatu dla niewlasciwego sellera
- Kryterium domkniecia:
  - `api` umie policzyc wynik rabatu dla koszyka per sprzedawca

## Ticket 3. Pokazac rabaty w `app` podczas zakupu

- status: do zrobienia
- Dodac w `app` obsluge wyniku rabatow zwracanego przez `api`.
- Pokazac klientowi:
  - czy rabat zostal naliczony
  - jaki efekt zostal zastosowany
  - jak rabat wplywa na podsumowanie zamowienia
- Jesli potrzebne, dodac UI pod wpisanie kodu rabatowego albo informacje o automatycznie naliczonej promocji.
- Kryterium domkniecia:
  - klient widzi efekt rabatu w koszyku i podsumowaniu checkoutu

## Ticket 4. Zapisac efekt promocji przy zamowieniu

- status: do zrobienia
- Promocje i ich efekty przypisujemy do konkretnego `order` per sprzedawca, nie do `orderGroupId`.
- Przy tworzeniu zamowienia zapisac snapshot zastosowanej promocji.
- Preferowany kierunek:
  - snapshot bezposrednio przy `orders`, np. `appliedDiscountSnapshotJson`
  - albo zestaw jawnych kolumn + uzupelniajacy snapshot JSON
- Jesli prezent trafia do zamowienia jako pozycja handlowa:
  - zapisac go jako `order_item` z oznaczeniem pochodzenia promocji
  - nie dokladac osobnej tabeli tylko do utrwalania gratisu z chwili zakupu
- Kryterium domkniecia:
  - zamowienie przechowuje efekt zastosowanej promocji per seller

## Ticket 5. Zweryfikowac logike `quantity_threshold`

- status: do zrobienia
- `quantity_threshold` w obecnym `seller` pozwala wybrac konkretne warianty produktu.
- Trzeba doprecyzowac po stronie `api` i `app`:
  - jak liczyc prog liczby sztuk dla wskazanych wariantow
  - czy liczymy ilosc per wariant, per produkt, czy lacznie dla zaznaczonego zbioru
  - jak ma sie to zachowac przy koszyku z wieloma wariantami tego samego produktu
- Kryterium domkniecia:
  - egzekucja promocji ilosciowej jest zgodna z tym, co seller konfiguruje w popupie wariantow

## Ticket 6. Uporzadkowac feature `pricing-rules`

- status: w duzej czesci zrobione w `seller`
- Zostawic `pricing-rules` jako jeden formularz ustawien sprzedawcy.
- Dopracowac:
  - nazewnictwo
  - komunikacje biznesowa
  - decyzje, czy obecny podzial sekcji formularza jest finalny
- Kryterium domkniecia:
  - feature jest jednoznaczny biznesowo i nie sugeruje automatycznej przebudowy katalogu produktow

## Ticket 7. Uporzadkowac logike statusow produktu i wariantow

- status: czesciowo zrobione w `seller`
- Obecnie w `seller` dziala robocza logika:
  - produkt `draft` wymusza `draft` na wszystkich wariantach
  - ustawienie wariantu na `active` podnosi produkt do `active`
- Trzeba opisac i zatwierdzic docelowe zasady biznesowe:
  - czy `product.status` publikuje caly produkt
  - czy `variant.status` publikuje pojedyncza opcje zakupu
  - czy widocznosc dla klienta ma byc liczona jako `product.active AND variant.active`
  - czy produkt aktywny moze miec zero aktywnych wariantow
  - czy produkt powinien byc automatycznie zrzucany do `draft`, gdy wszystkie warianty staja sie `draft`
- Po decyzji trzeba ujednolicic to w:
  - `seller`
  - `api/src/services/products.js`
  - `app`
- Kryterium domkniecia:
  - status produktu i status wariantu maja jawna, niesprzeczna semantyke

## Ticket 8. Refaktor modelu `discounts` tylko jesli MVP go nie uniesie

- status: odlozone
- Jesli obecny model `discountRules` zacznie blokowac checkout, wtedy wracamy do refaktoru:
  - osobny feature API `discounts`
  - nowa tabela zamiast `seller_discount_rules`
  - pelniejszy model kodow rabatowych
- Na teraz to nie jest pierwszy priorytet.
- Kryterium domkniecia:
  - decyzja o refaktorze wynika z realnych ograniczen wdrozenia, a nie z checi uprzedniego porzadkowania architektury

## Ticket 9. Zaktualizowac dokumentacje po wdrozeniu

- status: jeszcze nie zrobione
- Po ustabilizowaniu kolejnych zmian zaktualizowac:
  - [`ZAJAWKA.md`](/c:/Projects/ardrop_v2/ZAJAWKA.md)
- Trzeba dopisac:
  - odejscie od warstwy `configuration` w seller
  - routing i strukture feature-first
  - schemat `lista -> details` dla `shipping` i `discounts`
  - pojedynczy formularz dla `pricing-rules`
  - tymczasowa logike statusow produktu i wariantow
  - tymczasowy picker wariantow dla `quantity_threshold`
  - zakres, w jakim `api` i `app` konsumuje logike rabatow
- Kryterium domkniecia:
  - nowy chat dostaje aktualny obraz architektury i faktycznie dzialajacych feature

## Najwazniejsze ryzyka

- Najwieksze ryzyko obecnie: UI sellera bedzie sugerowac dzialajace promocje, zanim `app` zacznie je egzekwowac.
- Drugie ryzyko: obecny model `discountRules` moze okazac sie zbyt malo czytelny przy bardziej zlozonej logice checkoutu.
- Trzecie ryzyko: zapisanie efektu promocji tylko na poziomie `orderGroupId` rozmyje odpowiedzialnosc per sprzedawca i utrudni rozliczenia oraz prezentacje zamowien.
- Czwarte ryzyko: brak jawnie spisanej logiki `product.status` vs `variant.status` znowu bedzie prowadzil do rozjazdu miedzy sellerem, API i app.
- Piate ryzyko: `pricing-rules` moze byc mylnie rozumiane jako automatyczne sterowanie cenami katalogu.
