# CampusGo – User Guide

This guide explains how to use CampusGo, the campus delivery app of Université Antonine, from your first login to rating your delivered order.

---

## Contents

1. [Opening the app](#1-opening-the-app)
2. [Creating an account / logging in](#2-creating-an-account--logging-in)
3. [Browsing the campus stores](#3-browsing-the-campus-stores)
4. [Ordering a product](#4-ordering-a-product)
5. [Printing a document](#5-printing-a-document)
6. [Your cart](#6-your-cart)
7. [Checkout: where, when and how to pay](#7-checkout-where-when-and-how-to-pay)
8. [Tracking your order](#8-tracking-your-order)
9. [Your orders and reordering](#9-your-orders-and-reordering)
10. [Profile and saved locations](#10-profile-and-saved-locations)
11. [Campus Wallet](#11-campus-wallet)
12. [FAQ / Troubleshooting](#12-faq--troubleshooting)

---

## 1. Opening the app

1. Install **Expo Go** from the Play Store / App Store.
2. On the computer, run `npx expo start` in the project folder.
3. Scan the QR code (Expo Go on Android, Camera app on iOS).

The **Welcome** screen shows the CampusGo logo, a short introduction and two buttons: **Log in** and **Create an account**.

---

## 2. Creating an account / logging in

### Sign up
Tap **Create an account** and fill in:

| Field | Rule | Example |
|-------|------|---------|
| Full name | first and last name | Rita Khoury |
| University email | must end with `@ua.edu.lb` | rita.khoury@ua.edu.lb |
| Student / Staff ID | students: 9 digits · staff: `ST` + 5 digits | 202312345 / ST10234 |
| Faculty | tap one of the chips | Engineering |
| Phone number | 8 digits | 71123456 |
| Password | 8+ characters with letters and numbers | campus123 |
| Confirm password | same as password | |

Tap **Create account**. Any problem is shown **in red under the field**; it updates as you correct it. After a successful sign-up you are logged in automatically and receive **$20** in your Campus Wallet.

### Log in
Tap **Log in**, enter your university email and password. Use the 👁 icon to show/hide the password.

**Demo account:** `demo@ua.edu.lb` / `campus123`

You stay logged in even if you close the app.

---

## 3. Browsing the campus stores

The **Stores** tab is the home screen:

- **Blue banner** – the **next delivery slot** still available today and your **wallet balance** (tap it to open the wallet).
- **Search bar** – search a store *or a product* (e.g. typing "latte" shows the Coffee Corner).
- **Category chips** – All, Food, Drinks, Stationery, Printing.
- **Store cards** – logo, description, category, average preparation time and a badge:
  - 🟢 **Open · closes 16:00**
  - 🔴 **Closed · opens 07:30** / **Closed today**

Badges update automatically every 30 seconds. Closed stores are shown faded at the bottom; you can look at their menu but **cannot order**.

---

## 4. Ordering a product

1. Tap a store to open its **menu**. Products are grouped by category (e.g. Sandwiches, Hot Drinks). Use the chips at the top to show one category.
2. Products marked **Out of stock** are visible but cannot be ordered.
3. Tap a product to open its **details**:
   - choose a **size** (if any) – extra cost is shown, e.g. "Large (+$1.00)"
   - choose **extras** (optional, several allowed)
   - choose the **quantity** with − / +
4. Tap **Add to cart · $X.XX**. The price includes size, extras and quantity.

The 🛒 icon at the top-right and the **Cart** tab show how many items you have. A **View cart** bar also appears at the bottom of the menu.

### One store per order
Your cart can only contain products from **one store**. If you add a product from another store, the app asks:

> *Start a new cart? Your cart has items from Coffee Corner…*

Choose **Empty cart & add** to start a new cart, or **Cancel** to keep your current one.

---

## 5. Printing a document

Open the **Print** tab (or the Printing Office → *Print a document*).

1. Tap **Choose a document** and pick a file (simulated upload). The number of pages is filled in automatically – you can change it.
2. Set the **number of copies**.
3. Choose **Black & White** ($0.05/page) or **Color** ($0.25/page).
4. Choose **Single-sided** or **Double-sided** (−10%).
5. Choose the **binding**: None, Staple (+$0.25) or Spiral (+$1.50) – per copy.

The **Price** card updates immediately each time you change an option.

**Example:** 86 pages, color, double-sided, spiral, 2 copies → (86 × $0.225 + $1.50) × 2 = **$41.70**

Rules: pages between 1 and **200**, copies between 1 and 50. Tap **Add to cart** – the job is added to the Printing Office cart.

---

## 6. Your cart

Open the **Cart** tab:

- change quantities with − / + (for print jobs this is the number of copies)
- 🗑 removes an item; **Clear** (top-right) empties the whole cart
- **Subtotal**, **Delivery fee** and **Total** are shown at the bottom

| Rule | |
|------|---|
| Delivery fee | **FREE** from $10 – otherwise $0.50 (the app tells you how much more to add for free delivery) |
| Minimum order | **$2.00** – the Checkout button is disabled below this |
| Store closed | the Checkout button is disabled |

Tap **Checkout**.

---

## 7. Checkout: where, when and how to pay

### Delivery location
- Tap one of your **saved locations** (★), **or**
- choose a **building** (A – F) and type the **room number** (required, e.g. `204`).
- Optionally switch on **Save this location to my profile** and give it a name.

### Delivery time
Choose a **class break**. A slot is greyed out when:

| Message | Meaning |
|---------|---------|
| *Already passed* | the break has already started |
| *Too soon to prepare* | the store cannot prepare and deliver your order in time |
| *Store closed by then* | the store closes before this break |

The first possible slot is selected automatically.

### Payment
- **Campus Wallet** – the balance is shown. If it is not enough, the order is **refused**; tap **Top up** or choose cash.
- **Cash** on delivery.

### Confirm
Check the **order summary**, tap **Place order**, and confirm in the pop-up. You are taken to the tracking screen.

---

## 8. Tracking your order

The tracking screen shows:

- the **status**, the **delivery location**, the **estimated delivery** (your slot), the **courier** and the payment method
- a **timeline**: Received → Preparing → On the way → **Delivered to Building X, Room Y**, with the time of each step

The status moves forward automatically every few seconds (simulation) while this screen is open.

- **Cancel order** – only available while the order is still **Received**. If you paid with the wallet, the money is refunded.
- **Rate your order** – after delivery, choose 1 to 5 ★, add an optional comment and tap **Submit rating**.

---

## 9. Your orders and reordering

The **Orders** tab lists all your orders (newest first) with date, store, items, total and status.

- Filter by **store** and/or **status** (In progress, Delivered, Cancelled).
- Tap an order to see its details / tracking.
- **Reorder** (on delivered or cancelled orders) copies the order into your cart. Out-of-stock products are skipped, and if your cart is not empty the app asks before replacing it.

---

## 10. Profile and saved locations

The **Profile** tab shows your name, Student/Staff ID, email, phone and faculty, plus some statistics.

**Saved delivery locations** (e.g. "My Lab – Building B, Room 204"):
- **+ Add** – enter a name, choose the building and type the room, then **Save**
- 🗑 – remove a location

Saved locations appear at checkout for one-tap selection.

**Log out** is at the bottom. Your cart, orders and wallet stay saved on the phone for next time.

---

## 11. Campus Wallet

Open it from Profile → **Campus Wallet**, or from the Home banner.

- **Current balance**
- **Top up** – tap $5 / $10 / $20 / $50 or type an amount (max $500), tap **Top up**, then confirm the *simulated* card payment
- **Transactions** – every top-up (+, green), payment (−, red) and refund (+, green) with its date

---

## 12. FAQ / Troubleshooting

**All stores show "Closed".**
Opening hours use your phone's time. Stores are closed on Sundays and in the evening (most close between 15:00 and 18:00).

**"No delivery slots left today".**
All class breaks have passed or are too close for the store's preparation time. Try again during the day.

**I can't log in with my email.**
Only university emails ending with `@ua.edu.lb` are accepted. Check the password (8+ characters).

**My order status stopped moving.**
The simulation only runs while the tracking screen is open. Open the order again from the **Orders** tab.

**The QR code doesn't connect.**
Make sure the phone and computer are on the same Wi-Fi, or run `npx expo start --tunnel`.
