# TODO

---

## Bezpieczeństwo (szczegóły w TODO_SECURITY.md)

- [x] Podłączyć rate limiter do `POST /auth/login`, `/auth/register`, `/auth/forgot-password` — `api/src/app.js`
- [x] Naprawić error handler — nie zwracać surowych błędów DB — `api/src/middlewares/error.middleware.js`
- [x] Dodać `helmet` — `api/src/app.js`
- [x] Na produkcji zablokować CORS bez nagłówka Origin — `api/src/app.js`

---

## Formularze kontaktowe — pełny feature

### Baza danych

- [x] Dodać tabelę `contact_forms` do `DB_STRUCTURE.md` i wykonać SQL:

```sql
CREATE TABLE `contact_forms` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `formName` varchar(100) NOT NULL,
  `dataJson` longtext NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_forms_formName` (`formName`),
  KEY `idx_contact_forms_created` (`formName`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

`formName` to stały identyfikator typu formularza (np. `"ddd"`).
`dataJson` to surowy obiekt z polami formularza — każdy formularz ma swoje klucze.

---

### Backend API

- [x] Utworzyć `api/src/controllers/contact.js` z endpointami:
  - `POST /contact/:formName` — publiczny (bez JWT). Zapisuje `{ formName, dataJson: JSON.stringify(body) }` do tabeli `contact_forms`. Opcjonalnie wysyła email przez Nodemailer na adres z env `CONTACT_FORM_EMAIL`.
  - `GET /admin/forms` — tylko ADMIN. Zwraca listę typów formularzy z liczbą wiadomości: `[{ formName, count, lastReceivedAt }]`. Query: `SELECT formName, COUNT(*) as count, MAX(createdAt) as lastReceivedAt FROM contact_forms GROUP BY formName`.
  - `GET /admin/forms/:formName` — tylko ADMIN. Zwraca stronicowaną listę wiadomości danego typu. Filtry: `page`, `limit`. Każdy rekord zawiera `id`, `formName`, `dataJson` (sparsowany), `createdAt`.

- [x] Zarejestrować kontroler w `api/src/app.js`:
  - `POST /contact/:formName` jako publiczny (dodać do listy wyjątków auth middleware)
  - `GET /admin/forms*` jako chroniony rolą ADMIN

- [x] Dodać `CONTACT_FORM_EMAIL` do env i do `ZAJAWKA.md`

---

### App — formularz DDD

- [x] Dodać stronę `/forms/ddd` (szczegółowe zadania w osobnej sekcji poniżej)

#### Routing i nawigacja — `app/`
- [x] `app/src/App.jsx` — dodać `<Route path="/forms/ddd" element={<DDDPage />} />` przed catch-all; dodać `"/forms/ddd"` do `allowedPathPrefixes`
- [x] `app/src/components/SidebarMenu/index.jsx` — dodać `NavLink` do `/forms/ddd` z tekstem `"Dezynfekcja / Dezynsekcja / Deratyzacja"` poniżej listy kategorii

#### Pliki do utworzenia — `app/`
- [x] `app/src/pages/ddd/index.jsx` — cienki wrapper importujący `DDDForm`
- [x] `app/src/modules/DDDForm/initialValues.js` — pola: `serviceType`, `contactName`, `companyName`, `phone`, `email`, `addressLine`, `postalCode`, `city`, `area`, `problemDescription`, `preferredDate`, `notes`
- [x] `app/src/modules/DDDForm/validation.js` — Yup: wymagane `serviceType` (enum), `contactName` (min 2), `phone` (min 9), `email` (format), `addressLine`, `postalCode` (XX-XXX), `city`, `area` (liczba > 0), `problemDescription` (min 10)
- [x] `app/src/modules/DDDForm/index.jsx` — formularz Formik z `FormikWrapper`; po submit wywołuje `DDDService.sendInquiry(values)`; pokazuje komunikat sukcesu lub błędu
- [x] `app/src/services/ddd.js` — `sendInquiry: (data) => apiPost({ url: "contact/ddd", data })`

#### Pola formularza DDD (dla firmy realizującej usługę)
```
Rodzaj usługi *      — select: Dezynfekcja / Dezynsekcja / Deratyzacja
Imię i nazwisko *    — contactName
Nazwa firmy          — companyName (opcjonalne)
Telefon *            — phone
Email *              — email
Ulica i numer *      — addressLine
Kod pocztowy *       — postalCode
Miasto *             — city
Powierzchnia (m²) *  — area (type decimal)
Opis problemu *      — problemDescription (textarea, min 10 znaków)
Preferowany termin   — preferredDate (type date, opcjonalne)
Uwagi                — notes (textarea, opcjonalne)
```

---

### Admin — moduł Formularze

#### Routing i nawigacja — `admin/`
- [x] `admin/src/components/SidebarMenu/sidebar.config.js` — dodać pozycję:
  ```js
  { title: 'Formularze', icon: 'fa-envelope-open-text', path: '/forms' }
  ```
- [x] `admin/src/App.jsx` — dodać trasy:
  ```jsx
  <Route path="/forms" element={<FormsPage />} />
  <Route path="/forms/:formName" element={<FormMessagesPage />} />
  ```

#### Pliki do utworzenia — `admin/`
- [x] `admin/src/services/forms.js`:
  ```js
  export const getForms = () => apiGet({ url: "admin/forms" });
  export const getFormMessages = ({ formName, ...filters }) =>
    apiGet({ url: `admin/forms/${formName}`, params: filters });
  ```

- [x] `admin/src/pages/forms/index.jsx` — lista typów formularzy:
  - `FetchWrapper` z `connector={getForms}`
  - Tabela lub siatka kafelków: kolumny `Formularz`, `Liczba wiadomości`, `Ostatnia wiadomość`
  - Kliknięcie wiersza → `navigate(\`/forms/${row.formName}\`)`

- [x] `admin/src/pages/forms/Messages/index.jsx` — lista wiadomości danego formularza:
  - Pobiera `formName` z `useParams()`
  - `FetchWrapper` z `connector={(filters) => getFormMessages({ formName, ...filters })}`, filtry `{ page: 1, limit: 20 }`
  - Tabela z kolumnami: `ID`, `Data`, i dynamicznie kluczami z `dataJson` (dla DDD: `serviceType`, `contactName`, `phone`, `email`, `city`, `area`)
  - Konfiguracja kolumn w osobnym `table.config.js` per formularz (lub generyczna jeśli klucze są nieznane)
  - Wzorzec jak `admin/src/pages/products/index.jsx` + `admin/src/modules/ProductList/`

