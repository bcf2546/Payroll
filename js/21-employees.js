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
  
  // Sort by empId
  emps.sort((a, b) => (a.empId || '').localeCompare(b.empId || ''));
  
  const tbody = document.getElementById('empTbody');
  if (emps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" class="loading">ไม่พบข้อมูล</td></tr>';
    return;
  }
  
  tbody.innerHTML = emps.map(e => `
    <tr>
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
      <td><span class="badge ${e.endDate ? 'badge-inactive' : 'badge-active'}">${e.endDate ? 'ออกแล้ว' : 'ทำงาน'}</span></td>
      <td>
        <button class="btn-primary btn-sm" onclick="editEmp('${encodeURIComponent(e.empId)}')">✏️</button>
        <button class="btn-danger btn-sm" onclick="delEmp('${encodeURIComponent(e.empId)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
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
