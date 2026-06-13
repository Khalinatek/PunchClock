# PunchClock

A clean, minimalist, single-file HTML time-tracking application designed to log shifts and sync seamlessly with Google Sheets.

## ✨ Features
- **Minimalist Interface:** Clean design with a real-time 24-hour clock and date display.
- **One-Click Clock In/Out:** Dynamic UI that tracks ongoing sessions and prevents duplicate network requests.
- **Smart Break Deductions:** Automatically deducts a 30-minute break for any shift that is 8.5 hours or longer.
- **Weekly Navigation:** Automatically groups your hours by the current work week (Monday–Sunday). Toggle between past and present weeks to review your history.
- **Inline Editing:** Forgot to clock out? Click the ✎ icon to manually edit your in/out times (in 24-hour HH:MM format). The app will automatically recalculate your gross and net hours.
- **CSV Exports:** Easily download your currently viewed work week as a `.csv` file for payroll.
- **Google Sheets Integration:** Saves all data directly to a private Google Sheet.
- **Bot-Resistant Security:** Uses Base64 URL obfuscation so you can host the file publicly on GitHub Pages without bots scraping your private database link.

---

## 🛠️ Setup & Usage

To keep your data private and entirely under your control, PunchClock uses a Google Sheet as its database. You will need to deploy your own backend using the provided `Code.gs` script.

### 1. Database Setup
1. Create a new [Google Sheet](https://sheets.new/).
2. Rename the primary worksheet tab at the bottom to `Shifts` (capital 'S').
3. Create the following header row in row 1 of the `Shifts` tab:
   `Date` | `Clock In` | `Clock Out` | `Gross Hours` | `Net Hours` | `ID`
4. Create a second worksheet tab at the bottom and name it `State`. *(The script uses this tab to remember when you clocked in if you accidentally close the app).*

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

### 3. Frontend Setup & Security
To safely host this app on GitHub Pages without exposing your Web App URL to scraper bots, the URL must be encoded.

1. Go to [Base64Encode.org](https://www.base64encode.org/).
2. Paste the Web App URL you copied in the previous step and click **Encode**.
3. Copy the resulting scrambled text.
4. Clone or download this repository and open `PunchClock.html` in a text editor.
5. Locate the `ENCODED_URL` variable inside the `<script>` tag (around line 140).
6. Replace the placeholder text with your encoded string:
   `const ENCODED_URL = 'YOUR_BASE64_STRING_HERE';`
7. Save the file. You can now open `PunchClock.html` locally or host it publicly via GitHub Pages to start tracking your time!

---

## ⚠️ Disclaimer
**This project is for personal use only.** It is not licensed for commercial use, modification, or distribution.
