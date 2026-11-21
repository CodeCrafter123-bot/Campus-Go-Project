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
| Storage | **AsyncStorage** – users, session, cart, wallet and orders are saved on the phone |
| Data | Local mock JSON file: `src/data/campus.json` |
| Lists | All lists use **FlatList** |
| Icons | `@expo/vector-icons` (Ionicons) |

No real backend, payment or GPS: login, payments, top-ups and order tracking are **simulated**.

---

## Getting started

### Requirements
- [Node.js](https://nodejs.org/) (LTS)
- The **Expo Go** app on your phone (Android / iOS), **or** an Android emulator / iOS simulator

> The project uses **Expo SDK 58**. Your Expo Go app must support SDK 58 (Expo Go on the Apple App Store only goes up to SDK 54 – see [Expo Go version mismatch](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)).

### Install and run

```bash
git clone https://github.com/CodeCrafter123-bot/Campus-Go-Project.git
cd Campus-Go-Project
npm install
npx expo start
```

Then scan the QR code with **Expo Go** (Android) or the **Camera** app (iOS).
Your phone and computer must be on the same Wi-Fi. If they are not, use:

```bash
npx expo start --tunnel
```

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `demo@ua.edu.lb` | `campus123` |
| Admin | `admin@ua.edu.lb` | `admin123` |

Both accounts are created automatically on first launch. The student account starts with a **$20** wallet balance and a saved location ("My Lab – Building B, Room 204"); every new account also starts with $20. The admin account opens the **Admin panel** instead of the store app.

---

## Business rules

| Rule | Value | Where in the code |
|------|-------|-------------------|
| Email domain | must end with `@ua.edu.lb` | `utils/validation.js` |
| Student / Staff ID | 9 digits (`202312345`) or `ST` + 5 digits (`ST10234`) | `utils/validation.js` |
| Password | at least 8 characters, letters and numbers | `utils/validation.js` |
| Phone | 8-digit Lebanese number | `utils/validation.js` |
| Opening hours | per store and per day of the week; closed stores cannot receive orders | `data/campus.json`, `utils/time.js` |
| Cart | products from **one store only** – adding from another store asks to empty the cart | `context/CartContext.js`, `utils/useAddToCart.js` |
| Minimum order | **$2.00** | `data/campus.json → settings` |
| Delivery fee | **free from $10**, otherwise **$0.50** | `utils/pricing.js` |
| Delivery slot | disabled if already started, if `now + prep time + 5 min` is after its start, or if the store closes before it | `utils/time.js → checkSlot` |
| Wallet payment | refused if the balance is lower than the total | `context/WalletContext.js` |
| Wallet top-up | between $0.01 and $500 | `context/WalletContext.js` |
| Printing price | B&W **$0.05**/page, color **$0.25**/page, double-sided −10%, staple +$0.25, spiral +$1.50 (per copy) | `data/campus.json → printPricing` |
| Printing limits | pages 1–200, copies 1–50 | `utils/pricing.js` |
| Cancel | only while the order is "Received"; wallet payments are refunded | `context/OrdersContext.js` |
| Reorder | copies a previous order into the cart, skipping out-of-stock products | `screens/orders/OrdersHistoryScreen.js` |
| Roles | sign-up always creates a normal user; only an admin can create another admin | `context/AuthContext.js` |
| Frozen accounts | cannot log in (and an open session is closed) until an admin unfreezes them | `context/AuthContext.js` |
| Admin protection | the main admin (`admin@ua.edu.lb`) and your own account cannot be frozen or deleted | `context/AuthContext.js → checkTarget` |
| Delete user | also deletes that user's wallet, cart and orders | `context/AuthContext.js → deleteUser` |

---

## Mock data

`src/data/campus.json` contains:

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
├── docs/USER_GUIDE.md          # User guide
└── src/
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
    ├── context/                # Auth, Wallet, Cart, Orders contexts (+ AppProvider)
    ├── data/                   # campus.json (mock data) + index.js (data access)
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

Each context uses the custom hook `usePersistedUserState`, which works like `useState` but saves the value in AsyncStorage under a **per-user key** (`campusgo:user:<id>:cart`, `…:wallet`, `…:orders`). Several accounts can use the same phone without mixing their data.

---

## Notes and limitations

- Passwords are stored in plain text in AsyncStorage because this is a mock app with no backend. A real app would use a server with hashed passwords.
- Order tracking is simulated: the status advances every few seconds **while the tracking screen is open** (timer in `useEffect`, cleared on unmount).
- Opening hours and delivery slots use the **phone's current time**. Outside opening hours (e.g. Sundays or evenings) all stores show as closed and ordering is disabled.

---

## Useful commands

```bash
npx expo start          # start the dev server
npx expo start --tunnel # if the phone is on a different network
npx expo-doctor         # check the project configuration
```
