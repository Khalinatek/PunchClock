# PunchClock

A clean, minimalist, single-file HTML time-tracking application designed to log shifts and sync seamlessly with Google Sheets.

## ✨ Features
- **Minimalist Interface:** Clean design with a real-time 24-hour clock and date display.
- **One-Click Clock In/Out:** Dynamic UI that tracks ongoing sessions and prevents duplicate network requests.
- **Smart Break Deductions:** Automatically deducts a 30-minute break for any shift that is 8.5 hours or longer.
- **Weekly Navigation:** Automatically groups your hours by the current work week (Monday–Sunday). Toggle between past and present weeks to review your history.
- **Inline Editing:** Forgot to clock out? Click the ✎ icon to manually edit your in/out times (in 24-hour HH:MM format). The app will automatically recalculate your gross and net hours.
- **Auto Punch-Out at Midnight:** If you forget to clock out, a nightly script closes the open session at 23:59 of that day so the clock never runs into the next day. Just edit the out time the next morning.
- **CSV Exports:** Easily download your currently viewed work week as a `.csv` file for payroll.
- **Google Sheets Integration:** Saves all data directly to a private Google Sheet.
- **Token-Protected Backend:** Every request carries a shared secret token, and the backend rejects anything without it — so a leaked endpoint URL alone can't read or modify your data. The URL is also Base64-obfuscated to deter casual scrapers, and visiting it directly returns nothing.
- **Offline Safety Net:** The open session and any shift whose save fails are stored in your browser and automatically restored/retried on the next load, so a dropped network request can't lose a shift or strand you "clocked in."
- **Cross-Device Sync (no duplicates):** Open the app on your phone and PC at once — a tab left open all day re-syncs with the server when you return to it, so it reflects a punch made elsewhere. Each clock-in also gets a unique session ID, and the backend refuses to record the same session twice, so punching out on a second device can never create a duplicate shift.
- **Version Badge:** The current version (e.g. `PunchClock 0.4A`) is shown in the footer so you can confirm which build is deployed.

---

## 🛠️ Setup & Usage

To keep your data private and entirely under your control, PunchClock uses a Google Sheet as its database. You will need to deploy your own backend using the provided `Code.gs` script.

### 1. Database Setup
1. Create a new [Google Sheet](https://sheets.new/).
2. Rename the primary worksheet tab at the bottom to `Shifts` (capital 'S').
3. Create the following header row in row 1 of the `Shifts` tab:
   `Date` | `Clock In` | `Clock Out` | `Gross Hours` | `Net Hours` | `ID` | `Session ID`
   *(`Session ID` in column **G** is used for duplicate protection; existing rows without one are fine.)*
4. Create a second worksheet tab at the bottom and name it `State`. *(The script uses this tab to remember the current session — cell A1 holds the clock-in time and B1 the session ID — so it can restore or auto-close a session you left open.)*

### 2. Backend Deployment
1. From your Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any default code in the editor and paste the entire contents of the `Code.gs` file from this repository.
3. Click the **Deploy** button in the top right and select **New deployment**.
4. Click the gear icon next to "Select type" and choose **Web App**.
5. Set the following configuration:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` *(This is required for your HTML frontend to communicate with the script).*
6. Click **Deploy** and authorize the required Google permissions.
7. **Copy the Web App URL** provided at the end of the deployment.

#### (Optional) Enable Auto Punch-Out at Midnight
To have forgotten sessions closed automatically each night:
1. In the Apps Script editor, open the **Triggers** panel (the clock icon ⏰ in the left sidebar).
2. Click **+ Add Trigger** (bottom right) and set:
   - **Function to run:** `autoClockOut`
   - **Event source:** `Time-driven`
   - **Type of time based trigger:** `Day timer`
   - **Time of day:** `Midnight to 1am`
3. Click **Save** and authorize if prompted. Any session left open will now be closed at 23:59 of the day it started.

> **Note:** This caps every open shift at midnight, so it isn't suited to overnight/graveyard shifts that legitimately cross into the next day.

### 3. Set Your Shared Token
The backend rejects any request that doesn't present a matching secret token. To keep the real token **out of the repository**, the committed files use a `__API_TOKEN__` placeholder, and the token is supplied in two private places:

1. **Choose a random string** (e.g. a password-generator value or `openssl rand -hex 32`). This is your token.
2. **Apps Script:** when you paste `code.gs` into the editor, replace `__API_TOKEN__` with your real token. (This copy lives in your Google project, never in the repo.)
3. **GitHub Actions secret:** in your repo, go to **Settings → Secrets and variables → Actions → New repository secret**, name it `API_TOKEN`, and paste the *same* token. The deploy workflow injects it into the page at publish time (see next step).

> **Note:** Because the token ends up in the client, anyone who views your **live page's** source can read it — so it protects against a leaked *endpoint URL*, not against someone who already has your page. This setup keeps the secret out of your *repo and its history*; it does not hide it from the deployed page. For a personal tool that's a reasonable bar.

### 4. Set the Backend URL
To keep your Web App URL out of casual scrapers, it's stored Base64-encoded.

1. Go to [Base64Encode.org](https://www.base64encode.org/).
2. Paste the Web App URL you copied in the deployment step and click **Encode**.
3. Copy the resulting scrambled text.
4. Open `PunchClock.html`, locate the `ENCODED_URL` variable inside the `<script>` tag, and replace the placeholder:
   `const ENCODED_URL = 'YOUR_BASE64_STRING_HERE';`
5. Commit and push.

### 5. Host on GitHub Pages
Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. In your repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Make sure the `API_TOKEN` secret from step 3 is in place.
3. Push to `main` (or run the workflow manually from the **Actions** tab). The workflow injects your token into a deployed copy of the page and publishes it — your site will be at `https://<user>.github.io/<repo>/`.

> **Local testing:** opening `PunchClock.html` directly won't authenticate (it still holds the `__API_TOKEN__` placeholder). To test locally, temporarily paste your real token over the placeholder — just don't commit that change.

> **Heads up:** The frontend and backend are a matched pair. After changing `code.gs`, paste it into the Apps Script editor, then **update your existing deployment to a new version** (Deploy → Manage deployments → ✏️ edit → Version: *New version* → Deploy) so the `load` action and token check go live. Updating in place keeps the same Web App URL; creating a *brand-new* deployment would give you a different URL and break your encoded string.

---

## ⚠️ Disclaimer
**This project is for personal use only.** It is not licensed for commercial use, modification, or distribution.
