1. W seller znajduje się podstrona /pricing-rules (Reguły cenowe). Chcę tę funkcjonalność na razie wykasować z logiki seller i reszty projektów. discounts zostaje bez zmian, tak jak i logika z nim związana.

   Aktualny stan:
   - Routing seller nadal wystawia stronę `/pricing-rules` oraz aliasy `/configuration/pricing` i `/pricing`: `seller/src/App.jsx`.
   - Pozycja menu nadal istnieje w sidebarze: `seller/src/components/SidebarMenu/sidebar.config.js`.
   - Widok strony ładuje `PricingRulesForm`: `seller/src/pages/pricing-rules/index.jsx`.
   - Sam formularz żyje w `seller/src/modules/PricingRulesForm/*` i zapisuje pola do `seller_settings` oraz `seller_sales_settings`.
   - W backendzie logika `salesSettings` nadal istnieje i jest obsługiwana przez `api/src/services/seller-settings.js`.

   Co realnie trzeba usunąć / wyłączyć:
   - Frontend seller:
     - usunąć import `PricingRulesPage` z `seller/src/App.jsx`,
     - usunąć route `/pricing-rules`,
     - usunąć przekierowania `/configuration/pricing` i `/pricing` albo przekierować je na sensowną stronę, np. `/discounts` lub `/payout-settings`,
     - usunąć wpis menu `Reguly cenowe`,
     - sprawdzić czy moduł `seller/src/modules/PricingRulesForm/*` ma zostać fizycznie usunięty czy tylko odłączony.
   - Backend:
     - jeśli celem jest tylko ukrycie funkcji, API `salesSettings` może zostać bez zmian.
     - jeśli celem jest pełne wykasowanie z logiki projektu, trzeba usunąć obsługę `salesSettings` z `api/src/services/seller-settings.js` i ustalić co zrobić z tabelą `seller_sales_settings`.

   Ważna zależność:
   - Pole `minimumOrderValueGross` z `seller_sales_settings` jest dobrym miejscem dla tasku nr 7. Jeśli task 1 ma być zrobiony teraz, a task 7 później, to nie warto usuwać całego backendowego `salesSettings`, tylko tylko ukryć `PricingRulesForm` z UI.

   Rekomendacja:
   - Na teraz odłączyć wyłącznie UI `/pricing-rules`, ale zostawić backend `salesSettings`, bo już istnieje i przyda się do progu minimalnego zamówienia.

2. Obecnie na stronie użytkownika (app), przykład podstrony http://localhost:3001/?limit=20&category=przyprawy&page=3, kiedy wejdę na inną podstronę, page wraca do 1

   Aktualny stan:
   - Lista produktów używa `FetchWrapper` z synchronizacją `page` i `limit` do query string: `app/src/components/FetchWrapper/index.jsx`.
   - `AllProducts` pobiera kategorię z query params i przy zmianie kategorii resetuje `page` do `1`: `app/src/modules/AllProducts/index.jsx`.
   - Sidebar kategorii oraz `CategoriesView` również celowo usuwają `page` przy zmianie kategorii: `app/src/components/SidebarMenu/index.jsx`, `app/src/modules/CategoriesView/index.jsx`.

   Prawdopodobny problem:
   - Przy przejściu na inną podstronę i powrocie do `/` komponent `AllProducts` mountuje się od nowa.
   - `FetchWrapper` czyta z URL tylko `page` i `limit`, ale `AllProducts` ma dodatkowy efekt, który porównuje `filters.category` z `selectedCategory`.
   - Jeśli w momencie pierwszego renderu `filters.category` jest jeszcze puste, efekt robi `setFilters(... page: 1 ...)`, więc query param `page=3` zostaje nadpisany.

   Miejsca do sprawdzenia przy implementacji:
   - `app/src/components/FetchWrapper/index.jsx`
   - `app/src/modules/AllProducts/index.jsx`

   Co warto zmienić:
   - albo rozszerzyć `FetchWrapper`, żeby inicjalnie synchronizował także inne filtry z query string, np. `category`, `search`,
   - albo w `AllProducts` nie resetować `page` do `1`, jeśli `selectedCategory` już zgadza się z URL i to jest tylko odtworzenie stanu po remoncie komponentu,
   - albo uzależnić reset strony wyłącznie od faktycznej zmiany kategorii przez użytkownika, a nie od pierwszego `useEffect`.

   Oczekiwany efekt:
   - wejście na `/` z `?limit=20&category=przyprawy&page=3` powinno zawsze odtworzyć listę na stronie 3, również po przejściu na inny route i powrocie.

3. Ten sam przegląd produktów (lista produktów). Obecnie kiedy otworzę zawartość .allProductsInlineConfig z formularzem, pojawia się też input allProductsInlineField. Niestety obecnie pojawiają się tam warianty, ale nie ma cen. Fajnie by było dodać ceny w nawiasie (netto/brutto). Tak samo zaprezentuj cenę w pojedynczym produkcie na liście produktów.

   Aktualny stan:
   - Widok listy produktów: `app/src/modules/AllProducts/index.jsx`.
   - Inline konfigurator pokazuje select wariantów, ale opcje renderują tylko `variant.name`.
   - Karta produktu pokazuje tylko jedną cenę `displayPrice`, obecnie w praktyce brutto.
   - API produktów zwraca dla produktu i wariantów oba pola: `netPrice`, `grossPrice`, a dla klienta potrafi też podmienić je cenami specjalnymi: `api/src/services/products.js`.

   Co można dopisać w UI:
   - W select opcji wariantu format:
     - `Wariant X (12.30 netto / 15.13 brutto)`.
   - W pojedynczej karcie produktu pokazywać:
     - główną cenę brutto,
     - pod nią mniejszy tekst z netto,
     - albo oba formaty obok siebie, jeśli design pozwala.

   Techniczne uwagi:
   - Dane już są dostępne po stronie API, nie trzeba robić nowego endpointu.
   - Jeśli produkt ma `originalGrossPrice` / `originalNetPrice` z cen specjalnych klienta, można rozważyć później także przekreśloną cenę bazową, ale to nie jest wymagane do tego taska.
   - Warto ujednolicić formatowanie cen do jednej helperki, bo podobne formatowanie występuje już w wielu miejscach app.

   Miejsca do zmiany:
   - `app/src/modules/AllProducts/index.jsx`
   - opcjonalnie `app/src/modules/FastProductView/index.jsx` i `app/src/pages/productPreview/index.jsx`, jeśli ceny mają być spójne także tam.

4. Seller dla podstrony /shipping/1. Pojawia się formularz, ale dodałbym tam też vat i przelicznik. Jeśli mamy vat (domyślnie 23%), to jeśli wpiszę netto, brutto samo się przelicza i odwrotnie. Może warto by było te przeliczniki (funkcję) przenieść do utils

   Aktualny stan:
   - Formularz metody dostawy: `seller/src/modules/ShippingEditForm/index.jsx`.
   - Initial values: `seller/src/modules/ShippingEditForm/initialValues.js`.
   - Walidacja: `seller/src/modules/ShippingEditForm/validation.js`.
   - Backend zapisuje tylko `priceNet` i `priceGross` dla `seller_shipping_methods`, nie ma osobnej kolumny `vatRate`: `api/src/services/seller-settings.js`, tabela `seller_shipping_methods` w `DB_STRUCTURE.md`.

   Wniosek:
   - Żeby VAT był trwały i edytowalny, potrzebna będzie zmiana schematu bazy.
   - Sam przelicznik w UI bez kolumny `vatRate` też jest możliwy, ale wtedy VAT nie będzie zapisany per metoda i trzeba go domyślnie brać np. z `seller_settings.defaultVatRate` albo hardcode `23`.

   Minimalny zakres implementacyjny:
   - Dodać pole `vatRate` do:
     - tabeli `seller_shipping_methods`,
     - `SHIPPING_METHODS_SELECT`,
     - `buildShippingMethods`,
     - `normalizeShippingMethod`,
     - insert/update w `api/src/services/seller-settings.js`,
     - `seller/src/modules/ShippingEditForm/initialValues.js`,
     - `seller/src/modules/ShippingEditForm/validation.js`,
     - formularza `seller/src/modules/ShippingEditForm/index.jsx`.

   Logika UI:
   - domyślny VAT:
     - najbezpieczniej `23`,
     - opcjonalnie fallback do `seller_settings.defaultVatRate`, jeśli dostępne w payload.
   - zmiana `priceNet` przelicza `priceGross = net * (1 + vat/100)`,
   - zmiana `priceGross` przelicza `priceNet = gross / (1 + vat/100)`,
   - zmiana `vatRate` powinna przeliczyć drugie pole na podstawie ostatnio edytowanego pola albo przyjąć jedno źródło prawdy.

   Rekomendacja architektoniczna:
   - wydzielić helpery typu:
     - `calculateGrossFromNet(net, vatRate)`
     - `calculateNetFromGross(gross, vatRate)`
     - `roundCurrency(value)`
   - wrzucić je do wspólnego utilsa w seller, a jeśli później będą używane też w admin/app, przenieść do wspólnego modułu.

   SQL / migracja:
   - potrzeba dodać kolumnę, np. `vatRate DECIMAL(5,2) NOT NULL DEFAULT 23.00` do `seller_shipping_methods`.

5. Kiedy wejdziemy do /discounts/new pojawia się formularz i typy regół. Obecnie chciałbym, by jako typy zostały tylko rabat od progu koszyka oraz rabat od ilości sztuk.

   Aktualny stan:
   - Typy w formularzu definiuje `DISCOUNT_RULE_TYPE_OPTIONS`: `seller/src/modules/DiscountEditForm/validation.js`.
   - Widoczność pól zależy od `getRuleFieldVisibility` w tym samym pliku.
   - Backend nadal akceptuje więcej typów:
     - `cart_threshold`
     - `quantity_threshold`
     - `first_purchase`
     - `loyal_customer`
     - `b2b_customer`
     - `happy_hours`
     - `free_bonus`
     w `api/src/services/seller-settings.js`.
   - Logika naliczania rabatów w koszyku i zamówieniach obsługuje:
     - `cart_threshold`
     - `quantity_threshold`
     - `first_purchase`
     - `loyal_customer`
     - `free_bonus`
     w `api/src/services/discount-rules.js`.

   Jeśli celem jest tylko ograniczenie UI:
   - wystarczy usunąć z `DISCOUNT_RULE_TYPE_OPTIONS` wszystkie typy poza:
     - `cart_threshold`
     - `quantity_threshold`
   - istniejące stare rekordy w bazie nadal będą działały w backendzie.

   Jeśli celem jest pełne ograniczenie logiki:
   - trzeba też zawęzić `allowedRuleTypes` w `api/src/services/seller-settings.js`,
   - rozważyć migrację / cleanup istniejących wpisów w `seller_discount_rules`,
   - upewnić się, że stare reguły nie są dalej naliczane w `api/src/services/discount-rules.js`.

   Rekomendacja:
   - Najpierw ograniczyć UI.
   - Jeśli w bazie istnieją stare typy, warto dodać jednorazowy cleanup SQL:
     - usunięcie reguł z `ruleType NOT IN ('cart_threshold', 'quantity_threshold')`.

6. W seller pojawiają się nowi sprzedawcy. Ważna funkcja dla nas, to niepokazywanie produktów klientów, którzy nie mają wypełnionych danych przesyłki, danych do przelewu. Może warto zapisać ten stan gdzieś w bazie. Jeśli podrzucisz SQL query, to wrzucę go do bazy.

   Interpretacja biznesowa:
   - Chodzi o ukrycie produktów sprzedawcy przed klientem, jeśli sprzedawca nie ma:
     - skonfigurowanej wysyłki,
     - uzupełnionych danych do przelewów.
   - Słowo "klientów" w treści wygląda tu raczej na skrót myślowy; w kodzie dotyczy to produktów sprzedawców widocznych dla klientów.

   Aktualny stan:
   - App pobiera listę produktów z `api/src/services/products.js`.
   - Dla roli `CLIENT` endpoint filtruje tylko `products.status = 'active'`.
   - Nie ma dziś żadnego sprawdzenia gotowości sprzedawcy do sprzedaży.
   - Dane do przelewów siedzą w `seller_settings`:
     - `payoutAccountHolder`
     - `payoutBankAccount`
     - `payoutBankName`
   - Metody wysyłki siedzą w `seller_shipping_methods`.

   Najprostsza implementacja bez nowej kolumny:
   - w `api/src/services/products.js` dla roli `CLIENT` dodać warunek, że produkt jest widoczny tylko jeśli seller:
     - ma co najmniej jedną aktywną metodę wysyłki,
     - ma komplet danych przelewowych w `seller_settings`.

   Lepsza implementacja z flagą w bazie:
   - dodać pole np. `isReadyForSales TINYINT(1) NOT NULL DEFAULT 0` do `seller_settings`,
   - aktualizować je automatycznie po zapisaniu:
     - payout settings,
     - shipping methods,
     - opcjonalnie innych krytycznych danych.
   - wtedy `products.js` filtruje po gotowej fladze zamiast liczyć warunki za każdym razem.

   Rekomendacja:
   - Na start nie trzeba nowej kolumny. Da się to policzyć dynamicznie i będzie mniej ryzyka migracyjnego.
   - Flaga ma sens dopiero jeśli takich warunków będzie więcej albo pojawią się problemy wydajnościowe.

   SQL pomocniczy do wykrycia sellerów niegotowych:
   ```sql
   SELECT
     s.id AS sellerId,
     s.companyName,
     CASE
       WHEN ss.payoutAccountHolder IS NOT NULL
        AND ss.payoutAccountHolder <> ''
        AND ss.payoutBankAccount IS NOT NULL
        AND ss.payoutBankAccount <> ''
        AND ss.payoutBankName IS NOT NULL
        AND ss.payoutBankName <> ''
       THEN 1 ELSE 0
     END AS hasPayoutData,
     CASE
       WHEN EXISTS (
         SELECT 1
         FROM seller_shipping_methods sm
         WHERE sm.sellerId = s.id
           AND sm.isActive = 1
       )
       THEN 1 ELSE 0
     END AS hasActiveShipping
   FROM sellers s
   LEFT JOIN seller_settings ss ON ss.sellerId = s.id;
   ```

   SQL jeśli jednak chcesz dodać flagę:
   ```sql
   ALTER TABLE seller_settings
   ADD COLUMN isReadyForSales TINYINT(1) NOT NULL DEFAULT 0
   AFTER paymentDueDays;

   UPDATE seller_settings ss
   JOIN sellers s ON s.id = ss.sellerId
   SET ss.isReadyForSales = CASE
     WHEN ss.payoutAccountHolder IS NOT NULL
      AND ss.payoutAccountHolder <> ''
      AND ss.payoutBankAccount IS NOT NULL
      AND ss.payoutBankAccount <> ''
      AND ss.payoutBankName IS NOT NULL
      AND ss.payoutBankName <> ''
      AND EXISTS (
        SELECT 1
        FROM seller_shipping_methods sm
        WHERE sm.sellerId = s.id
          AND sm.isActive = 1
      )
     THEN 1 ELSE 0
   END;
   ```

   Gdzie wdrożyć filtr:
   - `api/src/services/products.js`
   - opcjonalnie też `getSuggestedProducts`, żeby karuzele i sugestie nie pokazywały niegotowych sellerów.

7. Seller - Dane do przelewów pod podstroną /payout-settings. Należy tam wpisać minimalną kwotę, poniżej której nie można zakupić produktu w koszyku. Będzie blokowane kliknięcie zamówienia oraz informacja, że nie przekroczono progu minimalnego zakupu dla tego sprzedawcy.

   Aktualny stan:
   - Formularz payout settings jest w:
     - `seller/src/pages/payout-settings/index.jsx`
     - `seller/src/modules/PayoutSettingsForm/*`
   - Dziś zapisuje tylko:
     - `payoutAccountHolder`
     - `payoutBankAccount`
     - `payoutBankName`
     - `paymentDueDays`
   - Pole `minimumOrderValueGross` już istnieje w tabeli `seller_sales_settings` oraz jest obsługiwane przez backend `salesSettings`.
   - Pole to jest dziś edytowane przez ukrywany ekran `PricingRulesForm`.
   - Koszyk (`app/src/modules/Cart/index.jsx`) blokuje checkout tylko dla braku dostawy, nie dla minimalnego progu zamówienia.
   - Backend tworzenia zamówienia (`api/src/services/orders.js`) też nie waliduje tego warunku.

   Wniosek:
   - Nie trzeba dodawać nowej kolumny do bazy. Najlepiej wykorzystać istniejące `seller_sales_settings.minimumOrderValueGross`.

   Co trzeba zrobić:
   - Seller UI:
     - dodać input `minimumOrderValueGross` do `seller/src/modules/PayoutSettingsForm/index.jsx`,
     - dopiąć go do `initialValues.js` i `validation.js`,
     - przy submit wysyłać nie tylko settings, ale też `salesSettings.minimumOrderValueGross`.
   - API:
     - backend już to przyjmuje w `updateSellerSettings`, więc wystarczy poprawnie wysyłać payload.
   - App koszyk:
     - przy renderze shipmentów porównać `shipment.totals.itemsGross` albo `totalGrossAfterDiscount` z progiem sellera,
     - pokazać komunikat przy danym sellerze,
     - zablokować przycisk zamówienia.
   - Backend zamówień:
     - dodać twardą walidację w `api/src/services/orders.js`, żeby nie dało się ominąć blokady frontendowej.

   Kluczowa decyzja biznesowa:
   - próg powinien być liczony od:
     - wartości produktów brutto bez dostawy,
     - czy po rabatach?
   - Obecne sformułowanie sugeruje:
     - minimalny zakup u sprzedawcy,
     - więc najlogiczniej liczyć `shipment.totals.totalGrossAfterDiscount - shippingGross`, albo prościej `itemsGross - discountGross`.

   Rekomendacja techniczna:
   - Walidować próg na poziomie pojedynczego shipmentu per seller.
   - Na froncie dodać listę sellerów blokujących checkout i czytelny komunikat.
   - Na backendzie zwracać błąd 400 z nazwą sprzedawcy i wymaganym progiem.

8. Seller - w podstronie discounts/new przydałby się dodatkowy typ. Kod rabatowy. Zostawiamy nazwę reguły, wpisujemi input z nazwą kodu rabatowego. Rabat % zostaje. Dopisujemy ile razy jedno konto może skorzystać z tego kodu rabatowego. 0 oznacza nieskończoność.

   Aktualny stan:
   - Formularz rabatów oparty jest o `seller_discount_rules.configJson`.
   - To daje dużą elastyczność, bo nie trzeba dodawać nowych kolumn do `seller_discount_rules`.
   - Natomiast dziś nie ma tabeli historii użyć kodów rabatowych per klient.
   - `carts.couponCode` istnieje, ale nie ma obecnie logiki wpisywania i walidacji kodu w koszyku.
   - `discount-rules.js` liczy rabaty automatyczne per seller, nie ma tam jeszcze obsługi kodów.

   Zakres potrzebny do pełnej funkcji:
   - Seller UI:
     - dodać nowy `ruleType`, np. `coupon_code`,
     - pokazać pola:
       - `name` (nazwa reguły),
       - `couponCode`,
       - `discountPercent`,
       - `usageLimitPerClient`.
   - Backend settings:
     - dopuścić `coupon_code` w `allowedRuleTypes` w `api/src/services/seller-settings.js`.
   - Logika naliczania:
     - `api/src/services/discount-rules.js` musi umieć ocenić kod tylko wtedy, gdy został wpisany do koszyka.
   - Koszyk / app:
     - potrzebny UI do wpisania kodu rabatowego,
     - zapis kodu do `carts.couponCode`,
     - przeliczenie koszyka po wpisaniu/usunięciu kodu.
   - Baza:
     - potrzebna nowa tabela historii użyć kodu, np. `seller_discount_rule_usages` albo bardziej ogólnie `discount_code_usages`.

   Proponowany config w `configJson`:
   ```json
   {
     "couponCode": "WIOSNA10",
     "discountPercent": 10,
     "usageLimitPerClient": 0
   }
   ```

   Proponowana tabela użyć:
   ```sql
   CREATE TABLE seller_discount_rule_usages (
     id INT UNSIGNED NOT NULL AUTO_INCREMENT,
     discountRuleId INT UNSIGNED NOT NULL,
     sellerId INT NOT NULL,
     clientId INT NOT NULL,
     orderId INT UNSIGNED DEFAULT NULL,
     orderGroupId INT UNSIGNED DEFAULT NULL,
     usedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (id),
     KEY idx_sdr_usage_rule_client (discountRuleId, clientId),
     KEY idx_sdr_usage_seller_client (sellerId, clientId)
   );
   ```

   Ważne pytania implementacyjne:
   - czy kod ma działać globalnie na cały koszyk czy per seller?
     - obecna architektura rabatów działa per seller, więc kod też najlepiej trzymać per seller.
   - czy jeden kod może łączyć się z automatycznym rabatem progowym?
     - obecny silnik wybiera jedną najlepszą promocję; trzeba ustalić, czy kod ma nadpisywać automat, czy być dodatkowy.
   - czy limit użyć liczymy po złożonych zamówieniach czy już po samym wpisaniu kodu do koszyka?
     - najbezpieczniej po złożonym zamówieniu.

   Rekomendacja:
   - Ten task jest większy niż sama zmiana formularza.
   - Jeśli ma być zrobiony porządnie, trzeba objąć:
     - seller form,
     - app cart UI,
     - backend walidacji koszyka,
     - backend tworzenia zamówienia,
     - nową tabelę użyć kodów.
