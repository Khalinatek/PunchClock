// Shared secret. When you paste this into the Apps Script editor, replace the
// placeholder with your real token (the same value stored in the GitHub Actions
// API_TOKEN secret). Keep the real token OUT of the committed repo.
const API_TOKEN = '__API_TOKEN__';

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Shifts') || ss.getActiveSheet();
    const stateSheet = ss.getSheetByName('State') || ss.insertSheet('State');
    const data = JSON.parse(e.postData.contents);

    // Reject any request that doesn't present the shared token.
    if (data.token !== API_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ok: false, error: 'unauthorized'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'load') {
      // getDisplayValues() ensures we get "08:57" instead of "Sat Dec 30 1899..."
      const rows = sheet.getDataRange().getDisplayValues();
      const clockInTime = stateSheet.getRange('A1').getValue().toString();
      const sessionId = stateSheet.getRange('B1').getValue().toString();
      return ContentService.createTextOutput(JSON.stringify({ok: true, rows: rows, clockInTime, sessionId}))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === 'add') {
      // Idempotency guard: refuse a second shift for a session already recorded
      // (e.g. the same session punched out on two devices, or a retried save that
      // actually went through). Session IDs live in column G.
      if (data.sessionId) {
        const rows = sheet.getDataRange().getValues();
        for (let i = 0; i < rows.length; i++) {
          if (rows[i][6] && rows[i][6].toString() === data.sessionId.toString()) {
            return ContentService.createTextOutput(JSON.stringify({ok: false, duplicate: true, error: 'session_already_recorded'}))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      sheet.appendRow([data.date, data.inTime, data.outTime, data.raw, data.net, data.id, data.sessionId || '']);
      stateSheet.clearContents();
    } else if (data.action === 'delete') {
      const rows = sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i][5].toString().trim() === data.id.toString().trim()) {
          sheet.deleteRow(i + 1); 
          break;
        }
      }
    } else if (data.action === 'clockin') {
      stateSheet.clearContents();
      stateSheet.getRange('A1').setValue(data.clockInTime);
      stateSheet.getRange('B1').setValue(data.sessionId || ''); // so every device learns this session's id
    } else if (data.action === 'edit') {
      const rows = sheet.getDataRange().getValues();
      // Search from the bottom up to find the ID
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i][5].toString().trim() === data.id.toString().trim()) {
          // Update columns B, C, D, and E (InTime, OutTime, Raw, Net)
          sheet.getRange(i + 1, 2, 1, 4).setValues([[data.inTime, data.outTime, data.raw, data.net]]);
          break;
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Data loading now happens via the token-protected 'load' POST action, so a
// plain browser visit to the Web App URL reveals nothing about your shifts.
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ok: true, msg: 'PunchClock API'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Runs on a daily time trigger (set up to fire just after midnight).
// If a session was left open, it closes it out at 23:59 of the day it started
// so a forgotten punch-out doesn't run the clock into the next day.
// The resulting shift can be edited the next morning like any other.
function autoClockOut() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Shifts') || ss.getActiveSheet();
  const stateSheet = ss.getSheetByName('State');
  if (!stateSheet) return;

  const stored = stateSheet.getRange('A1').getValue();
  if (!stored) return; // no open session

  const sessionId = stateSheet.getRange('B1').getValue().toString();

  // A1 holds the clock-in time (ISO string, though Sheets may coerce it to a Date).
  const clockIn = (stored instanceof Date) ? stored : new Date(stored);
  if (isNaN(clockIn.getTime())) return;

  const tz = ss.getSpreadsheetTimeZone();
  const now = new Date();

  // Safety: only auto-close a session that started on an earlier day, so a
  // session begun just after midnight isn't closed the moment it starts.
  const sameDay = Utilities.formatDate(clockIn, tz, 'yyyy-MM-dd') ===
                  Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  if (sameDay) return;

  // Shift ends at 23:59 of the clock-in day.
  const shiftEnd = new Date(clockIn);
  shiftEnd.setHours(23, 59, 0, 0);

  const raw = Math.round(((shiftEnd - clockIn) / 3600000) * 100) / 100;
  const BREAK_HOURS = 0.5;
  const net = raw >= 8.5 ? Math.max(0, Math.round((raw - BREAK_HOURS) * 100) / 100) : raw;

  const dateStr = Utilities.formatDate(clockIn, tz, 'EEE, MMM d');
  const inStr = Utilities.formatDate(clockIn, tz, 'HH:mm');
  const outStr = '23:59';
  const id = shiftEnd.getTime().toString(); // keeps week-grouping on the shift's day

  sheet.appendRow([dateStr, inStr, outStr, raw, net, id, sessionId]);
  stateSheet.clearContents();
}
