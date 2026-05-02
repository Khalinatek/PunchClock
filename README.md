# PunchClock

A clean, minimalist, single-file HTML time-tracking application designed to log shifts and sync seamlessly with Google Sheets.

## Features
- **Simple Interface:** Minimalist design with a real-time clock and date display.
- **One-Click Clock In/Out:** Dynamic UI that tracks ongoing sessions.
- **Smart Break Deductions:** Automatically deducts a 30-minute break for any shift that is 8.5 hours or longer.
- **Google Sheets Integration:** Saves clock-in/out times, gross hours, and net hours directly to a Google Sheet via an Apps Script Web App.
- **CSV Export:** Easily download your recent shifts as a CSV file.

## Setup & Usage
1. Set up a Google Sheet and a Google Apps Script Web App to handle the `POST` and `GET` requests (the URL is defined in the `SCRIPT_URL` variable inside the HTML).
2. Update the `SCRIPT_URL` in `PunchClock.html` with your own Google Apps Script deployment URL.
3. Open `PunchClock.html` in any modern web browser.
4. Click **Clock In** to start a session and **Clock Out** to end it.

## Disclaimer
**This project is for personal use only.** It is not licensed for commercial use, modification, or distribution.
