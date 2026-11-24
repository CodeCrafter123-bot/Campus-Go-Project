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

Logging out only needs the app to forget its token.

## Security

- Passwords are hashed with **scrypt** and a random salt (`lib/password.js`).
- Login tokens are **JWTs signed with HMAC-SHA256** (`lib/token.js`). The secret is
  read from `JWT_SECRET`, or generated once and kept in the database.
- Every input is validated again on the server (`lib/validation.js`).
- SQL queries use **parameters** (`?`), never string concatenation, so SQL injection is not possible.
- Frozen accounts are refused on every request, not only at login.

## Folder structure

```
backend/
├── app/
│   ├── api/            # API routes (one folder per URL, each with route.js)
│   │   ├── health/
│   │   ├── auth/       # signup, login, me
│   │   ├── catalog/    # whole catalog in one request
│   │   ├── stores/     # stores and one store's menu
│   │   └── products/   # one product
│   └── page.js         # small info page
├── data/
│   └── campus.json     # seed data (copied into the database on first run)
└── lib/
    ├── db.js           # database connection, tables and seed
    ├── auth.js         # requireUser / requireAdmin (protects routes)
    ├── catalog.js      # reads stores, products, buildings, slots
    ├── http.js         # error responses and JSON helpers
    ├── password.js     # password hashing (scrypt)
    ├── time.js         # opening hours and delivery-slot rules (same as the app)
    ├── token.js        # login tokens (JWT)
    └── validation.js   # input rules (same as the app)
proxy.js                # CORS, so the web version of the app can call the API
```
