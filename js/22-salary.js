/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Salary Entry */
/* ============================================================
 * SALARY ENTRY
 * ============================================================ */
function bindSalaryDropdowns() {
  const sel = document.getElementById('salEmployee');
  const group = document.getElementById('salGroup').value;
  const emps = state.data.employees.filter(e => e.group === group && !e.endDate);
  emps.sort((a, b) => (a.empId || '').localeCompare(b.empId || ''));
  sel.innerHTML = '<option value="">-- เลือกพนักงาน --</option>' +
    emps.map(e => `<option value="${escapeHtml(e.empId)}">${escapeHtml(e.empId)} - ${escapeHtml(e.firstName)} ${escapeHtml(e.lastName || e.nameEn || '')}</option>`).join('');
}

function loadSalary() {
  const empId = document.getElementById('salEmployee').value;
  const year = parseInt(document.getElementById('salYear').value);
  if (!empId || !year) {
    toast('กรุณาเลือกพนักงานและปี', 'error');
    return;
  }
  
  const emp = state.data.employees.find(e => e.empId === empId);
  if (!emp) return;
  
  state.ui.currentEmp = emp;
  state.ui.currentYear = year;
  
  document.getElementById('salEmpName').textContent = 
    `${emp.empId} - ${emp.firstName} ${emp.lastName || emp.nameEn || ''}`;
  document.getElementById('salEmpInfo').textContent =
    `${emp.position ? '| ' + emp.position : ''}${emp.idCard ? ' | บัตรปชช. ' + emp.idCard : ''}`;
  
  renderSalaryForm();
  document.getElementById('salaryFormArea').style.display = 'block';
  document.getElementById('salaryEmptyState').style.display = 'none';
}

function renderSalaryForm() {
  const empId = state.ui.currentEmp.empId;
  const year = state.ui.currentYear;
  
  const tbody = document.getElementById('salaryTbody');
  tbody.innerHTML = MONTHS.map((name, idx) => {
    const m = idx + 1;
    const s = state.data.salaries[salaryKey(empId, year, m)] || {};
    return `
      <tr data-month="${m}">
        <td class="month-cell">${name}</td>
        <td><input type="number" step="0.01" data-field="salary" value="${s.salary || ''}"></td>
        <td><input type="number" step="0.01" data-field="otherIncome" value="${s.otherIncome || ''}"></td>
        <td class="calc-cell" data-col="total">0</td>
        <td><input type="number" step="0.01" data-field="sso" value="${s.sso || ''}"></td>
        <td><input type="number" step="0.01" data-field="tax" value="${s.tax || ''}"></td>
        <td><input type="number" step="0.01" data-field="pvd" value="${s.pvd || ''}"></td>
        <td class="net-cell" data-col="net">0</td>
        <td><input type="text" data-field="receivedBy" value="${escapeHtml(s.receivedBy || '')}" placeholder="รับโดย"></td>
        <td><input type="text" data-field="receivedDate" value="${escapeHtml(s.receivedDate || '')}" placeholder="dd/MM"></td>
      </tr>
    `;
  }).join('');
  
  // Bonus
  const bonus = state.data.bonuses[bonusKey(empId, year)] || {};
  document.getElementById('bonusAmount').value = bonus.amount || '';
  document.getElementById('bonusReceivedBy').value = bonus.receivedBy || '';
  document.getElementById('bonusDate').value = bonus.receivedDate || '';
  
  // Bind listeners
  document.querySelectorAll('#salaryTbody input').forEach(input => {
    input.addEventListener('input', () => {
      recalcRow(input.closest('tr'));
    });
    input.addEventListener('blur', () => {
      const row = input.closest('tr');
      const field = input.dataset.field;
      // Auto calc SSO เมื่อกรอก salary แล้ว SSO ว่าง
      if (field === 'salary') {
        const ssoInput = row.querySelector('[data-field="sso"]');
        const salary = parseFloat(input.value) || 0;
        if (salary > 0 && !ssoInput.value) {
          ssoInput.value = calcSSO(salary);
          recalcRow(row);
        }
      }
    });
  });
  
  document.getElementById('bonusAmount').addEventListener('input', () => {
    document.getElementById('bonusDisplay').textContent = formatNum(parseFloat(document.getElementById('bonusAmount').value) || 0);
  });
  
  // Init calc
  document.querySelectorAll('#salaryTbody tr').forEach(recalcRow);
  updateTotals();
  document.getElementById('bonusDisplay').textContent = formatNum(bonus.amount || 0);
}

function recalcRow(row) {
  const salary = parseFloat(row.querySelector('[data-field="salary"]').value) || 0;
  const otherIncome = parseFloat(row.querySelector('[data-field="otherIncome"]').value) || 0;
  const sso = parseFloat(row.querySelector('[data-field="sso"]').value) || 0;
  const tax = parseFloat(row.querySelector('[data-field="tax"]').value) || 0;
  const pvd = parseFloat(row.querySelector('[data-field="pvd"]').value) || 0;
  
  const total = salary + otherIncome;
  const net = total - sso - tax - pvd;
  
  row.querySelector('[data-col="total"]').textContent = formatNum(total);
  row.querySelector('[data-col="net"]').textContent = formatNum(net);
  
  updateTotals();
}

function updateTotals() {
  const sums = { salary:0, otherIncome:0, total:0, sso:0, tax:0, pvd:0, net:0 };
  document.querySelectorAll('#salaryTbody tr').forEach(row => {
    const salary = parseFloat(row.querySelector('[data-field="salary"]').value) || 0;
    const otherIncome = parseFloat(row.querySelector('[data-field="otherIncome"]').value) || 0;
    const sso = parseFloat(row.querySelector('[data-field="sso"]').value) || 0;
    const tax = parseFloat(row.querySelector('[data-field="tax"]').value) || 0;
    const pvd = parseFloat(row.querySelector('[data-field="pvd"]').value) || 0;
    sums.salary += salary;
    sums.otherIncome += otherIncome;
    sums.total += salary + otherIncome;
    sums.sso += sso;
    sums.tax += tax;
    sums.pvd += pvd;
    sums.net += salary + otherIncome - sso - tax - pvd;
  });
  
  document.querySelectorAll('tfoot .total-row [data-col]').forEach(cell => {
    const col = cell.dataset.col;
    if (sums[col] !== undefined) cell.textContent = formatNum(sums[col]);
  });
}

function saveSalaryData() {
  const emp = state.ui.currentEmp;
  if (!emp) return;
  const year = state.ui.currentYear;
  
  document.querySelectorAll('#salaryTbody tr').forEach(row => {
    const m = parseInt(row.dataset.month);
    const salary = parseFloat(row.querySelector('[data-field="salary"]').value) || 0;
    const otherIncome = parseFloat(row.querySelector('[data-field="otherIncome"]').value) || 0;
    const sso = parseFloat(row.querySelector('[data-field="sso"]').value) || 0;
    const tax = parseFloat(row.querySelector('[data-field="tax"]').value) || 0;
    const pvd = parseFloat(row.querySelector('[data-field="pvd"]').value) || 0;
    const receivedBy = row.querySelector('[data-field="receivedBy"]').value.trim();
    const receivedDate = row.querySelector('[data-field="receivedDate"]').value.trim();
    
    const key = salaryKey(emp.empId, year, m);
    if (salary > 0 || otherIncome > 0 || sso > 0 || tax > 0 || pvd > 0 || receivedBy || receivedDate) {
      state.data.salaries[key] = {
        salary, otherIncome, sso, tax, pvd, receivedBy, receivedDate
      };
    } else {
      delete state.data.salaries[key];
    }
  });
  
  // Bonus
  const bonusAmount = parseFloat(document.getElementById('bonusAmount').value) || 0;
  const bonusReceivedBy = document.getElementById('bonusReceivedBy').value.trim();
  const bonusDate = document.getElementById('bonusDate').value.trim();
  const bKey = bonusKey(emp.empId, year);
  
  if (bonusAmount > 0 || bonusReceivedBy || bonusDate) {
    state.data.bonuses[bKey] = {
      amount: bonusAmount,
      receivedBy: bonusReceivedBy,
      receivedDate: bonusDate
    };
  } else {
    delete state.data.bonuses[bKey];
  }
  
  schedulePush();
  toast('✅ บันทึกข้อมูลทั้งปีสำเร็จ');
}
