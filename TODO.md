# TODO

## Cel

Wdrozyc model platnosci, w ktorym:

1. klient sklada jeden koszyk, ale po checkoutcie ma platnosci rozdzielone per sprzedawca,
2. pieniadze ida bezposrednio do sprzedawcow,
3. platforma nie przyjmuje srodkow i nie rozdziela ich dalej,
4. na start obslugujemy `przedplate / przelew tradycyjny`,
5. architektura pozostaje gotowa na przyszle rozszerzenia, ale bez budowania teraz pelnej bramki platniczej.

## Stan obecny

### Model zamowien

- [`DB_STRUCTURE.md`](c:/Projects/ardrop_v2/DB_STRUCTURE.md) pokazuje, ze `orders` sa juz rozdzielone per sprzedawca:
  - `sellerId`
  - `clientId`
  - `orderGroupId`
  - `totalGross`
  - `totalShipping`
  - `paymentStatus`
- To znaczy:
  - `orderGroupId` jest warstwa wspolnego checkoutu
  - `order` jest juz naturalna jednostka handlowa dla konkretnego sprzedawcy

### Dane do przelewu sprzedawcy

- W [`DB_STRUCTURE.md`](c:/Projects/ardrop_v2/DB_STRUCTURE.md) tabela `seller_settings` ma juz pola:
  - `payoutAccountHolder`
  - `payoutBankAccount`
  - `payoutBankName`
- To daje baze pod bezposredni przelew klienta do sprzedawcy.

### Status platnosci

- Tabela `orders` ma tylko podstawowe pole:
  - `paymentStatus enum('pending','paid','failed')`
- Brakuje:
  - `paymentMethod`
  - `paymentDueDate`
  - `paymentReference`
  - snapshotu danych bankowych sprzedawcy na moment zakupu
  - rozdzielenia logiki platnosci od samego zamowienia

### Dokumenty / faktury

- W obecnym schemacie nie ma tabeli dokumentow platniczych ani sprzedazowych.
- Nie ma:
  - `pro forma`
  - `invoice`
  - `pdf file / url`
  - numeracji dokumentow
- Nie ma tez snapshotu danych wystawcy i nabywcy dla dokumentu.

### Historia finansowa sprzedawcy

- Tabela `seller_financial_entries` istnieje i nadaje sie do historii finansowej / rozliczen.
- Ale to nie jest model platnosci klienta.
- Ta tabela nie zastepuje:
  - instrukcji przelewu
  - dokumentu platniczego
  - potwierdzenia, jak klient ma zaplacic

## Kluczowa decyzja architektoniczna

Nie idziemy w model:

- jedna platnosc za caly koszyk do platformy
- split payment przez platforme
- platforma jako posrednik srodkow

Idziemy w model:

- jeden koszyk klienta
- jeden `orderGroupId`
- wiele `orders` per sprzedawca
- osobna platnosc per `order`
- osobny dokument platniczy per `order`
- osobne dane do przelewu per sprzedawca

To oznacza:

- dostawa per sprzedawca
- platnosc per sprzedawca
- dokument per sprzedawca

## Co jest potrzebne

## 1. Jasny model platnosci per order

Trzeba przyjac jako source of truth:

- `orderGroupId` = wspolny checkout UX
- `order` = jednostka platnosci i realizacji konkretnego sprzedawcy

To musi byc widoczne w logice:

- API
- panelu klienta
- panelu sprzedawcy
- panelu admina

Klient po checkoutcie nie powinien widziec jednej abstrakcyjnej platnosci za wszystko, tylko:

- liste zamowien do oplacenia
- kazde z kwota i danymi przelewu konkretnego sprzedawcy

## 2. Rozszerzenie modelu `orders` o dane platnicze

Minimalnie trzeba dodac do `orders` pola typu:

- `paymentMethod`
- `paymentDueDate`
- `paymentReference`
- `sellerBankAccountSnapshot`
- `sellerBankNameSnapshot`
- `sellerAccountHolderSnapshot`

Powod:

- dane w `seller_settings` moga sie zmienic po zakupie
- zamowienie musi trzymac snapshot danych, z ktorych klient korzystal przy platnosci

Nie chcemy przy odczycie historycznego zamowienia polegac na aktualnych ustawieniach sprzedawcy.

## 3. Snapshot stron transakcji dla platnosci

Na moment utworzenia zamowienia trzeba utrwalic nie tylko dostawe, ale tez dane rozliczeniowe:

- dane sprzedawcy:
  - `companyName`
  - `nip`
  - `address`
  - `postalCode`
  - `city`
- dane klienta:
  - `companyName`
  - `nip`
  - `address`
  - `postalCode`
  - `city`

Najlepiej jako snapshot JSON przy zamowieniu albo przy przyszlym dokumencie.

Powod:

- dokument platniczy i ewentualna faktura musza odzwierciedlac stan z chwili zakupu

## 4. Minimalny dokument platniczy na start

Na MVP nie robimy od razu pelnej logiki faktur VAT.

Na start potrzebny jest dokument typu:

- `pro forma`
  albo
- `wezwanie do zaplaty / instrukcja platnosci`

Dokument musi zawierac:

- numer dokumentu
- dane sprzedawcy
- dane klienta
- numer zamowienia
- kwote
- termin platnosci
- numer rachunku
- tytul przelewu

To moze byc:

- nowa tabela `order_documents`
  albo
- prostszy snapshot / payload generowany bez tabeli, jesli chcemy najpierw zrobic MVP bez numeracji

Rekomendacja:

- od razu zrobic osobna tabele dokumentow, bo inaczej kolejny etap i tak bedzie refaktorem

## 5. Tabela dokumentow per order

Najbardziej naturalny kierunek:

- nowa tabela np. `order_documents`

Minimalne pola:

- `id`
- `orderId`
- `sellerId`
- `clientId`
- `type` (`proforma`, `invoice`)
- `number`
- `status`
- `buyerSnapshotJson`
- `sellerSnapshotJson`
- `totalsSnapshotJson`
- `paymentSnapshotJson`
- `filePath` albo `fileUrl`
- `createdAt`
- `updatedAt`

Powod:

- dokument nie powinien byc rozproszony po przypadkowych kolumnach `orders`
- przyszle faktury i pro formy powinny miec wspolny model

## 6. Checkout klienta: ekran po zlozeniu zamowienia

Po zlozeniu koszyka klient musi zobaczyc, ze:

- zamowienie zostalo rozbite na sprzedawcow
- dla kazdego sprzedawcy jest osobna platnosc

Widok po checkoutcie powinien pokazywac per `order`:

- nazwe sprzedawcy
- numer zamowienia
- kwote do zaplaty
- termin platnosci
- bank account
- tytul przelewu
- link do dokumentu platniczego

To jest kluczowe UX-owo, bo inaczej klient nie zrozumie, ze ma wykonac kilka przelewow.

## 7. Panel klienta: widok zamowienia i lista zamowien

W aplikacji klienta trzeba rozszerzyc:

- liste zamowien
- szczegoly zamowienia

O dane platnicze:

- `paymentMethod`
- `paymentStatus`
- `paymentDueDate`
- dane przelewu
- dokument do pobrania

Jesli `orderGroupId` zawiera kilka `orders`, UI powinno to jasno pokazywac.

Nie mozna udawac, ze to jedna platnosc.

## 8. Panel sprzedawcy: obsluga platnosci

Sprzedawca powinien miec widok swojego zamowienia z informacja:

- jaka metoda platnosci zostala wybrana
- czy zamowienie jest oplacone
- jaki byl termin platnosci

Minimalnie sprzedawca powinien moc:

- oznaczyc zamowienie jako `paid`
  albo
- admin robi to centralnie, a sprzedawca tylko widzi status

Tu trzeba podjac decyzje produktowa:

- czy `paid` ustawia tylko admin
- czy moze tez sprzedawca

Na MVP sensowniejsze wydaje sie:

- admin i ewentualnie sprzedawca

ale musi byc jasna odpowiedzialnosc.

## 9. Panel admina: nadzor nad platnosciami

Admin powinien miec mozliwosc:

- filtrowania zamowien po `paymentStatus`
- podgladu danych przelewu
- podgladu dokumentu platniczego
- recznej zmiany statusu platnosci

Bez tego operacyjnie MVP bedzie slepe.

## 10. Reguly tworzenia zamowienia

Podczas `POST /orders` backend powinien:

1. utworzyc `orders` per sprzedawca jak teraz,
2. zapisac snapshot danych platniczych sprzedawcy,
3. wygenerowac `paymentReference`,
4. ustawic `paymentMethod = bank_transfer`,
5. ustawic `paymentStatus = pending`,
6. ustawic `paymentDueDate`,
7. opcjonalnie wygenerowac od razu dokument `proforma`

Backend powinien byc source of truth dla tych danych.

Frontend nie powinien skladac instrukcji przelewu samodzielnie.

## 11. Numer referencyjny platnosci

Potrzebny jest stabilny `paymentReference`, ktory klient wpisze w tytule przelewu.

Najprostszy MVP:

- oparty o `orderId`
  albo
- oparty o `orderGroupId + orderId`

Wazne:

- musi byc jednoznaczny
- musi byc latwy do wyszukania przez admina i sprzedawce
- musi byc zapisany w bazie, a nie generowany kazdorazowo na fly

## 12. Termin platnosci

Potrzebny jest prosty model terminu platnosci, np.:

- `createdAt + 3 dni`
  albo
- `createdAt + 7 dni`

To powinno byc zapisane w `orders`, a nie wyliczane dynamicznie przy kazdym odczycie.

Pozniej mozna myslec o:

- konfiguracji per sprzedawca

ale nie jest to konieczne na MVP.

## 13. Wplyw platnosci na realizacje

Trzeba jasno ustalic regule biznesowa:

- zamowienie nie przechodzi do realizacji, dopoki `paymentStatus !== paid`

To powinno byc widoczne w:

- API
- panelu sprzedawcy
- panelu admina

I ewentualnie blokowac zmiany statusu zamowienia z `new` do dalszych etapow.

## 14. Minimalny zakres MVP

Zeby uruchomic to sensownie, minimalny zakres jest taki:

1. Uznac `order` za jednostke platnosci per sprzedawca.
2. Dodac do `orders` podstawowe pola platnicze i snapshot danych przelewu.
3. Podczas tworzenia zamowienia zapisac `paymentMethod`, `paymentStatus`, `paymentDueDate`, `paymentReference`.
4. Zbudowac prosty dokument platniczy typu `proforma` albo `instrukcja przelewu`.
5. Pokazac klientowi po checkoutcie osobne instrukcje platnosci dla kazdego sprzedawcy.
6. Dodac widocznosc danych platniczych w szczegolach zamowienia klienta.
7. Dodac obsluge / podglad platnosci w panelu sprzedawcy i admina.
8. Utrzymac model bez posrednictwa finansowego platformy.

## 15. Rzeczy do swiadomego odlozenia

Na pozniej:

- integracja z Przelewy24
- jakikolwiek split payment przez platforme
- jedna platnosc za caly koszyk
- automatyczne ksiegowanie przelewow
- automatyczna weryfikacja wyciagow bankowych
- pelna faktura VAT z kompletna numeracja i obsluga korekt
- kilka metod platnosci per sprzedawca
- odroczone terminy / kredyt kupiecki

## 16. Ryzyka i uwagi

- Najwieksze ryzyko UX: klient sklada jeden koszyk, ale finalnie musi wykonac kilka przelewow.
- To trzeba bardzo jasno pokazac po checkoutcie i w szczegolach zamowien.
- Najwieksze ryzyko techniczne: korzystanie z aktualnych danych `seller_settings` zamiast snapshotu z chwili zakupu.
- Najwieksze ryzyko operacyjne: brak jasnego procesu, kto zmienia `paymentStatus` na `paid`.
- `seller_financial_entries` nie powinno byc traktowane jako system platnosci klienta; to raczej historia rozliczeniowa / finansowa.
- Jesli zrobimy teraz model per `order`, to bedzie on spojny z obecnym schematem bazy i nie bedzie udawal, ze platforma jest bankiem lub merchant of record.
