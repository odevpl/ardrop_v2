# TODO

## 1. INVESTIGATION: Seller onboarding / puste stany ustawien

### Problem

Nowy seller na podstronach `/shipping`, `/discounts`, `/pricing-rules`, `/payout-settings` widzi blad pobierania danych zamiast pustego formularza/listy i przez to nie ma jak skonfigurowac pierwszych ustawien.

### Ustalenia techniczne

- Frontend tych sekcji umie dzialac na pustych danych, jezeli backend zwroci defaultowy obiekt lub pusta liste:
  - `seller/src/modules/PayoutSettingsForm/index.jsx`
  - `seller/src/modules/PricingRulesForm/index.jsx`
  - `seller/src/modules/DiscountList/index.jsx`
  - `seller/src/modules/ShippingList/index.jsx`
- Backend `api/src/services/seller-settings.js` mapuje brakujace rekordy konfiguracyjne do defaultow (`mapSettingsRow`, `mapReturnPolicy`, `mapSalesSettings`, `buildBusinessHours`, `buildShippingMethods`).
- Wspolny punkt awarii jest wyzej: `getSellerByUserId(userId)` rzuca `404 Seller profile not found`, jezeli istnieje `users.role = SELLER`, ale nie istnieje odpowiadajacy rekord w `sellers`.
- Wtedy wszystkie endpointy `/seller/me/...` zwracaja blad, a `FetchWrapper` pokazuje ekran "Nie udalo sie pobrac danych".

### Prawdopodobna przyczyna

Istnieje sciezka utworzenia konta sellera, ktora tworzy rekord w `users`, ale nie gwarantuje rekordu w `sellers` dla tego samego `userId` (np. reczna operacja na bazie albo niespojny onboarding). Dla takich kont API nie ma jak wyznaczyc `sellerId`.

### Proponowane taski naprawcze

- Uszczelnic invariant: kazdy `users.role = SELLER` musi miec rekord w `sellers`.
- Zdecydowac docelowe zachowanie dla konta SELLER bez profilu:
  - auto-utworzenie minimalnego rekordu w `sellers` przy pierwszym wejsciu do `/seller/me/settings`,
  - albo dedykowany stan onboardingowy z formularzem danych firmy zamiast twardego 404.
- Dodac jednorazowy SQL diagnostyczny/naprawczy dla osieroconych kont SELLER bez rekordu `sellers`.
- Dodac testy manualne dla nowego sellera bez ustawien:
  - shipping: pusta tabela + mozliwosc dodania pierwszej metody,
  - discounts: pusta tabela + mozliwosc dodania pierwszego rabatu,
  - pricing-rules: pusty formularz z defaultami + zapis,
  - payout-settings: pusty formularz + zapis.

### SQL diagnostyczny do phpMyAdmin

```sql
SELECT
  u.id AS userId,
  u.email,
  u.role,
  u.isActive,
  s.id AS sellerId
FROM users u
LEFT JOIN sellers s ON s.userId = u.id
WHERE u.role = 'SELLER'
  AND s.id IS NULL;
```
