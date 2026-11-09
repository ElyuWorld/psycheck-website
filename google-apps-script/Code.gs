/**
 * PsyCheck Student Analytics -> Google Sheet
 *
 * In this spreadsheet:
 * 1. Extensions > Apps Script
 * 2. Replace the default code with this file
 * 3. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL into GOOGLE_SHEETS_WEBHOOK_URL
 *    in .env.local and in Vercel environment variables
 */

function doGet() {
  return ContentService.createTextOutput("PsyCheck sheet sync is running.");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    writeAnalyticsSheet(ss, data);
    writeRecordsSheet(ss, data);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(error) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function writeSection(sheet, startRow, title, headers, rows) {
  sheet.getRange(startRow, 1).setValue(title).setFontWeight("bold").setFontSize(12);
  sheet
    .getRange(startRow + 1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground("#087f3e")
    .setFontColor("#ffffff");

  if (rows.length > 0) {
    sheet.getRange(startRow + 2, 1, rows.length, headers.length).setValues(rows);
  }

  return startRow + 2 + Math.max(rows.length, 1) + 1;
}

function writeAnalyticsSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, "Student Analytics");
  sheet.clear();
  sheet.setFrozenRows(3);

  sheet.getRange("A1").setValue("PsyCheck Student Analytics").setFontWeight("bold").setFontSize(16);
  sheet.getRange("A2").setValue("Generated " + (data.generatedAt || "")).setFontColor("#6b7280");

  let row = 4;
  row = writeSection(
    sheet,
    row,
    "Summary",
    ["Metric", "Count", "Share", "Description"],
    data.summary || []
  );
  row = writeSection(
    sheet,
    row,
    "Appointment Services",
    ["Category", "Count", "Share", "Description"],
    data.services || []
  );
  row = writeSection(
    sheet,
    row,
    "Students by Year Level",
    ["Category", "Count", "Share", "Description"],
    data.yearLevels || []
  );
  row = writeSection(
    sheet,
    row,
    "Appointment Status",
    ["Category", "Count", "Share", "Description"],
    data.statuses || []
  );
  writeSection(
    sheet,
    row,
    "Appointment Mode",
    ["Category", "Count", "Share", "Description"],
    data.modes || []
  );

  sheet.autoResizeColumns(1, 4);
}

function writeRecordsSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, "Appointment Records");
  sheet.clear();
  sheet.setFrozenRows(1);

  const headers = ["Student", "Student ID", "Year Level", "Service", "Date", "Time", "Mode", "Status"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold")
    .setBackground("#087f3e")
    .setFontColor("#ffffff");

  const appointments = data.appointments || [];
  const rows = appointments.length
    ? appointments
    : [["No appointment records yet.", "", "", "", "", "", "", ""]];

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}
