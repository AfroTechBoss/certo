# Certo

**Genuine Apple products, sourced directly from the US — serial-verified, warranty intact, delivered to your door in Nigeria.**

---

## What is Certo?

Certo is an e-commerce platform built for Nigerians who want to buy authentic Apple products without the risk of counterfeit goods or grey-market devices. Every item sold on Certo is sourced directly from Apple US, verified against Apple's official serial number database, and shipped to customers in Nigeria with the original US warranty fully intact — plus an additional 12-month Certo coverage on top.

The name reflects the core promise: *certainty*. You know exactly what you're getting, where it came from, and that it's real.

---

## The Problem Certo Solves

Buying Apple products in Nigeria is risky. The market is flooded with:

- Counterfeit devices that look identical to genuine ones
- Grey-market units with tampered or blacklisted serials
- Expired or void warranties with no recourse
- Inflated prices with no transparency on the exchange rate applied

Certo eliminates all of these concerns by acting as a trusted sourcing and verification layer between Apple US and Nigerian buyers.

---

## How It Works

1. **Browse** — Shop iPhones, MacBooks, iPads, AirPods, Apple Watch, Apple TV, HomePods, and Accessories
2. **Verify** — Every serial number is checked on Apple.com before dispatch
3. **Choose your coverage** — Add AppleCare+ (monthly or annual) or AppleCare One (monthly) at checkout
4. **Pay** — Naira prices are calculated at the live USD/NGN exchange rate, shown transparently before you confirm
5. **Receive** — Device delivered to your door in Nigeria, boxed exactly as it left Apple US

---

## Key Features

### For Customers
- **Live exchange rate pricing** — Naira prices update in real time from live market data; the rate applied is always shown before payment
- **Serial verification** — Every product is verified on Apple's official website before it ships
- **AppleCare options** — Choose between AppleCare+ (monthly or annual billing) or AppleCare One (monthly), or skip coverage entirely
- **Shareable product URLs** — Every product page has a unique URL (`#/product/product-id`) so customers can save or share a specific listing
- **Order tracking** — Track your order status directly on the platform
- **Full product detail** — Specs, features, tech specs, delivery estimates, and condition notes on every listing

### For Admins
- **Product management** — Add, edit, and remove products with image gallery support
- **Forex dashboard** — Monitor the live USD/NGN rate with a timestamped feed
- **Revenue & customer analytics** — Built-in dashboard with revenue, customer, and refund tracking
- **Category management** — Products are organised by type (iPhone, MacBook, iPad, AirPods, Watch, Apple TV, HomePod, Accessories)

---

## Product Catalogue

| Category | Examples |
|---|---|
| iPhone | iPhone 15 Pro, iPhone 15, iPhone 14 Pro, and more |
| MacBook | MacBook Air M3, MacBook Pro M3, and more |
| iPad | iPad Pro M4, iPad Air M2, iPad mini, and more |
| AirPods | AirPods Pro 2, AirPods 4, AirPods Max |
| Watch | Apple Watch Ultra 2, Series 9, SE |
| Apple TV | Apple TV 4K |
| HomePod | HomePod 2nd gen, HomePod mini |
| Accessories | MagSafe chargers, cases, cables, and more |

---

## Tech Stack

Certo is a frontend-only web application — no build step required.

| Layer | Technology |
|---|---|
| UI framework | React 18 (CDN, no bundler) |
| JSX transpilation | Babel Standalone |
| Routing | Hash-based (`#/page/param`) |
| Styling | Inline JS style objects with CSS custom properties |
| Fonts | Inter (body), Syne (headings) via Google Fonts |
| Exchange rate | ExchangeRate-API (live USD/NGN, refreshed every 10 min) |
| State | React `useState` / `useEffect`, `localStorage` for rate caching |

The app runs entirely in the browser. Open `index.html` directly or serve it from any static host.

---

## Running Locally

No installation needed. Just open `index.html` in a browser:

```bash
# Option 1 — open directly
open index.html

# Option 2 — serve with any static server
npx serve .
# or
python -m http.server 8080
```

The admin dashboard is accessible at `admin.html`.

---

## Project Structure

```
certo/
├── index.html              # Customer-facing storefront
├── admin.html              # Admin dashboard entry point
└── src/
    ├── data.js             # Product catalogue, AppleCare options, pricing
    ├── App.jsx             # App shell — routing, global state, footer
    ├── tweaks-panel.jsx    # Dev utility panel
    ├── components/
    │   └── Nav.jsx         # Top navigation bar
    └── pages/
        ├── HomePage.jsx    # Landing page
        ├── ShopPage.jsx    # Shop grid + product detail page
        ├── Pages.jsx       # How It Works, About, FAQ, Contact, Track Order
        ├── Checkout.jsx    # Cart and checkout flow
        └── dashboard/
            └── DashboardPage.jsx  # Admin panel (products, forex, revenue, customers, refunds)
```

---

## Warranty & Trust

- ✓ Every serial number verified on Apple.com
- ✓ Full Apple US warranty intact at time of sale
- ✓ 12-month Certo coverage included on every device
- ✓ Transparent forex rate — shown before payment, never hidden

---

## Contact

**Email:** hello@certo.ng  
**Location:** Lagos, Nigeria
