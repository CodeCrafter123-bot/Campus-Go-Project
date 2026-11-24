# CampusGo – Antonine Campus Delivery App

**Mobile Development – PROG421-EC10 · Université Antonine**

CampusGo is a React Native (Expo) mobile app that lets students and staff of Université Antonine order from the on-campus services – **Cafeteria, Coffee Corner, Bookstore & Stationery and Printing Office** – and receive their order **in a specific building and room, within a chosen class break**.

> 📖 For a step-by-step walkthrough of the app, see the **[User Guide](docs/USER_GUIDE.md)**.

---

## Features

| # | Screen | Main features |
|---|--------|---------------|
| 1 | **Welcome / Login / Sign-up** | University email (`@ua.edu.lb`) login, sign-up (name, ID, faculty, phone, password), validation with clear error messages |
| 2 | **Home – Campus Stores** | Store list with logo, category, prep time, live **Open/Closed** badge, search (stores + products), category filter, banner with next delivery slot and wallet balance |
| 3 | **Store Menu & Product Details** | Products grouped by category, sizes / extras / quantity, out-of-stock products shown but not addable, cart badge, **one-store cart rule** |
| 4 | **Printing Service** | Simulated document upload, pages, copies, color/B&W, single/double-sided, binding, **live price**, validation (max 200 pages) |
| 5 | **Cart & Checkout** | Quantity +/−, remove, subtotal / delivery fee / total, minimum order, building + room, class-break slots (passed or too-close slots disabled), Wallet or cash, confirmation |
| 6 | **Order Tracking** | Timeline Received → Preparing → On the way → Delivered (timer in `useEffect` with cleanup), courier, ETA, cancel while "Received", 1–5 star rating + comment |
| 7 | **Orders, Profile & Wallet** | Order history with store/status filters and **Reorder**, profile with saved delivery locations, wallet balance, simulated top-up, transactions list |
| + | **Admin panel** (extra) | Dashboard (users, sales today/total, orders per day for the last 7 days, top products, most active stores), user list with search, user details (wallet, orders, cart, locations), **freeze / unfreeze**, **delete**, create new admins |

---

## Tech stack

| | |
|---|---|
| Framework | React Native 0.88 with **Expo SDK 58** (runs in Expo Go) |
| Navigation | **React Navigation 7** – bottom tabs + native stack navigators |
| State | React **Hooks** (`useState`, `useEffect`, `useMemo`, `useCallback`) + **Context API** |
| Backend | **Next.js 16** API in [`backend/`](backend/README.md) with a **SQLite** database |
| Storage on the phone | **AsyncStorage** – only the login token and the cart |
| Data | Catalog served by the backend (`GET /api/catalog`); `src/data/campus.json` is the offline copy |
| Lists | All lists use **FlatList** |
| Icons | `@expo/vector-icons` (Ionicons) |

Payments, top-ups and delivery are still **simulated** (no real card payment or GPS),
but accounts, wallets and orders are now stored and checked **on the server**.

### Architecture

```
 Phone (Expo app)                         Laptop (backend/)
┌───────────────────────┐   HTTP + JSON  ┌──────────────────────────────┐
│ Screens               │  ───────────▶  │ Next.js API routes (/api/…)  │
│ Contexts (Auth, Cart, │  Bearer token  │ business rules, validation,  │
│ Wallet, Orders,       │  ◀───────────  │ price calculation            │
│ Catalog)              │                │            │                 │
│ AsyncStorage: token,  │                │  SQLite database file        │
│ cart                  │                │  (users, orders, wallet …)   │
└───────────────────────┘                └──────────────────────────────┘
```

- The app finds the backend automatically: it uses the laptop address Expo Go was
  loaded from, port **3000** (see `src/api/config.js`). Set `EXPO_PUBLIC_API_URL`
  to use another address.
- The **cart** stays on the phone. Everything else (accounts, wallet, orders,
  ratings, saved locations) lives in the database.

---

## Getting started

### Requirements
- [Node.js](https://nodejs.org/) **22.13 or newer** (the backend uses the built-in `node:sqlite`)
- The **Expo Go** app on your phone (Android / iOS), **or** an Android emulator / iOS simulator

> The project uses **Expo SDK 58**. Your Expo Go app must support SDK 58 (Expo Go on the Apple App Store only goes up to SDK 54 – see [Expo Go version mismatch](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)).

### Install

```bash
git clone https://github.com/CodeCrafter123-bot/Campus-Go-Project.git
cd Campus-Go-Project
npm install
cd backend
npm install
```

### Run (two terminals)

**Terminal 1 – backend** (from the project folder):

```bash
cd backend
npm run dev
```

Check http://localhost:3000/api/health. The database is created automatically on the first run.

**Terminal 2 – app** (from the project folder):

```bash
npx expo start
```

Then scan the QR code with **Expo Go** (Android) or the **Camera** app (iOS).
The phone and the computer must be on the **same Wi-Fi**, and the Windows firewall
must allow ports **8081** (Expo) and **3000** (backend). The login screen shows the
backend address the app is using (`Server: http://…:3000`).

> If Expo picks the wrong network address (e.g. a VirtualBox adapter), set it
> yourself before starting: `$env:REACT_NATIVE_PACKAGER_HOSTNAME="<your Wi-Fi IP>"` (PowerShell).
> Tunnel mode (`--tunnel`) does not work for the backend, because port 3000 is not tunnelled.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `demo@ua.edu.lb` | `campus123` |
| Admin | `admin@ua.edu.lb` | `admin123` |

Both accounts are created automatically in the database the first time the backend runs. The student account starts with a **$20** wallet balance and a saved location ("My Lab – Building B, Room 204"); every new account also starts with $20. The admin account opens the **Admin panel** instead of the store app.

---

## Business rules

The app checks the rules first to show errors immediately; the **server checks them
again** (it never trusts the app). Paths: app = `src/…`, server = `backend/lib/…`.

| Rule | Value | App | Server |
|------|-------|-----|--------|
| Email domain | must end with `@ua.edu.lb` | `utils/validation.js` | `validation.js` |
| Student / Staff ID | 9 digits (`202312345`) or `ST` + 5 digits (`ST10234`) | `utils/validation.js` | `validation.js` |
| Password | at least 8 characters, letters and numbers; stored **hashed** (scrypt) | `utils/validation.js` | `validation.js`, `password.js` |
| Phone | 8-digit Lebanese number | `utils/validation.js` | `validation.js` |
| Opening hours | per store and per day of the week; closed stores cannot receive orders | `utils/time.js` | `time.js`, `orders.js` |
| Cart | products from **one store only** – adding from another store asks to empty the cart | `context/CartContext.js`, `utils/useAddToCart.js` | `orders.js` |
| Prices | the server **recalculates every price** from the database and ignores prices sent by the app | `utils/pricing.js` (display) | `orders.js`, `pricing.js` |
| Minimum order | **$2.00** | `utils/pricing.js` | `orders.js` |
| Delivery fee | **free from $10**, otherwise **$0.50** | `utils/pricing.js` | `pricing.js` |
| Delivery slot | refused if already started, if `now + prep time + 5 min` is after its start, or if the store closes before it | `utils/time.js → checkSlot` | `time.js → checkSlot` |
| Wallet payment | refused if the balance is lower than the total; order + payment saved together | `screens/cart/CheckoutScreen.js` | `wallet.js`, `orders.js` |
| Wallet top-up | between $0.01 and $500 | `screens/profile/WalletScreen.js` | `wallet.js` |
| Printing price | B&W **$0.05**/page, color **$0.25**/page, double-sided −10%, staple +$0.25, spiral +$1.50 (per copy) | `utils/pricing.js` | `pricing.js` |
| Printing limits | pages 1–200, copies 1–50 | `utils/pricing.js` | `pricing.js` |
| Cancel | only while the order is "Received"; wallet payments are refunded | `screens/orders/OrderTrackingScreen.js` | `orders.js → cancelOrder` |
| Rating | 1–5 stars, only once, only after delivery | `screens/orders/OrderTrackingScreen.js` | `orders.js → rateOrder` |
| Reorder | copies a previous order into the cart, skipping out-of-stock products | `screens/orders/OrdersHistoryScreen.js` | – |
| Roles | sign-up always creates a normal user; only an admin can create another admin | – | `app/api/auth/signup`, `admin.js` |
| Frozen accounts | cannot log in, and are logged out at their next request | `context/AuthContext.js` | `auth.js → requireUser` |
| Admin protection | the main admin (`admin@ua.edu.lb`) and your own account cannot be frozen or deleted | `screens/admin/` | `admin.js → checkTarget` |
| Delete user | also deletes that user's wallet history, saved locations and orders | – | database `ON DELETE CASCADE` |

---

## Campus data

The catalog is stored in the backend database. It is filled on the first run from
`backend/data/campus.json`; the app keeps the same file in `src/data/campus.json`
as an offline copy. It contains:

- **4 stores** with icon, category, average preparation time and weekly opening hours
- **29 products** with category, emoji image, price, stock status and options (sizes / extras)
- **6 buildings** (A – F)
- **6 delivery slots** (class breaks: 08:15, 09:45, 11:15, 12:45, 14:45, 16:15)
- The printing price table, courier names and app settings (minimum order, fees, initial wallet balance)

---

## Project structure

```
Campus-Go-Project/
├── App.js                      # Providers + NavigationContainer
├── app.json                    # Expo configuration
├── metro.config.js             # keeps the Expo bundler out of backend/
├── docs/USER_GUIDE.md          # User guide
├── backend/                    # Next.js API + SQLite database (see backend/README.md)
└── src/
    ├── api/                    # config.js (server address) + client.js (api() helper)
    ├── navigation/
    │   ├── RootNavigator.js    # Auth screens ⇄ user app ⇄ admin panel (switches on login/logout)
    │   ├── MainTabs.js         # Bottom tabs: Stores, Print, Cart, Orders, Profile
    │   ├── AdminTabs.js        # Admin bottom tabs: Dashboard, Users
    │   └── stacks.js           # One stack navigator per tab
    ├── screens/
    │   ├── auth/               # Welcome, Login, SignUp
    │   ├── home/               # Home, StoreMenu, ProductDetails
    │   ├── print/              # Printing
    │   ├── cart/               # Cart, Checkout
    │   ├── orders/             # OrdersHistory, OrderTracking
    │   ├── profile/            # Profile, Wallet
    │   └── admin/              # Dashboard, AdminScreen (users), UserDetailsScreen
    ├── components/             # Reusable UI (Button, TextField, Chip, StoreCard, StatusTimeline…)
    ├── context/                # Catalog, Auth, Wallet, Cart, Orders contexts (+ AppProvider)
    ├── data/                   # campus.json (offline copy) + index.js (data access)
    ├── utils/                  # Business rules, validation, storage, custom hooks
    └── theme/colors.js         # Colors and spacing
```

### Navigation map

```
Root stack
├── (logged out) Welcome → Login / SignUp
├── (user)       Bottom tabs
│   ├── Stores  : Home → StoreMenu → ProductDetails
│   ├── Print   : Printing
│   ├── Cart    : Cart → Checkout
│   ├── Orders  : OrdersHistory → OrderTracking
│   └── Profile : Profile → Wallet
└── (admin)      Admin tabs: Dashboard, Users → UserDetails
```

### How state is saved

| Data | Where | How the app gets it |
|------|-------|---------------------|
| Catalog | server database | `CatalogContext` → `GET /api/catalog` at start-up (bundled copy if offline) |
| Account, saved locations | server database | `AuthContext` → `/api/auth/…`, `/api/locations` |
| Login token | phone (AsyncStorage `campusgo:token`) | sent as `Authorization: Bearer <token>` |
| Wallet | server database | `WalletContext` → `/api/wallet` |
| Orders | server database | `OrdersContext` → `/api/orders` |
| Cart | phone (AsyncStorage, per user) | `CartContext` with the custom hook `usePersistedUserState` |

All requests go through one helper, `api()` in `src/api/client.js`, which always
returns `{ data }` or `{ error }` and logs the user out if the server says the
session is no longer valid (expired token, frozen or deleted account).

---

## Notes and limitations

- Payments and top-ups are simulated (no real card payment), and so is delivery.
- Order tracking: the status moves forward **on the server** with time (Received 10 s → Preparing 8 s → On the way 8 s → Delivered), even while the app is closed. The tracking screen asks for updates every 3 seconds (timer in `useEffect`, cleared on unmount).
- Opening hours and delivery slots use the **current time** (on the phone for display, on the server for the final check). Outside opening hours (e.g. Sundays or evenings) all stores show as closed and ordering is disabled.
- The backend runs on the laptop for the demo. For a real deployment it would run on a server with HTTPS.

---

## Useful commands

```bash
npx expo start          # start the app (Expo dev server)
npx expo-doctor         # check the app configuration
cd backend && npm run dev   # start the backend on port 3000
cd backend && npm run lint  # lint the backend
```

To reset the database (fresh demo accounts and no orders), stop the backend and
delete `backend/data/campusgo.db`.
