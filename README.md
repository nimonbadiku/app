# DoorTrack 🚪

> **Minimalist, rapid door-to-door sales tracking. Tap result, keep walking.**

DoorTrack is a mobile-first web app built specifically for door-to-door sales representatives. Designed for one-handed operation on iPhone, it lets you log doors in 1–2 taps and calculate live earnings and hourly pacing without losing rhythm.

---

## Key Features

- **Lightning-Fast Door Logging**:
  - `YES`: 1 tap + instant quantity selector (`- 1 +` with `1, 2, 3, 4, 5` quick pills) &rarr; `SAVE`.
  - `NO`: 1 tap (`doors + 1`, `no + 1`).
  - `NOT HOME`: 1 tap (`doors + 1`, `noAnswer + 1`).
- **iPhone Safe Timer Architecture**:
  - Pure timestamp-based (`startedAt = Date.now()`).
  - Elapsed time is calculated as `currentTime - startedAt`.
  - Resilient against iOS backgrounding, phone locking, and JavaScript throttling.
- **Immediate Undo**: `↶ UNDO` reverses the last door log, counts, items, and earnings.
- **Route Experiments & Notes**: Track test opener pitches, weather conditions, or strategies with subtle personal handwritten notes.
- **Chronological History & Deep Dive**: Compare every session against your all-time average (DKK/hour, Doors/hour, Yes rate).
- **Progress & Trends**: Clean SVG performance charts, weekly summaries, and historical bests.
- **Offline Resilient**: Local storage persistence ensures you never lose a door count or active session even if cell service drops between houses.
- **PWA & iPhone Ready**: Web App Manifest, Apple touch icons, and safe-area insets.

---

## 1. Local Setup

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your database connection string:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db"
```

### Step 3: Run database migration

Push the schema with Drizzle Kit:

```bash
npx drizzle-kit push
```

### Step 4: Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser (or your local IP on mobile Safari).

---

## 2. Supabase Setup Instructions

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the left navigation, go to **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` from this repository and run it.
4. Go to **Project Settings &rarr; Database**.
5. Copy the **URI connection string** (under Connection Pooling or Direct Connection).
6. Replace `[YOUR-PASSWORD]` with your database password.
7. Set this as `DATABASE_URL` in your `.env` and in Vercel.

---

## 3. GitHub Steps

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial DoorTrack production release"
   ```
2. Create a new repository on [github.com](https://github.com/new).
3. Link and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/doortrack.git
   git branch -M main
   git push -u origin main
   ```

---

## 4. Vercel Deployment Instructions

1. Go to [vercel.com](https://vercel.com) and click **Add New &rarr; Project**.
2. Select your `doortrack` GitHub repository.
3. In the **Environment Variables** section, add:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string.
4. Click **Deploy**.
5. Vercel will build and assign your production domain (e.g. `doortrack.vercel.app`).

---

## 5. iPhone Installation (PWA)

1. Open your production URL in **Safari** on your iPhone.
2. Tap the **Share** button (box with upward arrow at bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.
5. Launch DoorTrack from your Home Screen for a native standalone app experience.

---

## 6. Verification Flow Checklist

- [x] **Test 1**: Start session &rarr; timer runs &rarr; tap `NO` &rarr; counters update immediately.
- [x] **Test 2**: Tap `YES` &rarr; choose quantity &rarr; earnings and hourly rate update.
- [x] **Test 3**: Tap `NOT HOME` &rarr; counter updates without forms.
- [x] **Test 4**: Tap `UNDO` &rarr; all affected counts and earnings reverse accurately.
- [x] **Test 5**: Refresh page during active session &rarr; active state remains intact.
- [x] **Test 6**: Close/reopen app &rarr; active session recovered from local storage.
- [x] **Test 7**: Lock phone / background &rarr; reopen &rarr; timer shows exact real elapsed time from timestamps.
- [x] **Test 8**: End session &rarr; saved to database &rarr; appears in History.
- [x] **Test 9**: Tap session card &rarr; view metrics, conversion rates, and comparisons.
- [x] **Test 10**: Progress chart & weekly summary update with every new session.
- [x] **Test 11**: Lose internet &rarr; app continues logging seamlessly offline.
- [x] **Test 12**: Reconnect &rarr; pending sessions automatically synchronize.
