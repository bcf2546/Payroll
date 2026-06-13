/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Utilities + Tab Navigation */
/* ============================================================
 * UTILITIES
 * ============================================================ */

/* ---- การเรียงลำดับพนักงาน (ใช้ทั้งระบบ) ----
 * ลำดับความสำคัญ:
 *   1. ลำดับที่ผู้ใช้จัดเอง (drag & drop) — เก็บใน state.data.empOrder[empId] = ตำแหน่ง
 *   2. ถ้าไม่มีลำดับเอง → natural sort ตามรหัส (T-2 มาก่อน T-10, B100 หลัง B11)
 * natural sort: แยกตัวเลขในรหัสออกมาเทียบเป็นเลขจริง ไม่ใช่ตัวอักษร */
function naturalCompareId(a, b) {
  const ax = String(a || ''), bx = String(b || '');
  // แตกเป็นชิ้น: ตัวอักษร / ตัวเลข สลับกัน
  const re = /(\d+|\D+)/g;
  const ap = ax.match(re) || [], bp = bx.match(re) || [];
  const n = Math.max(ap.length, bp.length);
  for (let i = 0; i < n; i++) {
    const as = ap[i] || '', bs = bp[i] || '';
    const an = parseInt(as, 10), bn = parseInt(bs, 10);
    const aIsNum = !isNaN(an) && /^\d+$/.test(as);
    const bIsNum = !isNaN(bn) && /^\d+$/.test(bs);
    if (aIsNum && bIsNum) {
      if (an !== bn) return an - bn;       // เทียบเป็นเลขจริง
    } else {
      const c = as.localeCompare(bs, 'th');
      if (c !== 0) return c;
    }
  }
  return 0;
}

/* คืน comparator สำหรับ .sort() — เคารพลำดับ custom ก่อน แล้วค่อย natural */
function employeeComparator() {
  const order = (state.data && state.data.empOrder) || {};
  return function (a, b) {
    const ao = order[a.empId], bo = order[b.empId];
    const aHas = ao !== undefined && ao !== null;
    const bHas = bo !== undefined && bo !== null;
    if (aHas && bHas) {
      if (ao !== bo) return ao - bo;        // ทั้งคู่มีลำดับเอง → ใช้ลำดับนั้น
    } else if (aHas) {
      return -1;                            // คนมีลำดับเอง มาก่อนคนไม่มี
    } else if (bHas) {
      return 1;
    }
    return naturalCompareId(a.empId, b.empId);  // fallback: natural sort
  };
}

/* เรียง array พนักงาน in-place ตามลำดับมาตรฐานของระบบ แล้ว return array เดิม */
function sortEmployees(arr) {
  return arr.sort(employeeComparator());
}

/* ---- ปิด modal แบบปลอดภัย (กันลากเมาส์คลุมข้อความแล้ว modal ปิดเอง) ----
 * ปัญหาเดิม: ใช้ event 'click' ที่ backdrop → ถ้าเริ่มลากในช่อง input แล้วปล่อยเมาส์
 *   นอกกรอบ จะนับเป็น click ที่ backdrop → ปิด modal ทิ้งข้อมูล
 * วิธีแก้: ปิดเฉพาะเมื่อ "เริ่มกด (mousedown) ที่ backdrop เอง" เท่านั้น
 * ใช้: bindModalBackdropClose(modalEl, closeFn)  — backdropMatch บอกว่า element ไหนคือพื้นหลัง */
function bindModalBackdropClose(modalEl, closeFn, backdropMatch) {
  if (!modalEl || modalEl.dataset.backdropBound === '1') return;
  modalEl.dataset.backdropBound = '1';
  let downOnBackdrop = false;
  const isBackdrop = backdropMatch || ((target) => target === modalEl);
  modalEl.addEventListener('mousedown', (e) => {
    downOnBackdrop = isBackdrop(e.target);
  });
  modalEl.addEventListener('mouseup', (e) => {
    // ปิดเฉพาะเมื่อ "ทั้งกดและปล่อย" อยู่ที่ backdrop (ไม่ใช่ลากออกมาจากในกรอบ)
    if (downOnBackdrop && isBackdrop(e.target)) closeFn();
    downOnBackdrop = false;
  });
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function formatNum(n) {
  if (!n || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-US', { 
    minimumFractionDigits: 0, maximumFractionDigits: 2 
  });
}

function formatNumEmpty(n) {
  if (!n || isNaN(n) || n === 0) return '';
  return formatNum(n);
}

// ปัดเศษตามกฎประกันสังคม/เงินเดือน:
// เศษ ≥ 0.50 สตางค์ → ปัดขึ้นเป็น 1 บาท
// เศษ < 0.50 สตางค์ → ปัดทิ้ง
// (ใช้สำหรับค่าบวกเท่านั้น — SSO, PVD, TAX)
function ssoRound(n) {
  if (!n || n <= 0) return 0;
  return Math.floor(n + 0.5);
}

function calcSSO(salary) {
  // ม.33: เงินเดือนต่ำกว่าฐานขั้นต่ำ ให้คิดจากฐานขั้นต่ำ 1,650 (ไม่ใช่ 0)
  // — logic เดียวกับ autoCalcSsoRow ใน Quick Entry
  if (!salary || salary <= 0) return 0;
  const base = Math.max(salary, CONFIG_DEFAULTS.SSO_MIN_BASE);
  let sso = ssoRound(base * CONFIG_DEFAULTS.SSO_RATE);
  if (sso > CONFIG_DEFAULTS.SSO_MAX) sso = CONFIG_DEFAULTS.SSO_MAX;
  return sso;
}

function salaryKey(empId, year, month) {
  return empId + '_' + year + '_' + month;
}

function bonusKey(empId, year) {
  return empId + '_' + year;
}

function numberToThaiText(num) {
  if (!num || num === 0 || isNaN(num)) return 'ศูนย์บาทถ้วน';
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  function readNum(numStr) {
    let result = '';
    const len = numStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(numStr[i]);
      const pos = len - i - 1;
      if (digit === 0) continue;
      if (pos === 0 && digit === 1 && len > 1) result += 'เอ็ด';
      else if (pos === 1 && digit === 2) result += 'ยี่' + positions[pos];
      else if (pos === 1 && digit === 1) result += positions[pos];
      else result += digits[digit] + positions[pos];
    }
    return result;
  }
  
  function convert(n) {
    if (n === 0) return 'ศูนย์';
    let result = '';
    const million = Math.floor(n / 1000000);
    const rest = n % 1000000;
    if (million > 0) result += convert(million) + 'ล้าน';
    if (rest > 0) result += readNum(String(rest));
    return result;
  }
  
  const rounded = Math.round(num * 100) / 100;
  const baht = Math.floor(rounded);
  const satang = Math.round((rounded - baht) * 100);
  
  let text = '';
  if (baht > 0) text += convert(baht) + 'บาท';
  if (satang > 0) text += convert(satang) + 'สตางค์';
  else text += 'ถ้วน';
  return text || 'ศูนย์บาทถ้วน';
}

/* ============================================================
 * TAB NAVIGATION
 * ============================================================ */
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById('panel-' + tabName).classList.add('active');
  renderCurrentTab();
}

function renderCurrentTab() {
  const active = document.querySelector('.tab.active');
  if (!active) return;
  const tabName = active.dataset.tab;
  
  if (tabName === 'dashboard') renderDashboard();
  else if (tabName === 'employees') renderEmployees();
  else if (tabName === 'quickentry') { bindQuickEntryDropdowns(); }
  else if (tabName === 'salary') { bindSalaryDropdowns(); }
  else if (tabName === 'summary') { bindSummaryDropdowns(); }
  else if (tabName === 'print') { bindPrintDropdowns(); }
  else if (tabName === 'settings') renderSettings();
}
