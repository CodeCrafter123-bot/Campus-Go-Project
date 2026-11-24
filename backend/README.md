# CampusGo API (backend)

Next.js backend for the CampusGo mobile app. It exposes a JSON API under `/api`
and stores everything in a SQLite database file (`data/campusgo.db`).

## Requirements

- Node.js **22.13 or newer** (uses the built-in `node:sqlite` module)

## Run

```bash
cd backend
npm install
npm run dev
```

Then open http://localhost:3000/api/health. The database file is created and
filled automatically the first time (stores, products, buildings, delivery
slots, the demo student and the admin account).

To start again with a fresh database, stop the server and delete
`data/campusgo.db`.

## API

All requests and responses use JSON. Errors always look like
`{ "error": "message" }` (form errors also include `"fields": { "email": "message" }`).

Routes marked 🔒 need the login token in a header:
`Authorization: Bearer <token>` (you get the token from login or sign-up; it is valid for 7 days).

| Method | URL | What it does |
|---|---|---|
| GET | `/api/health` | Server and database check |
| POST | `/api/auth/signup` | Create an account → `{ token, user }` |
| POST | `/api/auth/login` | Log in → `{ token, user }` |
| GET 🔒 | `/api/auth/me` | The logged-in user |
| PATCH 🔒 | `/api/auth/me` | Edit your name, phone or faculty |
| GET | `/api/catalog` | Everything the app loads at start-up: settings, print prices, stores, products, buildings, delivery slots |
| GET | `/api/stores` | Stores with their live open/closed status |
| GET | `/api/stores/:storeId` | One store, its status and its products |
| GET | `/api/products/:productId` | One product with its sizes and extras |
| GET 🔒 | `/api/wallet` | Balance and transactions (newest first) |
| POST 🔒 | `/api/wallet/topup` | Simulated card top-up `{ amount }` (more than $0, at most $500) |
| GET 🔒 | `/api/locations` | Your saved delivery locations |
| POST 🔒 | `/api/locations` | Save a location `{ label, buildingId, room }` |
| DELETE 🔒 | `/api/locations/:locationId` | Remove one of your saved locations |
| GET 🔒 | `/api/orders` | Your orders, newest first, with up-to-date status |
| POST 🔒 | `/api/orders` | Place an order `{ items, buildingId, room, slotId, paymentMethod, expectedTotal? }` |
| GET 🔒 | `/api/orders/:orderId` | One of your orders (used by the tracking screen) |
| POST 🔒 | `/api/orders/:orderId/cancel` | Cancel while "Received"; wallet payments are refunded |
| POST 🔒 | `/api/orders/:orderId/rate` | Rate a delivered order once `{ stars, comment? }` |

### How an order is checked

The app only sends **what** the user wants (product ids, size and extra names,
quantities, print options). The server then, in this order:

1. checks the cart is not empty and comes from **one store**
2. checks the store is **open now**
3. looks up every product, size and extra in the database and **recalculates the price**
   (any price sent by the app is ignored), refusing out-of-stock products and bad quantities
4. checks the **minimum order** ($2), the **building**, the **room** and the **delivery slot**
   (not passed, enough time to prepare + 5 min, store still open)
5. if the app sent `expectedTotal` and the real total is different, refuses the order
   so the user is never charged an amount they did not see
6. saves the order and takes the wallet payment **in one transaction**: if the
   payment fails, the order is not saved either

Order status moves forward **by itself with time** (Received 10 s → Preparing 8 s →
On the way 8 s → Delivered), even while the app is closed.

Logging out only needs the app to forget its token.

## Security

- Passwords are hashed with **scrypt** and a random salt (`lib/password.js`).
- Login tokens are **JWTs signed with HMAC-SHA256** (`lib/token.js`). The secret is
  read from `JWT_SECRET`, or generated once and kept in the database.
- Every input is validated again on the server (`lib/validation.js`).
- SQL queries use **parameters** (`?`), never string concatenation, so SQL injection is not possible.
- Frozen accounts are refused on every request, not only at login.
- A user can only see and change **their own** wallet, locations and orders
  (every query filters by the user id taken from the token, never from the request).
- A wallet payment checks and changes the balance in **one SQL statement**, so two
  payments at the same moment can never make the balance negative.

## Folder structure

```
backend/
├── app/
│   ├── api/            # API routes (one folder per URL, each with route.js)
│   │   ├── health/
│   │   ├── auth/       # signup, login, me
│   │   ├── catalog/    # whole catalog in one request
│   │   ├── stores/     # stores and one store's menu
│   │   ├── products/   # one product
│   │   ├── wallet/     # balance, transactions, top-up
│   │   ├── locations/  # saved delivery locations
│   │   └── orders/     # place, list, track, cancel, rate
│   └── page.js         # small info page
├── data/
│   └── campus.json     # seed data (copied into the database on first run)
└── lib/
    ├── db.js           # database connection, tables and seed
    ├── auth.js         # requireUser / requireAdmin (protects routes)
    ├── catalog.js      # reads stores, products, buildings, slots
    ├── http.js         # error responses and JSON helpers
    ├── orders.js       # placing, tracking, cancelling and rating orders
    ├── pricing.js      # delivery fee and printing price (server-side)
    ├── password.js     # password hashing (scrypt)
    ├── time.js         # opening hours and delivery-slot rules (same as the app)
    ├── token.js        # login tokens (JWT)
    ├── validation.js   # input rules (same as the app)
    └── wallet.js       # balance changes and transactions
proxy.js                # CORS, so the web version of the app can call the API
```
