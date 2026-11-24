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

## Folder structure

```
backend/
├── app/
│   ├── api/            # API routes (one folder per URL, each with route.js)
│   └── page.js         # small info page
├── data/
│   └── campus.json     # seed data (copied into the database on first run)
└── lib/
    ├── db.js           # database connection, tables and seed
    └── password.js     # password hashing (scrypt)
```
