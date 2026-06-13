/* โค้ด Google Apps Script v3 ฝังไว้ให้ copy ในหน้าตั้งค่า */
window.GS_CODE_TEMPLATE = `/***********************************************************
 * Google Apps Script Backend — v3
 * สำหรับ: ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี)
 *
 * โครงสร้างชีต (อ่านรู้เรื่อง ไม่จำกัดแถว):
 *   - "พนักงาน"   1 แถว/คน
 *   - "เงินเดือน"  1 แถว/คน/เดือน
 *   - "โบนัส"     1 แถว/คน/ปี
 *   - "Meta"      updatedAt, สถิติ
 *   - "Backups"   สำรองอัตโนมัติวันละครั้ง วนลูป 30 วัน
 *
 * คอลัมน์สุดท้ายของแต่ละชีตคือ _json (ข้อมูลดิบครบถ้วน)
 * ใช้ _json ในการอ่านกลับ — คอลัมน์อื่นมีไว้ให้คนอ่าน
 * ห้ามแก้คอลัมน์ _json ด้วยมือ
 *
 * อัพเกรดจาก v2 (เก็บใน Data!A1): ระบบ migrate ให้อัตโนมัติ
 ***********************************************************/

var BACKUP_KEEP_DAYS = 30;
var CHUNK = 45000; // จำกัด 50,000 ตัวอักษร/เซลล์ — แบ่ง JSON เป็นชิ้น
var TZ = 'Asia/Bangkok';

// ============ WEB APP ENTRY POINTS ============

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'backups') {
      return jsonOut({ success: true, backups: listBackups() });
    }
    if (action === 'backup') {
      var date = e.parameter.date || '';
      var data = readBackup(date);
      if (!data) throw new Error('ไม่พบข้อมูลสำรองของวันที่ ' + date);
      return jsonOut({ success: true, data: data });
    }

    migrateIfNeeded();
    var current = readAll();
    return jsonOut({ success: true, data: current, timestamp: new Date().toISOString() });
  } catch (err) {
    return jsonOut({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // กันเขียนชนกัน
  try {
    var payload = JSON.parse(e.postData.contents);
    if (!payload || typeof payload !== 'object' || !payload.employees) {
      throw new Error('Invalid payload');
    }

    migrateIfNeeded();
    maybeDailyBackup();   // สำรองข้อมูลปัจจุบัน (ก่อนเขียนทับ) วันละ 1 ครั้ง
    writeAll(payload);

    return jsonOut({ success: true, updatedAt: payload.updatedAt });
  } catch (err) {
    return jsonOut({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ READ / WRITE ============

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function getSheet(name) {
  var sheet = ss().getSheetByName(name);
  if (!sheet) sheet = ss().insertSheet(name);
  return sheet;
}

function writeAll(data) {
  var employees = data.employees || [];
  var salaries = data.salaries || {};
  var bonuses = data.bonuses || {};

  // ---- พนักงาน ----
  var empHeader = ['รหัส', 'กลุ่ม', 'ชื่อ', 'นามสกุล', 'ชื่อ EN', 'ตำแหน่ง', 'เลขบัตร',
                   'ที่อยู่', 'เริ่มงาน', 'ลาออก', 'PVD ลจ.%', 'PVD นจ.%', '_json'];
  var empRows = employees.map(function (emp) {
    return [
      emp.empId || '', emp.group || '', emp.firstName || '', emp.lastName || '',
      emp.nameEn || '', emp.position || '', "'" + (emp.idCard || ''),
      emp.address || '', emp.startDate || '', emp.endDate || '',
      emp.fundRate != null ? emp.fundRate : '', emp.fundRateEmployer != null ? emp.fundRateEmployer : '',
      JSON.stringify(emp)
    ];
  });
  replaceSheet('พนักงาน', empHeader, empRows);

  // ---- เงินเดือน ----
  var empName = {};
  employees.forEach(function (emp) {
    empName[emp.empId] = ((emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || '')).trim();
  });
  var salHeader = ['key', 'รหัส', 'ชื่อ', 'ปี', 'เดือน', 'รายได้', 'รายได้อื่น', 'พิเศษ', 'OT',
                   'SSO ลจ.', 'SSO นจ.', 'TAX', 'PVD ลจ.', 'PVD นจ.', 'หยุด', 'หนี้อื่นๆ',
                   'เงินสด', 'เข้าบัญชี', 'วันที่รับ', 'หมายเหตุ', '_json'];
  var salKeys = Object.keys(salaries).sort(function (a, b) {
    var A = salaries[a], B = salaries[b];
    return (A.year - B.year) || (A.month - B.month) || String(A.empId).localeCompare(String(B.empId));
  });
  var salRows = salKeys.map(function (k) {
    var s = salaries[k];
    return [
      k, s.empId || '', empName[s.empId] || '', s.year || '', s.month || '',
      s.salary || 0, s.otherIncome || 0, s.bonus || 0, s.ot || 0,
      s.sso || 0, s.ssoEmployer || 0, s.tax || 0, s.pvd || 0, s.pvdEmployer || 0,
      s.holiday || 0, s.debt || 0, s.cash || 0, "'" + (s.bank || ''),
      s.receivedDate || '', s.note || '', JSON.stringify(s)
    ];
  });
  replaceSheet('เงินเดือน', salHeader, salRows);

  // ---- โบนัส ----
  var bonHeader = ['key', 'รหัส', 'ชื่อ', 'ปี', 'จำนวนเงิน', 'วันที่รับ', '_json'];
  var bonRows = Object.keys(bonuses).sort().map(function (k) {
    var b = bonuses[k];
    return [k, b.empId || '', empName[b.empId] || '', b.year || '',
            b.amount || 0, b.receivedDate || '', JSON.stringify(b)];
  });
  replaceSheet('โบนัส', bonHeader, bonRows);

  // ---- Meta ----
  replaceSheet('Meta', ['key', 'value'], [
    ['updatedAt', data.updatedAt || new Date().toISOString()],
    ['version', data.version || 1],
    ['จำนวนพนักงาน', employees.length],
    ['จำนวนรายการเงินเดือน', salKeys.length],
    ['empOrder', JSON.stringify(data.empOrder || {})],
    ['บันทึกล่าสุดโดย script เมื่อ', Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss')]
  ]);
}

function replaceSheet(name, header, rows) {
  var sheet = getSheet(name);
  sheet.clearContents();
  var all = [header].concat(rows);
  if (all.length > 0) {
    sheet.getRange(1, 1, all.length, header.length).setValues(
      all.map(function (r) {
        while (r.length < header.length) r.push('');
        return r.slice(0, header.length);
      })
    );
  }
  sheet.setFrozenRows(1);
}

function readAll() {
  var employees = readJsonColumn('พนักงาน');
  var salaries = {};
  var bonuses = {};

  readKeyJsonRows('เงินเดือน').forEach(function (r) { salaries[r.key] = r.obj; });
  readKeyJsonRows('โบนัส').forEach(function (r) { bonuses[r.key] = r.obj; });

  var meta = {};
  var metaSheet = ss().getSheetByName('Meta');
  if (metaSheet && metaSheet.getLastRow() > 1) {
    metaSheet.getRange(2, 1, metaSheet.getLastRow() - 1, 2).getValues().forEach(function (r) {
      meta[r[0]] = r[1];
    });
  }

  var empOrder = {};
  if (meta['empOrder']) {
    try { empOrder = JSON.parse(meta['empOrder']); } catch (e) { empOrder = {}; }
  }

  return {
    employees: employees,
    salaries: salaries,
    bonuses: bonuses,
    empOrder: empOrder,
    version: meta['version'] || 1,
    updatedAt: meta['updatedAt'] || ''
  };
}

// อ่านคอลัมน์ _json (คอลัมน์สุดท้าย) ของชีต → array ของ object
function readJsonColumn(name) {
  var sheet = ss().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var lastCol = sheet.getLastColumn();
  var values = sheet.getRange(2, lastCol, sheet.getLastRow() - 1, 1).getValues();
  var out = [];
  values.forEach(function (r) {
    if (r[0]) { try { out.push(JSON.parse(r[0])); } catch (e) {} }
  });
  return out;
}

// อ่าน (key คอลัมน์แรก, _json คอลัมน์สุดท้าย)
function readKeyJsonRows(name) {
  var sheet = ss().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var lastCol = sheet.getLastColumn();
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  var out = [];
  values.forEach(function (r) {
    var key = r[0], json = r[lastCol - 1];
    if (key && json) { try { out.push({ key: key, obj: JSON.parse(json) }); } catch (e) {} }
  });
  return out;
}

// ============ BACKUP (วนลูป 30 วัน) ============

function maybeDailyBackup() {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var sheet = getSheet('Backups');

  // มี backup ของวันนี้แล้ว → ข้าม
  if (sheet.getLastRow() >= 1) {
    var dates = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    for (var i = 0; i < dates.length; i++) {
      if (dates[i][0] === today) return;
    }
  }

  // สำรอง "ข้อมูลปัจจุบันก่อนเขียนทับ" = สถานะสิ้นวันก่อนหน้า
  var current = readAll();
  if (!current.employees || current.employees.length === 0) return; // ไม่สำรองข้อมูลว่าง

  var json = JSON.stringify(current);
  var row = [today];
  for (var p = 0; p < json.length; p += CHUNK) {
    row.push(json.substring(p, p + CHUNK));
  }
  sheet.appendRow(row);

  // วนลูป: เก็บแค่ BACKUP_KEEP_DAYS แถวล่าสุด (แถวบนสุด = เก่าสุด)
  var excess = sheet.getLastRow() - BACKUP_KEEP_DAYS;
  if (excess > 0) sheet.deleteRows(1, excess);
}

function listBackups() {
  var sheet = ss().getSheetByName('Backups');
  if (!sheet || sheet.getLastRow() < 1) return [];
  var dates = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  return dates.map(function (r) { return String(r[0]); }).filter(String).reverse(); // ใหม่สุดก่อน
}

function readBackup(date) {
  var sheet = ss().getSheetByName('Backups');
  if (!sheet || sheet.getLastRow() < 1) return null;
  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === date) {
      var json = values[i].slice(1).join('');
      try { return JSON.parse(json); } catch (e) { return null; }
    }
  }
  return null;
}

// ============ MIGRATE จาก v2 (Data!A1) ============

function migrateIfNeeded() {
  var empSheet = ss().getSheetByName('พนักงาน');
  if (empSheet && empSheet.getLastRow() > 1) return; // มีข้อมูลแบบใหม่แล้ว

  var oldSheet = ss().getSheetByName('Data');
  if (!oldSheet) return;
  var raw = oldSheet.getRange('A1').getValue();
  if (!raw) return;

  try {
    var data = JSON.parse(raw);
    if (data && data.employees && data.employees.length > 0) {
      writeAll(data);
      oldSheet.setName('Data_เก่า_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd'));
    }
  } catch (e) { /* ข้อมูลเก่าเสีย — ไม่ migrate */ }
}
`;
