# TODO_SECURITY.md

Znalezione podczas audytu (2026-04-30). Pliki API — `api/src/`.

---

## Krytyczne

### Rate limiting nie jest podłączony do żadnego endpointu
- Middleware istnieje w `src/middlewares/rate-limit.middleware.js`, ale nigdzie nie jest użyty.
- Endpointy `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password` są otwarte na brute-force.
- **Fix:** W `src/app.js` dodać `.use(rateLimit(...))` do publicznych tras auth.

---

## Wysokie

### Error handler zwraca surowe komunikaty bazy danych
- Plik: `src/middlewares/error.middleware.js`
- Błędy DB (np. naruszenie unique key) trafiają wprost do response: `"Duplicate entry 'jan@firma.pl' for key 'users.email'"`.
- Ujawnia strukturę tabel i indeksów.
- **Fix:** Oddzielić błędy operacyjne od systemowych. Błędy DB logować server-side (console.error lub logger), użytkownikowi zwracać generyczny komunikat `"Wystąpił błąd. Spróbuj ponownie."`.

### Brak security headers (helmet)
- Plik: `src/app.js`
- Nie ma `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
- **Fix:** `npm install helmet` + `app.use(helmet())` na początku middleware stack.

---

## Średnie

### CORS zezwala na żądania bez nagłówka Origin
- Plik: `src/app.js`
- Linia `if (!origin) return callback(null, true)` przepuszcza curl, Postman i inne klienty nieposyłające `Origin`.
- Na dev wygodne, na produkcji ryzykowne.
- **Fix:** Na produkcji zmienić na `return callback(new Error("Not allowed"))`. Można sterować zmienną env `NODE_ENV`.

### Email regex zbyt permisywny
- Plik: `src/helpers/validator.js`
- Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` akceptuje `a@b.c` i inne nierealne adresy.
- **Fix:** Użyć biblioteki `validator.js` (`isEmail()`) albo bardziej rygorystycznego wyrażenia.

### Rate limiter oparty wyłącznie na pamięci
- Plik: `src/middlewares/rate-limit.middleware.js`
- Stan resetuje się przy każdym restarcie procesu. Nie działa w środowisku wieloinstancyjnym.
- **Fix:** Docelowo zastąpić `express-rate-limit` z adapterem Redis. Na teraz zostawić in-memory, ale przynajmniej podłączyć do endpointów.

---

## Niskie / do rozważenia

- `yup` jest w `package.json` ale nigdzie nieużywany — albo wdrożyć do walidacji requestów w kontrolerach, albo usunąć z zależności.
- Brak walidacji typów dla pól numerycznych w PATCH/POST (np. `area`, `vatRate`) — można wysłać string i zostanie zapisany.
- Brak logowania błędów do zewnętrznego serwisu (np. Sentry) — trudno diagnozować błędy produkcyjne.
