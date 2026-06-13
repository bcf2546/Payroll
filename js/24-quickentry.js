/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Quick Entry + Date Helpers + Draft */
/* ============================================================
 * QUICK ENTRY (กรอกรายเดือน - ทุกคนในหน้าเดียว)
 * ============================================================ */
function bindQuickEntryDropdowns() {
  const yearSel = document.getElementById('qeYear');
  if (yearSel && yearSel.options.length === 0) {
    const currentThaiYear = new Date().getFullYear() + 543;
    for (let y = currentThaiYear - 3; y <= currentThaiYear + 1; y++) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === currentThaiYear) opt.selected = true;
      yearSel.appendChild(opt);
    }
  }
  const monthSel = document.getElementById('qeMonth');
  if (monthSel) monthSel.value = (new Date().getMonth() + 1);
}

/* ---- ข้อ 11: เปลี่ยน dropdown → โหลดอัตโนมัติ + เตือนถ้ามีข้อมูลค้าง ----
 * เช็คว่ามีแถวที่กรอกค่าไว้ในตาราง แต่ค่ายังไม่ตรงกับที่บันทึกใน state (ยังไม่เซฟ) */
let qeLoaded = false;  // ตารางถูกโหลดแล้วหรือยัง (ถ้ายัง = เปลี่ยน dropdown โหลดได้เลย)

function hasUnsavedQeData() {
  const wrap = document.getElementById('qeWrap');
  if (!wrap) return false;
  const rows = wrap.querySelectorAll('.qe-table tbody tr[data-empid]');
  if (rows.length === 0) return false;
  // ปี/เดือน/กลุ่ม "ที่ตารางถูกโหลดมา" (เก็บไว้ตอน loadQuickEntry) — ใช้เทียบกับ state
  const ly = wrap.dataset.loadedYear, lm = wrap.dataset.loadedMonth;
  if (!ly || !lm) return false;
  const year = parseInt(ly), month = parseInt(lm);
  
  for (const tr of rows) {
    const empId = tr.dataset.empid;
    const s = state.data.salaries[salaryKey(empId, year, month)] || {};
    // เทียบค่าในช่องกับค่าที่บันทึกไว้ — ต่างกัน = มีข้อมูลค้างยังไม่เซฟ
    const fields = ['salary','otherIncome','bonus','ot','holiday','debt','sso','ssoEmployer','tax','pvd','pvdEmployer','cash'];
    for (const f of fields) {
      const inp = tr.querySelector('[data-field="' + f + '"]');
      if (!inp) continue;
      const cur = qeReadNum(inp);
      const saved = Number(s[f]) || 0;
      if (cur !== saved) return true;
    }
    // เช็ค bank + note + วันที่ ด้วย
    const bankInp = tr.querySelector('[data-field="bank"]');
    if (bankInp) {
      const curBank = qeReadNum(bankInp);
      const savedBankRaw = s.bank || s.receivedBy || '';
      const savedBank = typeof savedBankRaw === 'number' ? savedBankRaw : (parseFloat(String(savedBankRaw).replace(/,/g,'')) || 0);
      if (curBank !== savedBank) return true;
    }
  }
  return false;
}

function onQeSelectorChange() {
  // ตารางยังไม่เคยโหลด → โหลดเลย
  const wrap = document.getElementById('qeWrap');
  const hasTable = wrap && wrap.querySelector('.qe-table tbody tr[data-empid]');
  if (!hasTable) { loadQuickEntry(); return; }
  
  // มีข้อมูลค้างยังไม่เซฟ → เตือน 3 ทาง
  if (hasUnsavedQeData()) {
    showQeSwitchModal();
  } else {
    loadQuickEntry();  // ไม่มีค้าง → โหลดเลย
  }
}

/* modal เตือนตอนเปลี่ยนเดือนทั้งที่มีข้อมูลค้าง (ข้อ 11) */
function showQeSwitchModal() {
  let modal = document.getElementById('qeSwitchModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'qeSwitchModal';
    modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;';
    modal.innerHTML =
      '<div style="background:white; border-radius:12px; padding:26px 30px; max-width:440px; width:92%; box-shadow:0 16px 48px rgba(0,0,0,0.25);">' +
        '<h3 style="margin:0 0 6px; color:#e67e22; font-size:17px;">⚠️ ยังไม่ได้บันทึก</h3>' +
        '<p style="margin:0 0 18px; color:#7f8c8d; font-size:13px;">มีข้อมูลที่กรอกไว้ยังไม่ได้กดบันทึก จะทำอย่างไรก่อนเปลี่ยน?</p>' +
        '<div style="display:flex; flex-direction:column; gap:10px;">' +
          '<button onclick="qeSwitchSaveFirst()" style="padding:12px 16px; border:1px solid #a9dfbf; border-radius:8px; background:#eafaf1; cursor:pointer; text-align:left; font-size:14px; font-family:inherit;">' +
            '💾 <strong>บันทึกก่อน แล้วค่อยเปลี่ยน</strong><br><span style="font-size:12px; color:#888;">เซฟขึ้น Sheets แล้วโหลดข้อมูลเดือนใหม่</span></button>' +
          '<button onclick="qeSwitchDiscard()" style="padding:12px 16px; border:1px solid #f5b7b1; border-radius:8px; background:#fdf2f0; cursor:pointer; text-align:left; font-size:14px; font-family:inherit;">' +
            '↪️ <strong>เปลี่ยนเลย ไม่บันทึก</strong><br><span style="font-size:12px; color:#888;">ทิ้งที่กรอกค้าง (ยังกู้คืนได้จากระบบ draft)</span></button>' +
          '<button onclick="qeSwitchCancel()" style="padding:10px 16px; border:none; border-radius:8px; background:#f0f4f8; cursor:pointer; font-size:14px; font-family:inherit; color:#555;">ยกเลิก (อยู่เดือนเดิม)</button>' +
        '</div>' +
      '</div>';
    modal.addEventListener('mousedown', (e) => { modal._downBg = (e.target === modal); });
    modal.addEventListener('mouseup', (e) => { if (modal._downBg && e.target === modal) qeSwitchCancel(); modal._downBg = false; });
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}

function qeCloseSwitchModal() {
  const m = document.getElementById('qeSwitchModal');
  if (m) m.style.display = 'none';
}

function qeSwitchSaveFirst() {
  qeCloseSwitchModal();
  // บันทึกข้อมูลเดือนเดิมก่อน (saveQuickEntry อ่านจาก dropdown ปัจจุบัน — ต้องเซฟด้วยค่าเดิม)
  // แต่ dropdown เปลี่ยนไปแล้ว → ใช้ค่า loadedYear/Month ที่จำไว้
  saveQuickEntryForLoaded();
  loadQuickEntry();
}

function qeSwitchDiscard() {
  qeCloseSwitchModal();
  loadQuickEntry();  // โหลดใหม่ทับ — draft ยังมี กู้คืนได้
}

function qeSwitchCancel() {
  qeCloseSwitchModal();
  // คืน dropdown กลับไปเดือน/ปี/กลุ่มเดิมที่ตารางโหลดอยู่
  const wrap = document.getElementById('qeWrap');
  if (wrap.dataset.loadedGroup) document.getElementById('qeGroup').value = wrap.dataset.loadedGroup;
  if (wrap.dataset.loadedYear) document.getElementById('qeYear').value = wrap.dataset.loadedYear;
  if (wrap.dataset.loadedMonth) document.getElementById('qeMonth').value = wrap.dataset.loadedMonth;
}

/* บันทึกโดยใช้กลุ่ม/ปี/เดือน "ที่ตารางโหลดมา" (ไม่ใช่ค่า dropdown ปัจจุบันที่อาจเปลี่ยนแล้ว) */
function saveQuickEntryForLoaded() {
  const wrap = document.getElementById('qeWrap');
  const g = document.getElementById('qeGroup');
  const y = document.getElementById('qeYear');
  const m = document.getElementById('qeMonth');
  const curG = g.value, curY = y.value, curM = m.value;
  // สลับ dropdown กลับไปค่าเดิมชั่วคราว เพื่อให้ saveQuickEntry บันทึกถูกเดือน
  if (wrap.dataset.loadedGroup) g.value = wrap.dataset.loadedGroup;
  if (wrap.dataset.loadedYear) y.value = wrap.dataset.loadedYear;
  if (wrap.dataset.loadedMonth) m.value = wrap.dataset.loadedMonth;
  saveQuickEntry();
  // คืนค่า dropdown ปัจจุบัน (ที่ผู้ใช้เพิ่งเลือก)
  g.value = curG; y.value = curY; m.value = curM;
}

function loadQuickEntry() {
  const group = document.getElementById('qeGroup').value;
  const year = parseInt(document.getElementById('qeYear').value);
  const month = parseInt(document.getElementById('qeMonth').value);
  const wrap = document.getElementById('qeWrap');
  
  // กรอง: แสดงเฉพาะคนที่ active ในเดือนนั้น + คนที่ออกในเดือนก่อนหน้า (1 เดือน buffer)
  const emps = state.data.employees.filter(e => 
    e.group === group && isActiveForMonthView(e, year, month)
  );
  sortEmployees(emps);
  
  if (emps.length === 0) {
    wrap.innerHTML = '<div style="text-align:center; padding:60px; color:#999;">ไม่พบพนักงานในกลุ่มนี้</div>';
    document.getElementById('btnSaveQuickEntry').style.display = 'none';
    return;
  }
  
  const isMyanmar = group.includes('พม่า');
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  let html = '';
  
  // Toolbar ด้านบนของตาราง (Copy + Search + Filter + Quick actions)
  html += '<div style="display:flex; gap:8px; margin-bottom:10px; align-items:center; flex-wrap:wrap; padding:8px 12px; background:#f8f9fa; border-radius:6px; border:1px solid #e9ecef;">';
  html += '<button class="btn-secondary" onclick="copyFromPrevMonth()" style="font-size:13px;">📋 Copy จากเดือนก่อน</button>';
  html += '<button class="btn-secondary" onclick="clearAllQuickEntry()" style="font-size:13px;">🧹 ล้างทุกช่อง</button>';
  html += '<button class="btn-secondary" onclick="recalcAllBankRows()" style="font-size:13px; background:#eaf4fb; border-color:#aed6f1; color:#1a5276;" title="คำนวณช่องเข้าบัญชีใหม่ทุกแถว = รับสุทธิ − เงินสด">🔧 คำนวณเข้าบัญชีใหม่</button>';
  html += '<button class="btn-secondary" onclick="showKeyboardHelp()" style="font-size:13px;" title="กด ?">⌨️ Shortcuts</button>';
  html += '<div style="flex:1;"></div>';
  html += '<input type="text" id="qeSearch" oninput="filterQuickEntry()" placeholder="🔍 ค้นหาชื่อ/รหัส... (กด /)" style="padding:6px 10px; border:1px solid #ccc; border-radius:4px; font-size:13px; min-width:200px;">';
  html += '<select id="qeFilter" onchange="filterQuickEntry()" style="padding:6px 10px; border:1px solid #ccc; border-radius:4px; font-size:13px;">';
  html += '<option value="all">ทั้งหมด</option>';
  html += '<option value="filled">✅ กรอกแล้ว</option>';
  html += '<option value="empty">⏳ ยังไม่กรอก</option>';
  html += '<option value="hasNote">📝 มีหมายเหตุ</option>';
  html += '</select>';
  html += '</div>';
  
  html += '<div style="overflow-x:auto; overflow-y:visible; border:1px solid #ddd; border-radius:6px; max-width:100%;">';
  html += '<table class="qe-table" style="width:100%; border-collapse:collapse; font-size:12px;">';
  
  // Header — ลำดับคอลัมน์ใหม่: ลบ, รหัส, ชื่อ, ... , หมายเหตุ
  const headerBg = isMyanmar ? '#d35400' : '#2c5f8d';
  const headerBorder = isMyanmar ? '#a0411f' : '#1a4567';
  
  html += '<thead><tr style="background:' + headerBg + '; color:white;">';
  html += '<th class="qe-sticky-del" style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:62px; position:sticky; left:0; background:' + headerBg + '; z-index:3;"></th>';
  html += '<th class="qe-sticky-code" style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:62px; position:sticky; left:62px; background:' + headerBg + '; z-index:3;">รหัส</th>';
  html += '<th class="qe-sticky-name" style="border:1px solid ' + headerBorder + '; padding:6px 6px; min-width:120px; max-width:160px; text-align:left; position:sticky; left:124px; background:' + headerBg + '; z-index:3;">ชื่อ</th>';
  
  if (isMyanmar) {
    // พม่า: รายได้, พิเศษ, OT, SSO ลจ., หนี้อื่นๆ, หยุด, เงินสด, เข้าบัญชี, รับสุทธิ, ว.ด.ป., SSO นจ., note
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:85px;">รายได้</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">พิเศษ</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">OT</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">SSO ลจ.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:75px; background:#e67e22;">หนี้อื่นๆ</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px; background:#e67e22;">หยุด</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:80px;">เงินสด</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:100px;">เข้าบัญชี</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:85px; background:#ba4a00;">รับสุทธิ</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">ว.ด.ป.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px; background:#ba4a00;">SSO นจ.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:160px;">📝 หมายเหตุ</th>';
  } else {
    // ไทย: รายได้, รายได้อื่น, SSO ลจ., TAX, PVD ลจ., เงินสด, เข้าบัญชี, รับสุทธิ, ว.ด.ป., SSO นจ., PVD นจ., note
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:85px;">รายได้</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:85px;">รายได้อื่น</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">SSO ลจ.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">TAX</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">PVD ลจ.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:80px;">เงินสด</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:100px;">เข้าบัญชี</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:90px; background:#1e8449;">รับสุทธิ</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px;">ว.ด.ป.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px; background:#1a6091;">PVD นจ.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:70px; background:#1a6091;">SSO นจ.</th>';
    html += '<th style="border:1px solid ' + headerBorder + '; padding:6px 4px; min-width:160px;">📝 หมายเหตุ</th>';
  }
  html += '</tr></thead><tbody>';
  
  // Data rows — ลำดับ: ลบ, รหัส, ชื่อ, inputs...
  emps.forEach((emp, i) => {
    const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
    const salary = Number(s.salary) || '';
    const otherIncome = Number(s.otherIncome) || '';
    const bonus = Number(s.bonus) || '';      // พิเศษ (พม่า)
    const ot = Number(s.ot) || '';             // OT (พม่า)
    const holiday = Number(s.holiday) || '';   // หยุด - หักเงิน (พม่า)
    const debt = Number(s.debt) || '';         // หนี้อื่นๆ - หักเงิน (พม่า)
    const sso = Number(s.sso) || '';
    const ssoEmployer = Number(s.ssoEmployer) || '';
    const tax = Number(s.tax) || '';
    const pvd = Number(s.pvd) || '';
    const pvdEmployer = Number(s.pvdEmployer) || '';
    const cash = Number(s.cash) || '';
    const bank = s.bank || s.receivedBy || '';  // ช่อง "เข้าบัญชี" เดิมคือ receivedBy
    const receivedDate = s.receivedDate || '';
    const note = s.note || '';
    
    const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
    const empCode = escapeHtml(emp.empId);
    const empName = escapeHtml((emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || ''));
    
    html += '<tr data-empid="' + escapeHtml(emp.empId) + '" style="background:' + bg + ';">';
    // ปุ่มลบ + ปุ่ม copy จากเดือนก่อน (sticky)
    html += '<td class="qe-sticky-del" style="border:1px solid #ddd; padding:2px; text-align:center; position:sticky; left:0; background:' + bg + '; z-index:1; white-space:nowrap;">' +
      '<button class="btn-copy-prev-row" onclick="copyFromPrevMonthRow(\'' + escapeHtml(emp.empId) + '\')" title="คัดลอกข้อมูลเดือนก่อนของคนนี้" style="background:none; border:none; cursor:pointer; padding:2px 3px; font-size:14px; border-radius:3px; color:#2980b9; line-height:1;">📋</button>' +
      '<button class="btn-del-row" onclick="deleteQuickEntryRow(\'' + escapeHtml(emp.empId) + '\')" title="ลบข้อมูลเดือนนี้" style="background:none; border:none; cursor:pointer; padding:2px 3px; font-size:14px; border-radius:3px; color:#dc3545; line-height:1; margin-left:2px;">🗑️</button>' +
      '</td>';
    // รหัส (sticky)
    html += '<td class="qe-sticky-code" style="border:1px solid #ddd; padding:4px 6px; text-align:center; font-weight:600; color:#1a5276; background:#f0f4f8; position:sticky; left:62px; z-index:1; font-size:11px; white-space:nowrap;">' + empCode + '</td>';
    // ชื่อ (sticky)
    html += '<td class="qe-sticky-name" style="border:1px solid #ddd; padding:4px 6px; font-size:11px; position:sticky; left:124px; background:' + bg + '; z-index:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px;" title="' + empName + '">' + empName + '</td>';
    // Inputs
    html += qeInput('salary', salary);
    if (isMyanmar) {
      // พม่า: พิเศษ, OT, SSO ลจ., หนี้อื่นๆ, หยุด
      html += qeInput('bonus', bonus);
      html += qeInput('ot', ot);
      html += qeInput('sso', sso);
      html += qeInput('debt', debt);
      html += qeInput('holiday', holiday);
    } else {
      html += qeInput('otherIncome', otherIncome);
      html += qeInput('sso', sso);
      html += qeInput('tax', tax);
      html += qeInput('pvd', pvd);
    }
    // เงินสด (input) → auto-calc เข้าบัญชี
    html += qeInput('cash', cash);
    // เข้าบัญชี (input ตัวเลข — auto-calc = รับสุทธิ - เงินสด, override ได้)
    html += qeInput('bank', typeof bank === 'number' ? bank : (parseFloat(String(bank).replace(/,/g,'')) || ''), 'min-width:95px; width:100%; text-align:right;');
    // รับสุทธิ (readonly) — ย้ายมาหลังเข้าบัญชี
    html += '<td class="qe-net" style="border:1px solid #ddd; padding:4px 6px; text-align:right; font-weight:bold; color:' + (isMyanmar ? '#d35400' : '#1e8449') + '; background:' + (isMyanmar ? '#fff5ee' : '#d5f5e3') + ';">-</td>';
    html += qeInputText('receivedDate', receivedDate, 'dd/MM');
    // ช่องนายจ้าง — ไทย: PVD นจ. ก่อน SSO นจ. (สลับให้ตรงตารางสรุป) / พม่า: มีแค่ SSO นจ.
    if (!isMyanmar) {
      html += qeInput('pvdEmployer', pvdEmployer);
      html += qeInput('ssoEmployer', ssoEmployer);
    } else {
      html += qeInput('ssoEmployer', ssoEmployer);
    }
    html += qeInputText('note', note, 'บันทึก...');
    html += '</tr>';
  });
  
  // Summary row — ตำแหน่งเซลล์ต้องตรงกับคอลัมน์ใหม่
  html += '<tr class="qe-totals" style="background:#fff8dc; font-weight:bold;">';
  html += '<td colspan="3" class="qe-sticky-total" style="border:1px solid #ddd; padding:6px 8px; position:sticky; left:0; background:#fff8dc; z-index:1;">** รวมทั้งหมด **</td>';
  
  // Field order ต้องตรงกับ input row
  // ไทย: salary, otherIncome, sso, tax, pvd, [net], cash, bank, date, ssoEmployer, pvdEmployer, note
  // พม่า: salary, otherIncome, sso, [net], cash, bank, date, ssoEmployer, note
  const cellStyle = 'border:1px solid #ddd; padding:6px 8px; text-align:right; font-family:monospace;';
  
  if (isMyanmar) {
    // salary, bonus, ot, sso, debt, holiday
    html += '<td class="qe-total-cell" data-field="salary" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="bonus" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="ot" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="sso" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="debt" style="' + cellStyle + ' color:#c0392b;">-</td>';
    html += '<td class="qe-total-cell" data-field="holiday" style="' + cellStyle + ' color:#c0392b;">-</td>';
    // cash, bank, net, date
    html += '<td class="qe-total-cell qe-total-cash" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell qe-total-bank" style="' + cellStyle + ' color:#2471a3;">-</td>';  // bank
    html += '<td class="qe-total-cell qe-total-net" style="' + cellStyle + ' color:#d35400;">-</td>';
    html += '<td style="border:1px solid #ddd; padding:6px 8px;"></td>';  // date
    // ssoEmployer
    html += '<td class="qe-total-cell" data-field="ssoEmployer" style="' + cellStyle + '">-</td>';
    // note
    html += '<td style="border:1px solid #ddd; padding:6px 8px;"></td>';
  } else {
    // salary, otherIncome, sso, tax, pvd
    html += '<td class="qe-total-cell" data-field="salary" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="otherIncome" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="sso" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="tax" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="pvd" style="' + cellStyle + '">-</td>';
    // cash, bank, net, date
    html += '<td class="qe-total-cell qe-total-cash" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell qe-total-bank" style="' + cellStyle + ' color:#2471a3;">-</td>';  // bank
    html += '<td class="qe-total-cell qe-total-net" style="' + cellStyle + ' color:#1e8449;">-</td>';
    html += '<td style="border:1px solid #ddd; padding:6px 8px;"></td>';  // date
    // pvdEmployer, ssoEmployer (สลับให้ตรงตารางสรุป)
    html += '<td class="qe-total-cell" data-field="pvdEmployer" style="' + cellStyle + '">-</td>';
    html += '<td class="qe-total-cell" data-field="ssoEmployer" style="' + cellStyle + '">-</td>';
    // note
    html += '<td style="border:1px solid #ddd; padding:6px 8px;"></td>';
  }
  html += '</tr>';
  
  html += '</tbody></table></div>';
  
  // Style
  html += '<style>';
  html += '.qe-table { table-layout: auto; }';
  html += '.qe-table input { width:100%; padding:4px 5px; border:1px solid #ccc; border-radius:3px; font-size:12px; font-family:inherit; box-sizing:border-box; }';
  html += '.qe-table input.num { text-align:right; font-family:monospace; }';
  html += '.qe-table input:focus { outline:none; border-color:#2c5f8d; background:#fffbe6; box-shadow:0 0 0 2px rgba(44,95,141,0.15); }';
  html += '.qe-table td { padding:2px !important; }';
  html += '.qe-table td.qe-sticky-del, .qe-table td.qe-sticky-code, .qe-table td.qe-sticky-name { padding:4px 6px !important; }';
  html += '.qe-table tbody tr:hover { background:#e8f4f8 !important; }';
  html += '.qe-table tbody tr:hover td.qe-sticky-name { background:#e8f4f8 !important; }';
  html += '.btn-del-row:hover { background:#ffe3e3 !important; transform:scale(1.15); }';
  // shadow ด้านขวาของ sticky column (ช่วยให้ดูแยกจาก scroll content)
  html += '.qe-table th.qe-sticky-name, .qe-table td.qe-sticky-name { box-shadow: 4px 0 4px -2px rgba(0,0,0,0.1); }';
  html += '</style>';
  
  wrap.innerHTML = html;
  document.getElementById('btnSaveQuickEntry').style.display = '';
  document.getElementById('qeBulkTools').style.display = 'flex';
  
  // Attach listeners for real-time calc
  wrap.querySelectorAll('.qe-table tbody tr[data-empid]').forEach(tr => {
    tr.querySelectorAll('input.num').forEach(inp => {
      // Real-time input: คำนวณสด
      inp.addEventListener('input', () => {
        if (inp.dataset.field === 'salary' || inp.dataset.field === 'otherIncome') {
          autoCalcSsoRow(tr);
        }
        // ถ้า user พิมพ์ที่ช่อง bank เอง → mark ห้าม auto overwrite
        if (inp.dataset.field === 'bank') {
          inp.dataset.userEdited = 'true';
        }
        updateQeNet(tr);
        updateQeTotals();
        updateQeStatus();
        scheduleQeDraftSave();  // เก็บ draft กันข้อมูลพิมพ์ค้างหาย
      });
      
      // Blur: จัดรูปแบบตัวเลข (ใส่ comma)
      inp.addEventListener('blur', () => {
        qeFormatInput(inp);
      });
      
      // Focus: เลือกทุกตัวใน input ทำให้พิมพ์ทับได้เลย
      inp.addEventListener('focus', () => {
        inp.select();
      });
      
      // Double-click ที่ bank → เคลียร์ flag userEdited (กลับไป auto-calc)
      if (inp.dataset.field === 'bank') {
        inp.addEventListener('dblclick', () => {
          delete inp.dataset.userEdited;
          updateQeNet(tr);
          updateQeTotals();
          qeFormatInput(inp);
          toast('🔄 กลับไปคำนวณอัตโนมัติ (net - cash)', 'info');
        });
        inp.title = '💡 Auto: รับสุทธิ - เงินสด — ถ้าต้องการ auto-calc อีกครั้ง ให้ดับเบิ้ลคลิก';
      }
    });
    
    // Enter key: ไปช่องล่าง (แบบ Excel)
    tr.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const field = inp.dataset.field;
          const nextTr = tr.nextElementSibling;
          if (nextTr && nextTr.dataset.empid) {
            const nextInp = nextTr.querySelector('[data-field="' + field + '"]');
            if (nextInp) {
              // Trigger blur ก่อน เพื่อ format ช่องปัจจุบัน
              inp.blur();
              nextInp.focus();
              // select() ทำงานผ่าน focus listener อยู่แล้ว
            }
          }
        }
      });
    });
  });
  
  // Initial calc + mark saved bank as userEdited (to preserve saved values)
  wrap.querySelectorAll('.qe-table tbody tr[data-empid]').forEach(tr => {
    const bankInput = tr.querySelector('[data-field="bank"]');
    if (bankInput && bankInput.value && bankInput.value.trim() !== '') {
      // มีค่าอยู่แล้ว = เคย save มาก่อน → ไม่ให้ auto overwrite
      bankInput.dataset.userEdited = 'true';
    }
    updateQeNet(tr);
    markPvdPlaceholder(tr);  // โชว์ "–" สำหรับคนไม่เข้ากองทุน ตั้งแต่โหลดตาราง
    
    // ผูก auto-format ให้ช่องวันที่
    const dateInp = tr.querySelector('[data-field="receivedDate"]');
    if (dateInp) setupDateInput(dateInp);
  });
  updateQeTotals();
  updateQeStatus();
  
  // จำกลุ่ม/ปี/เดือนที่โหลด ไว้เทียบตอนเปลี่ยน dropdown (ข้อ 11)
  const prevMonth = wrap.dataset.loadedMonth;
  const prevYear = wrap.dataset.loadedYear;
  wrap.dataset.loadedGroup = group;
  wrap.dataset.loadedYear = String(year);
  wrap.dataset.loadedMonth = String(month);
  
  // ข้อ 12: เปลี่ยนเดือน/ปี → ล้างช่องวันจ่ายในเครื่องมือกรอกไว (แต่ละเดือนวันจ่ายไม่เหมือนกัน)
  if (prevMonth !== undefined && (prevMonth !== String(month) || prevYear !== String(year))) {
    const bulkDate = document.getElementById('qeBulkDate');
    if (bulkDate) bulkDate.value = '';
  }
  
  // Draft: ครอบทุก input (รวมช่องวันที่/หมายเหตุ/บัญชี ที่ไม่ใช่ .num) — ผูกครั้งเดียว
  if (!wrap.dataset.draftBound) {
    wrap.dataset.draftBound = '1';
    wrap.addEventListener('input', (e) => {
      if (e.target && e.target.matches('.qe-table input[data-field]')) {
        scheduleQeDraftSave();
      }
    });
  }
  
  // มี draft ที่พิมพ์ค้าง (ยังไม่บันทึก) ของตารางนี้ไหม → ถามกู้คืน
  maybeRestoreQeDraft(group, year, month);
}

function updateQeStatus() {
  const wrap = document.getElementById('qeWrap');
  const rows = wrap.querySelectorAll('.qe-table tbody tr[data-empid]');
  const total = rows.length;
  let filled = 0;
  rows.forEach(tr => {
    const sal = qeReadNum(tr.querySelector('[data-field="salary"]'));
    const oth = qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
    if (sal > 0 || oth > 0) filled++;
  });
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const month = parseInt(document.getElementById('qeMonth').value);
  const year = document.getElementById('qeYear').value;
  const remaining = total - filled;
  
  let statusHtml = '👥 <strong style="color:#1a5276;">' + total + '</strong> คน';
  statusHtml += ' · ✏️ กรอกแล้ว <strong style="color:#27ae60;">' + filled + '</strong>';
  if (remaining > 0) {
    statusHtml += ' · ⏳ เหลือ <strong style="color:#e67e22;">' + remaining + '</strong>';
  } else if (total > 0) {
    statusHtml += ' · <strong style="color:#27ae60;">✅ ครบแล้ว</strong>';
  }
  statusHtml += ' · ' + MONTHS[month-1] + ' ' + year;
  document.getElementById('qeStatus').innerHTML = statusHtml;
}

/* ============================================================
 * ปุ่ม 🗑️ ในตาราง: 3 ทางเลือก
 *   1. 🧹 ล้างข้อมูลเดือนนี้ (พฤติกรรมเดิม — กรอกผิด)
 *   2. 👋 บันทึกว่าลาออก — ใส่วันลาออกในประวัติให้อัตโนมัติ
 *      (เก็บข้อมูลเงินเดือนเดือนนี้ไว้ เพราะเป็นงวดสุดท้าย)
 *   3. ยกเลิก
 * ============================================================ */
let qeDelPendingEmpId = null;

function deleteQuickEntryRow(empId) {
  const month = parseInt(document.getElementById('qeMonth').value);
  const year = parseInt(document.getElementById('qeYear').value);
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const emp = state.data.employees.find(e => e.empId === empId);
  const empName = emp ? (emp.firstName + ' ' + (emp.lastName || emp.nameEn || '')) : empId;
  
  qeDelPendingEmpId = empId;
  
  let modal = document.getElementById('qeDelModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'qeDelModal';
    modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;';
    modal.innerHTML =
      '<div style="background:white; border-radius:12px; padding:26px 30px; max-width:430px; width:92%; box-shadow:0 16px 48px rgba(0,0,0,0.25);">' +
        '<h3 id="qeDelModalTitle" style="margin:0 0 6px; color:#2c3e50; font-size:17px;"></h3>' +
        '<p id="qeDelModalSub" style="margin:0 0 18px; color:#7f8c8d; font-size:13px;"></p>' +
        '<div style="display:flex; flex-direction:column; gap:10px;">' +
          '<button onclick="qeDelClearMonth()" style="padding:12px 16px; border:1px solid #e0e0e0; border-radius:8px; background:#fff; cursor:pointer; text-align:left; font-size:14px; font-family:inherit;">' +
            '🧹 <strong>ล้างข้อมูลเดือนนี้</strong><br><span style="font-size:12px; color:#888;">กรอกผิด อยากล้างค่าเดือนนี้ทิ้ง — ประวัติพนักงานยังอยู่</span></button>' +
          '<button onclick="qeDelMarkResign()" style="padding:12px 16px; border:1px solid #f5b7b1; border-radius:8px; background:#fdf2f0; cursor:pointer; text-align:left; font-size:14px; font-family:inherit;">' +
            '👋 <strong>บันทึกว่าลาออก</strong><br><span style="font-size:12px; color:#888;">ใส่วันลาออกในประวัติให้อัตโนมัติ · ข้อมูลเงินเดือนเดือนนี้ยังเก็บไว้ (งวดสุดท้าย)</span></button>' +
          '<button onclick="qeDelCloseModal()" style="padding:10px 16px; border:none; border-radius:8px; background:#f0f4f8; cursor:pointer; font-size:14px; font-family:inherit; color:#555;">ยกเลิก</button>' +
        '</div>' +
      '</div>';
    modal.addEventListener('mousedown', (e) => { modal._downBg = (e.target === modal); });
    modal.addEventListener('mouseup', (e) => { if (modal._downBg && e.target === modal) qeDelCloseModal(); modal._downBg = false; });
    document.body.appendChild(modal);
  }
  document.getElementById('qeDelModalTitle').textContent = empName + ' (' + empId + ')';
  document.getElementById('qeDelModalSub').textContent = 'เดือน ' + MONTHS[month-1] + ' ' + year + ' — ต้องการทำอะไร?';
  modal.style.display = 'flex';
}

function qeDelCloseModal() {
  const modal = document.getElementById('qeDelModal');
  if (modal) modal.style.display = 'none';
  qeDelPendingEmpId = null;
}

/* ทางเลือก 1: ล้างข้อมูลเดือนนี้ (logic เดิม) */
function qeDelClearMonth() {
  const empId = qeDelPendingEmpId;
  qeDelCloseModal();
  if (!empId) return;
  
  const year = parseInt(document.getElementById('qeYear').value);
  const month = parseInt(document.getElementById('qeMonth').value);
  const emp = state.data.employees.find(e => e.empId === empId);
  const empName = emp ? (emp.firstName + ' ' + (emp.lastName || emp.nameEn || '')) : empId;
  
  // ลบข้อมูลเงินเดือนของเดือนนั้น
  const key = salaryKey(empId, year, month);
  if (state.data.salaries[key]) {
    delete state.data.salaries[key];
  }
  
  // ลบแถวออกจากตาราง (ไม่โหลดใหม่ทั้งตาราง เพราะแถวอื่นอาจมีของที่ยังไม่บันทึก)
  const tr = document.querySelector('.qe-table tr[data-empid="' + empId + '"]');
  if (tr) tr.remove();
  
  saveLocal();
  schedulePush();
  updateQeTotals();
  updateQeStatus();
  toast('🗑️ ลบข้อมูลเดือนนี้ของ ' + empName + ' แล้ว', 'success');
}

/* ทางเลือก 2: บันทึกว่าลาออก — ใส่ endDate อัตโนมัติ เก็บข้อมูลเงินเดือนไว้ */
function qeDelMarkResign() {
  const empId = qeDelPendingEmpId;
  qeDelCloseModal();
  if (!empId) return;
  
  const year = parseInt(document.getElementById('qeYear').value);   // ปี พ.ศ.
  const month = parseInt(document.getElementById('qeMonth').value);
  const emp = state.data.employees.find(e => e.empId === empId);
  if (!emp) { toast('ไม่พบพนักงาน', 'error'); return; }
  const empName = emp.firstName + ' ' + (emp.lastName || emp.nameEn || '');
  
  // ค่าเริ่มต้น = วันสุดท้ายของเดือนที่เลือก (พ.ศ. 4 หลัก — กฎ buffer จะทำงานพอดี)
  const ceYear = year - 543;
  const lastDay = new Date(ceYear, month, 0).getDate();
  const defDate = ('0' + lastDay).slice(-2) + '/' + ('0' + month).slice(-2) + '/' + year;
  
  const input = prompt(
    '👋 บันทึกว่า "' + empName + '" ลาออก\n\nวันที่ลาออก (วว/ดด/ปปปป แบบ พ.ศ.)\nแก้ได้ถ้าออกกลางเดือน:', defDate);
  if (input === null) return; // กดยกเลิก
  
  const normalized = normalizeResignDate(input);
  if (!normalized) {
    toast('รูปแบบวันที่ไม่ถูกต้อง — ใช้ วว/ดด/ปปปป เช่น ' + defDate, 'error');
    return;
  }
  
  // มีวันลาออกอยู่แล้ว → ถามก่อนทับ
  if (emp.endDate && emp.endDate.trim() !== '') {
    if (!confirm('⚠️ ' + empName + ' มีวันลาออกบันทึกไว้แล้ว: ' + emp.endDate + '\n\nเปลี่ยนเป็น ' + normalized + ' ใช่หรือไม่?')) return;
  }
  
  emp.endDate = normalized;
  saveLocal();
  schedulePush();
  updateQeStatus();
  toast('👋 บันทึกแล้ว: ' + empName + ' ลาออกวันที่ ' + normalized + '\nเดือนนี้ยังแสดงให้กรอกงวดสุดท้าย · กดผิด/แก้วันที่ได้ที่แท็บ "พนักงาน"', 'success');
}

/* แปลงวันที่ที่ผู้ใช้พิมพ์ → dd/mm/yyyy (พ.ศ. 4 หลัก) — คืน null ถ้าไม่ถูกต้อง
 * รองรับ: 30/6/69 (พ.ศ. 2 หลัก) · 30/06/2569 (พ.ศ.) · 30/06/2026 (ค.ศ.) */
function normalizeResignDate(input) {
  const p = String(input).trim().split('/');
  if (p.length !== 3) return null;
  let d = parseInt(p[0]), m = parseInt(p[1]), y = parseInt(p[2]);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 100) y += 2500;                    // 69 → 2569 (เลขปีไทยแบบย่อ)
  else if (y >= 1900 && y <= 2400) y += 543; // ค.ศ. → พ.ศ.
  if (y < 2400 || y > 2700) return null;
  if (m < 1 || m > 12) return null;
  const daysInMonth = new Date(y - 543, m, 0).getDate();
  if (d < 1 || d > daysInMonth) return null;
  return ('0' + d).slice(-2) + '/' + ('0' + m).slice(-2) + '/' + y;
}

function copyFromPrevMonth() {
  const year = parseInt(document.getElementById('qeYear').value);
  const month = parseInt(document.getElementById('qeMonth').value);
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  // คำนวณเดือนก่อนหน้า
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
  
  const currentName = MONTHS[month-1] + ' ' + year;
  const prevName = MONTHS[prevMonth-1] + ' ' + prevYear;
  
  if (!confirm('คัดลอกข้อมูลจาก ' + prevName + ' มาที่ ' + currentName + '?\n\n' +
    '✅ จะคัดลอก: รายได้, รายได้อื่น, ปกส., TAX, กองทุน\n' +
    '❌ จะไม่คัดลอก: เงินสด, เข้าบัญชี, ว.ด.ป., หมายเหตุ (กรอกใหม่ทีหลัง)\n\n' +
    '⚠️ ถ้าช่องไหนกรอกข้อมูลแล้ว จะไม่ถูกเขียนทับ')) return;
  
  const wrap = document.getElementById('qeWrap');
  let copied = 0, skipped = 0;
  
  wrap.querySelectorAll('.qe-table tbody tr[data-empid]').forEach(tr => {
    const empId = tr.dataset.empid;
    const prevKey = salaryKey(empId, prevYear, prevMonth);
    const prevData = state.data.salaries[prevKey];
    
    if (!prevData) return;
    
    // เช็คว่ามีข้อมูลอยู่แล้วไหม
    const currentSalary = qeReadNum(tr.querySelector('[data-field="salary"]'));
    const currentOther = qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
    if (currentSalary > 0 || currentOther > 0) {
      skipped++;
      return;  // ไม่เขียนทับ
    }
    
    // Copy ข้อมูลหลัก (แสดงเป็น comma format)
    ['salary', 'otherIncome', 'bonus', 'ot', 'holiday', 'debt', 'sso', 'tax', 'pvd'].forEach(f => {
      const inp = tr.querySelector('[data-field="' + f + '"]');
      if (inp && prevData[f]) {
        inp.value = Number(prevData[f]).toLocaleString('en-US');
      }
    });
    
    // คำนวณ net ใหม่
    updateQeNet(tr);
    copied++;
  });
  
  updateQeTotals();
  updateQeStatus();
  
  if (copied === 0 && skipped === 0) {
    toast('ไม่พบข้อมูลเดือน ' + prevName + ' เลย', 'warning');
  } else {
    let msg = '📋 คัดลอกเรียบร้อย ' + copied + ' คน';
    if (skipped > 0) msg += ' (ข้าม ' + skipped + ' คนที่มีข้อมูลอยู่แล้ว)';
    toast(msg, 'success');
  }
}

// Copy ข้อมูลเดือนก่อน — แบบรายคน (คลิกปุ่ม 📋 ในแถว)
function copyFromPrevMonthRow(empId) {
  const year = parseInt(document.getElementById('qeYear').value);
  const month = parseInt(document.getElementById('qeMonth').value);
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  // เดือนก่อน
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
  const prevName = MONTHS[prevMonth-1] + ' ' + prevYear;
  
  const prevKey = salaryKey(empId, prevYear, prevMonth);
  const prevData = state.data.salaries[prevKey];
  
  if (!prevData) {
    toast('⚠️ ไม่พบข้อมูลของ ' + empId + ' ใน ' + prevName, 'warning');
    return;
  }
  
  // หาแถว
  const tr = document.querySelector('.qe-table tr[data-empid="' + CSS.escape(empId) + '"]');
  if (!tr) return;
  
  // เช็คว่าแถวมีข้อมูลอยู่แล้วไหม → ถ้ามี confirm ก่อน
  const currentSalary = qeReadNum(tr.querySelector('[data-field="salary"]'));
  const currentOther = qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
  if (currentSalary > 0 || currentOther > 0) {
    if (!confirm('⚠️ แถว ' + empId + ' มีข้อมูลอยู่แล้ว\n\nต้องการเขียนทับด้วยข้อมูลจาก ' + prevName + ' หรือไม่?')) {
      return;
    }
  }
  
  // Copy ข้อมูลหลัก (รายได้ + หัก) แสดงเป็น comma format
  ['salary', 'otherIncome', 'bonus', 'ot', 'holiday', 'debt', 'sso', 'ssoEmployer', 'tax', 'pvd', 'pvdEmployer'].forEach(f => {
    const inp = tr.querySelector('[data-field="' + f + '"]');
    if (inp && prevData[f]) {
      inp.value = Number(prevData[f]).toLocaleString('en-US');
    }
  });
  
  // คำนวณ net + bank ใหม่
  updateQeNet(tr);
  updateQeTotals();
  updateQeStatus();
  
  toast('📋 คัดลอก ' + empId + ' จาก ' + prevName + ' เรียบร้อย', 'success');
}

function clearAllQuickEntry() {
  if (!confirm('⚠️ ล้างทุกช่องในตารางนี้?\n\nหมายเหตุ: ล้างเฉพาะช่องในหน้าจอ — ยังไม่ได้บันทึกไปที่ฐานข้อมูล\nถ้าอยากบันทึกการล้าง ให้กดปุ่ม "บันทึกทั้งหมด" ด้วย')) return;
  
  const wrap = document.getElementById('qeWrap');
  wrap.querySelectorAll('.qe-table tbody tr[data-empid] input').forEach(inp => {
    inp.value = '';
  });
  wrap.querySelectorAll('.qe-net').forEach(td => td.textContent = '-');
  updateQeTotals();
  updateQeStatus();
  toast('🧹 ล้างช่องแล้ว — กดบันทึกเพื่อลบออกจากฐานข้อมูล', 'info');
}

function filterQuickEntry() {
  const search = (document.getElementById('qeSearch').value || '').toLowerCase().trim();
  const filter = document.getElementById('qeFilter').value;
  const rows = document.querySelectorAll('.qe-table tbody tr[data-empid]');
  let visibleCount = 0;
  
  rows.forEach(tr => {
    const empId = (tr.dataset.empid || '').toLowerCase();
    const nameCell = tr.querySelector('.qe-sticky-name');
    const name = nameCell ? nameCell.textContent.toLowerCase() : '';
    
    // Search match
    const matchSearch = !search || empId.includes(search) || name.includes(search);
    
    // Filter match
    const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
    const otherIncome = qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
    const hasData = salary > 0 || otherIncome > 0;
    const noteVal = (tr.querySelector('[data-field="note"]') || {}).value || '';
    
    let matchFilter = true;
    if (filter === 'filled') matchFilter = hasData;
    else if (filter === 'empty') matchFilter = !hasData;
    else if (filter === 'hasNote') matchFilter = noteVal.trim().length > 0;
    
    const visible = matchSearch && matchFilter;
    tr.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });
  
  // Update status to show filter info
  const statusEl = document.getElementById('qeStatus');
  if (search || filter !== 'all') {
    const total = rows.length;
    statusEl.innerHTML = '🔍 แสดง <strong style="color:#1a5276;">' + visibleCount + '</strong> / ' + total + ' คน';
    if (filter !== 'all') {
      const filterLabel = { filled: 'กรอกแล้ว', empty: 'ยังไม่กรอก', hasNote: 'มีหมายเหตุ' }[filter];
      statusEl.innerHTML += ' · Filter: <strong>' + filterLabel + '</strong>';
    }
  } else {
    updateQeStatus();
  }
}

function qeInput(field, val, extraStyle) {
  const displayVal = (val !== '' && val !== null && val !== undefined && !isNaN(val)) 
    ? Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '';
  const st = extraStyle ? (' style="' + extraStyle + '"') : '';
  return '<td style="border:1px solid #ddd;"><input class="num" type="text" inputmode="decimal" data-field="' + field + '" value="' + displayVal + '"' + st + ' placeholder="0"></td>';
}
function qeInputText(field, val, placeholder) {
  // ถ้าเป็นช่องวันที่ → เพิ่มปุ่มปฏิทินข้างๆ
  if (field === 'receivedDate') {
    return '<td style="border:1px solid #ddd; padding:0 !important;">' +
      '<div style="display:flex; align-items:stretch; gap:2px;">' +
        '<input type="text" data-field="' + field + '" value="' + escapeHtml(val || '') + '" placeholder="' + placeholder + '" style="flex:1; min-width:0;">' +
        '<button type="button" onclick="openDatePicker(this)" title="เลือกจากปฏิทิน" style="flex-shrink:0; padding:0 6px; background:#f0f4f8; border:1px solid #bdc3c7; border-radius:3px; cursor:pointer; font-size:13px;">📅</button>' +
      '</div></td>';
  }
  return '<td style="border:1px solid #ddd;"><input type="text" data-field="' + field + '" value="' + escapeHtml(val || '') + '" placeholder="' + placeholder + '"></td>';
}

// เปิด native date picker สำหรับช่องวันที่
function openDatePicker(btn) {
  const wrapper = btn.parentElement;
  const textInp = wrapper.querySelector('input[type="text"]');
  if (!textInp) return;
  
  // สร้าง hidden <input type="date"> ชั่วคราว (ให้แสดง picker ของ browser)
  const dateInp = document.createElement('input');
  dateInp.type = 'date';
  dateInp.style.position = 'fixed';
  dateInp.style.top = (btn.getBoundingClientRect().bottom + 2) + 'px';
  dateInp.style.left = btn.getBoundingClientRect().left + 'px';
  dateInp.style.opacity = '0';
  dateInp.style.pointerEvents = 'none';
  dateInp.style.zIndex = '9999';
  
  // Pre-fill จากค่าปัจจุบัน (ถ้ามี)
  const current = textInp.value.trim();
  if (current) {
    const iso = dateStrToISO(current);
    if (iso) dateInp.value = iso;
  }
  
  document.body.appendChild(dateInp);
  
  // เมื่อเปลี่ยน → normalize แล้วใส่ในช่อง text
  dateInp.addEventListener('change', () => {
    if (dateInp.value) {
      textInp.value = normalizeDateStr(dateInp.value);
      textInp.dispatchEvent(new Event('blur'));  // trigger save
    }
    document.body.removeChild(dateInp);
  });
  
  // ถ้าปิด picker โดยไม่เลือก → cleanup
  dateInp.addEventListener('blur', () => {
    setTimeout(() => {
      if (dateInp.parentElement) document.body.removeChild(dateInp);
    }, 300);
  });
  
  // เปิด picker
  setTimeout(() => {
    if (dateInp.showPicker) {
      dateInp.showPicker();
    } else {
      dateInp.focus();
      dateInp.click();
    }
  }, 10);
}

// แยก helper function: อ่านค่าตัวเลขจาก input (รองรับ comma)
function qeReadNum(input) {
  if (!input) return 0;
  const cleaned = (input.value || '').replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// จัดรูปแบบ input value (เพิ่ม comma)
function qeFormatInput(input) {
  const raw = (input.value || '').replace(/,/g, '').trim();
  if (raw === '' || raw === '-') { input.value = ''; return; }
  const n = parseFloat(raw);
  if (isNaN(n)) { input.value = ''; return; }
  // แสดง comma แต่คงทศนิยมที่ผู้ใช้กรอก
  const hasDecimal = raw.includes('.');
  if (hasDecimal) {
    const parts = raw.split('.');
    const intPart = parseInt(parts[0] || '0').toLocaleString('en-US');
    input.value = intPart + '.' + (parts[1] || '');
  } else {
    input.value = n.toLocaleString('en-US');
  }
}

function autoCalcSsoRow(tr) {
  // ⚠️ SSO คำนวณจาก 'salary' (ช่องรายได้) เท่านั้น
  // ไม่รวม: otherIncome, bonus, ot, holiday, debt
  const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
  const ssoInput = tr.querySelector('[data-field="sso"]');
  if (!ssoInput) return;
  
  const base = Math.max(salary, 0);
  let sso = ssoRound(base * CONFIG_DEFAULTS.SSO_RATE);
  if (sso > CONFIG_DEFAULTS.SSO_MAX) sso = CONFIG_DEFAULTS.SSO_MAX;
  if (base > 0 && base < CONFIG_DEFAULTS.SSO_MIN_BASE) sso = ssoRound(CONFIG_DEFAULTS.SSO_MIN_BASE * CONFIG_DEFAULTS.SSO_RATE);
  if (base === 0) sso = 0;
  ssoInput.value = sso ? sso.toLocaleString('en-US') : '';
  
  // ปกส.นายจ้าง = เท่ากับลูกจ้าง (สามารถแก้เองได้ถ้ารัฐประกาศอัตราต่าง)
  const ssoEmpInput = tr.querySelector('[data-field="ssoEmployer"]');
  if (ssoEmpInput) {
    ssoEmpInput.value = sso ? sso.toLocaleString('en-US') : '';
  }
  
  // คำนวณกองทุน (PVD) ตาม % ที่ตั้งไว้ในประวัติพนักงาน
  autoCalcPvdRow(tr);
}

function autoCalcPvdRow(tr) {
  const pvdInput = tr.querySelector('[data-field="pvd"]');
  if (!pvdInput) return;  // พม่าไม่มีช่อง pvd
  
  markPvdPlaceholder(tr);  // อัพเดต "–" / tooltip ตาม % ปัจจุบัน
  
  const empId = tr.dataset.empid;
  const emp = state.data.employees.find(e => e.empId === empId);
  if (!emp) return;
  
  const fundRate = parseFloat(emp.fundRate) || 0;
  const fundRateEmp = parseFloat(emp.fundRateEmployer) || 0;
  const pvdEmpInput = tr.querySelector('[data-field="pvdEmployer"]');
  
  const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
  const base = Math.max(salary, 0);
  
  // กองทุนลูกจ้าง
  if (fundRate > 0 && base > 0) {
    const pvd = ssoRound(base * (fundRate / 100));
    pvdInput.value = pvd ? pvd.toLocaleString('en-US') : '';
  } else {
    // ไม่เข้ากองทุน (ลูก) — ล้างช่อง
    // NOTE: ไม่ล้างถ้าผู้ใช้แก้เองไว้ — แต่ scenario ปกติคือ fundRate=0 = ช่องว่าง
  }
  
  // กองทุนนายจ้าง (แยกจากลูก — บริษัทกำหนดเอง)
  if (pvdEmpInput) {
    if (fundRateEmp > 0 && base > 0) {
      const pvdEmp = ssoRound(base * (fundRateEmp / 100));
      pvdEmpInput.value = pvdEmp ? pvdEmp.toLocaleString('en-US') : '';
    } else {
      pvdEmpInput.value = '';
    }
  }
}

/* แสดง "–" ในช่อง PVD ของคนที่ไม่เข้ากองทุน (% = 0 ในประวัติ)
 * ให้แยกออกชัดๆ ระหว่าง "ไม่เข้ากองทุน" กับ "ยังไม่ได้คำนวณ"
 * ไม่แตะ value — แค่ placeholder + tooltip */
function markPvdPlaceholder(tr) {
  const emp = state.data.employees.find(e => e.empId === tr.dataset.empid);
  if (!emp) return;
  const rate = parseFloat(emp.fundRate) || 0;
  const rateEmp = parseFloat(emp.fundRateEmployer) || 0;
  
  const pvdInput = tr.querySelector('[data-field="pvd"]');
  if (pvdInput) {
    pvdInput.placeholder = rate > 0 ? '0' : '–';
    pvdInput.title = rate > 0
      ? ('คำนวณอัตโนมัติ ' + rate + '% ของรายได้')
      : 'ไม่เข้ากองทุน (% กองทุน = 0 — ตั้งได้ที่แท็บพนักงาน)';
  }
  const pvdEmpInput = tr.querySelector('[data-field="pvdEmployer"]');
  if (pvdEmpInput) {
    pvdEmpInput.placeholder = rateEmp > 0 ? '0' : '–';
    pvdEmpInput.title = rateEmp > 0
      ? ('คำนวณอัตโนมัติ ' + rateEmp + '% ของรายได้')
      : 'ไม่เข้ากองทุน (% นายจ้าง = 0 — ตั้งได้ที่แท็บพนักงาน)';
  }
}

/* ============================================================
 * DATE HELPERS — รองรับทั้ง auto-format และ date picker
 * รูปแบบที่รับ:
 *   ddmmyy → dd/mm/yy     (เช่น 300469 → 30/04/69)
 *   ddmmyyyy → dd/mm/yy   (เช่น 30042569 → 30/04/69 — ตัด 2 ตัวแรกของปี)
 *   dd/mm → dd/mm/yy      (เติมปีปัจจุบัน พ.ศ. 2 หลัก)
 *   dd/mm/yy → dd/mm/yy   (keep)
 *   dd/mm/yyyy → dd/mm/yy (ตัด 2 หลักท้าย)
 *   YYYY-MM-DD (จาก <input type=date>) → dd/mm/yy (แปลง ค.ศ. → พ.ศ.)
 * ============================================================ */
function normalizeDateStr(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  if (!s) return '';
  
  // 1) จาก ISO (YYYY-MM-DD) จาก <input type="date">
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const yearCE = parseInt(iso[1]);
    const yearBE = yearCE + 543;
    const yy = String(yearBE % 100).padStart(2, '0');
    return iso[3] + '/' + iso[2] + '/' + yy;
  }
  
  // 2) ดึง digit ล้วน → ถ้าพอดีเป็นรูป compact
  const digits = s.replace(/\D/g, '');
  if (digits.length === 6) {
    // ddmmyy
    return digits.substr(0,2) + '/' + digits.substr(2,2) + '/' + digits.substr(4,2);
  }
  if (digits.length === 8) {
    // ddmmyyyy → ตัด 2 ตัวแรกของปี (2568 → 68)
    return digits.substr(0,2) + '/' + digits.substr(2,2) + '/' + digits.substr(6,2);
  }
  
  // 3) ถ้ามี / อยู่แล้ว → normalize เป็น dd/mm/yy
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 2) {
    // dd/mm → เติมปีปัจจุบัน
    const now = new Date();
    const yy = String((now.getFullYear() + 543) % 100).padStart(2, '0');
    return parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0') + '/' + yy;
  }
  if (parts.length === 3) {
    let yy = parts[2];
    if (yy.length === 4) yy = yy.substr(2);  // 2568 → 68
    return parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0') + '/' + yy.padStart(2, '0');
  }
  
  // ถ้า parse ไม่ได้ return เดิม
  return s;
}

// แปลง dd/mm/yy → YYYY-MM-DD (ค.ศ.) สำหรับใส่ใน <input type="date">
function dateStrToISO(s) {
  if (!s) return '';
  const parts = s.split(/[\/\-\.]/);
  if (parts.length !== 3) return '';
  let yy = parseInt(parts[2]);
  if (isNaN(yy)) return '';
  // yy < 100 = พ.ศ. 2 หลัก → แปลงเป็น ค.ศ.
  let yearCE;
  if (yy < 100) {
    const yearBE = 2500 + yy;  // 69 → 2569
    yearCE = yearBE - 543;
  } else {
    // 4 หลัก สมมติว่าเป็น พ.ศ.
    yearCE = yy - 543;
  }
  const mm = String(parseInt(parts[1])).padStart(2, '0');
  const dd = String(parseInt(parts[0])).padStart(2, '0');
  return yearCE + '-' + mm + '-' + dd;
}

// ผูก auto-format + ปุ่มปฏิทินกับ input ที่ใส่วันที่
function setupDateInput(inp) {
  if (!inp || inp.dataset.dateSetup === '1') return;
  inp.dataset.dateSetup = '1';
  inp.placeholder = 'dd/mm/yy';
  inp.maxLength = 10;  // รองรับ dd/mm/yyyy ชั่วคราว
  
  // On blur: normalize
  inp.addEventListener('blur', () => {
    const formatted = normalizeDateStr(inp.value);
    if (formatted !== inp.value) inp.value = formatted;
  });
  
  // On Enter: normalize ทันที (ไม่ต้องรอ blur)
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const formatted = normalizeDateStr(inp.value);
      if (formatted !== inp.value) inp.value = formatted;
    }
  });
}

function updateQeNet(tr) {
  const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
  const otherIncome = qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
  const sso = qeReadNum(tr.querySelector('[data-field="sso"]'));
  const tax = qeReadNum(tr.querySelector('[data-field="tax"]'));
  const pvd = qeReadNum(tr.querySelector('[data-field="pvd"]'));
  
  // พม่ามีช่องเพิ่ม: bonus, ot (+), holiday, debt (−)
  const bonus = qeReadNum(tr.querySelector('[data-field="bonus"]'));
  const ot = qeReadNum(tr.querySelector('[data-field="ot"]'));
  const holiday = qeReadNum(tr.querySelector('[data-field="holiday"]'));
  const debt = qeReadNum(tr.querySelector('[data-field="debt"]'));
  
  // สูตร: รายได้ + รายได้อื่น + พิเศษ + OT − SSO − TAX − PVD − หยุด − หนี้อื่นๆ
  const net = salary + otherIncome + bonus + ot - sso - tax - pvd - holiday - debt;
  const netCell = tr.querySelector('.qe-net');
  if (netCell) netCell.textContent = net ? net.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-';
  
  // Auto-calc เข้าบัญชี = รับสุทธิ - เงินสด (ถ้าผู้ใช้ยังไม่ได้แก้เอง)
  autoCalcBankRow(tr, net);
}

function autoCalcBankRow(tr, netOverride) {
  const bankInput = tr.querySelector('[data-field="bank"]');
  if (!bankInput) return;
  // ถ้า user แก้เอง (flag userEdited) ไม่เขียนทับ
  if (bankInput.dataset.userEdited === 'true') return;
  
  let net = netOverride;
  if (net === undefined) {
    const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
    const otherIncome = qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
    const sso = qeReadNum(tr.querySelector('[data-field="sso"]'));
    const tax = qeReadNum(tr.querySelector('[data-field="tax"]'));
    const pvd = qeReadNum(tr.querySelector('[data-field="pvd"]'));
    net = salary + otherIncome - sso - tax - pvd;
  }
  const cash = qeReadNum(tr.querySelector('[data-field="cash"]'));
  const bank = net - cash;
  
  if (net > 0) {
    bankInput.value = bank > 0 ? bank.toLocaleString('en-US') : (bank === 0 ? '0' : '');
  } else {
    bankInput.value = '';
  }
}

/* ปุ่ม 🔧: บังคับคำนวณช่อง "เข้าบัญชี" ใหม่ทุกแถว = รับสุทธิ − เงินสด
 * ล้าง flag userEdited ทิ้งก่อน เพื่อให้เขียนทับค่าเก่า/ค่าเพี้ยนได้
 * แก้เคสข้อมูลเก่าที่ช่องเข้าบัญชีถูกตัด/บันทึกค่าเพี้ยน */
function recalcAllBankRows() {
  const wrap = document.getElementById('qeWrap');
  if (!wrap) return;
  const rows = wrap.querySelectorAll('.qe-table tbody tr[data-empid]');
  if (rows.length === 0) { toast('ไม่มีข้อมูลให้คำนวณ', 'info'); return; }
  
  if (!confirm('🔧 คำนวณช่อง "เข้าบัญชี" ใหม่ทุกแถว?\n\nสูตร: เข้าบัญชี = รับสุทธิ − เงินสด\nใช้แก้ข้อมูลเก่าที่ตัวเลขเข้าบัญชีเพี้ยน/ถูกตัด\n\n⚠️ จะเขียนทับค่าเข้าบัญชีเดิมทุกแถว — อย่าลืมกด 💾 บันทึกทั้งหมด หลังตรวจดูแล้ว')) return;
  
  let changed = 0;
  rows.forEach(tr => {
    const bankInput = tr.querySelector('[data-field="bank"]');
    if (!bankInput) return;
    const before = bankInput.value;
    bankInput.dataset.userEdited = 'false';  // ปลดล็อก ให้คำนวณทับได้
    updateQeNet(tr);                          // คำนวณรับสุทธิ + เข้าบัญชีใหม่
    if (bankInput.value !== before) changed++;
  });
  
  updateQeTotals();
  updateQeStatus();
  scheduleQeDraftSave();
  toast('🔧 คำนวณเข้าบัญชีใหม่แล้ว ' + changed + ' แถว — ตรวจดูแล้วกด 💾 บันทึกทั้งหมด เพื่อบันทึกขึ้น Sheets', 'success');
}

function applyBulkDate() {
  let date = document.getElementById('qeBulkDate').value.trim();
  if (!date) {
    toast('⚠️ กรุณาใส่วันที่ก่อน (เช่น 300469)', 'error');
    document.getElementById('qeBulkDate').focus();
    return;
  }
  date = normalizeDateStr(date);
  document.getElementById('qeBulkDate').value = date;  // echo กลับ
  
  const wrap = document.getElementById('qeWrap');
  const rows = wrap.querySelectorAll('.qe-table tbody tr[data-empid]');
  let count = 0;
  rows.forEach(tr => {
    // เฉพาะแถวที่มีข้อมูลเงินเดือน (เพื่อไม่ spam คนที่ยังไม่กรอก)
    const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
    if (salary > 0) {
      const dateInp = tr.querySelector('[data-field="receivedDate"]');
      if (dateInp) {
        dateInp.value = date;
        count++;
      }
    }
  });
  if (count > 0) {
    toast('✅ ใส่วันที่ ' + date + ' ให้ ' + count + ' คนแล้ว', 'success');
    updateQeStatus();
  } else {
    toast('⚠️ ยังไม่มีใครกรอกเงินเดือน', 'error');
  }
}

function applyBulkDateToEmpty() {
  let date = document.getElementById('qeBulkDate').value.trim();
  if (!date) {
    toast('⚠️ กรุณาใส่วันที่ก่อน', 'error');
    document.getElementById('qeBulkDate').focus();
    return;
  }
  date = normalizeDateStr(date);
  document.getElementById('qeBulkDate').value = date;
  
  const wrap = document.getElementById('qeWrap');
  const rows = wrap.querySelectorAll('.qe-table tbody tr[data-empid]');
  let count = 0;
  rows.forEach(tr => {
    const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
    const dateInp = tr.querySelector('[data-field="receivedDate"]');
    if (salary > 0 && dateInp && !dateInp.value.trim()) {
      dateInp.value = date;
      count++;
    }
  });
  if (count > 0) {
    toast('✅ เติมวันที่ ' + date + ' ให้ ' + count + ' ช่องที่ยังว่าง', 'success');
    updateQeStatus();
  } else {
    toast('ℹ️ ทุกคนมีวันที่แล้ว', 'info');
  }
}

function updateQeTotals() {
  const wrap = document.getElementById('qeWrap');
  const isMyanmar = document.getElementById('qeGroup').value.includes('พม่า');
  const fields = isMyanmar 
    ? ['salary', 'bonus', 'ot', 'holiday', 'debt', 'sso', 'ssoEmployer'] 
    : ['salary', 'otherIncome', 'sso', 'ssoEmployer', 'tax', 'pvd', 'pvdEmployer'];
  let totalNet = 0;
  let totalCash = 0;
  let totalBank = 0;
  const sumMap = {};
  fields.forEach(f => sumMap[f] = 0);
  
  wrap.querySelectorAll('.qe-table tbody tr[data-empid]').forEach(tr => {
    fields.forEach(f => {
      sumMap[f] += qeReadNum(tr.querySelector('[data-field="' + f + '"]'));
    });
    const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
    const otherIncome = qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
    const sso = qeReadNum(tr.querySelector('[data-field="sso"]'));
    const tax = qeReadNum(tr.querySelector('[data-field="tax"]'));
    const pvd = qeReadNum(tr.querySelector('[data-field="pvd"]'));
    const cash = qeReadNum(tr.querySelector('[data-field="cash"]'));
    const bank = qeReadNum(tr.querySelector('[data-field="bank"]'));
    const bonus = qeReadNum(tr.querySelector('[data-field="bonus"]'));
    const ot = qeReadNum(tr.querySelector('[data-field="ot"]'));
    const holiday = qeReadNum(tr.querySelector('[data-field="holiday"]'));
    const debt = qeReadNum(tr.querySelector('[data-field="debt"]'));
    totalNet += salary + otherIncome + bonus + ot - sso - tax - pvd - holiday - debt;
    totalCash += cash;
    totalBank += bank;
  });
  
  // เขียนค่าลงเซลล์ตาม data-field
  fields.forEach(f => {
    const cell = wrap.querySelector('.qe-total-cell[data-field="' + f + '"]');
    if (cell) {
      const v = sumMap[f];
      cell.textContent = v ? v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-';
    }
  });
  const netCell = wrap.querySelector('.qe-total-net');
  if (netCell) netCell.textContent = totalNet ? totalNet.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-';
  const cashCell = wrap.querySelector('.qe-total-cash');
  if (cashCell) cashCell.textContent = totalCash ? totalCash.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-';
  const bankCell = wrap.querySelector('.qe-total-bank');
  if (bankCell) bankCell.textContent = totalBank ? totalBank.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-';
}

/* ============================================================
 * QUICK ENTRY DRAFT (กันข้อมูลพิมพ์ค้างหาย — logout/ปิดแท็บ/เครื่องดับ)
 * เก็บค่าที่พิมพ์ในตาราง (ยังไม่กดบันทึก) ลง localStorage ทุก 600ms
 * พอเปิดตารางเดิม (กลุ่ม/ปี/เดือนเดียวกัน) จะถามว่ากู้คืนไหม
 * ============================================================ */
const QE_DRAFT_KEY = 'payroll_qe_draft_v1';
let qeDraftTimer = null;

function scheduleQeDraftSave() {
  if (qeDraftTimer) clearTimeout(qeDraftTimer);
  qeDraftTimer = setTimeout(saveQeDraft, 600);
}

function saveQeDraft() {
  qeDraftTimer = null;
  const wrap = document.getElementById('qeWrap');
  if (!wrap) return;
  const rows = wrap.querySelectorAll('.qe-table tbody tr[data-empid]');
  if (rows.length === 0) return;
  
  const values = [];
  rows.forEach(tr => {
    tr.querySelectorAll('input[data-field]').forEach(inp => {
      if (inp.value && inp.value.trim() !== '') {
        values.push({ empId: tr.dataset.empid, field: inp.dataset.field, value: inp.value });
      }
    });
  });
  
  try {
    if (values.length === 0) {
      localStorage.removeItem(QE_DRAFT_KEY);
      return;
    }
    localStorage.setItem(QE_DRAFT_KEY, JSON.stringify({
      group: document.getElementById('qeGroup').value,
      year: parseInt(document.getElementById('qeYear').value),
      month: parseInt(document.getElementById('qeMonth').value),
      at: new Date().toISOString(),
      values: values
    }));
  } catch (e) { console.error('QE draft save failed:', e); }
}

function clearQeDraft() {
  if (qeDraftTimer) { clearTimeout(qeDraftTimer); qeDraftTimer = null; }
  try { localStorage.removeItem(QE_DRAFT_KEY); } catch (e) {}
}

/* เรียกตอน loadQuickEntry render เสร็จ — ถ้ามี draft ของตารางเดียวกันค้างอยู่ ให้ถามกู้คืน */
function maybeRestoreQeDraft(group, year, month) {
  let draft = null;
  try {
    const raw = localStorage.getItem(QE_DRAFT_KEY);
    if (!raw) return;
    draft = JSON.parse(raw);
  } catch (e) { return; }
  
  if (!draft || draft.group !== group || draft.year !== year || draft.month !== month) return;
  if (!draft.values || draft.values.length === 0) return;
  
  // เทียบกับค่าที่ render จาก state — ถ้าเหมือนกันหมด แปลว่าบันทึกไปแล้ว ไม่ต้องถาม
  const wrap = document.getElementById('qeWrap');
  // สร้าง Map: empId → tr (ไม่ใช้ CSS.escape เพราะบาง browser เก่าไม่มี)
  const rowMap = {};
  wrap.querySelectorAll('.qe-table tbody tr[data-empid]').forEach(tr => {
    rowMap[tr.dataset.empid] = tr;
  });
  
  let differs = false;
  for (const v of draft.values) {
    const tr = rowMap[v.empId];
    if (!tr) continue;
    const inp = tr.querySelector('[data-field="' + v.field + '"]');
    if (inp && inp.value !== v.value) { differs = true; break; }
  }
  if (!differs) { clearQeDraft(); return; }
  
  const when = new Date(draft.at).toLocaleString('th-TH');
  if (!confirm('💾 พบข้อมูลที่พิมพ์ค้างไว้ ยังไม่ได้กดบันทึก\n(ล่าสุดเมื่อ ' + when + ')\n\nกู้คืนข้อมูลที่พิมพ์ค้างไหม?\n• ตกลง = กู้คืน\n• ยกเลิก = ทิ้ง draft ใช้ข้อมูลที่บันทึกล่าสุด')) {
    clearQeDraft();
    return;
  }
  
  let applied = 0;
  draft.values.forEach(v => {
    const tr = rowMap[v.empId];
    if (!tr) return;
    const inp = tr.querySelector('[data-field="' + v.field + '"]');
    if (!inp) return;
    inp.value = v.value;
    if (v.field === 'bank') inp.dataset.userEdited = 'true';  // กัน auto-calc ทับค่า draft
    applied++;
  });
  
  // คำนวณใหม่ทุกแถว
  wrap.querySelectorAll('.qe-table tbody tr[data-empid]').forEach(tr => updateQeNet(tr));
  updateQeTotals();
  updateQeStatus();
  toast('♻️ กู้คืนข้อมูลที่พิมพ์ค้าง ' + applied + ' ช่อง — อย่าลืมกด 💾 บันทึกทั้งหมด', 'info');
}

function saveQuickEntry() {
  const group = document.getElementById('qeGroup').value;
  const year = parseInt(document.getElementById('qeYear').value);
  const month = parseInt(document.getElementById('qeMonth').value);
  const isMyanmar = group.includes('พม่า');
  const wrap = document.getElementById('qeWrap');
  
  let savedCount = 0;
  wrap.querySelectorAll('.qe-table tbody tr[data-empid]').forEach(tr => {
    const empId = tr.dataset.empid;
    const salary = qeReadNum(tr.querySelector('[data-field="salary"]'));
    const otherIncome = isMyanmar ? 0 : qeReadNum(tr.querySelector('[data-field="otherIncome"]'));
    const sso = qeReadNum(tr.querySelector('[data-field="sso"]'));
    const ssoEmployer = qeReadNum(tr.querySelector('[data-field="ssoEmployer"]'));
    const tax = isMyanmar ? 0 : qeReadNum(tr.querySelector('[data-field="tax"]'));
    const pvd = isMyanmar ? 0 : qeReadNum(tr.querySelector('[data-field="pvd"]'));
    const pvdEmployer = isMyanmar ? 0 : qeReadNum(tr.querySelector('[data-field="pvdEmployer"]'));
    // พม่าเท่านั้น
    const bonus = isMyanmar ? qeReadNum(tr.querySelector('[data-field="bonus"]')) : 0;
    const ot = isMyanmar ? qeReadNum(tr.querySelector('[data-field="ot"]')) : 0;
    const holiday = isMyanmar ? qeReadNum(tr.querySelector('[data-field="holiday"]')) : 0;
    const debt = isMyanmar ? qeReadNum(tr.querySelector('[data-field="debt"]')) : 0;
    const cash = qeReadNum(tr.querySelector('[data-field="cash"]'));
    // เก็บ bank เป็นตัวเลขสะอาด (strip comma) — กันปัญหา parseFloat ตัดที่ comma ตอนโหลดกลับ
    const bankRaw = (tr.querySelector('[data-field="bank"]') || {}).value || '';
    const bank = bankRaw === '' ? '' : (parseFloat(String(bankRaw).replace(/,/g,'')) || 0);
    const receivedDate = (tr.querySelector('[data-field="receivedDate"]') || {}).value || '';
    const note = (tr.querySelector('[data-field="note"]') || {}).value || '';
    
    // เก็บ receivedBy ไว้ด้วย (backward compat) — ถ้ามี bank ก็ใช้ bank, else cash > 0 = 'เงินสด'
    const receivedBy = bank || (cash > 0 ? 'เงินสด' : '');
    
    // เขียนลง state ถ้ามีข้อมูลอย่างน้อย 1 ช่อง
    const hasData = salary || otherIncome || sso || tax || pvd || cash || bank || receivedDate || note || bonus || ot || holiday || debt;
    const key = salaryKey(empId, year, month);
    
    if (hasData) {
      state.data.salaries[key] = { 
        empId, year, month, salary, otherIncome, sso, ssoEmployer, tax, pvd, pvdEmployer, 
        bonus, ot, holiday, debt,
        cash, bank, receivedBy, receivedDate, note 
      };
      savedCount++;
    } else {
      // ถ้าไม่มีข้อมูลเลย ลบออกเพื่อไม่ให้ storage บวม
      if (state.data.salaries[key]) {
        delete state.data.salaries[key];
      }
    }
  });
  
  saveLocal();
  schedulePush();
  clearQeDraft();  // บันทึกแล้ว — ทิ้ง draft
  updateQeStatus();
  toast('💾 บันทึกเรียบร้อย ' + savedCount + ' รายการ', 'success');
}
