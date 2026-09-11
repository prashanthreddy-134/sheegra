# HOW TO RUN Sheegra — read this first

**Why did the page show up blank when you opened `index.html`?**

Because this isn't a plain HTML website — `customer-web` and `admin-web` are React apps built with Vite. The `index.html` file is just a nearly-empty shell; all the actual content is JavaScript that has to be compiled and served by a dev server, and that server needs to talk to the backend API to get any data (products, categories, etc.) to show. Double-clicking `index.html` in a file browser can't do either of those things, so you get a blank page. You always start it with a terminal command (shown below), never by opening the file directly.

This one file walks you through everything, in order, from nothing installed to all four apps running.

---

## 0. Install the tools you need (one-time)

You need these installed on your computer first:

1. **Node.js** (version 18 or newer) — download from [nodejs.org](https://nodejs.org), pick the LTS version. To check it's installed, open a terminal and run:
   ```bash
   node --version
   ```
2. **PostgreSQL** — the database. Easiest options:
   - **Local install**: [postgresql.org/download](https://www.postgresql.org/download/)
   - **Or skip local install entirely** and use a free hosted database instead (recommended if you're not comfortable with database admin) — sign up at [railway.app](https://railway.app) or [supabase.com](https://supabase.com), create a Postgres database, and copy the connection string they give you. Either way you'll end up with one `DATABASE_URL` string like:
     ```
     postgresql://username:password@host:5432/databasename
     ```
3. A code editor if you want to look at/edit files — [VS Code](https://code.visualstudio.com) is fine, but not required to just run it.
4. **(Only if you want the mobile apps)** the free **Expo Go** app on your phone, from the App Store or Play Store.

You do **not** need to install anything else globally — each app installs its own dependencies in the next steps.

---

## 1. Unzip the project

Unzip `sheegra.zip` somewhere on your computer. You should see:

```
sheegra/
├── backend/
├── customer-web/
├── admin-web/
├── customer-mobile/
└── admin-mobile/
```

Open a terminal and `cd` into that `sheegra` folder.

---

## 2. Start the backend (do this first — every other app depends on it)

```bash
cd backend
cp .env.example .env
```

Now open the new `.env` file in a text editor and fill in just these two lines to start (leave everything else as-is for now):

```
DATABASE_URL="postgresql://your-real-connection-string-here"
JWT_SECRET="any-long-random-string-at-least-20-characters"
```

Then run:

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run seed
npm run dev
```

If everything works, you'll see:

```
Sheegra API running on port 4000
```

**Leave this terminal window open and running.** Every other app needs this backend running in the background. Open a **new terminal tab/window** for each step below.

To confirm it's really working, open **http://localhost:4000/health** in your browser — you should see `{"status":"ok",...}`, not a blank page.

### What `npm run seed` just did
It created sample categories and products, and made **one phone number an admin**: `+919999999999` by default. To use your own real phone number as the admin instead, before running seed:
```bash
SEED_ADMIN_PHONE="+91YOUR10DIGITNUMBER" npm run seed
```
(On Windows Command Prompt, use `set SEED_ADMIN_PHONE=+91YOUR10DIGITNUMBER && npm run seed` instead.)

### About OTP codes right now
Your `.env` has `OTP_PROVIDER="console"` by default — this means OTP codes are **not** actually texted to your phone yet, they're printed in this same backend terminal window instead, looking like:
```
[DEV OTP] +919999999999 -> 483920 (expires in 5m)
```
That's normal and expected until you add a real SMS provider (step 6). Just read the code from this terminal and type it into the app.

---

## 3. Start the customer website

Open a **new terminal window** (keep the backend one running):

```bash
cd customer-web
cp .env.example .env
npm install
npm run dev
```

You'll see something like:
```
  VITE ready
  ➜  Local:   http://localhost:5173/
```

Now open **http://localhost:5173** in your browser — this is the real way to view it, not opening `index.html` directly. You should see the Sheegra homepage with products.

---

## 4. Start the admin website

Open **another new terminal window**:

```bash
cd admin-web
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5174** in your browser. Log in with the admin phone number from step 2 — the OTP code will print in your **backend** terminal (step 2's window), not this one.

---

## 5. (Optional) Run the mobile apps

Open two more terminal windows, one per app:

```bash
cd customer-mobile
cp .env.example .env
npm install
npx expo start
```

```bash
cd admin-mobile
cp .env.example .env
npm install
npx expo start
```

Each command shows a QR code in the terminal. Scan it with the **Expo Go** app on your phone (same WiFi network as your computer). 

**Important:** `localhost` in the mobile `.env` files only works if you're testing in a simulator on the same computer running the backend. On a real phone, `localhost` means "the phone itself," which has no backend running on it — you'll get network errors. Fix this by editing `customer-mobile/.env` and `admin-mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR-COMPUTER-LAN-IP:4000/api
```

To find your computer's LAN IP: Mac/Linux run `ifconfig | grep inet`, Windows run `ipconfig` — look for something like `192.168.1.42`. Your phone and computer must be on the same WiFi network.

---

## 6. Going from "running on my laptop" to "a real live business"

Everything above runs only on your own computer — nobody else can see it yet. To make it a real, public website your customers can use, you need to additionally:

1. **Deploy the backend** somewhere it stays running 24/7 — e.g. [Railway](https://railway.app) or [Render](https://render.com) (both have simple "connect your GitHub repo and deploy" flows). Set the same `.env` variables there.
2. **Deploy the two websites** — e.g. [Vercel](https://vercel.com) or [Netlify](https://netlify.com), pointing `VITE_API_URL` at your deployed backend's URL instead of `localhost:4000`.
3. **Get a real SMS provider** — sign up for [MSG91](https://msg91.com) (simplest for Indian numbers) or [Twilio](https://twilio.com), then in your deployed backend's `.env` set `OTP_PROVIDER="msg91"` and fill in the MSG91 keys. Without this, OTP codes only ever show up in server logs, which real customers can't see.
4. **Get a real Razorpay account** — sign up at [razorpay.com](https://razorpay.com), complete their business KYC, and put your real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` into the deployed backend's `.env`. This is what makes payments actually settle to your bank account.
5. **Build and publish the mobile apps** to the App Store / Play Store using `npx eas build` (see the main `README.md` in the project for details).

The main `README.md` in the project root and `backend/SECURITY.md` cover these in more depth, plus a full pre-launch checklist.

---

## Troubleshooting

**"Page is blank / shows nothing"** → You opened `index.html` directly instead of running `npm run dev` and visiting `http://localhost:5173`. Go back to step 3.

**"Cannot connect" / "Network Error" in the browser or app** → The backend isn't running, or crashed. Check the backend's terminal window for red error text.

**"prisma: command not found" or migrate fails** → Make sure you ran `npm install` inside `backend/` first, and that `DATABASE_URL` in `backend/.env` is a real, reachable Postgres connection string.

**OTP never arrives on my phone** → Expected until you set up MSG91/Twilio (step 6, item 3). Until then, read the code from the backend terminal window.

**Port already in use** → Something else on your computer is already using port 4000/5173/5174. Either close that other program, or change `PORT` in `backend/.env` (and update the corresponding `VITE_API_URL` / `EXPO_PUBLIC_API_URL` to match).
