# REST API with Hono (LostSaga Example)

This project is a REST API backend built with [Hono](https://hono.dev/) (a fast, lightweight web framework for JavaScript/TypeScript), demonstrating core features such as authentication, billing, encryption, and game launcher logic. The project uses modular routing, strong validation, and a custom encryption algorithm (SEED in CFB mode) for enhanced security.

---

## Table of Contents

- [REST API with Hono (LostSaga Example)](#rest-api-with-hono-lostsaga-example)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [API Endpoints](#api-endpoints)
    - [Billing Routes](#billing-routes)
      - [1. `POST /billing/getcash`](#1-post-billinggetcash)
      - [2. `POST /billing/payment`](#2-post-billingpayment)
      - [3. `POST /billing/gift`](#3-post-billinggift)
    - [Launcher Route](#launcher-route)
      - [4. `POST /launcher/`](#4-post-launcher)
  - [Encryption (SEED CFB)](#encryption-seed-cfb)
  - [Validation](#validation)
  - [Error Handling](#error-handling)
  - [Project Structure](#project-structure)
  - [Setup \& Development](#setup--development)
  - [Contributing](#contributing)
  - [License](#license)

---

## Features

- Modular & scalable REST API using Hono
- Authentication and launcher endpoint for game clients
- User cash management (purchase, gifting)
- Secure, custom encryption (SEED Cipher, CFB mode)
- Strong payload validation using [Zod](https://zod.dev/)
- Middleware for logging, security headers, and JSON formatting

---

## Architecture

- **Framework:** Hono (TypeScript)
- **Modular Routing:** Separate files for billing and launcher routes
- **Validation:** Zod schemas via `@hono/zod-validator`
- **Encryption:** SEED Block Cipher (CFB mode, custom IV per region)
- **Database Layer:** Example calls to a (mocked) `LosaGameDB` (for user/server data)

---

## API Endpoints

### Billing Routes

**Prefix:** `/billing`

#### 1. `POST /billing/getcash`

Get user cash information.

- **Request (form data):**

  - `makeCodeNo` (string/number): Validation code
  - `userId` (string): User ID
  - `userNo` (string/number): User number

- **Response:**
  - `result`: "success"
  - `userNo`: User account number
  - `realCash`: Current cash
  - `bonusCash`: Currently always 0

---

#### 2. `POST /billing/payment`

Purchase item(s) using user cash.

- **Request (form data):**

  - `makeCodeNo` (string/number)
  - `userId` (string)
  - `userNo` (string/number)
  - `charId` (string, optional)
  - `itemId` (string/number)
  - `itemCnt` (number)
  - `itemUnitPrice` (number)

- **Response:**
  - `result`: "success"
  - `userNo`, `realCash`, `bonusCash`, `chargedCashAmt`
  - `itemInfos`: Array of item info (id, count, price, chargeNo)

---

#### 3. `POST /billing/gift`

Gift item(s) from one user to another (deducts sender's cash).

- **Request (form data):**

  - All fields from `/payment`
  - `receiveUserId` (string): Recipient ID
  - `receiveUserNo` (string/number): Recipient number
  - `receiveCharId` (string, optional)

- **Response:**
  - Same as `/payment`

---

### Launcher Route

**Prefix:** `/launcher`

#### 4. `POST /launcher/`

Authenticate user and initialize the game launcher.

- **Request (JSON):**

  - `username` (string)
  - `password` (string, hashed with bcrypt)
  - `publicIP` (string)

- **Response:**
  - `message`: "success"
  - `AppName`: e.g., `lostsaga.exe`
  - `result`: Encrypted string (using SEED, for launcher client)

---

## Encryption (SEED CFB)

This project uses the SEED block cipher (128-bit, CFB mode) for encrypting sensitive data sent to the launcher client.

- **Algorithm:** SEED (Korean standard)
- **Mode:** Cipher Feedback (CFB)
- **Key:** Max 16 bytes (combination of user/server keys)
- **Initialization Vector (IV):** Custom per region (default: Korea)
- **Output:** Hex string

**Example:**

```ts
const encrypted = Encode15("username", "userKey123", NationType.NT_KOREA);
```

See `/lib/ioencrypt/ioEcnrypt.ts` for implementation details.

---

## Validation

Each endpoint validates its payload using [Zod](https://zod.dev/). Invalid requests return HTTP 400 with error details.

- Billing endpoints use form data validation.
- Launcher endpoint uses JSON schema validation.

---

## Error Handling

- **Not found:** Returns `{ error: "Not Found" }` with HTTP 404
- **Validation error:** HTTP 400 with error message
- **Other errors:** HTTP 500 with `{ error: "Internal Server Error" }`
- Uses structured exception handling with `HTTPException` from Hono.

---

## Project Structure

```
with-hono/
├── src/
│   ├── core/
│   │   └── hono.ts               # Main Hono app & route mounting
│   ├── routes/
│   │   ├── billing.route.ts      # Billing endpoints
│   │   └── launcher.route.ts     # Launcher endpoint
│   ├── lib/
│   │   └── ioencrypt/            # SEED cipher implementation
│   └── schemas/                  # Zod schemas for validation
└── README.md
```

---

## Setup & Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/novals-oss/rest-api.git
   cd rest-api/with-hono
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   - Adjust database/config in `/src/db/` if needed

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Or build and start:
   ```bash
   npm run build
   npm start
   ```

---

## Contributing

Contributions, bug reports, and feature requests are welcome. Please open an issue or submit a pull request.

---

## License

This project is licensed under the [MIT License](./LICENSE).

---
