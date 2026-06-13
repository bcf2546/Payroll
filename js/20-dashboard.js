/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Dashboard */
/* ============================================================
 * DASHBOARD
 * ============================================================ */
function renderDashboard() {
  const emps = state.data.employees;
  // นับเฉพาะคนที่ยัง active ณ ปัจจุบัน (ไม่นับคนที่ออกไปแล้ว)
  const activeEmps = emps.filter(e => isActiveNow(e));
  const total = activeEmps.length;
  const thai = activeEmps.filter(e => e.group === 'BCF ไทย').length;
  const myanmar = activeEmps.filter(e => e.group === 'BCF พม่า').length;
  const others = total - thai - myanmar;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-thai').textContent = thai;
  document.getElementById('stat-myanmar').textContent = myanmar;
  document.getElementById('stat-others').textContent = others;
  
  // Populate year selector
  const yearSel = document.getElementById('dashChartYear');
  if (yearSel && yearSel.options.length === 0) {
    const currentThaiYear = new Date().getFullYear() + 543;
    for (let y = currentThaiYear - 2; y <= currentThaiYear; y++) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === currentThaiYear) opt.selected = true;
      yearSel.appendChild(opt);
    }
  }
  
  renderDashboardAlerts();
  renderDashboardCharts();
}

// Helper: พนักงานยังทำงานอยู่ ณ วันนี้หรือไม่
// เงื่อนไข: ไม่มี endDate หรือ endDate ยังไม่ถึง
function isActiveNow(emp) {
  if (!emp.endDate) return true;
  const today = new Date();
  const end = parseThaiDate(emp.endDate);
  if (!end) return true; // parse ไม่ได้ = treat as active (safety)
  return end >= today;
}

// Helper: พนักงานยังทำงานในเดือน/ปีที่ระบุหรือไม่
// year = ปี พ.ศ., month = 1-12
// เงื่อนไข: startDate ≤ สิ้นเดือนนั้น AND (endDate ว่าง OR endDate ≥ ต้นเดือนนั้น)
function isActiveInMonth(emp, thaiYear, month) {
  const ceYear = thaiYear - 543;
  const monthStart = new Date(ceYear, month - 1, 1);
  const monthEnd = new Date(ceYear, month, 0); // วันสุดท้ายของเดือน
  
  const start = emp.startDate ? parseThaiDate(emp.startDate) : null;
  const end = emp.endDate ? parseThaiDate(emp.endDate) : null;
  
  // เริ่มงานหลังสิ้นเดือน → ยังไม่ active
  if (start && start > monthEnd) return false;
  // ออกก่อนต้นเดือน → ไม่ active แล้ว
  if (end && end < monthStart) return false;
  return true;
}

// Helper: ควรแสดงพนักงานในมุมมองรายเดือน (กรอกรายเดือน + ตารางสรุปเดือน) หรือไม่?
// กฎ: 
//   1. ยังทำงานในเดือนนั้น → แสดง
//   2. ออกไปแล้วในเดือนก่อนหน้า (1 เดือน) → ยังแสดง (เพื่อกรอกเงินเดือนเดือนสุดท้าย)
//   3. ข้อยกเว้น: ถ้าออกเดือน ธ.ค. ของปีก่อน → ไม่แสดงใน ม.ค. ปีถัดไป (ข้ามปี)
function isActiveForMonthView(emp, thaiYear, month) {
  // ถ้า active ในเดือนนั้น → แสดง
  if (isActiveInMonth(emp, thaiYear, month)) return true;
  
  // ถ้าไม่มี endDate → ไม่ active ก็ไม่มีกรณีพิเศษ (แต่ case นี้ไม่ควรเกิดเพราะ isActiveInMonth ควรคืน true)
  if (!emp.endDate) return false;
  
  const end = parseThaiDate(emp.endDate);
  if (!end) return false;
  
  // หาเดือนก่อนหน้า
  // ถ้าเดือนปัจจุบันคือ ม.ค. → เดือนก่อน = ธ.ค. ปีที่แล้ว → ข้อยกเว้น: ไม่แสดง
  if (month === 1) return false;
  
  const prevCeYear = thaiYear - 543;
  const prevMonth = month - 1;
  const prevMonthStart = new Date(prevCeYear, prevMonth - 1, 1);
  const prevMonthEnd = new Date(prevCeYear, prevMonth, 0);
  
  // ถ้าออกในเดือนก่อนหน้า (ของปีเดียวกัน) → ยังแสดงอีก 1 เดือน
  if (end >= prevMonthStart && end <= prevMonthEnd) return true;
  
  return false;
}

// Helper: พนักงานเคยทำงานในปีที่ระบุหรือไม่ (สำหรับตารางรายปี)
// เงื่อนไข: startDate ≤ 31 ธ.ค. ของปีนั้น AND (endDate ว่าง OR endDate ≥ 1 ม.ค. ของปีนั้น)
function isActiveInYear(emp, thaiYear) {
  const ceYear = thaiYear - 543;
  const yearStart = new Date(ceYear, 0, 1);
  const yearEnd = new Date(ceYear, 11, 31);
  
  const start = emp.startDate ? parseThaiDate(emp.startDate) : null;
  const end = emp.endDate ? parseThaiDate(emp.endDate) : null;
  
  // เริ่มงานหลังสิ้นปี → ไม่นับ
  if (start && start > yearEnd) return false;
  // ออกก่อนต้นปี → ไม่นับ
  if (end && end < yearStart) return false;
  return true;
}

// Parse วันที่แบบไทย "DD/MM/YYYY" (YYYY = ค.ศ. หรือ พ.ศ.)
// คืนค่า Date ภาษา JS (ค.ศ.) หรือ null ถ้า parse ไม่ได้
function parseThaiDate(str) {
  if (!str) return null;
  const parts = String(str).split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  let y = parseInt(parts[2]);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  // ถ้าเป็น 2 หลัก (เช่น 22 → 2022)
  if (y < 100) y = 2000 + y;
  // ถ้าเป็น พ.ศ. (> 2500) → แปลงเป็น ค.ศ.
  if (y > 2400) y -= 543;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function renderDashboardAlerts() {
  const container = document.getElementById('dashAlerts');
  if (!container) return;
  
  const alerts = [];
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentThaiYear = now.getFullYear() + 543;
  const currentMonth = now.getMonth() + 1;
  
  // ตรวจเดือนปัจจุบัน — เฉพาะคนที่ยัง active ในเดือนนี้
  const groups = ['BCF ไทย', 'BCF พม่า', 'ฟาร์ม1', 'ฟาร์ม3', 'SNP'];
  const incompleteGroups = [];
  
  groups.forEach(g => {
    const groupEmps = state.data.employees.filter(e => 
      e.group === g && isActiveForMonthView(e, currentThaiYear, currentMonth)
    );
    if (groupEmps.length === 0) return;
    
    const filled = groupEmps.filter(e => {
      const s = state.data.salaries[salaryKey(e.empId, currentThaiYear, currentMonth)];
      return s && ((Number(s.salary) || 0) > 0 || (Number(s.otherIncome) || 0) > 0);
    }).length;
    
    if (filled < groupEmps.length) {
      incompleteGroups.push({ group: g, filled, total: groupEmps.length });
    }
  });
  
  const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  // Alert level = urgency
  const daysLeft = daysInMonth - currentDay;
  const isLateMonth = daysLeft <= 5;  // 5 วันสุดท้ายของเดือน
  
  if (incompleteGroups.length > 0) {
    const alertLevel = isLateMonth ? 'urgent' : 'warning';
    const bg = alertLevel === 'urgent' ? '#fee' : '#fff3cd';
    const border = alertLevel === 'urgent' ? '#dc3545' : '#f39c12';
    const icon = alertLevel === 'urgent' ? '🚨' : '⚠️';
    const title = alertLevel === 'urgent' 
      ? 'ยังกรอกเงินเดือนไม่ครบ — เดือน ' + MONTHS[currentMonth-1] + ' ' + currentThaiYear + ' เหลืออีก ' + daysLeft + ' วัน!'
      : 'ยังกรอกเงินเดือนไม่ครบ — เดือน ' + MONTHS[currentMonth-1] + ' ' + currentThaiYear;
    
    let html = '<div style="background:' + bg + '; border-left:4px solid ' + border + '; padding:14px 18px; border-radius:6px; margin-bottom:10px;">';
    html += '<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">';
    html += '<span style="font-size:24px;">' + icon + '</span>';
    html += '<strong style="font-size:15px; color:#333;">' + title + '</strong>';
    html += '</div>';
    html += '<div style="display:flex; gap:12px; flex-wrap:wrap;">';
    incompleteGroups.forEach(ig => {
      const pct = Math.round((ig.filled / ig.total) * 100);
      const barColor = pct >= 80 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#dc3545';
      html += '<div style="background:white; padding:10px 14px; border-radius:6px; min-width:200px; flex:1;">';
      html += '<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;"><strong>' + escapeHtml(ig.group) + '</strong><span style="color:#666;">' + ig.filled + '/' + ig.total + ' (' + pct + '%)</span></div>';
      html += '<div style="background:#e9ecef; height:8px; border-radius:4px; overflow:hidden;"><div style="background:' + barColor + '; height:100%; width:' + pct + '%; transition:width 0.3s;"></div></div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px;"><button onclick="switchTab(\'quickentry\')" style="background:#2c5f8d; color:white; padding:8px 16px; border:none; border-radius:4px; cursor:pointer; font-size:13px;">📝 ไปกรอกเงินเดือน</button></div>';
    html += '</div>';
    container.innerHTML = html;
  } else {
    // ทุกกลุ่มกรอกครบ
    if (state.data.employees.length > 0) {
      container.innerHTML = '<div style="background:#d4edda; border-left:4px solid #27ae60; padding:12px 18px; border-radius:6px;">' +
        '<span style="font-size:20px;">✅</span> <strong style="color:#155724;">เยี่ยม! กรอกเงินเดือนครบทุกคนแล้ว สำหรับเดือน ' + MONTHS[currentMonth-1] + ' ' + currentThaiYear + '</strong>' +
        '</div>';
    } else {
      container.innerHTML = '';
    }
  }
}

function renderDashboardCharts() {
  renderMonthlyCostChart();
  renderCompletionCalendar();
  renderGroupBreakdown();
  renderTopEarners();
}

function renderMonthlyCostChart() {
  const container = document.getElementById('dashMonthlyChart');
  if (!container) return;
  const year = parseInt(document.getElementById('dashChartYear').value) || (new Date().getFullYear() + 543);
  
  // คำนวณต้นทุนแต่ละเดือน
  const monthlyTotal = [];
  for (let m = 1; m <= 12; m++) {
    let sum = 0;
    state.data.employees.forEach(emp => {
      const s = state.data.salaries[salaryKey(emp.empId, year, m)];
      if (s) sum += (Number(s.salary) || 0) + (Number(s.otherIncome) || 0);
    });
    monthlyTotal.push(sum);
  }
  const maxVal = Math.max(...monthlyTotal, 1);
  
  const MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  
  // Render as SVG bar chart
  const W = 500, H = 200, PAD_L = 50, PAD_B = 30, PAD_T = 10, PAD_R = 10;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const barGap = 4;
  const barW = (chartW / 12) - barGap;
  
  const fmt = (n) => {
    if (n === 0) return '0';
    if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n/1000).toFixed(0) + 'K';
    return String(n);
  };
  
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg">';
  
  // Y-axis grid lines
  for (let i = 0; i <= 4; i++) {
    const y = PAD_T + (chartH / 4) * i;
    const val = maxVal - (maxVal / 4) * i;
    svg += '<line x1="' + PAD_L + '" y1="' + y + '" x2="' + (W - PAD_R) + '" y2="' + y + '" stroke="#e9ecef" stroke-width="1"/>';
    svg += '<text x="' + (PAD_L - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#666">' + fmt(val) + '</text>';
  }
  
  // Bars
  monthlyTotal.forEach((val, i) => {
    const x = PAD_L + i * (barW + barGap) + 2;
    const h = (val / maxVal) * chartH;
    const y = PAD_T + chartH - h;
    const hasData = val > 0;
    const color = hasData ? '#2c5f8d' : '#dee2e6';
    svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" fill="' + color + '" rx="2">';
    svg += '<title>' + MONTHS_SHORT[i] + ': ' + val.toLocaleString() + ' บาท</title></rect>';
    if (hasData) {
      svg += '<text x="' + (x + barW/2) + '" y="' + (y - 3) + '" text-anchor="middle" font-size="9" fill="#1a5276" font-weight="600">' + fmt(val) + '</text>';
    }
    svg += '<text x="' + (x + barW/2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" fill="#666">' + MONTHS_SHORT[i] + '</text>';
  });
  
  svg += '</svg>';
  container.innerHTML = svg;
}

function renderCompletionCalendar() {
  const container = document.getElementById('dashCalendar');
  if (!container) return;
  const year = parseInt(document.getElementById('dashChartYear').value) || (new Date().getFullYear() + 543);
  const groupFilter = document.getElementById('dashCalGroup').value;
  
  const emps = groupFilter === 'all'
    ? state.data.employees
    : state.data.employees.filter(e => e.group === groupFilter);
  
  const MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  
  let html = '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">';
  for (let m = 1; m <= 12; m++) {
    // กรองเฉพาะคนที่แสดงในเดือนนั้น (รวม buffer 1 เดือน) — ให้ตรงกับหน้ากรอก
    const activeEmps = emps.filter(e => isActiveForMonthView(e, year, m));
    const filled = activeEmps.filter(e => {
      const s = state.data.salaries[salaryKey(e.empId, year, m)];
      return s && ((Number(s.salary) || 0) > 0 || (Number(s.otherIncome) || 0) > 0);
    }).length;
    const pct = activeEmps.length > 0 ? Math.round((filled / activeEmps.length) * 100) : 0;
    
    let bg, color, emoji;
    if (activeEmps.length === 0) { bg = '#f8f9fa'; color = '#999'; emoji = '—'; }
    else if (pct === 100) { bg = '#d4edda'; color = '#155724'; emoji = '✅'; }
    else if (pct >= 50) { bg = '#fff3cd'; color = '#856404'; emoji = '🟡'; }
    else if (pct > 0) { bg = '#f8d7da'; color = '#721c24'; emoji = '🔴'; }
    else { bg = '#f8f9fa'; color = '#6c757d'; emoji = '⚪'; }
    
    html += '<div style="background:' + bg + '; color:' + color + '; padding:10px 8px; border-radius:6px; text-align:center; cursor:pointer;" onclick="switchTab(\'quickentry\'); setTimeout(()=>{document.getElementById(\'qeMonth\').value=' + m + '; document.getElementById(\'qeYear\').value=' + year + ';}, 100);" title="' + MONTHS_FULL[m-1] + ' ' + year + ': ' + filled + '/' + activeEmps.length + ' คน (' + pct + '%)">';
    html += '<div style="font-size:14px;">' + emoji + '</div>';
    html += '<div style="font-size:12px; font-weight:600; margin-top:2px;">' + MONTHS_SHORT[m-1] + '</div>';
    html += '<div style="font-size:10px; margin-top:2px;">' + filled + '/' + activeEmps.length + '</div>';
    html += '</div>';
  }
  html += '</div>';
  
  container.innerHTML = html;
}

function renderGroupBreakdown() {
  const container = document.getElementById('dashGroupBreakdown');
  if (!container) return;
  const year = parseInt(document.getElementById('dashChartYear').value) || (new Date().getFullYear() + 543);
  const month = new Date().getMonth() + 1;
  
  const groups = ['BCF ไทย', 'BCF พม่า', 'ฟาร์ม1', 'ฟาร์ม3', 'SNP'];
  const colors = ['#2c5f8d', '#d35400', '#27ae60', '#16a085', '#8e44ad'];
  
  const data = groups.map((g, i) => {
    const groupEmps = state.data.employees.filter(e => e.group === g);
    let total = 0;
    groupEmps.forEach(emp => {
      const s = state.data.salaries[salaryKey(emp.empId, year, month)];
      if (s) total += (Number(s.salary) || 0) + (Number(s.otherIncome) || 0);
    });
    return { group: g, total, color: colors[i] };
  }).filter(d => d.total > 0);
  
  const sum = data.reduce((a, d) => a + d.total, 0);
  
  if (sum === 0) {
    container.innerHTML = '<div style="text-align:center; padding:60px; color:#999; font-size:13px;">ยังไม่มีข้อมูลเดือนนี้</div>';
    return;
  }
  
  // Donut chart SVG
  const cx = 100, cy = 100, r = 70, innerR = 40;
  let angle = -Math.PI / 2; // start from top
  let paths = '';
  let legend = '';
  
  data.forEach(d => {
    const pct = d.total / sum;
    const endAngle = angle + pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(angle);
    const iy2 = cy + innerR * Math.sin(angle);
    const large = pct > 0.5 ? 1 : 0;
    paths += '<path d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' L ' + ix1 + ' ' + iy1 + ' A ' + innerR + ' ' + innerR + ' 0 ' + large + ' 0 ' + ix2 + ' ' + iy2 + ' Z" fill="' + d.color + '" stroke="white" stroke-width="2"><title>' + d.group + ': ' + d.total.toLocaleString() + '</title></path>';
    
    legend += '<div style="display:flex; align-items:center; gap:8px; font-size:12px; margin-bottom:4px;">';
    legend += '<div style="width:12px; height:12px; background:' + d.color + '; border-radius:2px;"></div>';
    legend += '<div style="flex:1;">' + d.group + '</div>';
    legend += '<div style="font-weight:600;">' + d.total.toLocaleString() + '</div>';
    legend += '<div style="color:#666; min-width:40px; text-align:right;">' + (pct*100).toFixed(0) + '%</div>';
    legend += '</div>';
    
    angle = endAngle;
  });
  
  const html = '<div style="display:flex; align-items:center; gap:20px;">' +
    '<svg viewBox="0 0 200 200" style="width:200px; height:200px; flex-shrink:0;">' + paths +
    '<text x="100" y="98" text-anchor="middle" font-size="11" fill="#666">รวม</text>' +
    '<text x="100" y="115" text-anchor="middle" font-size="13" font-weight="700" fill="#1a5276">' + (sum >= 1000000 ? (sum/1000000).toFixed(1) + 'M' : (sum/1000).toFixed(0) + 'K') + '</text>' +
    '</svg>' +
    '<div style="flex:1;">' + legend + '</div>' +
    '</div>';
  container.innerHTML = html;
}

function renderTopEarners() {
  const container = document.getElementById('dashTopEarners');
  if (!container) return;
  const year = parseInt(document.getElementById('dashChartYear').value) || (new Date().getFullYear() + 543);
  const month = new Date().getMonth() + 1;
  
  const earners = state.data.employees.map(emp => {
    const s = state.data.salaries[salaryKey(emp.empId, year, month)];
    if (!s) return null;
    const total = (Number(s.salary) || 0) + (Number(s.otherIncome) || 0);
    if (total === 0) return null;
    return { emp, total };
  }).filter(Boolean).sort((a, b) => b.total - a.total).slice(0, 5);
  
  if (earners.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:40px; color:#999; font-size:13px;">ยังไม่มีข้อมูลเดือนนี้</div>';
    return;
  }
  
  const maxVal = earners[0].total;
  let html = '';
  earners.forEach((d, i) => {
    const pct = (d.total / maxVal) * 100;
    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
    const name = (d.emp.firstName || '') + ' ' + (d.emp.lastName || d.emp.nameEn || '');
    html += '<div style="margin-bottom:10px;">';
    html += '<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px;">';
    html += '<span>' + medal + ' <strong>' + escapeHtml(d.emp.empId) + '</strong> ' + escapeHtml(name) + '</span>';
    html += '<span style="font-weight:600; color:#1a5276;">' + d.total.toLocaleString() + '</span>';
    html += '</div>';
    html += '<div style="background:#e9ecef; height:6px; border-radius:3px; overflow:hidden;">';
    html += '<div style="background:linear-gradient(90deg, #2c5f8d, #5d8cb0); height:100%; width:' + pct + '%;"></div>';
    html += '</div></div>';
  });
  container.innerHTML = html;
}
