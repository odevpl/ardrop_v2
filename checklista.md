# Checklista brakow dla flow sklepu

## 1. Co juz dziala

- Klient moze przegladac produkty i dodawac je do koszyka.
- Koszyk grupuje pozycje per sprzedawca.
- Zamowienie moze zostac utworzone z aktywnego koszyka.
- Jedno zamowienie zakupowe jest rozdzielane na osobne rekordy `orders` per sprzedawca, powiazane przez `orderGroupId`.
- Klient ma liste swoich zamowien i widok szczegolow zamowienia.
- Seller ma liste zamowien i widok szczegolow zamowienia.
- Seller ma konfiguracje kontaktu, realizacji, dostawy, zwrotow, cen i finansow pod `/configuration/*`.

## 2. Najwazniejszy wniosek

Projekt jest dalej na etapie "zlozenie zamowienia technicznie dziala", a nie "sklep end-to-end dziala jak e-commerce".

Najwieksza luka nie jest w samym dodaniu kolejnej podstrony, tylko w domknieciu procesow:

- checkoutu,
- platnosci,
- wyboru dostawy,
- realizacji po stronie sprzedawcy,
- komunikacji statusow do klienta,
- obslugi po zakupie.

W praktyce teraz bardziej oplaca sie dopiac operacyjny workflow zamowienia niz dodawac kolejna statyczna podstrone.

## 3. Krytyczne braki po stronie klienta

### Checkout i dostawa

- Brak realnego wyboru metody dostawy w koszyku.
  Teraz klient widzi `Do ustalenia`, a shipment mozna technicznie zapisac recznie przez API, ale UI tego nie prowadzi.
- Brak automatycznego wyliczania kosztu dostawy z konfiguracji sellera.
  Seller zapisuje `shippingMethods` w `seller/me/settings`, ale checkout nie korzysta z tych danych.
- Brak walidacji, czy dana metoda dostawy pasuje do kraju, regionu, koszyka, wagi, liczby sztuk i wykluczonych produktow.
- Brak wyliczania ETA z ustawien sellera.
  Seller ma `defaultOrderPreparationDays`, `shippingWorkdays`, `sameDayShippingCutoffTime`, `holidays`, ale checkout i order flow tego nie wykorzystuja.
- Brak blokady zlozenia zamowienia, gdy dla ktoregos sprzedawcy nie da sie ustalic dostawy.

### Platnosc

- Brak faktycznej integracji platnosci online.
  Zamowienie tworzy sie od razu z `paymentStatus: "pending"` i nie ma procesu przejscia do operatora platnosci, callbacka ani potwierdzenia.
- Brak rozroznienia metod platnosci.
  W koszyku widac statyczne `Metoda platnosci: Przedplata`, ale klient nic nie wybiera.
- Brak strony sukcesu / bledu platnosci.
- Brak retry platnosci dla zamowienia oczekujacego.
- Brak rezerwacji i finalizacji zamowienia zalezne od wyniku platnosci.
  Dzisiaj zamowienie jest tworzone przed platnoscia.

### Zamowienie i komunikacja z klientem

- Brak potwierdzenia e-mail po zlozeniu zamowienia.
- Brak powiadomien o zmianie statusu zamowienia.
- Brak czytelnych statusow dla klienta typu:
  `oczekuje na platnosc`, `oplacone`, `w realizacji`, `spakowane`, `wyslane`, `dostarczone`, `anulowane`, `zwrot`, `reklamacja`.
- Brak numeru przesylki i linku do sledzenia.
- Brak podzialu widoku klienta na przesylki per sprzedawca w sposob operacyjny.
  Dane sa technicznie podzielone, ale klient nie ma realnego wgladu w przebieg realizacji.

### Obsluga po zakupie

- Brak flow anulowania zamowienia przed wysylka.
- Brak flow zwrotu.
- Brak flow reklamacji.
- Brak dokumentow sprzedazowych: faktura, proforma, potwierdzenie zamowienia, korekta.
- Brak historii platnosci i rozliczen po stronie klienta.

## 4. Krytyczne braki po stronie sellera

### Operacyjna obsluga zamowienia

- Seller ma tylko podglad zamowienia.
  Obecna podstrona zamowienia jest glownie read-only.
- Brak mozliwosci zmiany statusu zamowienia przez sellera.
  Aktualnie `PUT /orders/:id` jest tylko dla `ADMIN`, nie dla `SELLER`.
- Brak akcji typu:
  `zaakceptuj do realizacji`,
  `rozpocznij kompletacje`,
  `oznacz jako spakowane`,
  `oznacz jako wyslane`,
  `oznacz jako dostarczone`,
  `anuluj`,
  `zglos brak towaru`.
- Brak numeru listu przewozowego / tracking number.
- Brak wyboru przewoznika.
- Brak mozliwosci korekty ETA i terminu wysylki.
- Brak mozliwosci dodania notatki wewnetrznej do zamowienia.
- Brak historii zdarzen na zamowieniu.

### Kontakt i obsluga klienta

- Brak miejsca, w ktorym seller moze odpowiedziec klientowi w sprawie zamowienia.
- Brak szablonow komunikacji opartych o ustawienia `orderSupportEmail`, `returnsEmail`, `emailSignature`, `emailFooter`.
- Brak obslugi zwrotow i reklamacji jako osobnych spraw.

### Magazyn i kontrola realizacji

- Brak twardej rezerwacji / zmniejszenia stocku przy checkout / platnosci.
- Brak ochrony przed oversellingiem przy finalizacji zamowienia.
- Brak workflow dla zamowien czesciowo zrealizowanych.
- Brak workflow dla brakow magazynowych po zakupie.

### Finanse sellera

- Historia finansowa istnieje, ale jest bardzo uproszczona.
- Brak rozroznienia:
  przychodu,
  prowizji,
  kosztu dostawy,
  zwrotow,
  wyplat,
  korekt,
  naleznosci netto do wyplaty.
- Brak powiazania finansow z faktycznie oplaconym zamowieniem.

## 5. Braki backendowe / systemowe

- Brak silnika checkoutu, ktory na podstawie `seller_settings` policzy dla kazdego sellera:
  dostepne metody dostawy,
  koszt dostawy,
  ETA,
  ograniczenia produktowe,
  darmowa dostawe.
- Brak modelu platnosci:
  `payments`,
  `payment_attempts`,
  `payment_provider_reference`,
  webhooki,
  audyt statusow.
- Brak modelu shipment / fulfillment:
  przewoznik,
  numer sledzenia,
  data nadania,
  data doreczenia,
  statusy logistyczne.
- Brak modelu zwrotow i reklamacji.
- Brak modelu eventow zamowienia / timeline.
- Brak automatycznych maili transakcyjnych po zamowieniu i zmianach statusu.

## 6. Rzeczy do zrobienia najpierw

### Priorytet 1 - domkniecie zakup -> platnosc -> realizacja

- Zrobic prawdziwy checkout per seller:
  wybor metody dostawy,
  wyliczenie kosztu dostawy,
  wyliczenie ETA,
  walidacja adresu i ograniczen.
- Zintegrowac platnosc online.
- Ustalic moment tworzenia zamowienia:
  albo zamowienie tworzy sie jako `awaiting_payment`,
  albo po potwierdzonej platnosci.
- Dodac sellerowi operacyjna obsluge zamowienia:
  zmiana statusu,
  tracking,
  data nadania,
  notatka wewnetrzna,
  komunikat do klienta.
- Dodac powiadomienia dla klienta po zmianach statusu.

### Priorytet 2 - obsluga po zakupie

- Zwroty.
- Reklamacje.
- Anulacje.
- Dokumenty sprzedazowe.

### Priorytet 3 - automatyzacja i finanse

- Automatyczne ETA z konfiguracji sellera.
- Automatyczne przypisywanie dostawy.
- Rozliczenia sellera i payout workflow.
- Alerty operacyjne dla sellera.

## 7. Co bym robil teraz

Nie zaczynalbym od kolejnej ogolnej podstrony konfiguracyjnej.

Najrozsadniejszy nastepny krok:

1. Zrobic minimalny operacyjny workflow zamowienia dla sellera.
2. Dopiac checkout klienta do `seller_settings.shippingMethods`.
3. Dodac warstwe platnosci.

Minimalny zakres dla sellera:

- przycisk zmiany statusu,
- mozliwosc ustawienia metody dostawy,
- mozliwosc wpisania numeru sledzenia,
- mozliwosc ustawienia ETA,
- historia zmian statusu,
- komunikat widoczny dla klienta.

Bez tego klient wprawdzie "kupi", ale sklep nie bedzie wiarygodnie obslugiwal realizacji.

## 8. Znalezione ryzyka / bugi techniczne

- W `api/src/services/carts.js` w `removeItemFromCurrentCart` uzywany jest `item.sellerId` przy usuwaniu shipmentu, ale w tym fragmencie nie ma zdefiniowanego `item`.
  To wyglada na realny bug przy usuwaniu pozycji z koszyka.
- `seller/src/services/orders.js` ma `updateOrder`, ale backendowy `PUT /orders/:id` jest ograniczony do `ADMIN`.
  To potwierdza, ze seller nie ma jeszcze domknietej obslugi statusow.
- Widok koszyka klienta pokazuje statyczna metode platnosci i pozwala wyslac zamowienie nawet gdy dostawa jest jeszcze "do ustalenia".

## 9. Decyzja produktowa

Jesli pytanie brzmi: "czy teraz dodac podstrone sprzedawcy, czy cos innego?" to odpowiedz brzmi:

- dodac sellerowi operacyjna obsluge zamowienia, a nie kolejna bierna podstrone,
- rownolegle dopiac checkout klienta do realnych metod dostawy i platnosci.

To jest teraz waski gardlo calego systemu.
