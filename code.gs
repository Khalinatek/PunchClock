function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Shifts') || ss.getActiveSheet();
    const stateSheet = ss.getSheetByName('State') || ss.insertSheet('State');
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'add') {
      sheet.appendRow([data.date, data.inTime, data.outTime, data.raw, data.net, data.id]);
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

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Shifts') || ss.getActiveSheet();
    const stateSheet = ss.getSheetByName('State');
    
    // getDisplayValues() ensures we get "08:57" instead of "Sat Dec 30 1899..."
    const rows = sheet.getDataRange().getDisplayValues();
    const clockInTime = stateSheet ? stateSheet.getRange('A1').getValue().toString() : '';
    
    return ContentService.createTextOutput(JSON.stringify({ok: true, rows: rows, clockInTime}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
