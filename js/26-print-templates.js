/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Print HTML Templates */
/* ============================================================
 * PRINT HTML GENERATOR
 * ============================================================ */
function generatePrintHTML(type) {
  if (type === 'yearly') return PRINT_YEARLY_HTML;
  if (type === 'slip') return PRINT_SLIP_HTML;
  if (type === 'wht') return PRINT_WHT_HTML;
  return '';
}

const PRINT_YEARLY_HTML = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8">
<title>ใบสำคัญจ่ายเงินเดือน</title>
<style>
@page { size: A4 landscape; margin: 0.5cm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Sarabun', 'TH Sarabun New', 'Tahoma', sans-serif; background: #f0f0f0; padding: 20px; }
.toolbar { max-width: 1200px; margin: 0 auto 20px; background: white; padding: 12px 20px; border-radius: 6px; display: flex; gap: 10px; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-wrap: wrap; }
.toolbar-info { font-size: 13px; color: #555; }
.toolbar-info b { color: #1a5276; }
.toolbar-buttons { display: flex; gap: 10px; }
.toolbar button { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-print { background: #27ae60; color: white; }
.btn-close { background: #95a5a6; color: white; }
.page { width: 29.7cm; height: 20.5cm; background: white; padding: 0.7cm 0.8cm; margin: 0 auto 10px; page-break-after: always; box-shadow: 0 2px 10px rgba(0,0,0,0.15); position: relative; font-size: 11pt; color: #000; }
.page:last-child { page-break-after: auto; }
.header-row { display: flex; align-items: center; gap: 14px; padding-bottom: 8px; border-bottom: 2px dotted #2c5f8d; }
.logo-img { width: 85px; height: 85px; object-fit: contain; flex-shrink: 0; }
.company-info { flex: 1; }
.company-name { font-size: 20pt; font-weight: bold; color: #2c5f8d; margin-bottom: 2px; }
.company-addr { font-size: 11pt; color: #444; }
.signature-box { width: 90px; height: 70px; border: 1.5px solid #2c5f8d; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; }
.signature-box .emp-id-label { font-size: 9pt; color: #666; margin-bottom: 2px; }
.signature-box .emp-id-value { font-size: 18pt; font-weight: bold; color: #1a5276; letter-spacing: 1px; }
.emp-info-row { display: flex; gap: 20px; padding: 8px 4px; align-items: center; font-size: 12pt; }
.emp-info-row .label { font-weight: 500; }
.emp-info-row .value { background: #e8f0f7; padding: 2px 10px; min-width: 180px; border-bottom: 1px solid #2c5f8d; min-height: 24px; }
.title-bar { background: #d4e6f1; text-align: center; padding: 6px; font-size: 16pt; font-weight: bold; color: #1a5276; font-style: italic; border: 1px solid #85c1e9; margin-bottom: 2px; }
.deco { text-align: center; color: #2c5f8d; font-size: 8pt; letter-spacing: 2px; margin: 2px 0; }
table.main { width: 100%; border-collapse: collapse; font-size: 11pt; }
table.main th, table.main td { border: 1px solid #333; padding: 3px 5px; text-align: center; }
table.main thead th { background: #f5f5f5; font-weight: 600; padding: 5px 3px; }
table.main td.num { text-align: right; padding-right: 6px; }
table.main td.month { text-align: center; font-weight: 500; background: #fafafa; }
table.main .net-col { background: #e8f5e9; font-weight: 600; }
table.main .sub-header { background: #e8f0f7; font-weight: 600; font-size: 10pt; }
table.main tr.summary-row { background: #fff8dc; font-weight: bold; }
table.main tr.bonus-row { background: #d5f5e3; font-weight: bold; font-style: italic; }
table.main tr.bonus-row td.bonus-label { text-align: center; letter-spacing: 3px; background: #a9dfbf; color: #1e8449; }
.arrow { color: #2c5f8d; font-size: 13pt; }

.page.data-only .header-row,
.page.data-only .emp-info-row,
.page.data-only .title-bar,
.page.data-only .deco,
.page.data-only table.main thead,
.page.data-only table.main tr.summary-row,
.page.data-only table.main tr.bonus-row td.bonus-label,
.page.data-only table.main tr.bonus-row .arrow { visibility: hidden; }
.page.data-only table.main th,
.page.data-only table.main td { border-color: transparent !important; background: transparent !important; }
.page.data-only table.main td.row-active { background: transparent !important; }
.page.data-only table.main td.row-inactive * { visibility: hidden !important; }
.page.data-only table.main td.row-inactive { visibility: hidden !important; }
.page.data-only table.main tr.summary-row td { visibility: hidden !important; }
.page.data-only table.main tr.bonus-row,
.page.data-only table.main tr.bonus-row td,
.page.data-only table.main tr.bonus-row .net-col { background: transparent !important; background-color: transparent !important; }
.page.data-only table.main tr.bonus-row.bonus-inactive td { visibility: hidden !important; }
.page.data-only table.main .net-col { background: transparent !important; background-color: transparent !important; }

@media print {
  body { background: white; padding: 0; }
  .toolbar { display: none; }
  .page { box-shadow: none; margin: 0; width: 100%; height: auto; min-height: 19.5cm; }
  .page-inner { transform: translate(var(--offset-x, 0mm), var(--offset-y, 0mm)); }
}
</style>
</head><body>
<div class="toolbar">
  <div class="toolbar-info" id="modeInfo">กำลังโหลด...</div>
  <div class="toolbar-buttons">
    <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
    <button class="btn-close" onclick="window.close()">❌ ปิด</button>
  </div>
</div>
<div id="pages"><div style="text-align:center; padding:60px; color:#666;">⏳ กำลังโหลดข้อมูล...</div></div>
\x3Cscript>
const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function formatNum(n) { if (!n || isNaN(n) || n === 0) return ''; return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function salaryKey(e, y, m) { return e + '_' + y + '_' + m; }
function bonusKey(e, y) { return e + '_' + y; }
function renderPage(emp, year, salaries, bonuses, config, logo, mode, selectedMonths, includeBonus) {
  const activeMonths = new Set(selectedMonths || [1,2,3,4,5,6,7,8,9,10,11,12]);
  const isDataOnly = mode === 'data-only';
  
  let sums = { salary:0, otherIncome:0, total:0, sso:0, tax:0, pvd:0, pvdEmployer:0, net:0 };
  for (let m = 1; m <= 12; m++) {
    if (!activeMonths.has(m)) continue;  // รวมเฉพาะเดือนที่เลือก — กันยอดเพี้ยนตอนพิมพ์กลางปี
    const s = salaries[salaryKey(emp.empId, year, m)];
    if (s) {
      sums.salary += Number(s.salary) || 0;
      sums.otherIncome += Number(s.otherIncome) || 0;
      sums.total += (Number(s.salary)||0) + (Number(s.otherIncome)||0);
      sums.sso += Number(s.sso) || 0;
      sums.tax += Number(s.tax) || 0;
      sums.pvd += Number(s.pvd) || 0;
      sums.pvdEmployer += Number(s.pvdEmployer) || 0;
      sums.net += (Number(s.salary)||0) + (Number(s.otherIncome)||0) - (Number(s.sso)||0) - (Number(s.tax)||0) - (Number(s.pvd)||0);
    }
  }
  let monthRows = '';
  for (let m = 1; m <= 12; m++) {
    const isActive = activeMonths.has(m);
    const s = salaries[salaryKey(emp.empId, year, m)] || {};
    const salary = Number(s.salary) || 0;
    const otherIncome = Number(s.otherIncome) || 0;
    const total = salary + otherIncome;
    const sso = Number(s.sso) || 0;
    const tax = Number(s.tax) || 0;
    const pvd = Number(s.pvd) || 0;
    const pvdEmployer = Number(s.pvdEmployer) || 0;
    const net = total - sso - tax - pvd;
    
    const rowClass = isActive ? 'row-active' : 'row-inactive';
    const cellCls = 'num ' + rowClass;
    // เดือนที่ไม่เลือก → เว้นว่าง ไม่แสดงตัวเลข (กันเลขเดือนที่ไม่ต้องการโผล่)
    const f = (v) => isActive ? formatNum(v) : '';
    
    monthRows += '<tr><td class="month ' + rowClass + '">' + MONTHS[m-1] + '</td>' +
      '<td class="' + cellCls + '">' + f(salary) + '</td>' +
      '<td class="' + cellCls + '">' + f(otherIncome) + '</td>' +
      '<td class="' + cellCls + '">' + f(total) + '</td>' +
      '<td class="' + cellCls + '">' + f(sso) + '</td>' +
      '<td class="' + cellCls + '">' + f(tax) + '</td>' +
      '<td class="' + cellCls + '">' + f(pvd) + '</td>' +
      '<td class="num net-col ' + rowClass + '">' + f(net) + '</td>' +
      '<td class="' + cellCls + '">' + f(pvdEmployer) + '</td>' +
      '<td class="' + rowClass + '">' + (isActive ? (s.receivedDate || '') : '') + '</td>' +
      '<td class="' + rowClass + '"></td></tr>';
  }
  const bonus = bonuses[bonusKey(emp.empId, year)] || {};
  const bonusAmount = Number(bonus.amount) || 0;
  
  const pageCls = 'page' + (isDataOnly ? ' data-only' : '');
  const bonusRowCls = 'bonus-row' + (isDataOnly && !includeBonus ? ' bonus-inactive' : '');
  
  return '<div class="' + pageCls + '"><div class="page-inner"><div class="header-row"><img class="logo-img" src="' + logo + '"><div class="company-info"><div class="company-name">' + config.COMPANY_NAME + '</div><div class="company-addr">' + config.COMPANY_ADDRESS + ' &nbsp;&nbsp; ' + config.COMPANY_TEL + '</div></div><div class="signature-box"><div class="emp-id-label">รหัสพนักงาน</div><div class="emp-id-value">' + (emp.empId || '') + '</div></div></div><div class="emp-info-row"><span class="label">ชื่อ-สกุล</span><span class="value">' + (emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || '') + '</span><span class="label">เลขที่บัตรประชาชน</span><span class="value">' + (emp.idCard || '') + '</span><span class="label">วันที่เริ่มงาน</span><span class="value">' + (emp.startDate || '') + '</span></div><div class="title-bar">ใบสำคัญจ่ายเงินเดือน ประจำปี ' + year + '</div><div class="deco">$$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$</div><table class="main"><thead><tr><th rowspan="2" style="width:8%">เดือน</th><th colspan="2" style="width:16%">รายการรับ +</th><th rowspan="2" style="width:8%">รวม =</th><th colspan="3" style="width:22%">รายการหัก -</th><th rowspan="2" style="width:11%; background:#d5f5e3">**รับสุทธิ**</th><th rowspan="2" style="width:8%">PVD นจ.</th><th rowspan="2" style="width:9%">ว.ด.ป.<br>ที่รับเงิน</th><th rowspan="2" style="width:8%">ลงชื่อ<br>ผู้รับเงิน</th></tr><tr class="sub-header"><th>เงินเดือน</th><th>รายได้อื่น</th><th>SSO ลจ.</th><th>W/H TAX</th><th>PVD ลจ.</th></tr></thead><tbody>' + monthRows + '<tr class="summary-row"><td class="month"><strong>สรุปรวม</strong></td><td class="num">' + formatNum(sums.salary) + '</td><td class="num">' + formatNum(sums.otherIncome) + '</td><td class="num">' + formatNum(sums.total) + '</td><td class="num">' + formatNum(sums.sso) + '</td><td class="num">' + formatNum(sums.tax) + '</td><td class="num">' + formatNum(sums.pvd) + '</td><td class="num net-col">' + formatNum(sums.net) + '</td><td class="num">' + formatNum(sums.pvdEmployer) + '</td><td colspan="2"></td></tr><tr class="' + bonusRowCls + '"><td colspan="4" class="bonus-label">***** BONUS *****</td><td colspan="3"></td><td class="num net-col">' + formatNum(bonusAmount) + '</td><td></td><td>' + (bonus.receivedDate || '') + '</td><td></td></tr></tbody></table><div class="deco" style="margin-top:4px">$$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$ $$</div></div></div>';
}
function doRender() {
  if (!window.PRINT_DATA) return;
  const d = window.PRINT_DATA;
  const mode = d.params.mode || 'full';
  const selectedMonths = d.params.selectedMonths || [1,2,3,4,5,6,7,8,9,10,11,12];
  const includeBonus = d.params.includeBonus !== undefined ? d.params.includeBonus : true;
  const offsetX = d.params.offsetX || 0;
  const offsetY = d.params.offsetY || 0;
  
  const html = d.params.emps.map(emp => renderPage(emp, d.params.year, d.salaries, d.bonuses, d.config, d.logo, mode, selectedMonths, includeBonus)).join('');
  document.getElementById('pages').innerHTML = html || '<div style="text-align:center; padding:60px; color:#666;">ไม่พบข้อมูล</div>';
  
  document.documentElement.style.setProperty('--offset-x', offsetX + 'mm');
  document.documentElement.style.setProperty('--offset-y', offsetY + 'mm');
  
  const info = document.getElementById('modeInfo');
  if (mode === 'data-only') {
    const monthNames = selectedMonths.map(m => MONTHS[m-1]).join(', ');
    const bonusTxt = includeBonus ? ' + BONUS' : '';
    info.innerHTML = '📌 โหมด: <b>พิมพ์เฉพาะข้อมูล</b> (บนใบเดิม) · เดือน: <b>' + (monthNames || '(ไม่มี)') + bonusTxt + '</b> · Offset: ' + offsetX + 'mm, ' + offsetY + 'mm';
  } else {
    info.innerHTML = '📄 โหมด: <b>พิมพ์เต็มใบ</b> (กระดาษเปล่า)';
  }
  document.title = 'ใบสำคัญจ่ายเงินเดือน ' + d.params.year;
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', doRender);
} else {
  doRender();
}
\x3C/script></body></html>`;

const PRINT_SLIP_HTML = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8">
<title>สลิปเงินเดือน</title>
<style>
@page { size: A4 portrait; margin: 0.5cm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Sarabun', 'TH Sarabun New', 'Tahoma', sans-serif; background: #f0f0f0; padding: 20px; font-size: 10pt; }
.toolbar { max-width: 900px; margin: 0 auto 20px; background: white; padding: 12px 20px; border-radius: 6px; display: flex; gap: 10px; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-wrap: wrap; }
.toolbar button { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-print { background: #27ae60; color: white; }
.btn-close { background: #95a5a6; color: white; }
.page { width: 21cm; min-height: 29.7cm; background: white; padding: 0.5cm 0.4cm; margin: 0 auto 10px; page-break-after: always; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
.page:last-child { page-break-after: auto; }

/* === Slip card: 1/3 of A4 portrait (~9.7cm) === */
.slip { 
  padding: 0.4cm 0.5cm; 
  margin-bottom: 0.35cm; 
  height: 9.2cm;
  border: none;
  position: relative; 
  page-break-inside: avoid;
  background: #fff;
  box-shadow: 0 0 0 1px #e1e8ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.slip-head { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  border-bottom: 2px solid #1a5276; 
  padding-bottom: 6px; 
  margin-bottom: 7px; 
}
.slip-logo { width: 42px; height: 42px; flex-shrink: 0; object-fit: contain; }
.slip-brand { flex: 1; }
.slip-company { font-size: 12.5pt; font-weight: 700; color: #1a5276; line-height: 1.15; letter-spacing: -0.2px; }
.slip-addr { font-size: 8.5pt; color: #566573; line-height: 1.25; margin-top: 1px; }
.slip-title-box { 
  background: linear-gradient(135deg, #1a5276 0%, #2874a6 100%); 
  color: white; 
  padding: 6px 12px; 
  border-radius: 6px; 
  text-align: center; 
  min-width: 120px; 
  box-shadow: 0 1px 3px rgba(26,82,118,0.25);
}
.slip-title-box .ttl { font-size: 11.5pt; font-weight: 700; letter-spacing: 1.5px; }
.slip-title-box .period { font-size: 9pt; margin-top: 2px; opacity: 0.95; }

.slip-info { 
  display: grid; 
  grid-template-columns: auto 1fr auto 1fr; 
  gap: 3px 14px; 
  font-size: 9.5pt; 
  margin-bottom: 7px; 
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 5px;
  border-left: 3px solid #1a5276;
}
.slip-info .label { color: #1a5276; font-weight: 600; white-space: nowrap; }
.slip-info .value { font-weight: 500; color: #1a1a1a; }

.slip-table { 
  width: 100%; 
  border-collapse: separate; 
  border-spacing: 0;
  font-size: 9pt; 
  flex: 1;
}
.slip-table th, .slip-table td { 
  border: 1px solid #d5dde3; 
  padding: 5px 6px; 
  text-align: center; 
}
.slip-table thead th { 
  background: #eef4f9; 
  color: #1a5276; 
  font-weight: 700; 
  font-size: 9pt; 
  padding: 5px 4px;
  letter-spacing: 0.3px;
}
.slip-table .hdr-plus { background: #e8f7ee !important; color: #176f3d; }
.slip-table .hdr-minus { background: #fde9e9 !important; color: #a93226; }
.slip-table .hdr-net { 
  background: linear-gradient(135deg, #1e8449 0%, #27ae60 100%) !important; 
  color: white !important; 
  font-size: 10pt !important;
}

.slip-table td.num { 
  text-align: right; 
  font-family: 'Consolas','Monaco',monospace; 
  font-size: 10pt; 
  font-variant-numeric: tabular-nums;
  padding: 6px 8px;
}
.slip-table td.net-value { 
  background: linear-gradient(135deg, #e8f7ee 0%, #d5f5e3 100%);
  font-size: 15pt; 
  font-weight: 700; 
  color: #176f3d; 
  vertical-align: middle;
  letter-spacing: -0.3px;
}

.slip-table .emp-contrib td { 
  background: #fafbfc; 
  font-size: 8.5pt; 
  color: #6c7680; 
  padding: 4px 6px; 
  font-style: italic; 
}
.slip-table .emp-contrib td.left-text { 
  text-align: left; 
  padding-left: 10px; 
  font-weight: 600; 
  color: #1a5276; 
  font-style: normal;
}

.slip-table .text-amount-row td { 
  text-align: center; 
  padding: 5px; 
  font-size: 9.5pt; 
  color: #1a5276; 
  font-weight: 500; 
  font-style: italic;
  background: #f8fafc;
  border-top: 2px solid #1a5276;
}

.divider-line { 
  border-top: 1.5px dashed #95a5a6; 
  margin: 0.12cm 0 0.22cm 0; 
  position: relative;
}
.divider-line::before {
  content: '✂';
  position: absolute;
  top: -10px;
  left: 20px;
  background: #f0f0f0;
  padding: 0 6px;
  color: #7f8c8d;
  font-size: 12pt;
}

.page.data-only .slip { box-shadow: none; }
.page.data-only .slip-head,
.page.data-only .slip-info .label,
.page.data-only .slip-logo,
.page.data-only .slip-title-box,
.page.data-only .slip-company,
.page.data-only .slip-addr,
.page.data-only .slip-table thead,
.page.data-only .divider-line { visibility: hidden; }
.page.data-only .slip-table th,
.page.data-only .slip-table td { border-color: transparent !important; background: transparent !important; }
.page.data-only .slip-table .emp-contrib td { visibility: hidden; }
.page.data-only .slip-info { background: transparent; border-left: none; }

@media print {
  body { background: white; padding: 0; }
  .toolbar { display: none; }
  .page { box-shadow: none; margin: 0; padding: 0.4cm 0.35cm; width: 100%; min-height: auto; }
  .page { transform: translate(var(--offset-x, 0mm), var(--offset-y, 0mm)); }
  .slip { box-shadow: 0 0 0 1px #d5dde3; }
}
</style>
</head><body>
<div class="toolbar">
  <div class="toolbar-info" id="modeInfo" style="font-size: 13px; color: #555;">กำลังโหลด...</div>
  <div style="display:flex; gap: 10px;">
    <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
    <button class="btn-close" onclick="window.close()">❌ ปิด</button>
  </div>
</div>
<div id="pages"><div style="text-align:center; padding:60px; color:#666;">⏳ กำลังโหลดข้อมูล...</div></div>
\x3Cscript>
const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function formatNum(n) { if (!n || isNaN(n) || n === 0) return '-'; return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function salaryKey(e, y, m) { return e + '_' + y + '_' + m; }
function numberToThaiText(num) {
  if (!num || num === 0 || isNaN(num)) return 'ศูนย์บาทถ้วน';
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  function readNum(s) { let r = ''; const l = s.length; for (let i = 0; i < l; i++) { const d = parseInt(s[i]); const p = l - i - 1; if (d === 0) continue; if (p === 0 && d === 1 && l > 1) r += 'เอ็ด'; else if (p === 1 && d === 2) r += 'ยี่' + positions[p]; else if (p === 1 && d === 1) r += positions[p]; else r += digits[d] + positions[p]; } return r; }
  function convert(n) { if (n === 0) return 'ศูนย์'; let r = ''; const m = Math.floor(n / 1000000); const rest = n % 1000000; if (m > 0) r += convert(m) + 'ล้าน'; if (rest > 0) r += readNum(String(rest)); return r; }
  const ro = Math.round(num * 100) / 100;
  const baht = Math.floor(ro);
  const satang = Math.round((ro - baht) * 100);
  let text = '';
  if (baht > 0) text += convert(baht) + 'บาท';
  if (satang > 0) text += convert(satang) + 'สตางค์'; else text += 'ถ้วน';
  return text || 'ศูนย์บาทถ้วน';
}
function renderSlip(emp, year, month, salaries, config, logo) {
  const s = salaries[salaryKey(emp.empId, year, month)] || {};
  const isMyanmar = (emp.group || '').includes('พม่า');
  
  const salary = Number(s.salary) || 0;
  const otherIncome = Number(s.otherIncome) || 0;
  const sso = Number(s.sso) || 0;
  const ssoEmployer = Number(s.ssoEmployer) || 0;
  const tax = Number(s.tax) || 0;
  const pvd = Number(s.pvd) || 0;
  const pvdEmployer = Number(s.pvdEmployer) || 0;
  // Myanmar-specific
  const bonus = Number(s.bonus) || 0;
  const ot = Number(s.ot) || 0;
  const holiday = Number(s.holiday) || 0;
  const debt = Number(s.debt) || 0;
  // Payment
  const cash = Number(s.cash) || 0;
  const bankRaw = s.bank || s.receivedBy || '';
  const bank = typeof bankRaw === 'number' ? bankRaw : (parseFloat(bankRaw) || 0);
  
  // Net calculation
  const net = isMyanmar 
    ? (salary + bonus + ot - sso - holiday - debt)
    : (salary + otherIncome - sso - tax - pvd);
  
  const monthName = MONTHS[month - 1];
  const yearShort = String(year).slice(-2);
  const empName = (emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || '');
  
  let html = '<div class="slip">';
  
  // Head: logo + company + title
  html += '<div class="slip-head">';
  html += '<img class="slip-logo" src="' + logo + '">';
  html += '<div class="slip-brand">';
  html += '<div class="slip-company">' + config.COMPANY_NAME + '</div>';
  html += '<div class="slip-addr">' + config.COMPANY_ADDRESS + ' · โทร ' + config.COMPANY_TEL + '</div>';
  html += '</div>';
  html += '<div class="slip-title-box"><div class="ttl">PAY SLIP</div><div class="period">' + monthName + ' ' + yearShort + '</div></div>';
  html += '</div>';
  
  // Employee info
  html += '<div class="slip-info">';
  html += '<span class="label">รหัส :</span><span class="value">' + (emp.empId || '-') + '</span>';
  html += '<span class="label">ตำแหน่ง :</span><span class="value">' + (emp.position || '-') + '</span>';
  html += '<span class="label">ชื่อ :</span><span class="value">' + empName + '</span>';
  html += '<span class="label">วันจ่าย :</span><span class="value">' + (s.receivedDate || '-') + '</span>';
  html += '</div>';
  
  // Main table
  html += '<table class="slip-table">';
  
  if (isMyanmar) {
    // === MYANMAR LAYOUT ===
    // รายรับ (3): รายได้ + พิเศษ + OT
    // รายหัก (3): SSO + หนี้ + หยุด
    // รับสุทธิ
    html += '<thead>';
    html += '<tr>';
    html += '<th colspan="3" class="hdr-plus">รายรับ (+)</th>';
    html += '<th colspan="3" class="hdr-minus">รายการหัก (−)</th>';
    html += '<th rowspan="2" class="hdr-net" style="width:20%;">รับสุทธิ</th>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>รายได้</th><th>พิเศษ</th><th>OT</th>';
    html += '<th>SSO ลจ.</th><th>หนี้อื่นๆ</th><th>หยุด</th>';
    html += '</tr>';
    html += '</thead><tbody>';
    html += '<tr>';
    html += '<td class="num">' + formatNum(salary) + '</td>';
    html += '<td class="num">' + formatNum(bonus) + '</td>';
    html += '<td class="num">' + formatNum(ot) + '</td>';
    html += '<td class="num">' + formatNum(sso) + '</td>';
    html += '<td class="num">' + formatNum(debt) + '</td>';
    html += '<td class="num">' + formatNum(holiday) + '</td>';
    html += '<td class="net-value">' + formatNum(net) + '</td>';
    html += '</tr>';
    // Employer contribution row
    html += '<tr class="emp-contrib">';
    html += '<td class="left-text" colspan="3">** นายจ้างสมทบให้ **</td>';
    html += '<td>SSO นจ.: ' + formatNum(ssoEmployer) + '</td>';
    html += '<td colspan="2">เงินสด ' + formatNum(cash) + ' · โอน ' + formatNum(bank) + '</td>';
    html += '<td></td>';
    html += '</tr>';
  } else {
    // === THAI LAYOUT ===
    // รายรับ (2): เงินเดือน + รายได้อื่น
    // รายหัก (3): SSO + W/H TAX + PVD ลจ.
    // รับสุทธิ
    html += '<thead>';
    html += '<tr>';
    html += '<th colspan="2" class="hdr-plus">รายรับ (+)</th>';
    html += '<th colspan="3" class="hdr-minus">รายการหัก (−)</th>';
    html += '<th rowspan="2" class="hdr-net" style="width:20%;">รับสุทธิ</th>';
    html += '</tr>';
    html += '<tr>';
    html += '<th>เงินเดือน</th><th>รายได้อื่น</th>';
    html += '<th>SSO ลจ.</th><th>W/H TAX</th><th>PVD ลจ.</th>';
    html += '</tr>';
    html += '</thead><tbody>';
    html += '<tr>';
    html += '<td class="num">' + formatNum(salary) + '</td>';
    html += '<td class="num">' + formatNum(otherIncome) + '</td>';
    html += '<td class="num">' + formatNum(sso) + '</td>';
    html += '<td class="num">' + formatNum(tax) + '</td>';
    html += '<td class="num">' + formatNum(pvd) + '</td>';
    html += '<td class="net-value">' + formatNum(net) + '</td>';
    html += '</tr>';
    // Employer contribution row
    html += '<tr class="emp-contrib">';
    html += '<td class="left-text" colspan="2">** นายจ้างสมทบให้ **</td>';
    html += '<td>SSO นจ.: ' + formatNum(ssoEmployer) + '</td>';
    html += '<td>—</td>';
    html += '<td>PVD นจ.: ' + formatNum(pvdEmployer) + '</td>';
    html += '<td></td>';
    html += '</tr>';
  }
  
  // Amount in words
  html += '<tr class="text-amount-row"><td colspan="7">(' + numberToThaiText(net) + ')</td></tr>';
  
  html += '</tbody></table>';
  html += '</div>';
  html += '<div class="divider-line"></div>';
  
  return html;
}
function doRender() {
  if (!window.PRINT_DATA) return;
  const d = window.PRINT_DATA;
  const emps = d.params.emps;
  const mode = d.params.mode || 'full';
  const offsetX = d.params.offsetX || 0;
  const offsetY = d.params.offsetY || 0;
  const pageCls = 'page' + (mode === 'data-only' ? ' data-only' : '');
  
  let html = '';
  for (let i = 0; i < emps.length; i += 3) {
    html += '<div class="' + pageCls + '">';
    for (let j = i; j < Math.min(i + 3, emps.length); j++) {
      html += renderSlip(emps[j], d.params.year, d.params.month, d.salaries, d.config, d.logo);
    }
    html += '</div>';
  }
  document.getElementById('pages').innerHTML = html || '<div style="text-align:center; padding:60px; color:#666;">ไม่พบข้อมูล</div>';
  
  document.documentElement.style.setProperty('--offset-x', offsetX + 'mm');
  document.documentElement.style.setProperty('--offset-y', offsetY + 'mm');
  
  const info = document.getElementById('modeInfo');
  if (mode === 'data-only') {
    info.innerHTML = '📌 โหมด: <b>พิมพ์เฉพาะข้อมูล</b> (บนใบเดิม) · ' + MONTHS[d.params.month-1] + ' · Offset: ' + offsetX + 'mm, ' + offsetY + 'mm';
  } else {
    info.innerHTML = '📄 โหมด: <b>พิมพ์เต็มใบ</b> · ' + MONTHS[d.params.month-1] + ' ' + d.params.year;
  }
  document.title = 'สลิปเงินเดือน ' + MONTHS[d.params.month - 1] + ' ' + d.params.year;
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', doRender);
} else {
  doRender();
}
\x3C/script></body></html>`;

/* ============================================================
 * 50 ทวิ — หนังสือรับรองการหักภาษี ณ ที่จ่าย
 * ============================================================ */
function printWhtCert(multi) {
  const group = document.getElementById('printWhtGroup').value;
  const year = parseInt(document.getElementById('printWhtYear').value);
  const empId = document.getElementById('printWhtEmp').value;
  const issueDateRaw = document.getElementById('printWhtIssueDate').value.trim();
  const startNo = parseInt(document.getElementById('printWhtStartNo').value) || 1;
  
  if (!multi && !empId) {
    toast('กรุณาเลือกพนักงาน หรือคลิก "พิมพ์ทั้งกลุ่ม"', 'error');
    return;
  }
  
  // หาพนักงานที่ active ในปีนั้น
  let emps;
  if (multi) {
    emps = state.data.employees.filter(e => e.group === group && isActiveInYear(e, year));
    // กรองเฉพาะคนที่มีเงินได้ในปีนั้น (salary > 0 ใน 1 เดือนขึ้นไป)
    emps = emps.filter(e => {
      for (let m = 1; m <= 12; m++) {
        const s = state.data.salaries[salaryKey(e.empId, year, m)];
        if (s && ((Number(s.salary) || 0) > 0 || (Number(s.otherIncome) || 0) > 0)) return true;
      }
      const bk = bonusKey(e.empId, year);
      if (state.data.bonuses[bk] && Number(state.data.bonuses[bk].amount) > 0) return true;
      return false;
    });
  } else {
    const emp = state.data.employees.find(e => e.empId === empId);
    emps = emp ? [emp] : [];
  }
  
  if (emps.length === 0) {
    toast('ไม่พบข้อมูลพนักงาน หรือไม่มีเงินได้ในปีนี้', 'error');
    return;
  }
  
  sortEmployees(emps);
  
  // Default วันออกหนังสือ = 30/12/ปีภาษี
  const issueDate = issueDateRaw || ('30/12/' + year);
  
  openPrintWindow('wht', { emps, year, issueDate, startNo });
}

const PRINT_WHT_HTML = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8">
<title>หนังสือรับรองการหักภาษี ณ ที่จ่าย</title>
<style>
@page { size: A4 portrait; margin: 0.7cm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Sarabun', 'TH Sarabun New', 'Tahoma', sans-serif; background: #f0f0f0; padding: 20px; font-size: 11pt; color: #000; }
.toolbar { max-width: 900px; margin: 0 auto 20px; background: white; padding: 12px 20px; border-radius: 6px; display: flex; gap: 10px; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-wrap: wrap; }
.toolbar button { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-print { background: #27ae60; color: white; }
.btn-close { background: #95a5a6; color: white; }

.wht-page { width: 21cm; min-height: 29.7cm; background: white; padding: 0.8cm 0.9cm; margin: 0 auto 10px; page-break-after: always; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
.wht-page:last-child { page-break-after: auto; }

.wht-frame { border: 1.5px solid #000; padding: 0; font-size: 10.5pt; line-height: 1.3; }

/* Title bar */
.wht-title { display: flex; align-items: center; border-bottom: 1px solid #000; padding: 5px 10px; }
.wht-title .t-text { flex: 1; text-align: center; font-size: 12.5pt; font-weight: 700; }
.wht-title .t-no { display: flex; align-items: center; gap: 8px; font-size: 10.5pt; }
.wht-title .t-no-box { border: 1px solid #000; padding: 2px 10px; min-width: 42px; text-align: center; background: #d4ecfa; font-weight: 700; }

/* Party blocks (payer/payee) */
.wht-party { display: flex; border-bottom: 1px solid #000; }
.wht-party .col-info { flex: 1; padding: 5px 10px; border-right: 1px solid #000; min-width: 0; }
.wht-party .col-tax { width: 265px; padding: 5px 10px; flex-shrink: 0; }
.wht-party .role { font-size: 10pt; }
.wht-party .row { display: flex; align-items: baseline; gap: 6px; margin-top: 1px; }
.wht-party .row .lbl { width: 28px; font-size: 10pt; color: #333; flex-shrink: 0; }
.wht-party .row .val { flex: 1; font-size: 10.5pt; padding-left: 6px; }
.wht-party .col-tax .title { font-size: 10pt; text-align: center; }
.wht-party .col-tax .box { border: 1px solid #000; padding: 3px 6px; text-align: center; font-size: 11pt; font-weight: 600; margin-top: 3px; font-family: 'Consolas', monospace; letter-spacing: 1px; white-space: nowrap; overflow: hidden; }

/* form number list */
.wht-forms { padding: 4px 10px; border-bottom: 1px solid #000; font-size: 10pt; }
.wht-forms .row1, .wht-forms .row2 { display: flex; gap: 10px; flex-wrap: wrap; }
.wht-forms .row1 { margin-bottom: 2px; }
.wht-forms .item { display: inline-flex; align-items: center; gap: 4px; }
.wht-forms .check { display: inline-block; width: 13px; height: 13px; border: 1px solid #000; text-align: center; line-height: 12px; font-size: 10pt; font-weight: bold; }
.wht-forms .lead { min-width: 70px; }

/* Main table */
.wht-tbl { width: 100%; border-collapse: collapse; }
.wht-tbl th, .wht-tbl td { border: 1px solid #000; padding: 2.5px 8px; vertical-align: top; font-size: 10pt; }
.wht-tbl thead th { background: #d4ecfa; font-weight: 600; text-align: center; font-size: 10pt; line-height: 1.2; padding: 4px 4px; }
.wht-tbl .type-col { width: 50%; }
.wht-tbl .year-col { width: 13%; text-align: center; }
.wht-tbl .amt-col { width: 20%; text-align: right; font-family: 'Consolas', monospace; }
.wht-tbl .tax-col { width: 17%; text-align: right; font-family: 'Consolas', monospace; }
.wht-tbl td.type-col { font-size: 10pt; }
.wht-tbl .sub { padding-left: 20px; }
.wht-tbl .sub2 { padding-left: 34px; }
.wht-tbl .total-row td { background: #fafafa; font-weight: 600; }
.wht-tbl .words-row td { background: #d4ecfa; text-align: right; font-weight: 600; padding: 4px 10px; }
.wht-tbl .words-row .words-val { background: #d4ecfa; text-align: center; font-style: italic; font-weight: 700; color: #1a5276; }

/* Fund / SSO block */
.wht-fund { border-top: 1px solid #000; padding: 4px 10px; font-size: 10pt; }
.wht-fund .row { display: flex; align-items: center; gap: 6px; padding: 2px 0; }
.wht-fund .lbl { flex: 0 0 auto; }
.wht-fund .dashes { flex: 1; border-bottom: 1px dotted #666; min-height: 1em; text-align: center; font-weight: 500; }
.wht-fund .amt { flex: 0 0 auto; text-align: right; font-weight: 600; font-family: 'Consolas', monospace; }
.wht-fund .unit { flex: 0 0 auto; }

.wht-sso { border-top: 1px solid #000; padding: 4px 10px; font-size: 10pt; }
.wht-sso .sso-amt-row { display: flex; align-items: center; gap: 6px; padding: 2px 0; }
.wht-sso .two-col { display: flex; gap: 20px; margin-top: 3px; }
.wht-sso .two-col .col { flex: 1; text-align: center; }
.wht-sso .two-col .col .hdr { font-size: 10pt; }
.wht-sso .two-col .col .val { border: 1px solid #000; padding: 3px 8px; margin-top: 3px; font-family: 'Consolas', monospace; font-size: 10.5pt; letter-spacing: 1px; display: inline-block; min-width: 180px; text-align: center; }

/* Payer options */
.wht-payer { border-top: 1px solid #000; padding: 4px 10px; font-size: 10pt; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.wht-payer .lead { font-weight: 500; }

/* Certify */
.wht-cert { border-top: 1px solid #000; padding: 8px 10px; }
.wht-cert .certify { text-align: center; margin-bottom: 6px; font-size: 10.5pt; }
.wht-cert .sig-row { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 6px; font-size: 10.5pt; }
.wht-cert .sig-row .label { white-space: nowrap; }
.wht-cert .sig-row .sig { min-width: 220px; border-bottom: 1px dotted #000; text-align: center; padding-bottom: 2px; font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; font-size: 18pt; font-style: italic; font-weight: 600; color: #1a5276; letter-spacing: 1px; }
.wht-cert .date-row { display: flex; align-items: center; gap: 14px; padding-left: 30px; margin-top: 8px; font-size: 10.5pt; }
.wht-cert .date-row .dval { border-bottom: 1px dotted #000; min-width: 140px; text-align: center; padding: 0 10px 2px; font-weight: 500; }

/* Footer note */
.wht-note { padding: 4px 10px; font-size: 9.5pt; color: #333; border-top: 1px solid #000; }

@media print {
  body { background: white; padding: 0; }
  .toolbar { display: none; }
  .wht-page { box-shadow: none; margin: 0; padding: 0.4cm 0.5cm; width: 100%; min-height: auto; }
  .wht-frame { font-size: 9.5pt; line-height: 1.2; }
  .wht-title { padding: 3px 8px; }
  .wht-title .t-text { font-size: 11.5pt; }
  .wht-party { padding: 0; }
  .wht-party .col-info { padding: 3px 8px; }
  .wht-party .col-tax { padding: 3px 8px; }
  .wht-party .col-tax .box { font-size: 10pt; padding: 2px 4px; }
  .wht-forms { padding: 2px 8px; font-size: 9pt; }
  .wht-tbl th, .wht-tbl td { padding: 1.5px 6px; font-size: 9pt; }
  .wht-tbl thead th { padding: 3px 4px; font-size: 9pt; }
  .wht-fund, .wht-sso { padding: 2px 8px; font-size: 9pt; }
  .wht-fund .row, .wht-sso .sso-amt-row { padding: 1px 0; }
  .wht-sso .two-col { margin-top: 2px; }
  .wht-sso .two-col .col .val { font-size: 9.5pt; padding: 2px 6px; min-width: 160px; }
  .wht-payer { padding: 2px 8px; font-size: 9pt; }
  .wht-cert { padding: 5px 10px; }
  .wht-cert .certify { margin-bottom: 3px; font-size: 9.5pt; }
  .wht-cert .sig-row { margin-top: 3px; font-size: 9.5pt; }
  .wht-cert .sig-row .sig { font-size: 16pt; }
  .wht-cert .date-row { margin-top: 4px; font-size: 9.5pt; padding-left: 20px; }
  .wht-note { padding: 2px 8px; font-size: 8.5pt; }
}
</style>
</head><body>
<div class="toolbar">
  <div class="toolbar-info" id="modeInfo" style="font-size: 13px; color: #555;">กำลังโหลด...</div>
  <div style="display:flex; gap: 10px;">
    <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
    <button class="btn-close" onclick="window.close()">❌ ปิด</button>
  </div>
</div>
<div id="pages"><div style="text-align:center; padding:60px; color:#666;">⏳ กำลังโหลดข้อมูล...</div></div>
\x3Cscript>
const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function fmt2(n) { if (!n || isNaN(n) || n === 0) return '-'; return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function salaryKey(e, y, m) { return e + '_' + y + '_' + m; }
function bonusKey(e, y) { return e + '_' + y; }
function escapeHtml(s) { if (s===null||s===undefined) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function numberToThaiText(num) {
  if (!num || num === 0 || isNaN(num)) return 'ศูนย์บาทถ้วน';
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  function readNum(s) { let r = ''; const l = s.length; for (let i = 0; i < l; i++) { const d = parseInt(s[i]); const p = l - i - 1; if (d === 0) continue; if (p === 0 && d === 1 && l > 1) r += 'เอ็ด'; else if (p === 1 && d === 2) r += 'ยี่' + positions[p]; else if (p === 1 && d === 1) r += positions[p]; else r += digits[d] + positions[p]; } return r; }
  function convert(n) { if (n === 0) return 'ศูนย์'; let r = ''; const m = Math.floor(n / 1000000); const rest = n % 1000000; if (m > 0) r += convert(m) + 'ล้าน'; if (rest > 0) r += readNum(String(rest)); return r; }
  const ro = Math.round(num * 100) / 100;
  const baht = Math.floor(ro);
  const satang = Math.round((ro - baht) * 100);
  let text = '';
  if (baht > 0) text += convert(baht) + 'บาท';
  if (satang > 0) text += convert(satang) + 'สตางค์'; else text += 'ถ้วน';
  return text || 'ศูนย์บาทถ้วน';
}

function renderWhtCert(emp, year, salaries, bonuses, config, issueDate, runningNo) {
  // รวบรวมข้อมูลทั้งปี
  let salaryTotal = 0, otherTotal = 0, taxTotal = 0, pvdTotal = 0, ssoTotal = 0;
  for (let m = 1; m <= 12; m++) {
    const s = salaries[salaryKey(emp.empId, year, m)] || {};
    salaryTotal += Number(s.salary) || 0;
    otherTotal += Number(s.otherIncome) || 0;
    taxTotal += Number(s.tax) || 0;
    pvdTotal += Number(s.pvd) || 0;
    ssoTotal += Number(s.sso) || 0;
  }
  const bonus = bonuses[bonusKey(emp.empId, year)] || {};
  const bonusAmount = Number(bonus.amount) || 0;
  
  // เงินเดือนตามมาตรา 40(1) = salary + otherIncome + bonus
  const income40_1 = salaryTotal + otherTotal + bonusAmount;
  const grandTotal = income40_1;  // รวมเฉพาะประเภท 1 (ปกติ)
  const grandTax = taxTotal;
  
  const empName = (emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || '');
  const empAddr = emp.address || '';
  const empIdCard = emp.idCard || '';
  // SSO number: สำหรับคนไทยใช้เลขบัตร ปชช., พม่าใช้ idCard ที่กรอกไว้
  const empSsoNo = empIdCard;
  
  let h = '<div class="wht-page"><div class="wht-frame">';
  
  // Title
  h += '<div class="wht-title">';
  h += '<div class="t-text">หนังสือรับรองการหักภาษี ณ ที่จ่าย ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</div>';
  h += '<div class="t-no">ลำดับ<div class="t-no-box">' + runningNo + '</div></div>';
  h += '</div>';
  
  // Payer (บริษัท)
  h += '<div class="wht-party">';
  h += '<div class="col-info">';
  h += '<div class="role">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย :</div>';
  h += '<div class="row"><div class="lbl">ชื่อ</div><div class="val">' + escapeHtml(config.COMPANY_NAME) + '</div></div>';
  h += '<div class="row"><div class="lbl">ที่อยู่</div><div class="val">' + escapeHtml(config.COMPANY_ADDRESS) + '</div></div>';
  h += '</div>';
  h += '<div class="col-tax">';
  h += '<div class="title">เลขประจำตัวผู้เสียภาษีอากร</div>';
  h += '<div class="box">' + escapeHtml(config.COMPANY_TAX_ID || '') + '</div>';
  h += '</div>';
  h += '</div>';
  
  // Payee (พนักงาน)
  h += '<div class="wht-party">';
  h += '<div class="col-info">';
  h += '<div class="role">ผู้ถูกหักภาษี ณ ที่จ่าย :</div>';
  h += '<div class="row"><div class="lbl">ชื่อ</div><div class="val">' + escapeHtml(empName) + '</div></div>';
  h += '<div class="row"><div class="lbl">ที่อยู่</div><div class="val">' + escapeHtml(empAddr) + '</div></div>';
  h += '</div>';
  h += '<div class="col-tax">';
  h += '<div class="title">เลขประจำตัวผู้เสียภาษีอากร</div>';
  h += '<div class="box">' + escapeHtml(empIdCard) + '</div>';
  h += '</div>';
  h += '</div>';
  
  // Form numbers
  h += '<div class="wht-forms">';
  h += '<div class="row1">';
  h += '<span class="lead">ลำดับที่</span>';
  h += '<span class="item" style="margin-right:20px;">ในแบบ</span>';
  h += '<span class="item"><span class="check">✓</span>(1) ภ.ง.ด. 1 ก.</span>';
  h += '<span class="item"><span class="check"></span>(2) ภ.ง.ด. 1 ก. พิเศษ</span>';
  h += '<span class="item"><span class="check"></span>(3) ภ.ง.ด. 2</span>';
  h += '<span class="item"><span class="check"></span>(4) ภ.ง.ด. 3</span>';
  h += '</div>';
  h += '<div class="row2">';
  h += '<span style="min-width:110px; display:inline-block;"></span>';
  h += '<span class="item"><span class="check"></span>(5) ภ.ง.ด. 2 ก.</span>';
  h += '<span class="item"><span class="check"></span>(6) ภ.ง.ด. 3 ก.</span>';
  h += '<span class="item"><span class="check"></span>(7) ภ.ง.ด. 53</span>';
  h += '</div>';
  h += '</div>';
  
  // Main table
  h += '<table class="wht-tbl">';
  h += '<thead><tr>';
  h += '<th class="type-col">ประเภทเงินได้ที่จ่าย</th>';
  h += '<th class="year-col">วัน เดือน หรือ<br>ปีภาษีที่จ่าย</th>';
  h += '<th class="amt-col">จำนวนเงินที่จ่าย</th>';
  h += '<th class="tax-col">ภาษีที่หัก<br>และนำส่งไว้</th>';
  h += '</tr></thead><tbody>';
  
  // 1. เงินเดือน
  h += '<tr>';
  h += '<td class="type-col">1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)</td>';
  h += '<td class="year-col">' + year + '</td>';
  h += '<td class="amt-col">' + fmt2(income40_1) + '</td>';
  h += '<td class="tax-col">' + fmt2(taxTotal) + '</td>';
  h += '</tr>';
  
  // 2-6 = เว้นว่าง (สำหรับกรณีอื่นๆ)
  h += '<tr><td class="type-col">2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col">3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col">4. (1) ค่าดอกเบี้ย ฯลฯ ตามมาตรา 40 (4) (ก)</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col sub">(2) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40 (4) (ข) ที่จ่ายจาก</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col sub2">(ก) กิจการที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตราร้อยละ 30 ของกำไรสุทธิ</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col sub2">(ข) กิจการในเขตส่งเสริมการลงทุนตามมาตรา 35 (2) แห่งพระราชบัญญัติ<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ส่งเสริมการลงทุน พ.ศ.2520 ที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตรากึ่งหนึ่งของอัตราตาม (ก)</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col sub2">(ค) กิจการวิเทศธนกิจที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตราร้อยละ 10 ของกำไรสุทธิ</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col sub2">(ง) กิจการที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตราอื่นนอกจาก (ก)(ข) หรือ (ค)</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col">5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่ายตามคำสั่งกรมสรรพากรที่ออกตามมาตรา 3<br>เตรส เช่น ค่าซื้อพืชผลทางการเกษตร (ยางพารา มันสำปะหลัง ปอ ข้าว ฯลฯ)<br>รางวัลในการประกวด การแข่งขัน การชิงโชค ค่าแสดงภาพยนตร์ ร้องเพลง ดนตรี<br><u>ค่าจ้างทำของ</u> ค่าบริการ ค่าจ้างโฆษณา ค่าเช่า ฯลฯ</td><td></td><td></td><td></td></tr>';
  h += '<tr><td class="type-col">6. อื่น ๆ (ระบุ)</td><td></td><td></td><td></td></tr>';
  
  // Total
  h += '<tr class="total-row">';
  h += '<td colspan="2" style="text-align:right; padding-right:14px;">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>';
  h += '<td class="amt-col">' + fmt2(grandTotal) + '</td>';
  h += '<td class="tax-col">' + fmt2(grandTax) + '</td>';
  h += '</tr>';
  
  // Words
  h += '<tr class="words-row">';
  h += '<td colspan="2" style="text-align:right;">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)</td>';
  h += '<td colspan="2" class="words-val">(' + numberToThaiText(grandTax) + ')</td>';
  h += '</tr>';
  
  h += '</tbody></table>';
  
  // Fund block
  h += '<div class="wht-fund">';
  h += '<div class="row">';
  h += '<span class="lbl">เงินสะสมจ่ายเข้ากองทุนสำรองเลี้ยงชีพใบอนุญาตเลขที่</span>';
  h += '<span class="dashes" style="max-width:110px; flex:0 0 110px;">' + escapeHtml(config.PVD_LICENSE || '') + '</span>';
  h += '<span class="lbl">จำนวนเงิน</span>';
  h += '<span class="dashes">' + fmt2(pvdTotal) + '</span>';
  h += '<span class="unit">บาท</span>';
  h += '</div>';
  h += '<div class="row">';
  h += '<span class="lbl">เงินสะสมจ่ายเข้ากองทุนบำเหน็จบำนาญข้าราชการ เลขที่บัญชีกองทุน</span>';
  h += '<span class="dashes"></span>';
  h += '<span class="lbl">จำนวนเงิน</span>';
  h += '<span class="dashes"></span>';
  h += '<span class="unit">บาท</span>';
  h += '</div>';
  h += '</div>';
  
  // SSO block
  h += '<div class="wht-sso">';
  h += '<div class="sso-amt-row">';
  h += '<span class="lbl">เงินสมทบจ่ายเข้ากองทุนประกันสังคม จำนวนเงิน</span>';
  h += '<span class="dashes" style="max-width:150px; flex:0 0 150px;">' + fmt2(ssoTotal) + '</span>';
  h += '<span class="unit">บาท</span>';
  h += '</div>';
  h += '<div class="two-col">';
  h += '<div class="col"><div class="hdr">เลขที่บัญชีนายจ้าง</div><div class="val">' + escapeHtml(config.EMPLOYER_SSO_NO || '') + '</div></div>';
  h += '<div class="col"><div class="hdr">เลขที่บัตรประกันสังคม ของผู้ถูกหักภาษี ณ ที่จ่าย</div><div class="val">' + escapeHtml(empSsoNo) + '</div></div>';
  h += '</div>';
  h += '</div>';
  
  // Payer options
  h += '<div class="wht-payer">';
  h += '<span class="lead">ผู้จ่ายเงิน</span>';
  h += '<span><span class="check" style="display:inline-block; width:14px; height:14px; border:1px solid #000; text-align:center; line-height:13px; font-weight:bold;">✓</span> (1) หักภาษี ณ ที่จ่าย</span>';
  h += '<span><span class="check" style="display:inline-block; width:14px; height:14px; border:1px solid #000; text-align:center; line-height:13px;"></span> (2) ออกภาษีให้ตลอดไป</span>';
  h += '<span><span class="check" style="display:inline-block; width:14px; height:14px; border:1px solid #000; text-align:center; line-height:13px;"></span> (3) ออกใบภาษีให้ครั้งเดียว</span>';
  h += '<span><span class="check" style="display:inline-block; width:14px; height:14px; border:1px solid #000; text-align:center; line-height:13px;"></span> (4) อื่น ๆ (ระบุ)___________</span>';
  h += '</div>';
  
  // Certification
  h += '<div class="wht-cert">';
  h += '<div class="certify">ขอรับรองว่า ข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ</div>';
  h += '<div class="sig-row">';
  h += '<span class="label">ลงชื่อ</span>';
  h += '<span class="sig">' + escapeHtml(config.WHT_SIGNER_NAME || '') + '</span>';
  h += '<span class="label">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</span>';
  h += '</div>';
  h += '<div class="date-row">';
  h += '<span>วันที่ออกหนังสือรับรอง</span>';
  h += '<span class="dval">' + escapeHtml(issueDate) + '</span>';
  h += '</div>';
  h += '</div>';
  
  // Note
  h += '<div class="wht-note">';
  h += 'หมายเหตุ - ให้สามารถอ้างอิงหรือสอบยันกันได้ระหว่างลำดับที่ตามหนังสือรับรอง ฯ กับแบบยื่นรายการภาษีหัก ณ ที่จ่าย';
  h += '</div>';
  
  h += '</div></div>';  // close .wht-frame .wht-page
  
  return h;
}

function doRender() {
  if (!window.PRINT_DATA) return;
  const d = window.PRINT_DATA;
  const emps = d.params.emps;
  const startNo = d.params.startNo || 1;
  
  let html = '';
  emps.forEach((emp, i) => {
    html += renderWhtCert(emp, d.params.year, d.salaries, d.bonuses, d.config, d.params.issueDate, startNo + i);
  });
  document.getElementById('pages').innerHTML = html || '<div style="text-align:center; padding:60px; color:#666;">ไม่พบข้อมูล</div>';
  
  const info = document.getElementById('modeInfo');
  info.innerHTML = '📜 หนังสือรับรอง 50 ทวิ · ปีภาษี ' + d.params.year + ' · ' + emps.length + ' ฉบับ · ลำดับ ' + startNo + '-' + (startNo + emps.length - 1);
  document.title = 'หนังสือรับรอง 50 ทวิ ปี ' + d.params.year;
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', doRender);
} else {
  doRender();
}
\x3C/script></body></html>`;
