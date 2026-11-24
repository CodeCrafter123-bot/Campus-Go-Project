import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import seed from "@/data/campus.json";
import { hashPassword } from "@/lib/password";

/*
 * SQLite database (Node's built-in `node:sqlite`, no extra install needed).
 * The whole database is one file: backend/data/campusgo.db
 * On first use the tables are created and filled with the campus data
 * (stores, products, buildings, slots) and the two demo accounts.
 */

const DB_FILE = process.env.DB_PATH || path.join(process.cwd(), "data", "campusgo.db");

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL              -- JSON
  );

  CREATE TABLE IF NOT EXISTS stores (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    category         TEXT NOT NULL,
    icon             TEXT,
    color            TEXT,
    description      TEXT,
    avg_prep_minutes INTEGER NOT NULL,
    opening_hours    TEXT NOT NULL,  -- JSON: { mon: { open, close }, sun: null, ... }
    sort_order       INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    store_id    TEXT NOT NULL REFERENCES stores(id),
    category    TEXT NOT NULL,
    name        TEXT NOT NULL,
    image       TEXT,
    price       REAL NOT NULL,
    in_stock    INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    options     TEXT,                -- JSON: { sizes: [...], extras: [...] }
    sort_order  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS buildings (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS delivery_slots (
    id         TEXT PRIMARY KEY,
    start_time TEXT NOT NULL,        -- "08:15"
    end_time   TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id             TEXT PRIMARY KEY,
    full_name      TEXT NOT NULL,
    email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash  TEXT NOT NULL,
    university_id  TEXT,
    faculty        TEXT,
    phone          TEXT,
    role           TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    frozen         INTEGER NOT NULL DEFAULT 0,
    wallet_balance REAL NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saved_locations (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    building_id TEXT NOT NULL REFERENCES buildings(id),
    room        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('topup', 'payment', 'refund')),
    amount      REAL NOT NULL,       -- positive = money in, negative = money out
    description TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id       TEXT NOT NULL REFERENCES stores(id),
    items          TEXT NOT NULL,    -- JSON array of order lines
    subtotal       REAL NOT NULL,
    delivery_fee   REAL NOT NULL,
    total          REAL NOT NULL,
    building_id    TEXT NOT NULL REFERENCES buildings(id),
    room           TEXT NOT NULL,
    slot_id        TEXT NOT NULL REFERENCES delivery_slots(id),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('wallet', 'cash')),
    courier        TEXT,
    status         TEXT NOT NULL,
    status_times   TEXT NOT NULL,    -- JSON: { received: "<date>", preparing: ... }
    rating_stars   INTEGER,
    rating_comment TEXT,
    created_at     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_tx_user ON wallet_transactions(user_id);
`;

// Runs `work` inside a transaction: either everything is saved or nothing is.
export function transaction(db, work) {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function seedCatalog(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM stores").get().n;
  if (count > 0) return;

  const setSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  setSetting.run("settings", JSON.stringify(seed.settings));
  setSetting.run("printPricing", JSON.stringify(seed.printPricing));
  setSetting.run("couriers", JSON.stringify(seed.couriers));

  const addStore = db.prepare(
    `INSERT INTO stores (id, name, category, icon, color, description, avg_prep_minutes, opening_hours, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  seed.stores.forEach((s, i) =>
    addStore.run(s.id, s.name, s.category, s.icon, s.color, s.description, s.avgPrepMinutes, JSON.stringify(s.openingHours), i)
  );

  const addProduct = db.prepare(
    `INSERT INTO products (id, store_id, category, name, image, price, in_stock, description, options, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  seed.products.forEach((p, i) =>
    addProduct.run(
      p.id, p.storeId, p.category, p.name, p.image, p.price, p.inStock ? 1 : 0,
      p.description || null, p.options ? JSON.stringify(p.options) : null, i
    )
  );

  const addBuilding = db.prepare("INSERT INTO buildings (id, name, sort_order) VALUES (?, ?, ?)");
  seed.buildings.forEach((b, i) => addBuilding.run(b.id, b.name, i));

  const addSlot = db.prepare("INSERT INTO delivery_slots (id, start_time, end_time, sort_order) VALUES (?, ?, ?, ?)");
  seed.deliverySlots.forEach((s, i) => addSlot.run(s.id, s.start, s.end, i));
}

function seedUsers(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) return;

  const now = new Date().toISOString();
  const welcome = seed.settings.initialWalletBalance;
  const addUser = db.prepare(
    `INSERT INTO users (id, full_name, email, password_hash, university_id, faculty, phone, role, wallet_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Demo student (same login as the offline version of the app).
  addUser.run("demo", "Demo Student", "demo@ua.edu.lb", hashPassword("campus123"), "202312345", "Engineering", "71123456", "user", welcome, now);
  db.prepare("INSERT INTO wallet_transactions (id, user_id, type, amount, description, created_at) VALUES (?, ?, 'topup', ?, 'Welcome credit', ?)")
    .run(randomUUID(), "demo", welcome, now);
  db.prepare("INSERT INTO saved_locations (id, user_id, label, building_id, room) VALUES (?, ?, ?, ?, ?)")
    .run(randomUUID(), "demo", "My Lab", "B", "204");

  // Main administrator: can never be frozen or deleted.
  addUser.run("admin", "System Administrator", "admin@ua.edu.lb", hashPassword("admin123"), "ADMIN", "Administration", "", "admin", 0, now);
}

function openDatabase() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA foreign_keys = ON;"); // needed for ON DELETE CASCADE
  db.exec("PRAGMA journal_mode = WAL;"); // better for many small writes
  db.exec(SCHEMA);
  transaction(db, () => {
    seedCatalog(db);
    seedUsers(db);
  });
  return db;
}

// Reads one JSON value from the settings table ("settings", "printPricing", "couriers").
export function getSetting(key) {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : null;
}

// One shared connection. Kept on globalThis so hot reload in `next dev`
// does not open a new connection every time a file changes.
export function getDb() {
  if (!globalThis.__campusgoDb) globalThis.__campusgoDb = openDatabase();
  return globalThis.__campusgoDb;
}
