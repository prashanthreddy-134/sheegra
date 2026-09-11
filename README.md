# Sheegra

A production-shaped grocery e-commerce platform (Zepto/Blinkit-style) with one shared backend and four client apps:

```
sheegra/
├── backend/           Node.js + Express + Prisma + PostgreSQL — the shared API
├── customer-web/      Customer website (React + Vite)
├── admin-web/         Admin website (React + Vite)
├── customer-mobile/   Customer mobile app (Expo / React Native)
└── admin-mobile/      Admin mobile app (Expo / React Native)
```

All four clients talk to the **same backend and the same PostgreSQL database** — a product added on the admin website instantly shows up on both the customer website and the customer app; an order placed on mobile instantly shows up in the admin dashboard.

## What's real vs. what you must configure

Everything here is real, working code — real database models, real JWT auth, real OTP flow, real Razorpay order creation + signature-verified payments + automated refunds on cancellation, an atomic stock-reservation system that prevents overselling under concurrent checkouts, real image uploads, real push notifications, optional Sentry error monitoring, and an automated test suite (`cd backend && npm test`, 22 tests) covering both the pricing/coupon math and the stock-reservation logic. Nothing is mocked or hardcoded. To go live you must supply your own:

1. **PostgreSQL database** (any host: Railway, Render, Supabase, RDS, or your own server)
2. **SMS OTP provider** — MSG91 (recommended for Indian numbers) or Twilio
3. **Razorpay account** — after business KYC, payments settle to your bank account automatically via Razorpay's own payout schedule (configured in their dashboard, not in this code)

Until you add real keys, OTP codes print to the backend's console log (clearly marked dev-only) so you can develop end-to-end without spending money on SMS. Note: the server refuses to start in `NODE_ENV=production` with placeholder Razorpay keys or the console OTP provider — see `backend/SECURITY.md`.

## 1. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET, and provider keys when ready
npm install
npx prisma migrate dev --name init   # creates all tables
npx prisma generate
SEED_ADMIN_PHONE="+91XXXXXXXXXX" npm run seed   # your real phone number as first admin
npm run dev                           # starts on http://localhost:4000
```

Health check: `GET http://localhost:4000/health`

### Environment variables (`backend/.env`)
See `backend/.env.example` for the full list with comments. Key ones:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — long random string (`openssl rand -hex 32`)
- `OTP_PROVIDER` — `console` (dev), `msg91`, or `twilio`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`

### Razorpay webhook (important)
In the Razorpay dashboard, add a webhook pointing to `https://yourdomain.com/api/payments/webhook`, subscribed to `payment.captured` and `payment.failed`. Set the webhook secret you choose there as `RAZORPAY_WEBHOOK_SECRET`. This webhook — not the frontend callback — is the authoritative source that confirms payment and moves an order to CONFIRMED, so orders still get confirmed correctly even if a customer closes the app right after paying.

## 2. Customer & Admin websites

```bash
cd customer-web && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
cd admin-web     && cp .env.example .env && npm install && npm run dev  # http://localhost:5174
```

Set `VITE_API_URL` in each `.env` to your backend URL. For production, `npm run build` outputs static files in `dist/` — deploy to Vercel, Netlify, Cloudflare Pages, or any static host.

## 3. Customer & Admin mobile apps

```bash
cd customer-mobile && cp .env.example .env && npm install && npx expo start
cd admin-mobile     && cp .env.example .env && npm install && npx expo start
```

Scan the QR code with Expo Go on your phone for development. For a real device or physical testing, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP or deployed backend URL — `localhost` only works in a simulator on the same machine.

For app store releases, use [EAS Build](https://docs.expo.dev/build/introduction/) (`npx eas build`) to produce signed `.ipa`/`.apk` files. `react-native-razorpay` requires a native build (EAS or bare workflow) — it will not work inside Expo Go.

## 4. Admin accounts

Only phone numbers already in the database with role `ADMIN` or `STAFF` can log into either admin app — OTP alone doesn't grant access to an unknown number. The seed script creates your first admin. To add more staff later, call `POST /api/admin/staff` while logged in as an existing admin, or add rows directly in the database.

## 5. Image uploads & push notifications

- **Images**: both admin apps (web and mobile) let you upload product/category photos directly — no need to host images elsewhere. Files are stored on the backend's local disk at first (`backend/uploads/`), served at `/uploads/<filename>`. Most hosting platforms wipe local disk on redeploy, so before real launch swap `backend/src/routes/upload.js` to upload to Cloudinary or S3 instead — the response shape (`{ url }`) stays identical, so no frontend changes are needed.
- **Push notifications**: both mobile apps register an Expo push token on login. The backend fires a real push (via Expo's push service) alongside every SMS/email notification — e.g. when an admin advances an order to "Packed", the customer's phone gets a push instantly, no polling required for that part. Order-tracking screens also poll every 8 seconds while an order is still in progress, as a fallback and for the admin dashboard.

## 6. Running the test suite

```bash
cd backend
npm test
```

Covers the money-math that matters most: coupon discounts (flat/percent/capped), delivery fee thresholds, order totals, and coupon validity checks (expiry, usage limits, minimum order value).

## 7. Deploying the mobile apps to app stores

```bash
cd customer-mobile   # or admin-mobile
npm install -g eas-cli
eas login
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android   # after the build finishes
eas submit --platform ios
```

`eas.json` in each mobile app already defines development/preview/production profiles — update the `EXPO_PUBLIC_API_URL` values in each to point at your real backend before building for production. `react-native-razorpay` requires a real EAS/native build; it will not work inside Expo Go.

## 8. Deployment checklist

- [ ] Postgres database provisioned, `DATABASE_URL` set, migrations run
- [ ] Backend deployed (Railway/Render/Fly.io/your own VM) behind HTTPS
- [ ] `CORS_ORIGINS` in backend `.env` updated to your real website domains
- [ ] MSG91 or Twilio account live, `OTP_PROVIDER` switched from `console`
- [ ] Razorpay business KYC complete, live keys in `.env`, webhook configured
- [ ] Customer & admin websites deployed with `VITE_API_URL` pointing at production backend
- [ ] Mobile apps built via EAS with `EXPO_PUBLIC_API_URL` pointing at production backend
- [ ] `JWT_SECRET` is a real random secret, not the placeholder
- [ ] Update the `[BRACKETED PLACEHOLDERS]` in `customer-web/src/pages/Terms.jsx`, `Privacy.jsx`, and `RefundPolicy.jsx` with your real business details, and have a lawyer review them
- [ ] (Optional but recommended) Set `SENTRY_DSN` in `backend/.env` so you're notified if something breaks in production
- [ ] Read `backend/SECURITY.md` and complete the "still your responsibility" items (TLS, backups, dependency updates, external review) before processing real payments

### Fixed in this pass
Stock is now reserved atomically at checkout (prevents overselling when two people buy the last unit at once), cancellations trigger real Razorpay refunds automatically, abandoned checkouts release their stock reservation after 20 minutes via a background sweep, and the admin mobile app can now edit and delete products (not just add them).

## Architecture notes for future features

- **Live delivery tracking**: add a `DeliveryPartner` model and lat/lng update endpoint; the `Order` model already has an `addressId` with coordinates ready to consume.
- **Delivery partner app**: would be a 5th client reusing the same auth/order APIs with a new `DELIVERY_PARTNER` role.
- **Subscriptions**: add a `Subscription` model referencing `Product` + a recurrence rule, and a scheduled job that creates orders automatically.
- **Advanced analytics**: the `Order`/`OrderItem` schema already captures everything needed (price snapshots, timestamps, status history) for cohort/retention analysis without schema changes.
