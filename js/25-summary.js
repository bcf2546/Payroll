/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Summary Tables */

function bindSummaryDropdowns() {
  const yearSel = document.getElementById('summaryYear');
  if (yearSel && yearSel.options.length === 0) {
    const currentThaiYear = new Date().getFullYear() + 543;
    for (let y = currentThaiYear - 3; y <= currentThaiYear + 1; y++) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === currentThaiYear) opt.selected = true;
      yearSel.appendChild(opt);
    }
  }
  // default month = เดือนปัจจุบัน
  const monthSel = document.getElementById('summaryMonth');
  if (monthSel) monthSel.value = (new Date().getMonth() + 1);
  updateSummaryUI();
}

function updateSummaryUI() {
  const type = document.querySelector('input[name="summaryType"]:checked').value;
  // แสดง month selector เมื่อ monthly/sso/tax
  document.getElementById('summaryMonth').style.display = (type !== 'yearly') ? '' : 'none';
}

function loadSummaryTable() {
  const type = document.querySelector('input[name="summaryType"]:checked').value;
  const group = document.getElementById('summaryGroup').value;
  const year = parseInt(document.getElementById('summaryYear').value);
  const wrap = document.getElementById('summaryTableWrap');
  
  if (type === 'sso' || type === 'tax') {
    // รายงานข้าม group (ทั้งบริษัท)
    const month = parseInt(document.getElementById('summaryMonth').value);
    const allEmps = state.data.employees.slice().sort(employeeComparator());
    wrap.innerHTML = type === 'sso'
      ? renderSSOReportHTML(year, month, allEmps)
      : renderTaxReportHTML(year, month, allEmps);
    return;
  }
  
  const allGroupEmps = state.data.employees.filter(e => e.group === group);
  sortEmployees(allGroupEmps);
  
  if (allGroupEmps.length === 0) {
    wrap.innerHTML = '<div style="text-align:center; padding:60px; color:#999;">ไม่พบพนักงานในกลุ่มนี้</div>';
    return;
  }
  
  if (type === 'yearly') {
    // รายปี: แสดงเฉพาะคนที่ทำงานในปีนั้น
    const emps = allGroupEmps.filter(e => isActiveInYear(e, year));
    wrap.innerHTML = renderSummaryTableHTML(group, year, emps);
  } else {
    const month = parseInt(document.getElementById('summaryMonth').value);
    // รายเดือน: แสดงเฉพาะคนที่ active + buffer 1 เดือน
    const emps = allGroupEmps.filter(e => isActiveForMonthView(e, year, month));
    const isThaiStyle = !group.includes('พม่า');
    wrap.innerHTML = isThaiStyle
      ? renderMonthlyThaiHTML(group, year, month, emps)
      : renderMonthlyMyanmarHTML(group, year, month, emps);
  }
}

function renderSSOReportHTML(year, month, emps) {
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  const rows = emps.map((emp, idx) => {
    const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
    const salary = Number(s.salary) || 0;
    const sso = Number(s.sso) || 0;
    return { idx: idx + 1, emp, salary, sso, ssoEmployer: sso };  // นายจ้างสมทบเท่าลูกจ้าง
  }).filter(r => r.salary > 0 || r.sso > 0);
  
  const totals = rows.reduce((a, r) => ({
    salary: a.salary + r.salary,
    sso: a.sso + r.sso,
    ssoEmployer: a.ssoEmployer + r.ssoEmployer
  }), { salary:0, sso:0, ssoEmployer:0 });
  
  let html = '<div class="summary-title" style="text-align:center; font-size:17px; font-weight:bold; margin-bottom:6px; color:#1a5276;">';
  html += '🏥 รายงานประกันสังคม (แบบ สปส. 1-10) — บริษัท ฟาร์มไก่ดำ (กาญจนบุรี) จำกัด</div>';
  html += '<div style="text-align:center; margin-bottom:14px; color:#666;">ประจำเดือน ' + MONTHS[month-1] + ' ' + year + '</div>';
  
  html += '<table class="summary-table" style="border-collapse:collapse; font-size:12px; width:100%;">';
  html += '<thead><tr style="background:#16a085; color:white;">';
  ['ลำดับ', 'รหัส', 'เลขที่บัตรประชาชน', 'ชื่อ-สกุล', 'กลุ่ม', 'ค่าจ้าง', 'ปกส.ลูกจ้าง (5%)', 'ปกส.นายจ้าง (5%)', 'รวมส่ง ปกส.'].forEach(h => {
    html += '<th style="border:1px solid #0e6655; padding:6px 8px;">' + h + '</th>';
  });
  html += '</tr></thead><tbody>';
  
  rows.forEach((r, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
    const name = escapeHtml((r.emp.firstName || '') + ' ' + (r.emp.lastName || r.emp.nameEn || ''));
    html += '<tr style="background:' + bg + ';">';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center;">' + r.idx + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center; font-weight:600; color:#1a5276;">' + escapeHtml(r.emp.empId) + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; font-family:monospace; font-size:11px;">' + escapeHtml(r.emp.idCard || '-') + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px;">' + name + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; font-size:11px;">' + escapeHtml(r.emp.group || '') + '</td>';
    html += '<td class="num">' + fmt(r.salary) + '</td>';
    html += '<td class="num">' + fmt(r.sso) + '</td>';
    html += '<td class="num">' + fmt(r.ssoEmployer) + '</td>';
    html += '<td class="num" style="font-weight:bold; color:#16a085;">' + fmt(r.sso + r.ssoEmployer) + '</td>';
    html += '</tr>';
  });
  
  html += '<tr style="background:#fff8dc; font-weight:bold;">';
  html += '<td style="border:1px solid #ddd; padding:6px 8px; text-align:center;" colspan="5">** รวมทั้งหมด ' + rows.length + ' คน **</td>';
  html += '<td class="num">' + fmt(totals.salary) + '</td>';
  html += '<td class="num">' + fmt(totals.sso) + '</td>';
  html += '<td class="num">' + fmt(totals.ssoEmployer) + '</td>';
  html += '<td class="num" style="color:#16a085;">' + fmt(totals.sso + totals.ssoEmployer) + '</td>';
  html += '</tr></tbody></table>';
  
  // Summary cards
  html += '<div style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">';
  html += '<div style="background:#d1f2eb; padding:14px; border-radius:6px; border-left:4px solid #16a085;">';
  html += '<div style="font-size:13px; color:#666;">ยอดเงินที่ต้องนำส่ง สปส.</div>';
  html += '<div style="font-size:24px; font-weight:bold; color:#0e6655; margin:4px 0;">' + fmt(totals.sso + totals.ssoEmployer) + '</div>';
  html += '<div style="font-size:11px; color:#999;">ลูกจ้าง ' + fmt(totals.sso) + ' + นายจ้าง ' + fmt(totals.ssoEmployer) + '</div>';
  html += '</div>';
  html += '<div style="background:#e8f4f8; padding:14px; border-radius:6px; border-left:4px solid #17a2b8;">';
  html += '<div style="font-size:13px; color:#666;">จำนวนลูกจ้าง</div>';
  html += '<div style="font-size:24px; font-weight:bold; color:#0c5460; margin:4px 0;">' + rows.length + ' คน</div>';
  html += '<div style="font-size:11px; color:#999;">เดือน ' + MONTHS[month-1] + ' ' + year + '</div>';
  html += '</div>';
  html += '<div style="background:#fff3cd; padding:14px; border-radius:6px; border-left:4px solid #f39c12;">';
  html += '<div style="font-size:13px; color:#666;">ฐานเงินเดือนรวม</div>';
  html += '<div style="font-size:24px; font-weight:bold; color:#856404; margin:4px 0;">' + fmt(totals.salary) + '</div>';
  html += '<div style="font-size:11px; color:#999;">ใช้คำนวณ 5% ต่อฝ่าย</div>';
  html += '</div>';
  html += '</div>';
  
  html += '<style>.summary-table td.num { border:1px solid #ddd; padding:4px 5px; text-align:right; font-family:monospace; overflow:hidden; text-overflow:ellipsis; } .summary-table tbody tr:hover { background:#e8f4f8 !important; } .summary-table th, .summary-table thead tr { -webkit-print-color-adjust:exact; print-color-adjust:exact; }</style>';
  
  return html;
}

function renderTaxReportHTML(year, month, emps) {
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  const rows = emps.map((emp, idx) => {
    const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
    const salary = Number(s.salary) || 0;
    const otherIncome = Number(s.otherIncome) || 0;
    const tax = Number(s.tax) || 0;
    const totalIncome = salary + otherIncome;
    return { idx: idx + 1, emp, salary, otherIncome, totalIncome, tax };
  }).filter(r => r.tax > 0);  // แสดงเฉพาะคนที่มี TAX
  
  const totals = rows.reduce((a, r) => ({
    salary: a.salary + r.salary,
    otherIncome: a.otherIncome + r.otherIncome,
    totalIncome: a.totalIncome + r.totalIncome,
    tax: a.tax + r.tax
  }), { salary:0, otherIncome:0, totalIncome:0, tax:0 });
  
  let html = '<div class="summary-title" style="text-align:center; font-size:17px; font-weight:bold; margin-bottom:6px; color:#1a5276;">';
  html += '💼 รายงานภาษีหัก ณ ที่จ่าย (ภงด. 1) — บริษัท ฟาร์มไก่ดำ (กาญจนบุรี) จำกัด</div>';
  html += '<div style="text-align:center; margin-bottom:14px; color:#666;">ประจำเดือน ' + MONTHS[month-1] + ' ' + year + '</div>';
  
  if (rows.length === 0) {
    html += '<div style="text-align:center; padding:40px; background:#f8f9fa; border-radius:6px; color:#999;">';
    html += '<div style="font-size:40px; margin-bottom:10px;">💼</div>';
    html += '<div>ไม่มีพนักงานที่ถูกหักภาษี ณ ที่จ่าย ในเดือนนี้</div>';
    html += '<div style="font-size:12px; margin-top:8px;">(กรอกช่อง TAX ในแท็บ "บันทึกเงินเดือน" หรือ "กรอกรายเดือน")</div>';
    html += '</div>';
    return html;
  }
  
  html += '<table class="summary-table" style="border-collapse:collapse; font-size:12px; width:100%;">';
  html += '<thead><tr style="background:#8e44ad; color:white;">';
  ['ลำดับ', 'รหัส', 'เลขที่บัตรประชาชน', 'ชื่อ-สกุล', 'กลุ่ม', 'เงินเดือน', 'รายได้อื่น', 'รวมรายได้', 'ภาษีหัก ณ ที่จ่าย'].forEach(h => {
    html += '<th style="border:1px solid #6c3483; padding:6px 8px;">' + h + '</th>';
  });
  html += '</tr></thead><tbody>';
  
  rows.forEach((r, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
    const name = escapeHtml((r.emp.firstName || '') + ' ' + (r.emp.lastName || r.emp.nameEn || ''));
    html += '<tr style="background:' + bg + ';">';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center;">' + r.idx + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center; font-weight:600; color:#1a5276;">' + escapeHtml(r.emp.empId) + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; font-family:monospace; font-size:11px;">' + escapeHtml(r.emp.idCard || '-') + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px;">' + name + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; font-size:11px;">' + escapeHtml(r.emp.group || '') + '</td>';
    html += '<td class="num">' + fmt(r.salary) + '</td>';
    html += '<td class="num">' + fmt(r.otherIncome) + '</td>';
    html += '<td class="num">' + fmt(r.totalIncome) + '</td>';
    html += '<td class="num" style="font-weight:bold; color:#8e44ad;">' + fmt(r.tax) + '</td>';
    html += '</tr>';
  });
  
  html += '<tr style="background:#fff8dc; font-weight:bold;">';
  html += '<td style="border:1px solid #ddd; padding:6px 8px; text-align:center;" colspan="5">** รวม ' + rows.length + ' คน **</td>';
  html += '<td class="num">' + fmt(totals.salary) + '</td>';
  html += '<td class="num">' + fmt(totals.otherIncome) + '</td>';
  html += '<td class="num">' + fmt(totals.totalIncome) + '</td>';
  html += '<td class="num" style="color:#8e44ad;">' + fmt(totals.tax) + '</td>';
  html += '</tr></tbody></table>';
  
  // Summary cards
  html += '<div style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">';
  html += '<div style="background:#f4ecf7; padding:14px; border-radius:6px; border-left:4px solid #8e44ad;">';
  html += '<div style="font-size:13px; color:#666;">ภาษีที่ต้องนำส่งสรรพากร</div>';
  html += '<div style="font-size:24px; font-weight:bold; color:#6c3483; margin:4px 0;">' + fmt(totals.tax) + '</div>';
  html += '<div style="font-size:11px; color:#999;">ภงด.1 ส่งภายในวันที่ 7 ของเดือนถัดไป</div>';
  html += '</div>';
  html += '<div style="background:#e8f4f8; padding:14px; border-radius:6px; border-left:4px solid #17a2b8;">';
  html += '<div style="font-size:13px; color:#666;">จำนวนลูกจ้างที่ถูกหักภาษี</div>';
  html += '<div style="font-size:24px; font-weight:bold; color:#0c5460; margin:4px 0;">' + rows.length + ' คน</div>';
  html += '<div style="font-size:11px; color:#999;">จากทั้งหมด ' + emps.length + ' คน</div>';
  html += '</div>';
  html += '<div style="background:#fff3cd; padding:14px; border-radius:6px; border-left:4px solid #f39c12;">';
  html += '<div style="font-size:13px; color:#666;">รายได้รวม</div>';
  html += '<div style="font-size:24px; font-weight:bold; color:#856404; margin:4px 0;">' + fmt(totals.totalIncome) + '</div>';
  html += '<div style="font-size:11px; color:#999;">ฐานคำนวณภาษี</div>';
  html += '</div>';
  html += '</div>';
  
  html += '<style>.summary-table td.num { border:1px solid #ddd; padding:5px 8px; text-align:right; font-family:monospace; } .summary-table tbody tr:hover { background:#f4ecf7 !important; }</style>';
  
  return html;
}

function renderSummaryTableHTML(group, year, emps) {
  const MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const isMyanmar = group.includes('พม่า');
  
  // รวบรวมข้อมูลทั้งหมด
  const data = emps.map(emp => {
    const months = [];
    const total = { salary: 0, otherIncome: 0, sso: 0, pvd: 0 };
    for (let m = 1; m <= 12; m++) {
      const s = state.data.salaries[salaryKey(emp.empId, year, m)] || {};
      const salary = Number(s.salary) || 0;
      // พม่า: "พิเศษ" = bonus + ot (ไม่มีช่อง otherIncome ในพม่า); ไทย: otherIncome
      const otherIncome = isMyanmar 
        ? (Number(s.bonus) || 0) + (Number(s.ot) || 0)
        : (Number(s.otherIncome) || 0);
      const sso = Number(s.sso) || 0;
      const pvd = Number(s.pvd) || 0;
      
      months.push({ salary, otherIncome, sso, pvd });
      total.salary += salary;
      total.otherIncome += otherIncome;
      total.sso += sso;
      total.pvd += pvd;
    }
    return { emp, months, total };
  });
  
  // คำนวณยอดรวมแต่ละเดือน (ใช้กับแถวสรุปด้านล่าง)
  const monthTotals = [];
  for (let m = 0; m < 12; m++) {
    let totals = { salary:0, otherIncome:0, sso:0, pvd:0 };
    data.forEach(d => {
      totals.salary += d.months[m].salary;
      totals.otherIncome += d.months[m].otherIncome;
      totals.sso += d.months[m].sso;
      totals.pvd += d.months[m].pvd;
    });
    monthTotals.push(totals);
  }
  
  // ยอดรวมทั้งบริษัทตลอดปี
  const grand = { salary: 0, otherIncome: 0, sso: 0, pvd: 0 };
  data.forEach(d => {
    grand.salary += d.total.salary;
    grand.otherIncome += d.total.otherIncome;
    grand.sso += d.total.sso;
    grand.pvd += d.total.pvd;
  });
  
  // Build table
  let html = '<div class="summary-title" style="text-align:center; font-size:16px; font-weight:bold; margin-bottom:10px; color:#1a5276;">';
  html += 'ทะเบียนการจ่ายเงินเดือน (' + escapeHtml(group) + ') บริษัท ฟาร์มไก่ดำ (กาญจนบุรี) จำกัด ประจำปี ' + year + '</div>';
  
  html += '<table class="summary-table" style="border-collapse:collapse; font-size:11px; width:100%; min-width:2800px;">';
  
  // Header row 1: เดือน (colspan=4) + รวมทั้งปี (colspan=5)
  html += '<thead><tr style="background:#2c5f8d; color:white;">';
  html += '<th rowspan="2" style="border:1px solid #1a4567; padding:4px 6px; min-width:120px; position:sticky; left:0; background:#2c5f8d; z-index:2;">เลขที่บัตรประชาชน</th>';
  html += '<th rowspan="2" style="border:1px solid #1a4567; padding:4px 6px; min-width:150px; position:sticky; left:120px; background:#2c5f8d; z-index:2;">ชื่อ สกุล</th>';
  for (let m = 0; m < 12; m++) {
    html += '<th colspan="4" style="border:1px solid #1a4567; padding:4px;">' + MONTHS[m] + '</th>';
  }
  // หัวคอลัมน์รวมทั้งปี (สีเขียวอ่อน เพื่อแยกจาก monthly)
  html += '<th colspan="5" style="border:1px solid #1a4567; padding:4px; background:#1e8449;">รวมทั้งปี ' + year + '</th>';
  html += '</tr><tr style="background:#5d8cb0; color:white;">';
  for (let m = 0; m < 12; m++) {
    html += '<th style="border:1px solid #1a4567; padding:3px; min-width:70px;">รายได้</th>';
    html += '<th style="border:1px solid #1a4567; padding:3px; min-width:65px;">พิเศษ</th>';
    html += '<th style="border:1px solid #1a4567; padding:3px; min-width:60px;">SSO ลจ.</th>';
    html += '<th style="border:1px solid #1a4567; padding:3px; min-width:65px;">PVD ลจ.</th>';
  }
  // หัวคอลัมน์ย่อยของรวมทั้งปี (สีเขียวเข้ม)
  html += '<th style="border:1px solid #1a4567; padding:3px; min-width:80px; background:#239b56;">รายได้</th>';
  html += '<th style="border:1px solid #1a4567; padding:3px; min-width:75px; background:#239b56;">พิเศษ</th>';
  html += '<th style="border:1px solid #1a4567; padding:3px; min-width:85px; background:#196f3d;">สุทธิ</th>';
  html += '<th style="border:1px solid #1a4567; padding:3px; min-width:75px; background:#239b56;">SSO ลจ.</th>';
  html += '<th style="border:1px solid #1a4567; padding:3px; min-width:75px; background:#239b56;">PVD ลจ.</th>';
  html += '</tr></thead><tbody>';
  
  // Data rows
  data.forEach((d, idx) => {
    const bg = idx % 2 === 0 ? '#fff' : '#f8f9fa';
    html += '<tr style="background:' + bg + ';">';
    html += '<td style="border:1px solid #ddd; padding:4px 6px; position:sticky; left:0; background:' + bg + ';">' + escapeHtml(d.emp.idCard || '-') + '</td>';
    html += '<td style="border:1px solid #ddd; padding:4px 6px; position:sticky; left:120px; background:' + bg + ';">' + escapeHtml((d.emp.firstName || '') + ' ' + (d.emp.lastName || d.emp.nameEn || '')) + '</td>';
    for (let m = 0; m < 12; m++) {
      const mm = d.months[m];
      html += '<td class="num">' + fmt(mm.salary) + '</td>';
      html += '<td class="num">' + fmt(mm.otherIncome) + '</td>';
      html += '<td class="num">' + fmt(mm.sso) + '</td>';
      html += '<td class="num">' + fmt(mm.pvd) + '</td>';
    }
    // รวมทั้งปีของคนนี้ (สีเขียวอ่อน + ตัวหนา)
    const net = d.total.salary + d.total.otherIncome; // สุทธิ = รายได้ + พิเศษ (ตามที่ขอ)
    const tb = '#eafaf1';  // เขียวอ่อนมาก
    html += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmt(d.total.salary) + '</td>';
    html += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmt(d.total.otherIncome) + '</td>';
    html += '<td class="num" style="background:#d5f5e3; font-weight:700; color:#196f3d;">' + fmt(net) + '</td>';
    html += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmt(d.total.sso) + '</td>';
    html += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmt(d.total.pvd) + '</td>';
    html += '</tr>';
  });
  
  // Summary row - รวมทั้งหมด (per month 4 cols + yearly 5 cols)
  html += '<tr style="background:#fff8dc; font-weight:bold;">';
  html += '<td style="border:1px solid #ddd; padding:4px 6px; position:sticky; left:0; background:#fff8dc;" colspan="2">รวมทั้งหมด</td>';
  for (let m = 0; m < 12; m++) {
    const t = monthTotals[m];
    html += '<td class="num">' + fmt(t.salary) + '</td>';
    html += '<td class="num">' + fmt(t.otherIncome) + '</td>';
    html += '<td class="num">' + fmt(t.sso) + '</td>';
    html += '<td class="num">' + fmt(t.pvd) + '</td>';
  }
  // Grand total 5 cols
  const grandNet = grand.salary + grand.otherIncome;
  html += '<td class="num" style="background:#fff3cd;">' + fmt(grand.salary) + '</td>';
  html += '<td class="num" style="background:#fff3cd;">' + fmt(grand.otherIncome) + '</td>';
  html += '<td class="num" style="background:#fcf3cf; color:#196f3d;">' + fmt(grandNet) + '</td>';
  html += '<td class="num" style="background:#fff3cd;">' + fmt(grand.sso) + '</td>';
  html += '<td class="num" style="background:#fff3cd;">' + fmt(grand.pvd) + '</td>';
  html += '</tr>';
  
  // แถวสรุปรายการ (merge cells เป็นรายเดือน) — ใช้ชื่อใหม่ SSO/PVD
  const makeSummaryRow = (label, bg, fn, grandFn) => {
    let r = '<tr style="background:' + bg + '; font-weight:500;">';
    r += '<td style="border:1px solid #ddd; padding:4px 6px; position:sticky; left:0; background:' + bg + ';" colspan="2">' + label + '</td>';
    for (let m = 0; m < 12; m++) {
      const t = monthTotals[m];
      r += '<td class="num" colspan="4" style="text-align:right;">' + fmt(fn(t)) + '</td>';
    }
    // รวมทั้งปีของแถวนี้ (ใช้ grandFn ถ้าส่งมา ไม่งั้นใช้ fn(grand))
    const y = grandFn ? grandFn(grand) : fn(grand);
    r += '<td class="num" colspan="5" style="text-align:right; background:' + bg + '; font-weight:600;">' + fmt(y) + '</td>';
    r += '</tr>';
    return r;
  };
  
  // ประกันสังคม (ยอดส่ง = ลูกจ้างจ่าย + นายจ้างสมทบ = 2 × SSO ลจ.)
  html += makeSummaryRow('ประกันสังคม (ส่ง ปกส.ทั้งหมด = ลจ.+นจ.)', '#e8f4f8', t => t.sso * 2);
  
  // PVD นายจ้าง (สมทบเท่าลูกจ้าง — default)
  html += makeSummaryRow('PVD นายจ้าง (สมทบ)', '#e8f4f8', t => t.pvd);
  
  // รวมจ่ายรายเดือน (รายได้ + พิเศษ)
  html += makeSummaryRow('รวมจ่ายเงินเดือน (รายได้+พิเศษ)', '#d5f5e3', t => t.salary + t.otherIncome);
  
  // ต้นทุนบริษัท (รายได้ + พิเศษ + ปกส.สมทบ + กองทุนสมทบ)
  html += makeSummaryRow('ต้นทุนรวมบริษัท', '#fde3e3', t => t.salary + t.otherIncome + t.sso + t.pvd);
  
  html += '</tbody></table>';
  
  // Add style for .num cells
  html += '<style>.summary-table td.num { border:1px solid #ddd; padding:4px 6px; text-align:right; font-family:monospace; } .summary-table tbody tr:hover { background:#e8f4f8 !important; }</style>';
  
  return html;
}

function fmt(n) { 
  if (!n || isNaN(n) || n === 0) return '-';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// สำหรับพิมพ์ยอดรวมรายปี แบ่ง 2 หน้า A4 landscape
// หน้า 1: ม.ค.-ก.ค. (7 เดือน)
// หน้า 2: ส.ค.-ธ.ค. (5 เดือน) + รวมทั้งปี (5 คอลัมน์)
function renderYearlySplitHTML(group, year, emps) {
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const isMyanmar = group.includes('พม่า');
  
  // รวบรวมข้อมูล (เหมือน renderSummaryTableHTML)
  const data = emps.map(emp => {
    const months = [];
    const total = { salary: 0, otherIncome: 0, sso: 0, pvd: 0 };
    for (let m = 1; m <= 12; m++) {
      const s = state.data.salaries[salaryKey(emp.empId, year, m)] || {};
      const salary = Number(s.salary) || 0;
      const otherIncome = isMyanmar 
        ? (Number(s.bonus) || 0) + (Number(s.ot) || 0)
        : (Number(s.otherIncome) || 0);
      const sso = Number(s.sso) || 0;
      const pvd = Number(s.pvd) || 0;
      months.push({ salary, otherIncome, sso, pvd });
      total.salary += salary;
      total.otherIncome += otherIncome;
      total.sso += sso;
      total.pvd += pvd;
    }
    return { emp, months, total };
  });
  
  const monthTotals = [];
  for (let m = 0; m < 12; m++) {
    let t = { salary:0, otherIncome:0, sso:0, pvd:0 };
    data.forEach(d => {
      t.salary += d.months[m].salary;
      t.otherIncome += d.months[m].otherIncome;
      t.sso += d.months[m].sso;
      t.pvd += d.months[m].pvd;
    });
    monthTotals.push(t);
  }
  
  const grand = { salary: 0, otherIncome: 0, sso: 0, pvd: 0 };
  data.forEach(d => {
    grand.salary += d.total.salary;
    grand.otherIncome += d.total.otherIncome;
    grand.sso += d.total.sso;
    grand.pvd += d.total.pvd;
  });
  
  // Short formatter — ไม่มีเศษเพื่อประหยัดพื้นที่
  function fmtShort(n) {
    if (!n || isNaN(n) || n === 0) return '-';
    return Math.round(Number(n)).toLocaleString('en-US');
  }
  
  function buildTable(startM, endM, showYearly, pageLabel) {
    let h = '<table class="yearly-split-table" style="border-collapse:collapse; font-size:8.5px; width:100%; table-layout:fixed;">';
    
    h += '<thead><tr style="background:#2c5f8d; color:white;">';
    h += '<th rowspan="2" style="border:1px solid #1a4567; padding:3px; width:80px;">เลขบัตร ปชช.</th>';
    h += '<th rowspan="2" style="border:1px solid #1a4567; padding:3px; width:110px;">ชื่อ สกุล</th>';
    for (let m = startM; m <= endM; m++) {
      h += '<th colspan="4" style="border:1px solid #1a4567; padding:3px;">' + MONTHS[m-1] + '</th>';
    }
    if (showYearly) {
      h += '<th colspan="5" style="border:1px solid #1a4567; padding:3px; background:#1e8449;">รวมทั้งปี ' + year + '</th>';
    }
    h += '</tr><tr style="background:#5d8cb0; color:white;">';
    for (let m = startM; m <= endM; m++) {
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px;">รายได้</th>';
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px;">พิเศษ</th>';
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px;">SSO ลจ.</th>';
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px;">PVD ลจ.</th>';
    }
    if (showYearly) {
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px; background:#239b56;">รายได้</th>';
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px; background:#239b56;">พิเศษ</th>';
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px; background:#196f3d;">สุทธิ</th>';
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px; background:#239b56;">SSO ลจ.</th>';
      h += '<th style="border:1px solid #1a4567; padding:2px; font-size:8px; background:#239b56;">PVD ลจ.</th>';
    }
    h += '</tr></thead><tbody>';
    
    data.forEach((d, idx) => {
      const bg = idx % 2 === 0 ? '#fff' : '#f8f9fa';
      h += '<tr style="background:' + bg + ';">';
      h += '<td style="border:1px solid #ddd; padding:2px 4px; font-size:8px; white-space:nowrap;">' + escapeHtml(d.emp.idCard || '-') + '</td>';
      h += '<td style="border:1px solid #ddd; padding:2px 4px; font-size:8.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escapeHtml((d.emp.firstName || '') + ' ' + (d.emp.lastName || d.emp.nameEn || '')) + '</td>';
      for (let m = startM; m <= endM; m++) {
        const mm = d.months[m-1];
        h += '<td class="num">' + fmtShort(mm.salary) + '</td>';
        h += '<td class="num">' + fmtShort(mm.otherIncome) + '</td>';
        h += '<td class="num">' + fmtShort(mm.sso) + '</td>';
        h += '<td class="num">' + fmtShort(mm.pvd) + '</td>';
      }
      if (showYearly) {
        const net = d.total.salary + d.total.otherIncome;
        const tb = '#eafaf1';
        h += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmtShort(d.total.salary) + '</td>';
        h += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmtShort(d.total.otherIncome) + '</td>';
        h += '<td class="num" style="background:#d5f5e3; font-weight:700; color:#196f3d;">' + fmtShort(net) + '</td>';
        h += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmtShort(d.total.sso) + '</td>';
        h += '<td class="num" style="background:' + tb + '; font-weight:600;">' + fmtShort(d.total.pvd) + '</td>';
      }
      h += '</tr>';
    });
    
    // แถวรวม
    h += '<tr style="background:#fff8dc; font-weight:bold;">';
    h += '<td colspan="2" style="border:1px solid #ddd; padding:3px 5px; font-size:8.5px;">** รวมทั้งหมด **</td>';
    for (let m = startM; m <= endM; m++) {
      const t = monthTotals[m-1];
      h += '<td class="num">' + fmtShort(t.salary) + '</td>';
      h += '<td class="num">' + fmtShort(t.otherIncome) + '</td>';
      h += '<td class="num">' + fmtShort(t.sso) + '</td>';
      h += '<td class="num">' + fmtShort(t.pvd) + '</td>';
    }
    if (showYearly) {
      const grandNet = grand.salary + grand.otherIncome;
      h += '<td class="num" style="background:#fff3cd;">' + fmtShort(grand.salary) + '</td>';
      h += '<td class="num" style="background:#fff3cd;">' + fmtShort(grand.otherIncome) + '</td>';
      h += '<td class="num" style="background:#fcf3cf; color:#196f3d;">' + fmtShort(grandNet) + '</td>';
      h += '<td class="num" style="background:#fff3cd;">' + fmtShort(grand.sso) + '</td>';
      h += '<td class="num" style="background:#fff3cd;">' + fmtShort(grand.pvd) + '</td>';
    }
    h += '</tr>';
    
    // แถวสรุป — เฉพาะหน้า 2
    if (showYearly) {
      const makeRow = (label, bg, fn) => {
        let r = '<tr style="background:' + bg + '; font-weight:500;">';
        r += '<td colspan="2" style="border:1px solid #ddd; padding:3px 5px; font-size:8.5px;">' + label + '</td>';
        for (let m = startM; m <= endM; m++) {
          const t = monthTotals[m-1];
          r += '<td class="num" colspan="4" style="text-align:right;">' + fmtShort(fn(t)) + '</td>';
        }
        r += '<td class="num" colspan="5" style="text-align:right; font-weight:600;">' + fmtShort(fn(grand)) + '</td>';
        r += '</tr>';
        return r;
      };
      
      h += makeRow('ประกันสังคม (ส่ง ปกส.ทั้งหมด)', '#e8f4f8', t => t.sso * 2);
      h += makeRow('PVD นายจ้าง (สมทบ)', '#e8f4f8', t => t.pvd);
      h += makeRow('รวมจ่ายเงินเดือน', '#d5f5e3', t => t.salary + t.otherIncome);
      h += makeRow('ต้นทุนรวมบริษัท', '#fde3e3', t => t.salary + t.otherIncome + t.sso + t.pvd);
    }
    
    h += '</tbody></table>';
    
    const label = '<div style="text-align:right; font-size:9px; color:#666; margin-bottom:2px; font-style:italic;">' + pageLabel + '</div>';
    return label + h;
  }
  
  const page1 = buildTable(1, 7, false, 'หน้า 1/2 · มกราคม - กรกฎาคม');
  const page2 = buildTable(8, 12, true, 'หน้า 2/2 · สิงหาคม - ธันวาคม + สรุปรวมทั้งปี');
  
  let html = '<style>';
  html += '.yearly-split-table td.num { border:1px solid #ddd; padding:2px 3px; text-align:right; font-family:"Consolas","Monaco",monospace; font-variant-numeric: tabular-nums; font-size:8px; }';
  html += '.yearly-split-page-break { page-break-after: always; break-after: page; height: 0; }';
  html += '.yearly-split-hide-on-page2 { /* letterhead/header ซ่อนก่อนตารางที่ 2 */ }';
  html += '@media print { ';
  html += '  .yearly-split-page-break { page-break-after: always; break-after: page; } ';
  html += '  .yearly-split-table { font-size: 8px !important; } ';
  html += '  .yearly-split-table td.num { font-size: 7.5px !important; padding: 1.5px 2px !important; }';
  html += '}';
  html += '</style>';
  
  html += '<div class="yearly-split-container-1">' + page1 + '</div>';
  html += '<div class="yearly-split-page-break"></div>';
  html += '<div class="yearly-split-container-2" style="margin-top:8px;">' + page2 + '</div>';
  
  return html;
}

function renderMonthlyThaiHTML(group, year, month, emps) {
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  const rows = emps.map((emp, idx) => {
    const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
    const salary = Number(s.salary) || 0;
    const otherIncome = Number(s.otherIncome) || 0;
    const sso = Number(s.sso) || 0;
    const ssoEmployer = Number(s.ssoEmployer) || 0;
    const tax = Number(s.tax) || 0;
    const pvd = Number(s.pvd) || 0;
    const pvdEmployer = Number(s.pvdEmployer) || 0;
    const cash = Number(s.cash) || 0;
    // Parse bank: เก็บเป็น string (backward compat กับ receivedBy) → แปลงเป็นตัวเลข
    const bankRaw = s.bank || s.receivedBy || '';
    const bank = typeof bankRaw === 'number' ? bankRaw : (parseFloat(String(bankRaw).replace(/,/g,'')) || 0);
    const net = salary + otherIncome - sso - tax - pvd;
    return { idx: idx + 1, emp, salary, otherIncome, sso, ssoEmployer, tax, pvd, pvdEmployer, cash, bank, net, hasData: salary > 0 || otherIncome > 0 };
  });
  
  // สรุปยอด + นับจำนวนคนที่โอน (bank > 0) สำหรับคำนวณค่าธรรมเนียม
  const TRANSFER_FEE_PER_PERSON = 10;
  const totals = rows.reduce((a, r) => ({
    salary: a.salary + r.salary, otherIncome: a.otherIncome + r.otherIncome,
    sso: a.sso + r.sso, ssoEmployer: a.ssoEmployer + r.ssoEmployer,
    tax: a.tax + r.tax,
    pvd: a.pvd + r.pvd, pvdEmployer: a.pvdEmployer + r.pvdEmployer,
    cash: a.cash + r.cash, bank: a.bank + r.bank, net: a.net + r.net,
    transferCount: a.transferCount + (r.bank > 0 ? 1 : 0)
  }), { salary:0, otherIncome:0, sso:0, ssoEmployer:0, tax:0, pvd:0, pvdEmployer:0, cash:0, bank:0, net:0, transferCount:0 });
  totals.transferFee = totals.transferCount * TRANSFER_FEE_PER_PERSON;
  
  let html = '<div class="summary-title" style="text-align:center; font-size:16px; font-weight:bold; margin-bottom:10px; color:#1a5276;">';
  html += 'สรุปรายการจ่ายเงินเดือน-ไทย (' + escapeHtml(group) + ') ประจำเดือน ' + MONTHS[month-1] + ' ' + year + '</div>';
  
  html += '<table class="summary-table" style="border-collapse:collapse; font-size:11px; width:100%; table-layout:fixed;">';
  html += '<thead><tr style="background:#2c5f8d; color:white;">';
  const headers = ['ลำดับ', 'รายชื่อ', 'รายได้', 'รายได้อื่น', 'SSO ลจ.', 'W/H TAX', 'PVD ลจ.', 'เงินสด', 'เข้าบัญชี', 'จ่ายสุทธิ', 'SSO นจ.', 'PVD นจ.'];
  const widths = ['34px', '120px', '68px', '64px', '58px', '58px', '58px', '60px', '70px', '74px', '58px', '58px'];
  headers.forEach((h, i) => {
    html += '<th style="border:1px solid #1a4567; padding:5px 4px; width:' + widths[i] + ';">' + h + '</th>';
  });
  html += '</tr></thead><tbody>';
  
  rows.forEach((r, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#f8f9fa';
    const name = escapeHtml((r.emp.firstName || '') + ' ' + (r.emp.lastName || r.emp.nameEn || ''));
    html += '<tr style="background:' + bg + ';">';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center;">' + r.idx + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px;">' + name + '</td>';
    html += '<td class="num">' + fmt(r.salary) + '</td>';
    html += '<td class="num">' + fmt(r.otherIncome) + '</td>';
    html += '<td class="num">' + fmt(r.sso) + '</td>';
    html += '<td class="num">' + fmt(r.tax) + '</td>';
    html += '<td class="num">' + fmt(r.pvd) + '</td>';
    html += '<td class="num">' + fmt(r.cash) + '</td>';
    html += '<td class="num" style="color:#2471a3;">' + fmt(r.bank) + '</td>';  // เข้าบัญชี
    html += '<td class="num" style="font-weight:bold; color:#1a5276;">' + fmt(r.net) + '</td>';
    html += '<td class="num">' + fmt(r.ssoEmployer) + '</td>';  // SSO นจ. (สลับมาก่อน)
    html += '<td class="num">' + fmt(r.pvdEmployer) + '</td>';  // PVD นจ.
    html += '</tr>';
  });
  
  // แถวรวม
  html += '<tr style="background:#fff8dc; font-weight:bold;">';
  html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center;" colspan="2">** รวม **</td>';
  html += '<td class="num">' + fmt(totals.salary) + '</td>';
  html += '<td class="num">' + fmt(totals.otherIncome) + '</td>';
  html += '<td class="num">' + fmt(totals.sso) + '</td>';
  html += '<td class="num">' + fmt(totals.tax) + '</td>';
  html += '<td class="num">' + fmt(totals.pvd) + '</td>';
  html += '<td class="num">' + fmt(totals.cash) + '</td>';
  html += '<td class="num" style="color:#2471a3;">' + fmt(totals.bank) + '</td>';  // เข้าบัญชี
  html += '<td class="num" style="color:#1a5276;">' + fmt(totals.net) + '</td>';
  html += '<td class="num">' + fmt(totals.ssoEmployer) + '</td>';  // SSO นจ.
  html += '<td class="num">' + fmt(totals.pvdEmployer) + '</td>';  // PVD นจ.
  html += '</tr>';
  
  html += '</tbody></table>';
  
  // สรุปเพิ่มเติม
  html += '<div style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">';
  html += '<div style="background:#e8f4f8; padding:12px; border-radius:6px; border-left:4px solid #17a2b8;">';
  html += '<div style="font-size:12px; color:#666;">ประกันสังคม (ส่งทั้งหมด)</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#0c5460;">' + fmt(totals.sso + totals.ssoEmployer) + '</div>';
  html += '<div style="font-size:11px; color:#999;">ลูกจ้าง ' + fmt(totals.sso) + ' + นายจ้าง ' + fmt(totals.ssoEmployer) + '</div>';
  html += '</div>';
  html += '<div style="background:#e8f4f8; padding:12px; border-radius:6px; border-left:4px solid #17a2b8;">';
  html += '<div style="font-size:12px; color:#666;">กองทุน (ส่งทั้งหมด)</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#0c5460;">' + fmt(totals.pvd + totals.pvdEmployer) + '</div>';
  html += '<div style="font-size:11px; color:#999;">ลูกจ้าง ' + fmt(totals.pvd) + ' + นายจ้าง ' + fmt(totals.pvdEmployer) + '</div>';
  html += '</div>';
  html += '<div style="background:#d5f5e3; padding:12px; border-radius:6px; border-left:4px solid #27ae60;">';
  html += '<div style="font-size:12px; color:#666;">รวมจ่ายให้พนักงาน</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#1e8449;">' + fmt(totals.net) + '</div>';
  html += '</div>';
  html += '<div style="background:#fff3cd; padding:12px; border-radius:6px; border-left:4px solid #f39c12;">';
  html += '<div style="font-size:12px; color:#666;">ค่าธรรมเนียมโอนเงิน</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#856404;">' + fmt(totals.transferFee) + '</div>';
  html += '<div style="font-size:11px; color:#999;">' + totals.transferCount + ' คน × 10 บาท · บริษัทเป็นผู้ชำระ</div>';
  html += '</div>';
  html += '<div style="background:#fde3e3; padding:12px; border-radius:6px; border-left:4px solid #e74c3c;">';
  html += '<div style="font-size:12px; color:#666;">ต้นทุนรวมบริษัท</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#8b0000;">' + fmt(totals.salary + totals.otherIncome + totals.ssoEmployer + totals.pvdEmployer + totals.transferFee) + '</div>';
  html += '<div style="font-size:11px; color:#999;">รวมค่าธรรมเนียมโอนแล้ว</div>';
  html += '</div>';
  html += '</div>';
  
  html += '<style>.summary-table td.num { border:1px solid #ddd; padding:4px 5px; text-align:right; font-family:monospace; overflow:hidden; text-overflow:ellipsis; } .summary-table tbody tr:hover { background:#e8f4f8 !important; } .summary-table th, .summary-table thead tr { -webkit-print-color-adjust:exact; print-color-adjust:exact; }</style>';
  
  return html;
}

function renderMonthlyMyanmarHTML(group, year, month, emps) {
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  const rows = emps.map((emp, idx) => {
    const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
    const salary = Number(s.salary) || 0;
    const bonus = Number(s.bonus) || 0;
    const ot = Number(s.ot) || 0;
    const holiday = Number(s.holiday) || 0;
    const debt = Number(s.debt) || 0;
    const sso = Number(s.sso) || 0;
    const ssoEmployer = Number(s.ssoEmployer) || 0;
    const cash = Number(s.cash) || 0;
    // Parse bank: string → ตัวเลข (backward compat)
    const bankRaw = s.bank || s.receivedBy || '';
    const bank = typeof bankRaw === 'number' ? bankRaw : (parseFloat(String(bankRaw).replace(/,/g,'')) || 0);
    // Net = รายได้ + พิเศษ + OT − SSO − หยุด − หนี้อื่นๆ
    const net = salary + bonus + ot - sso - holiday - debt;
    return { idx: idx + 1, emp, salary, bonus, ot, holiday, debt, sso, ssoEmployer, cash, bank, net, hasData: salary > 0 || bonus > 0 || ot > 0 };
  });
  
  const TRANSFER_FEE_PER_PERSON = 10;
  const totals = rows.reduce((a, r) => ({
    salary: a.salary + r.salary, bonus: a.bonus + r.bonus, ot: a.ot + r.ot,
    holiday: a.holiday + r.holiday, debt: a.debt + r.debt,
    sso: a.sso + r.sso, ssoEmployer: a.ssoEmployer + r.ssoEmployer,
    cash: a.cash + r.cash, net: a.net + r.net,
    transferCount: a.transferCount + (r.bank > 0 ? 1 : 0)
  }), { salary:0, bonus:0, ot:0, holiday:0, debt:0, sso:0, ssoEmployer:0, cash:0, net:0, transferCount:0 });
  totals.transferFee = totals.transferCount * TRANSFER_FEE_PER_PERSON;
  
  let html = '<div class="summary-title" style="text-align:center; font-size:16px; font-weight:bold; margin-bottom:10px; color:#1a5276;">';
  html += 'รายการจ่ายเงินเดือน-ต่างด้าว (' + escapeHtml(group) + ') ประจำเดือน ' + MONTHS[month-1] + ' ' + year + '</div>';
  
  html += '<table class="summary-table" style="border-collapse:collapse; font-size:12px; width:100%;">';
  html += '<thead><tr style="background:#d35400; color:white;">';
  const headers = ['ลำดับ', 'รายชื่อ', 'รายได้', 'พิเศษ', 'OT', 'SSO ลจ.', 'หนี้อื่นๆ', 'หยุด', 'เงินสด', 'จ่ายสุทธิ', 'SSO นจ.'];
  const widths = ['50px', '180px', '90px', '75px', '75px', '80px', '80px', '70px', '80px', '100px', '80px'];
  headers.forEach((h, i) => {
    html += '<th style="border:1px solid #a0411f; padding:6px 8px; min-width:' + widths[i] + ';">' + h + '</th>';
  });
  html += '</tr></thead><tbody>';
  
  rows.forEach((r, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#fff5ee';
    const name = escapeHtml((r.emp.firstName || '') + ' ' + (r.emp.lastName || r.emp.nameEn || ''));
    html += '<tr style="background:' + bg + ';">';
    html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center;">' + r.idx + '</td>';
    html += '<td style="border:1px solid #ddd; padding:5px 8px;">' + name + '</td>';
    html += '<td class="num">' + fmt(r.salary) + '</td>';
    html += '<td class="num">' + fmt(r.bonus) + '</td>';
    html += '<td class="num">' + fmt(r.ot) + '</td>';
    html += '<td class="num">' + fmt(r.sso) + '</td>';
    html += '<td class="num" style="color:#c0392b;">' + fmt(r.debt) + '</td>';
    html += '<td class="num" style="color:#c0392b;">' + fmt(r.holiday) + '</td>';
    html += '<td class="num">' + fmt(r.cash) + '</td>';
    html += '<td class="num" style="font-weight:bold; color:#d35400;">' + fmt(r.net) + '</td>';
    html += '<td class="num">' + fmt(r.ssoEmployer) + '</td>';
    html += '</tr>';
  });
  
  html += '<tr style="background:#fff8dc; font-weight:bold;">';
  html += '<td style="border:1px solid #ddd; padding:5px 8px; text-align:center;" colspan="2">** รวม **</td>';
  html += '<td class="num">' + fmt(totals.salary) + '</td>';
  html += '<td class="num">' + fmt(totals.bonus) + '</td>';
  html += '<td class="num">' + fmt(totals.ot) + '</td>';
  html += '<td class="num">' + fmt(totals.sso) + '</td>';
  html += '<td class="num" style="color:#c0392b;">' + fmt(totals.debt) + '</td>';
  html += '<td class="num" style="color:#c0392b;">' + fmt(totals.holiday) + '</td>';
  html += '<td class="num">' + fmt(totals.cash) + '</td>';
  html += '<td class="num" style="color:#d35400;">' + fmt(totals.net) + '</td>';
  html += '<td class="num">' + fmt(totals.ssoEmployer) + '</td>';
  html += '</tr>';
  
  html += '</tbody></table>';
  
  // สรุป card
  html += '<div style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">';
  html += '<div style="background:#fde3e3; padding:12px; border-radius:6px; border-left:4px solid #d35400;">';
  html += '<div style="font-size:12px; color:#666;">ประกันสังคม (ส่งทั้งหมด)</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#8b0000;">' + fmt(totals.sso + totals.ssoEmployer) + '</div>';
  html += '<div style="font-size:11px; color:#999;">ลูกจ้าง ' + fmt(totals.sso) + ' + นายจ้าง ' + fmt(totals.ssoEmployer) + '</div>';
  html += '</div>';
  html += '<div style="background:#d5f5e3; padding:12px; border-radius:6px; border-left:4px solid #27ae60;">';
  html += '<div style="font-size:12px; color:#666;">รวมจ่ายให้ต่างด้าว</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#1e8449;">' + fmt(totals.net) + '</div>';
  html += '</div>';
  html += '<div style="background:#fff3cd; padding:12px; border-radius:6px; border-left:4px solid #f39c12;">';
  html += '<div style="font-size:12px; color:#666;">ค่าธรรมเนียมโอนเงิน</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#856404;">' + fmt(totals.transferFee) + '</div>';
  html += '<div style="font-size:11px; color:#999;">' + totals.transferCount + ' คน × 10 บาท · บริษัทเป็นผู้ชำระ</div>';
  html += '</div>';
  html += '<div style="background:#fde3e3; padding:12px; border-radius:6px; border-left:4px solid #e74c3c;">';
  html += '<div style="font-size:12px; color:#666;">ต้นทุนรวม</div>';
  html += '<div style="font-size:18px; font-weight:bold; color:#8b0000;">' + fmt(totals.salary + totals.bonus + totals.ot + totals.ssoEmployer + totals.transferFee) + '</div>';
  html += '<div style="font-size:11px; color:#999;">รวมค่าธรรมเนียมโอนแล้ว</div>';
  html += '</div>';
  html += '</div>';
  
  html += '<style>.summary-table td.num { border:1px solid #ddd; padding:5px 8px; text-align:right; font-family:monospace; } .summary-table tbody tr:hover { background:#fff5ee !important; }</style>';
  
  return html;
}

function printSummaryTable() {
  const type = document.querySelector('input[name="summaryType"]:checked').value;
  const group = document.getElementById('summaryGroup').value;
  const year = parseInt(document.getElementById('summaryYear').value);
  
  let emps, tableHtml, pageSize, title, accentColor, subtitle;
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  if (type === 'sso' || type === 'tax') {
    emps = state.data.employees.slice().sort(employeeComparator());
    const month = parseInt(document.getElementById('summaryMonth').value);
    tableHtml = type === 'sso'
      ? renderSSOReportHTML(year, month, emps)
      : renderTaxReportHTML(year, month, emps);
    pageSize = 'A4 landscape';
    if (type === 'sso') {
      title = 'รายงานประกันสังคม (แบบ สปส. 1-10)';
      accentColor = '#16a085';
    } else {
      title = 'รายงานภาษีหัก ณ ที่จ่าย (ภงด. 1)';
      accentColor = '#8e44ad';
    }
    subtitle = 'ประจำเดือน ' + MONTHS[month-1] + ' ' + year;
  } else {
    const allGroupEmps = state.data.employees.filter(e => e.group === group);
    sortEmployees(allGroupEmps);
    if (allGroupEmps.length === 0) {
      toast('ไม่พบพนักงานในกลุ่มนี้', 'error');
      return;
    }
    
    const isMyanmar = group.includes('พม่า');
    accentColor = isMyanmar ? '#d35400' : '#2c5f8d';
    
    if (type === 'yearly') {
      // รายปี: แสดงเฉพาะคนที่ทำงานในปีนั้น (ออกในปีนั้นยังแสดง, ออกก่อนปีนั้นไม่แสดง)
      emps = allGroupEmps.filter(e => isActiveInYear(e, year));
      tableHtml = renderYearlySplitHTML(group, year, emps);
      pageSize = 'A4 landscape';
      title = 'ทะเบียนการจ่ายเงินเดือน';
      subtitle = 'กลุ่ม ' + group + '  |  ประจำปี ' + year;
    } else {
      const month = parseInt(document.getElementById('summaryMonth').value);
      // รายเดือน: แสดงเฉพาะคนที่ active ในเดือนนั้น + คนที่ออกในเดือนก่อนหน้า (1 เดือน buffer)
      emps = allGroupEmps.filter(e => isActiveForMonthView(e, year, month));
      tableHtml = !isMyanmar
        ? renderMonthlyThaiHTML(group, year, month, emps)
        : renderMonthlyMyanmarHTML(group, year, month, emps);
      pageSize = isMyanmar ? 'A4 portrait' : 'A4 landscape';
      title = isMyanmar ? 'รายการจ่ายเงินเดือน-ต่างด้าว' : 'สรุปรายการจ่ายเงินเดือน';
      subtitle = 'กลุ่ม ' + group + '  |  ประจำเดือน ' + MONTHS[month-1] + ' ' + year;
    }
  }
  
  // วันที่พิมพ์ (ปี พ.ศ.)
  const today = new Date();
  const thaiYear = today.getFullYear() + 543;
  const printDate = today.getDate() + ' ' + MONTHS[today.getMonth()] + ' ' + thaiYear;
  const printTime = today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  
  // ลบ .summary-title ของเดิมที่อยู่ใน tableHtml เพราะเราจะทำ header ใหม่
  const cleanedTableHtml = tableHtml.replace(/<div class="summary-title"[^>]*>[\s\S]*?<\/div>\s*(<div[^>]*>ประจำ[^<]*<\/div>)?/g, '');
  
  const fullHtml = '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">' +
    '<title>' + title + ' - ฟาร์มไก่ดำ</title>' +
    '<style>' +
    '@page { size: ' + pageSize + '; margin: ' + (pageSize.includes('portrait') ? '0.8cm' : '0.5cm') + '; }' +
    '* { box-sizing: border-box; }' +
    'body { font-family: "Sarabun", "TH Sarabun New", "Tahoma", sans-serif; margin: 0; padding: ' + (pageSize.includes('portrait') ? '14px 16px' : '24px 28px') + '; color: #222; background: #fff; }' +
    
    // Toolbar (ซ่อนตอนพิมพ์)
    '.toolbar { position: sticky; top: 0; z-index: 100; background: #fff; padding: 12px 0 16px; margin-bottom: 0; display: flex; justify-content: flex-end; gap: 10px; border-bottom: 1px solid #eee; }' +
    '.toolbar button { padding: 9px 22px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-family: inherit; font-weight: 500; transition: all 0.15s; }' +
    '.btn-print { background: ' + accentColor + '; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
    '.btn-print:hover { filter: brightness(1.1); box-shadow: 0 3px 8px rgba(0,0,0,0.15); }' +
    '.btn-close { background: #ecf0f1; color: #34495e; }' +
    '.btn-close:hover { background: #d5dbdb; }' +
    
    // Letterhead
    '.letterhead { display: flex; align-items: flex-start; gap: ' + (pageSize.includes('portrait') ? '14px' : '20px') + '; padding: ' + (pageSize.includes('portrait') ? '10px 0 12px' : '20px 0 16px') + '; border-bottom: 3px double ' + accentColor + '; margin-bottom: ' + (pageSize.includes('portrait') ? '14px' : '22px') + '; }' +
    '.letterhead .logo { width: ' + (pageSize.includes('portrait') ? '56px' : '72px') + '; height: ' + (pageSize.includes('portrait') ? '56px' : '72px') + '; flex-shrink: 0; }' +
    '.letterhead .logo img { width: 100%; height: 100%; object-fit: contain; }' +
    '.letterhead .company-info { flex: 1; }' +
    '.letterhead .company-name { font-size: ' + (pageSize.includes('portrait') ? '17px' : '22px') + '; font-weight: 700; color: #1a5276; margin: 0; line-height: 1.2; }' +
    '.letterhead .company-sub { font-size: ' + (pageSize.includes('portrait') ? '11px' : '13px') + '; color: #566573; margin-top: 4px; line-height: 1.5; }' +
    '.letterhead .doc-meta { text-align: right; font-size: ' + (pageSize.includes('portrait') ? '10px' : '11px') + '; color: #7f8c8d; line-height: 1.5; flex-shrink: 0; }' +
    '.letterhead .doc-meta strong { color: #34495e; }' +
    
    // Document title
    '.doc-header { text-align: center; margin-bottom: ' + (pageSize.includes('portrait') ? '12px' : '20px') + '; }' +
    '.doc-title { font-size: ' + (pageSize.includes('portrait') ? '16px' : '20px') + '; font-weight: 700; color: ' + accentColor + '; margin: 0 0 6px; letter-spacing: 0.3px; }' +
    '.doc-subtitle { font-size: ' + (pageSize.includes('portrait') ? '12px' : '14px') + '; color: #566573; font-weight: 500; }' +
    
    // Table
    '.summary-table { border-collapse: collapse; font-size: ' + (pageSize.includes('portrait') ? '9.5px' : '11px') + '; width: 100%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }' +
    '.summary-table th, .summary-table td { border: 0.5px solid #bdc3c7; padding: ' + (pageSize.includes('portrait') ? '3px 4px' : '5px 7px') + '; vertical-align: middle; }' +
    '.summary-table thead th { text-align: center; font-weight: 600; color: white; padding: ' + (pageSize.includes('portrait') ? '5px 4px' : '7px') + '; letter-spacing: 0.2px; }' +
    '.summary-table tbody td.num { text-align: right; font-family: "Consolas", "Monaco", monospace; font-variant-numeric: tabular-nums; }' +
    '.summary-table tbody tr:nth-child(even) { background: #fafbfc; }' +
    '.summary-table tbody tr:hover { background: #f0f8ff; }' +
    '.summary-table tbody tr:last-child { border-top: 2px solid ' + accentColor + '; }' +
    
    // Summary cards (in report)
    'div[style*="border-radius:6px"][style*="border-left"] { box-shadow: 0 1px 3px rgba(0,0,0,0.06); }' +
    
    // Footer
    '.footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #e9ecef; }' +
    '.signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; margin-top: 28px; }' +
    '.sig-box { text-align: center; font-size: 12px; color: #566573; }' +
    '.sig-line { border-top: 1px dotted #7f8c8d; margin-top: 50px; padding-top: 6px; }' +
    '.sig-label { font-weight: 600; color: #34495e; margin-bottom: 2px; }' +
    '.sig-date { color: #95a5a6; font-size: 11px; margin-top: 2px; }' +
    '.footer-meta { text-align: center; font-size: 10px; color: #95a5a6; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #e9ecef; }' +
    
    // Print
    '@media print {' +
    '  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
    '  .toolbar { display: none !important; }' +
    '  body { padding: 0; }' +
    '  .letterhead { break-after: avoid; padding: 6px 0 8px !important; margin-bottom: 6px !important; border-bottom-width: 2px !important; }' +
    '  .letterhead .logo { width: 42px !important; height: 42px !important; }' +
    '  .letterhead .company-name { font-size: 13px !important; }' +
    '  .letterhead .company-sub { font-size: 9px !important; margin-top: 2px !important; }' +
    '  .letterhead .doc-meta { font-size: 8px !important; }' +
    '  .doc-header { break-after: avoid; margin-bottom: 6px !important; }' +
    '  .doc-title { font-size: 14px !important; margin-bottom: 2px !important; }' +
    '  .doc-subtitle { font-size: 10px !important; }' +
    '  .summary-table { box-shadow: none; page-break-inside: auto; }' +
    '  .summary-table tr { page-break-inside: avoid; }' +
    '  .summary-table thead { display: table-header-group; }' +
    '  .yearly-split-table { box-shadow: none; page-break-inside: auto; }' +
    '  .yearly-split-table tr { page-break-inside: avoid; }' +
    '  .yearly-split-table thead { display: table-header-group; }' +
    '  .yearly-split-container-2 { margin-top: 0 !important; }' +
    '  .footer { display: none !important; }' +
    '}' +
    '</style></head><body>' +
    
    // Toolbar
    '<div class="toolbar">' +
    '<button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>' +
    '<button class="btn-close" onclick="window.close()">❌ ปิด</button>' +
    '</div>' +
    
    // Letterhead
    '<div class="letterhead">' +
    '<div class="logo"><img src="' + (window.LOGO_BASE64 || '') + '" alt="Logo"></div>' +
    '<div class="company-info">' +
    '<h1 class="company-name">บริษัท ฟาร์มไก่ดำ (กาญจนบุรี) จำกัด</h1>' +
    '<div class="company-sub">' +
    '300/13 ถ.แสงชูโตเหนือ ต.ท่ามะขาม อ.เมือง จ.กาญจนบุรี 71000<br>' +
    'โทร (034) 515999, 518999' +
    '</div>' +
    '</div>' +
    '<div class="doc-meta">' +
    '<div><strong>เอกสาร</strong><br>INTERNAL USE</div>' +
    '<div style="margin-top:6px;"><strong>วันที่พิมพ์</strong><br>' + printDate + '<br>เวลา ' + printTime + ' น.</div>' +
    '</div>' +
    '</div>' +
    
    // Document header
    '<div class="doc-header">' +
    '<h2 class="doc-title">' + title + '</h2>' +
    '<div class="doc-subtitle">' + subtitle + '</div>' +
    '</div>' +
    
    // Table content (stripped of old title)
    cleanedTableHtml +
    
    // Footer with metadata only
    '<div class="footer">' +
    '<div class="footer-meta">' +
    '— เอกสารนี้จัดทำโดยระบบเงินเดือนอัตโนมัติ · พิมพ์เมื่อ ' + printDate + ' เวลา ' + printTime + ' น. —' +
    '</div>' +
    '</div>' +
    
    '</body></html>';
  
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    toast('เบราว์เซอร์บล็อก popup กรุณาอนุญาต', 'error');
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function exportSummaryXlsx() {
  const type = document.querySelector('input[name="summaryType"]:checked').value;
  const group = document.getElementById('summaryGroup').value;
  const year = parseInt(document.getElementById('summaryYear').value);
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  let csv = '\uFEFF';
  let filename;
  
  if (type === 'sso') {
    const month = parseInt(document.getElementById('summaryMonth').value);
    const emps = state.data.employees.slice().sort(employeeComparator());
    csv += 'รายงานประกันสังคม (สปส. 1-10) ประจำเดือน ' + MONTHS[month-1] + ' ' + year + '\n\n';
    csv += 'ลำดับ,รหัส,เลขที่บัตรประชาชน,ชื่อ-สกุล,กลุ่ม,ค่าจ้าง,ปกส.ลูกจ้าง,ปกส.นายจ้าง,รวมส่ง\n';
    let totals = { salary:0, sso:0 };
    let idx = 1;
    emps.forEach(emp => {
      const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
      const salary = Number(s.salary)||0, sso = Number(s.sso)||0;
      if (salary === 0 && sso === 0) return;
      const name = (emp.firstName||'') + ' ' + (emp.lastName||emp.nameEn||'');
      csv += idx + ',"' + emp.empId + '","' + (emp.idCard||'') + '","' + name + '","' + emp.group + '",' + salary + ',' + sso + ',' + sso + ',' + (sso*2) + '\n';
      totals.salary += salary; totals.sso += sso;
      idx++;
    });
    csv += ',,,"** รวม **",,' + totals.salary + ',' + totals.sso + ',' + totals.sso + ',' + (totals.sso*2) + '\n';
    filename = 'รายงานปกส_' + MONTHS[month-1] + '_' + year + '.csv';
  } else if (type === 'tax') {
    const month = parseInt(document.getElementById('summaryMonth').value);
    const emps = state.data.employees.slice().sort(employeeComparator());
    csv += 'รายงานภาษีหัก ณ ที่จ่าย (ภงด.1) ประจำเดือน ' + MONTHS[month-1] + ' ' + year + '\n\n';
    csv += 'ลำดับ,รหัส,เลขที่บัตรประชาชน,ชื่อ-สกุล,กลุ่ม,เงินเดือน,รายได้อื่น,รวมรายได้,ภาษีหัก\n';
    let totals = { salary:0, other:0, total:0, tax:0 };
    let idx = 1;
    emps.forEach(emp => {
      const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
      const tax = Number(s.tax)||0;
      if (tax === 0) return;
      const salary = Number(s.salary)||0, oth = Number(s.otherIncome)||0;
      const name = (emp.firstName||'') + ' ' + (emp.lastName||emp.nameEn||'');
      csv += idx + ',"' + emp.empId + '","' + (emp.idCard||'') + '","' + name + '","' + emp.group + '",' + salary + ',' + oth + ',' + (salary+oth) + ',' + tax + '\n';
      totals.salary += salary; totals.other += oth; totals.total += salary+oth; totals.tax += tax;
      idx++;
    });
    csv += ',,,"** รวม **",,' + totals.salary + ',' + totals.other + ',' + totals.total + ',' + totals.tax + '\n';
    filename = 'รายงานTAX_' + MONTHS[month-1] + '_' + year + '.csv';
  } else if (type === 'yearly') {
    const emps = state.data.employees.filter(e => e.group === group && isActiveInYear(e, year));
    sortEmployees(emps);
    if (emps.length === 0) { toast('ไม่พบพนักงานในกลุ่มนี้', 'error'); return; }
    
    csv += 'ทะเบียนการจ่ายเงินเดือน (' + group + ') บริษัท ฟาร์มไก่ดำ (กาญจนบุรี) จำกัด ประจำปี ' + year + '\n\n';
    let row1 = 'เลขที่บัตรประชาชน,ชื่อ สกุล';
    MONTHS.forEach(m => { row1 += ',' + m + ',,,'; });
    csv += row1 + '\n';
    let row2 = ',';
    for (let m = 0; m < 12; m++) row2 += ',รายได้,พิเศษ,ปกส.,กองทุน';
    csv += row2 + '\n';
    
    const monthTotals = Array(12).fill(null).map(() => ({ salary:0, otherIncome:0, sso:0, pvd:0 }));
    emps.forEach(emp => {
      let row = '"' + (emp.idCard || '') + '","' + (emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || '') + '"';
      for (let m = 1; m <= 12; m++) {
        const s = state.data.salaries[salaryKey(emp.empId, year, m)] || {};
        const sal = Number(s.salary) || 0, oth = Number(s.otherIncome) || 0, sso = Number(s.sso) || 0, pvd = Number(s.pvd) || 0;
        row += ',' + sal + ',' + oth + ',' + sso + ',' + pvd;
        monthTotals[m-1].salary += sal;
        monthTotals[m-1].otherIncome += oth;
        monthTotals[m-1].sso += sso;
        monthTotals[m-1].pvd += pvd;
      }
      csv += row + '\n';
    });
    let totalRow = ',รวมทั้งหมด';
    monthTotals.forEach(t => { totalRow += ',' + t.salary + ',' + t.otherIncome + ',' + t.sso + ',' + t.pvd; });
    csv += totalRow + '\n';
    filename = 'ตารางสรุปเงินเดือน_' + group + '_' + year + '.csv';
  } else {
    // monthly
    const month = parseInt(document.getElementById('summaryMonth').value);
    const emps = state.data.employees.filter(e => e.group === group && isActiveForMonthView(e, year, month));
    sortEmployees(emps);
    if (emps.length === 0) { toast('ไม่พบพนักงานในกลุ่มนี้', 'error'); return; }
    
    const isThaiStyle = !group.includes('พม่า');
    const monthName = MONTHS[month-1];
    
    if (isThaiStyle) {
      csv += 'สรุปรายการจ่ายเงินเดือน-ไทย (' + group + ') ประจำเดือน ' + monthName + ' ' + year + '\n\n';
      csv += 'ลำดับ,รายชื่อ,รายได้,รายได้อื่น,SSO ลจ.,W/H TAX,PVD ลจ.,เงินสด,เข้าบัญชี,จ่ายสุทธิ,SSO นจ.,PVD นจ.\n';
      let totals = { salary:0, otherIncome:0, sso:0, ssoEmp:0, tax:0, pvd:0, pvdEmp:0, cash:0, bank:0, net:0, transferCount:0 };
      emps.forEach((emp, i) => {
        const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
        const sal = Number(s.salary)||0, oth = Number(s.otherIncome)||0;
        const sso = Number(s.sso)||0, ssoEmp = Number(s.ssoEmployer)||0;
        const tax = Number(s.tax)||0;
        const pvd = Number(s.pvd)||0, pvdEmp = Number(s.pvdEmployer)||0;
        const cash = Number(s.cash)||0;
        const bankRaw = s.bank || s.receivedBy || '';
        const bank = typeof bankRaw === 'number' ? bankRaw : (parseFloat(String(bankRaw).replace(/,/g,'')) || 0);
        const net = sal + oth - sso - tax - pvd;
        const name = (emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || '');
        csv += (i+1) + ',"' + name + '",' + sal + ',' + oth + ',' + sso + ',' + tax + ',' + pvd + ',' + cash + ',' + bank + ',' + net + ',' + ssoEmp + ',' + pvdEmp + '\n';
        totals.salary += sal; totals.otherIncome += oth;
        totals.sso += sso; totals.ssoEmp += ssoEmp;
        totals.tax += tax; totals.pvd += pvd; totals.pvdEmp += pvdEmp;
        totals.cash += cash; totals.bank += bank; totals.net += net;
        if (bank > 0) totals.transferCount++;
      });
      csv += ',"** รวม **",' + totals.salary + ',' + totals.otherIncome + ',' + totals.sso + ',' + totals.tax + ',' + totals.pvd + ',' + totals.cash + ',' + totals.bank + ',' + totals.net + ',' + totals.ssoEmp + ',' + totals.pvdEmp + '\n';
      // แถวสรุปค่าธรรมเนียมโอน (บริษัทเป็นผู้ชำระ)
      csv += '\n"ค่าธรรมเนียมโอน (10 บาท/คน · บริษัทเป็นผู้ชำระ)",' + totals.transferCount + ' คน,' + (totals.transferCount * 10) + '\n';
    } else {
      csv += 'รายการจ่ายเงินเดือน-ต่างด้าว (' + group + ') ประจำเดือน ' + monthName + ' ' + year + '\n\n';
      csv += 'ลำดับ,รายชื่อ,รายได้,พิเศษ,OT,SSO ลจ.,หนี้อื่นๆ,หยุด,เงินสด,จ่ายสุทธิ,SSO นจ.\n';
      let totals = { salary:0, bonus:0, ot:0, holiday:0, debt:0, sso:0, ssoEmp:0, cash:0, net:0, transferCount:0 };
      emps.forEach((emp, i) => {
        const s = state.data.salaries[salaryKey(emp.empId, year, month)] || {};
        const sal = Number(s.salary)||0;
        const bonus = Number(s.bonus)||0, ot = Number(s.ot)||0;
        const hol = Number(s.holiday)||0, debt = Number(s.debt)||0;
        const sso = Number(s.sso)||0, ssoEmp = Number(s.ssoEmployer)||0;
        const cash = Number(s.cash)||0;
        const bankRaw = s.bank || s.receivedBy || '';
        const bank = typeof bankRaw === 'number' ? bankRaw : (parseFloat(String(bankRaw).replace(/,/g,'')) || 0);
        const net = sal + bonus + ot - sso - hol - debt;
        const name = (emp.firstName || '') + ' ' + (emp.lastName || emp.nameEn || '');
        csv += (i+1) + ',"' + name + '",' + sal + ',' + bonus + ',' + ot + ',' + sso + ',' + debt + ',' + hol + ',' + cash + ',' + net + ',' + ssoEmp + '\n';
        totals.salary += sal; totals.bonus += bonus; totals.ot += ot;
        totals.holiday += hol; totals.debt += debt;
        totals.sso += sso; totals.ssoEmp += ssoEmp;
        totals.cash += cash; totals.net += net;
        if (bank > 0) totals.transferCount++;
      });
      csv += ',"** รวม **",' + totals.salary + ',' + totals.bonus + ',' + totals.ot + ',' + totals.sso + ',' + totals.debt + ',' + totals.holiday + ',' + totals.cash + ',' + totals.net + ',' + totals.ssoEmp + '\n';
      // แถวสรุปค่าธรรมเนียมโอน (บริษัทเป็นผู้ชำระ)
      csv += '\n"ค่าธรรมเนียมโอน (10 บาท/คน · บริษัทเป็นผู้ชำระ)",' + totals.transferCount + ' คน,' + (totals.transferCount * 10) + '\n';
    }
    filename = 'สรุปรายเดือน_' + group + '_' + monthName + '_' + year + '.csv';
  }
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast('ดาวน์โหลดไฟล์ CSV เรียบร้อย', 'success');
}


function openPrintWindow(type, params) {
  // Serialize ข้อมูลที่ต้องส่งไปหน้าพิมพ์
  const printData = {
    type: type,
    params: params,
    salaries: {},
    bonuses: {},
    config: CONFIG_DEFAULTS,
    logo: window.LOGO_BASE64
  };
  
  // เก็บเฉพาะเงินเดือน/โบนัสที่เกี่ยวข้อง
  params.emps.forEach(emp => {
    if (type === 'yearly' || type === 'wht') {
      for (let m = 1; m <= 12; m++) {
        const k = salaryKey(emp.empId, params.year, m);
        if (state.data.salaries[k]) printData.salaries[k] = state.data.salaries[k];
      }
      const bk = bonusKey(emp.empId, params.year);
      if (state.data.bonuses[bk]) printData.bonuses[bk] = state.data.bonuses[bk];
    } else {
      const k = salaryKey(emp.empId, params.year, params.month);
      if (state.data.salaries[k]) printData.salaries[k] = state.data.salaries[k];
    }
  });
  
  // ฝังข้อมูลเข้าไปใน HTML เลย (เป็น JSON ใน script tag)
  const htmlTemplate = generatePrintHTML(type);
  const dataScript = '<scr' + 'ipt>window.PRINT_DATA = ' + JSON.stringify(printData).replace(/</g, '\\u003c') + ';</scr' + 'ipt>';
  const fullHtml = htmlTemplate.replace('<head>', '<head>' + dataScript);
  
  // ใช้ Blob URL เพื่อให้เบราว์เซอร์ render ถูกต้อง
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    toast('เบราว์เซอร์บล็อก popup กรุณาอนุญาต', 'error');
    return;
  }
  
  // Clean up URL หลังหน้าโหลดเสร็จ
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

