/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Print */
/* ============================================================
 * PRINT
 * ============================================================ */
function bindPrintDropdowns() {
  // Yearly
  const groupY = document.getElementById('printYearlyGroup').value;
  const empsY = state.data.employees.filter(e => e.group === groupY);
  empsY.sort((a, b) => (a.empId || '').localeCompare(b.empId || ''));
  document.getElementById('printYearlyEmp').innerHTML =
    '<option value="">-- พิมพ์ทั้งกลุ่ม --</option>' +
    empsY.map(e => `<option value="${escapeHtml(e.empId)}">${escapeHtml(e.empId)} - ${escapeHtml(e.firstName)} ${escapeHtml(e.lastName || e.nameEn || '')}</option>`).join('');
  
  // Slip
  const groupS = document.getElementById('printSlipGroup').value;
  const empsS = state.data.employees.filter(e => e.group === groupS);
  empsS.sort((a, b) => (a.empId || '').localeCompare(b.empId || ''));
  document.getElementById('printSlipEmp').innerHTML =
    '<option value="">-- พิมพ์ทั้งกลุ่ม --</option>' +
    empsS.map(e => `<option value="${escapeHtml(e.empId)}">${escapeHtml(e.empId)} - ${escapeHtml(e.firstName)} ${escapeHtml(e.lastName || e.nameEn || '')}</option>`).join('');
  
  // WHT 50 ทวิ
  const groupW = document.getElementById('printWhtGroup');
  if (groupW) {
    const empsW = state.data.employees.filter(e => e.group === groupW.value);
    empsW.sort((a, b) => (a.empId || '').localeCompare(b.empId || ''));
    document.getElementById('printWhtEmp').innerHTML =
      '<option value="">-- พิมพ์ทั้งกลุ่ม --</option>' +
      empsW.map(e => `<option value="${escapeHtml(e.empId)}">${escapeHtml(e.empId)} - ${escapeHtml(e.firstName)} ${escapeHtml(e.lastName || e.nameEn || '')}</option>`).join('');
  }
  
  // Init month checkboxes
  initMonthChecks();
}

function initMonthChecks() {
  const container = document.getElementById('yearlyMonthChecks');
  if (!container) return;
  if (container.children.length > 0) return; // แค่ครั้งแรก
  
  const shortMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  container.innerHTML = shortMonths.map((name, i) => `
    <label style="display:flex; align-items:center; gap:4px; cursor:pointer; padding:4px 8px; background:#f8f9fa; border-radius:4px; font-size:13px;">
      <input type="checkbox" value="${i+1}" checked> ${name}
    </label>
  `).join('');
}

function selectYearlyMonths(mode) {
  const checkboxes = document.querySelectorAll('#yearlyMonthChecks input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = (mode === 'all');
  });
}

function updateYearlyMode() {
  const mode = document.querySelector('input[name="yearlyMode"]:checked').value;
  // ถ้าเปลี่ยนเป็น "พิมพ์เฉพาะข้อมูล" ให้ล้างเดือนที่เลือก เพื่อให้ผู้ใช้เลือกใหม่
  if (mode === 'data-only') {
    selectYearlyMonths('none');
    toast('💡 เลือกเดือนที่จะพิมพ์ลงใบเดิม', 'warning');
  } else {
    selectYearlyMonths('all');
  }
}

function printYearly(multi) {
  const group = document.getElementById('printYearlyGroup').value;
  const year = parseInt(document.getElementById('printYearlyYear').value);
  const empId = document.getElementById('printYearlyEmp').value;
  
  if (!multi && !empId) {
    toast('กรุณาเลือกพนักงาน หรือคลิก "พิมพ์ทั้งกลุ่ม"', 'error');
    return;
  }
  
  let emps;
  if (multi) {
    emps = state.data.employees.filter(e => e.group === group && isActiveInYear(e, year));
  } else {
    const emp = state.data.employees.find(e => e.empId === empId);
    emps = emp ? [emp] : [];
  }
  
  if (emps.length === 0) {
    toast('ไม่พบข้อมูลพนักงาน', 'error');
    return;
  }
  
  // ดึงค่าโหมด + เดือน + offset
  const mode = document.querySelector('input[name="yearlyMode"]:checked').value;
  const selectedMonths = [];
  document.querySelectorAll('#yearlyMonthChecks input[type="checkbox"]:checked').forEach(cb => {
    selectedMonths.push(parseInt(cb.value));
  });
  const includeBonus = document.getElementById('yearlyIncludeBonus').checked;
  const offsetX = parseFloat(document.getElementById('yearlyOffsetX').value) || 0;
  const offsetY = parseFloat(document.getElementById('yearlyOffsetY').value) || 0;
  
  if (selectedMonths.length === 0 && !includeBonus) {
    toast('กรุณาเลือกอย่างน้อย 1 เดือน หรือเลือกพิมพ์โบนัส', 'error');
    return;
  }
  
  emps.sort((a, b) => (a.empId || '').localeCompare(b.empId || ''));
  openPrintWindow('yearly', { emps, year, mode, selectedMonths, includeBonus, offsetX, offsetY });
}

function printSlip(multi) {
  const group = document.getElementById('printSlipGroup').value;
  const year = parseInt(document.getElementById('printSlipYear').value);
  const month = parseInt(document.getElementById('printSlipMonth').value);
  const empId = document.getElementById('printSlipEmp').value;
  
  if (!multi && !empId) {
    toast('กรุณาเลือกพนักงาน หรือคลิก "พิมพ์ทั้งกลุ่ม"', 'error');
    return;
  }
  
  let emps;
  if (multi) {
    emps = state.data.employees.filter(e => e.group === group && isActiveForMonthView(e, year, month));
    // กรองเฉพาะคนที่มีเงินเดือนในเดือนนั้น
    emps = emps.filter(e => {
      const s = state.data.salaries[salaryKey(e.empId, year, month)];
      return s && (s.salary > 0 || s.otherIncome > 0);
    });
  } else {
    const emp = state.data.employees.find(e => e.empId === empId);
    emps = emp ? [emp] : [];
  }
  
  if (emps.length === 0) {
    toast('ไม่พบข้อมูลสลิปเงินเดือน', 'error');
    return;
  }
  
  // ดึงค่าโหมด + offset
  const mode = document.querySelector('input[name="slipMode"]:checked').value;
  const offsetX = parseFloat(document.getElementById('slipOffsetX').value) || 0;
  const offsetY = parseFloat(document.getElementById('slipOffsetY').value) || 0;
  
  emps.sort((a, b) => (a.empId || '').localeCompare(b.empId || ''));
  openPrintWindow('slip', { emps, year, month, mode, offsetX, offsetY });
}
