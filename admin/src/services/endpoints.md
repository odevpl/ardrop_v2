# ArDrop Backend API

## Basic information

- API prefix: `/api`
- Data format: `application/json` (except PDF)
- Authorization: `Authorization: Bearer <authToken>` for protected endpoints
- Note: JWT middleware is mounted globally after auth routes in `app.js`, so all endpoints in the "Protected" section require a valid token.

## Public endpoints (without `authenticateToken` middleware)

### POST `/api/login`

User login.

Example body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

200 response:

```json
{
  "refreshToken": "...",
  "authToken": "..."
}
```

### GET `/api/auth/me`

Returns user data based on `authToken` sent in the header.

Header:

```http
Authorization: Bearer <authToken>
```

200 response:

```json
{
  "email": "user@example.com",
  "userId": 1,
  "role": 1
}
```

### POST `/api/auth/refresh`

Refreshes access token using `refreshToken`.

Example body:

```json
{
  "refreshToken": "..."
}
```

200 response:

```json
{
  "authToken": "..."
}
```

### POST `/api/send-reset-password-mail`

Sends password reset email (always returns success, regardless of whether the account exists).

Example body:

```json
{
  "email": "user@example.com"
}
```

### POST `/api/reset-password`

Resets password using reset token.

Example body:

```json
{
  "token": "token-from-email",
  "newPassword": "newpassword123"
}
```

### POST `/api/register-user`

Registers a user and creates client + delivery address data.

Example body:

```json
{
  "nip": "1234567890",
  "email": "user@example.com",
  "password": "password12345",
  "clientName": "Company Ltd.",
  "street": "Example Street 1",
  "city": "Warsaw",
  "postcode": "00-001",
  "deliveryName": "Warehouse",
  "deliveryStreet": "Warehouse Street 2",
  "deliveryCity": "Warsaw",
  "deliveryPostcode": "00-002"
}
```

### POST `/api/activate-user`

Activates account using registration token from email.

Example body:

```json
{
  "token": "activation-token"
}
```

## Protected endpoints (require `Authorization: Bearer <authToken>`)

### GET `/api/configs`

Returns application configuration.

### GET `/api/products`

Returns product list with pagination and search.

Query params:

- `limit` (default `20`)
- `page` (default `1`)
- `search` (default empty)

Example:
`/api/products?limit=20&page=1&search=paprika`

### GET `/api/products/:id`

Returns product details by ID.

### POST `/api/products`

Creates a new product.

Body: product object (forwarded directly to `Products.create` service).

### PUT `/api/products/:id`

Updates product by ID.

Body: object with fields to update.

### GET `/api/carts`

Returns cart for the authenticated user.

### POST `/api/carts`

Saves user cart.

Example body:

```json
{
  "cartProducts": []
}
```

### GET `/api/clients`

Returns client data for the authenticated user.

### POST `/api/clients`

Creates/updates client data.

Body: client data object.

### POST `/api/clients/delivery-address`

Creates/updates delivery address.

Body: delivery address object.

### GET `/api/orders`

Returns order list for the authenticated user (internally fixed to limit 50, page 1).

### POST `/api/orders`

Creates an order for the authenticated user.

Body: order data.

### GET `/api/invoices`

Returns invoice list for the authenticated user (internally fixed to limit 50, page 1).

### GET `/api/invoices/:id`

Returns invoice PDF file (`Content-Type: application/pdf`) if the user has access to it.

## Backend routes outside `/api`

### GET `/app/*`

Serves SPA from `app/dist`.

### GET `/(?!api|app)*`

Serves landing page (`landing/dist` or fallback `landing/`).

## Endpoint mapping sources

Endpoints were collected from:

- `app.js`
- `controllers/auth.js`
- `controllers/appConfigs.js`
- `controllers/products.js`
- `controllers/carts.js`
- `controllers/clients.js`
- `controllers/orders.js`
- `controllers/invoices.js`
- `middlewares/authMiddleware.js`
