/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Employees */
/* ============================================================
 * EMPLOYEES
 * ============================================================ */
function renderEmployees() {
  const group = document.getElementById('empGroupFilter').value;
  const q = state.ui.searchQuery.toLowerCase();
  
  let emps = state.data.employees.slice();
  if (group) emps = emps.filter(e => e.group === group);
  if (q) {
    emps = emps.filter(e =>
      (e.empId || '').toLowerCase().includes(q) ||
      (e.firstName || '').toLowerCase().includes(q) ||
      (e.lastName || '').toLowerCase().includes(q) ||
      (e.nameEn || '').toLowerCase().includes(q)
    );
  }
  
  // แยกคนทำงาน / ลาออกแล้ว
  const active = emps.filter(e => isActiveNow(e)).sort(employeeComparator());
  const resigned = emps.filter(e => !isActiveNow(e)).sort(employeeComparator());
  
  // ---- ตารางกำลังทำงาน (ลากจัดลำดับได้) ----
  const tbody = document.getElementById('empTbody');
  document.getElementById('empActiveCount').textContent = '(' + active.length + ' คน)';
  if (active.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" class="loading">ไม่พบพนักงานที่ทำงานอยู่</td></tr>';
  } else {
    tbody.innerHTML = active.map(e => `
      <tr draggable="true" data-empid="${escapeHtml(e.empId)}" class="emp-drag-row">
        <td style="text-align:center; cursor:grab; color:#bbb; font-size:18px;" class="emp-drag-handle" title="ลากเพื่อจัดลำดับ">⠿</td>
        <td><strong>${escapeHtml(e.empId)}</strong></td>
        <td>${escapeHtml(e.firstName || '')}</td>
        <td>${escapeHtml(e.lastName || '')}</td>
        <td>${escapeHtml(e.nameEn || '')}</td>
        <td>${escapeHtml(e.position || '')}</td>
        <td>${escapeHtml(e.idCard || '')}</td>
        <td>${escapeHtml(e.startDate || '')}</td>
        <td>${escapeHtml(e.group)}</td>
        <td style="text-align:center;">${(e.fundRate && e.fundRate > 0) ? '<span style="background:#e8f5e9; color:#27ae60; padding:2px 8px; border-radius:10px; font-weight:600;">' + e.fundRate + '%</span>' : '<span style="color:#bdc3c7;">-</span>'}</td>
        <td style="text-align:center;">${(e.fundRateEmployer && e.fundRateEmployer > 0) ? '<span style="background:#e3f2fd; color:#1976d2; padding:2px 8px; border-radius:10px; font-weight:600;">' + e.fundRateEmployer + '%</span>' : '<span style="color:#bdc3c7;">-</span>'}</td>
        <td><span class="badge badge-active">ทำงาน</span></td>
        <td>
          <button class="btn-primary btn-sm" onclick="editEmp('${encodeURIComponent(e.empId)}')">✏️</button>
          <button class="btn-danger btn-sm" onclick="delEmp('${encodeURIComponent(e.empId)}')">🗑️</button>
        </td>
      </tr>
    `).join('');
    setupEmpDragDrop();
  }
  
  // ---- ตารางลาออกแล้ว (เรียงตามรหัส ไม่ลาก) ----
  const tbodyR = document.getElementById('empTbodyResigned');
  document.getElementById('empResignedCount').textContent = '(' + resigned.length + ' คน)';
  if (resigned.length === 0) {
    tbodyR.innerHTML = '<tr><td colspan="11" class="loading">ไม่มีพนักงานที่ลาออก</td></tr>';
  } else {
    tbodyR.innerHTML = resigned.map(e => `
      <tr style="opacity:0.72;">
        <td><strong>${escapeHtml(e.empId)}</strong></td>
        <td>${escapeHtml(e.firstName || '')}</td>
        <td>${escapeHtml(e.lastName || '')}</td>
        <td>${escapeHtml(e.nameEn || '')}</td>
        <td>${escapeHtml(e.position || '')}</td>
        <td>${escapeHtml(e.idCard || '')}</td>
        <td>${escapeHtml(e.startDate || '')}</td>
        <td style="color:#c0392b;">${escapeHtml(e.endDate || '')}</td>
        <td>${escapeHtml(e.group)}</td>
        <td><span class="badge badge-inactive">ออกแล้ว</span></td>
        <td>
          <button class="btn-primary btn-sm" onclick="editEmp('${encodeURIComponent(e.empId)}')">✏️</button>
          <button class="btn-danger btn-sm" onclick="delEmp('${encodeURIComponent(e.empId)}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  }
}

/* ---- Drag & Drop จัดลำดับพนักงาน (ตารางกำลังทำงาน) ----
 * บันทึกลำดับลง state.data.empOrder (ทั้งกลุ่ม รวมกันในลำดับเดียว)
 * เก็บขึ้น Sheets ผ่าน schedulePush */
let empDragSrc = null;

function setupEmpDragDrop() {
  const rows = document.querySelectorAll('#empTbody tr.emp-drag-row');
  rows.forEach(row => {
    row.addEventListener('dragstart', (e) => {
      empDragSrc = row;
      row.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      row.style.opacity = '';
      document.querySelectorAll('#empTbody tr.emp-drag-row').forEach(r => r.style.borderTop = '');
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (row !== empDragSrc) row.style.borderTop = '3px solid #2980b9';
    });
    row.addEventListener('dragleave', () => { row.style.borderTop = ''; });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.style.borderTop = '';
      if (!empDragSrc || empDragSrc === row) return;
      const tbody = document.getElementById('empTbody');
      const rowsArr = [...tbody.querySelectorAll('tr.emp-drag-row')];
      const srcIdx = rowsArr.indexOf(empDragSrc);
      const tgtIdx = rowsArr.indexOf(row);
      // วางก่อน/หลังตามทิศ
      if (srcIdx < tgtIdx) row.after(empDragSrc);
      else row.before(empDragSrc);
      commitEmpOrder();
    });
  });
}

/* อ่านลำดับแถวปัจจุบันในตาราง → เขียนลง empOrder → push */
function commitEmpOrder() {
  const tbody = document.getElementById('empTbody');
  const ids = [...tbody.querySelectorAll('tr.emp-drag-row')].map(r => r.dataset.empid);
  if (!state.data.empOrder) state.data.empOrder = {};
  // ให้ลำดับเริ่มจากค่าฐานสูงๆ เผื่อคนใหม่/กลุ่มอื่นแทรก — ใช้ index ตรงๆ พอ
  // เก็บเฉพาะคนในตารางที่เห็น แล้วต่อท้ายด้วยคนอื่นที่มีลำดับเดิม
  let pos = 0;
  ids.forEach(id => { state.data.empOrder[id] = pos++; });
  saveLocal();
  schedulePush();
  toast('✅ จัดลำดับแล้ว — ใช้ทั้งระบบ บันทึกขึ้น Sheets อัตโนมัติ', 'success');
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}

function openEmpModal() {
  document.getElementById('empModalMode').value = 'add';
  document.getElementById('empOriginalId').value = '';
  document.getElementById('empModalTitle').textContent = 'เพิ่มพนักงานใหม่';
  ['empId','empFirstName','empLastName','empNameEn','empPosition','empIdCard','empAddress','empStartDate','empEndDate'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('empFundRate').value = '0';
  document.getElementById('empFundRateEmployer').value = '0';
  document.getElementById('empId').disabled = false;
  suggestEmpId();
  document.getElementById('empModal').classList.add('show');
}

function suggestEmpId() {
  const mode = document.getElementById('empModalMode').value;
  if (mode === 'edit') return;  // แก้ไขอยู่ ไม่ต้อง suggest
  
  const group = document.getElementById('empGroup').value;
  const empIdInput = document.getElementById('empId');
  
  // ถ้าผู้ใช้พิมพ์เองแล้ว ไม่แก้
  if (empIdInput.value.trim() !== '' && !empIdInput.dataset.autoSuggested) return;
  
  // prefix ตามกลุ่ม
  let prefix;
  if (group === 'BCF ไทย') prefix = 'B';
  else if (group === 'BCF พม่า') prefix = 'T-';
  else if (group === 'ฟาร์ม1') prefix = 'F1-';
  else if (group === 'ฟาร์ม3') prefix = 'F3-';
  else if (group === 'SNP') prefix = 'SNP-';
  else return;
  
  // หาเลขสูงสุดใน group ที่ prefix ตรงกัน
  const empsInGroup = state.data.employees.filter(e => e.empId && e.empId.startsWith(prefix));
  let maxNum = 0;
  empsInGroup.forEach(e => {
    const rest = e.empId.substring(prefix.length);
    const num = parseInt(rest);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });
  
  const nextNum = maxNum + 1;
  let suggested;
  if (prefix === 'B') suggested = prefix + String(nextNum).padStart(3, '0');  // B001
  else suggested = prefix + String(nextNum).padStart(2, '0');  // T-01, F1-01, F3-01, S-01
  
  empIdInput.value = suggested;
  empIdInput.dataset.autoSuggested = 'true';
  
  // ถ้าผู้ใช้แก้ input เอง ลบ flag
  empIdInput.addEventListener('input', function handler() {
    delete empIdInput.dataset.autoSuggested;
    empIdInput.removeEventListener('input', handler);
  }, { once: true });
}

function editEmp(empIdEncoded) {
  const empId = decodeURIComponent(empIdEncoded);
  const emp = state.data.employees.find(e => e.empId === empId);
  if (!emp) return;
  
  document.getElementById('empModalMode').value = 'edit';
  document.getElementById('empOriginalId').value = empId;
  document.getElementById('empModalTitle').textContent = 'แก้ไขพนักงาน: ' + empId;
  document.getElementById('empId').value = emp.empId;
  document.getElementById('empId').disabled = true;
  document.getElementById('empFirstName').value = emp.firstName || '';
  document.getElementById('empLastName').value = emp.lastName || '';
  document.getElementById('empNameEn').value = emp.nameEn || '';
  document.getElementById('empPosition').value = emp.position || '';
  document.getElementById('empIdCard').value = emp.idCard || '';
  document.getElementById('empAddress').value = emp.address || '';
  document.getElementById('empStartDate').value = emp.startDate || '';
  document.getElementById('empEndDate').value = emp.endDate || '';
  document.getElementById('empFundRate').value = emp.fundRate !== undefined ? emp.fundRate : 0;
  document.getElementById('empFundRateEmployer').value = emp.fundRateEmployer !== undefined ? emp.fundRateEmployer : 0;
  document.getElementById('empGroup').value = emp.group;
  document.getElementById('empModal').classList.add('show');
}

function closeEmpModal() {
  document.getElementById('empModal').classList.remove('show');
}

function saveEmp() {
  const mode = document.getElementById('empModalMode').value;
  const fundRateRaw = document.getElementById('empFundRate').value.trim();
  let fundRate = parseFloat(fundRateRaw);
  if (isNaN(fundRate) || fundRate < 0) fundRate = 0;
  if (fundRate > 15) fundRate = 15;
  
  const fundRateEmpRaw = document.getElementById('empFundRateEmployer').value.trim();
  let fundRateEmployer = parseFloat(fundRateEmpRaw);
  if (isNaN(fundRateEmployer) || fundRateEmployer < 0) fundRateEmployer = 0;
  if (fundRateEmployer > 15) fundRateEmployer = 15;
  
  const empData = {
    empId: document.getElementById('empId').value.trim(),
    firstName: document.getElementById('empFirstName').value.trim(),
    lastName: document.getElementById('empLastName').value.trim(),
    nameEn: document.getElementById('empNameEn').value.trim(),
    position: document.getElementById('empPosition').value.trim(),
    idCard: document.getElementById('empIdCard').value.trim(),
    address: document.getElementById('empAddress').value.trim(),
    startDate: document.getElementById('empStartDate').value.trim(),
    endDate: document.getElementById('empEndDate').value.trim(),
    fundRate: fundRate,
    fundRateEmployer: fundRateEmployer,
    group: document.getElementById('empGroup').value
  };
  
  if (!empData.empId || !empData.firstName) {
    toast('กรุณากรอกรหัสและชื่อพนักงาน', 'error');
    return;
  }
  
  if (mode === 'add') {
    if (state.data.employees.find(e => e.empId === empData.empId)) {
      toast('รหัสพนักงานซ้ำ', 'error');
      return;
    }
    state.data.employees.push(empData);
  } else {
    const idx = state.data.employees.findIndex(e => e.empId === empData.empId);
    if (idx >= 0) state.data.employees[idx] = empData;
  }
  
  schedulePush();
  closeEmpModal();
  renderEmployees();
  renderDashboard();
  toast('✅ บันทึกสำเร็จ');
}

function delEmp(empIdEncoded) {
  const empId = decodeURIComponent(empIdEncoded);
  if (!confirm(`ยืนยันการลบพนักงาน ${empId}?\n\n⚠️ ข้อมูลเงินเดือนของพนักงานคนนี้จะถูกลบด้วย`)) return;
  
  state.data.employees = state.data.employees.filter(e => e.empId !== empId);
  // ลบเงินเดือนและโบนัสทั้งหมดของคนนี้
  Object.keys(state.data.salaries).forEach(k => {
    if (k.startsWith(empId + '_')) delete state.data.salaries[k];
  });
  Object.keys(state.data.bonuses).forEach(k => {
    if (k.startsWith(empId + '_')) delete state.data.bonuses[k];
  });
  
  schedulePush();
  renderEmployees();
  renderDashboard();
  toast('✅ ลบสำเร็จ');
}
