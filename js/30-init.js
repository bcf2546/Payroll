/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Init */
/* ============================================================
 * INIT
 * ============================================================ */
function initYearSelectors() {
  const thisYear = new Date().getFullYear() + 543;
  const years = [];
  for (let y = thisYear + 1; y >= thisYear - 3; y--) years.push(y);
  
  ['salYear', 'printYearlyYear', 'printSlipYear', 'printWhtYear'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === thisYear) opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

function bindEvents() {
  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });
  
  // Employee filter/search
  document.getElementById('empGroupFilter').addEventListener('change', renderEmployees);
  document.getElementById('empSearch').addEventListener('input', (e) => {
    state.ui.searchQuery = e.target.value;
    renderEmployees();
  });
  
  // Salary group change
  document.getElementById('salGroup').addEventListener('change', bindSalaryDropdowns);
  document.getElementById('printYearlyGroup').addEventListener('change', bindPrintDropdowns);
  document.getElementById('printSlipGroup').addEventListener('change', bindPrintDropdowns);
  document.getElementById('printWhtGroup').addEventListener('change', bindPrintDropdowns);
  
  // Modal close on backdrop click
  document.getElementById('empModal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeEmpModal();
  });
  
  // Global keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcut);
  
  // Bulk date auto-format + Enter handling
  const bulkDate = document.getElementById('qeBulkDate');
  if (bulkDate) setupDateInput(bulkDate);
}

function handleKeyboardShortcut(e) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const mod = isMac ? e.metaKey : e.ctrlKey;
  const activeTab = document.querySelector('.tab.active');
  const currentTab = activeTab ? activeTab.dataset.tab : '';
  
  // Ctrl+S / Cmd+S — บันทึก
  if (mod && e.key === 's') {
    e.preventDefault();
    if (currentTab === 'quickentry') {
      const btn = document.getElementById('btnSaveQuickEntry');
      if (btn && btn.style.display !== 'none') btn.click();
    } else if (currentTab === 'salary') {
      const btn = document.getElementById('btnSaveSalary');
      if (btn) btn.click();
    } else {
      toast('💡 Ctrl+S ใช้ได้ในหน้า "กรอกรายเดือน" หรือ "บันทึกเงินเดือน"', 'info');
    }
    return;
  }
  
  // Ctrl+D / Cmd+D — ไปเดือนถัดไป
  if (mod && e.key === 'd') {
    e.preventDefault();
    if (currentTab === 'quickentry') {
      const monthSel = document.getElementById('qeMonth');
      const yearSel = document.getElementById('qeYear');
      let m = parseInt(monthSel.value);
      let y = parseInt(yearSel.value);
      m += 1;
      if (m > 12) { m = 1; y += 1; }
      // เปลี่ยนปีถ้าจำเป็น
      const yearOpt = Array.from(yearSel.options).find(o => parseInt(o.value) === y);
      if (yearOpt) yearSel.value = y;
      monthSel.value = m;
      const loadBtn = document.querySelector('#panel-quickentry button[onclick*="loadQuickEntry"]');
      if (loadBtn) loadBtn.click();
      toast('📅 ไปเดือนถัดไป', 'info');
    }
    return;
  }
  
  // Ctrl+Shift+D — กลับเดือนก่อน
  if (mod && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    if (currentTab === 'quickentry') {
      const monthSel = document.getElementById('qeMonth');
      const yearSel = document.getElementById('qeYear');
      let m = parseInt(monthSel.value);
      let y = parseInt(yearSel.value);
      m -= 1;
      if (m < 1) { m = 12; y -= 1; }
      const yearOpt = Array.from(yearSel.options).find(o => parseInt(o.value) === y);
      if (yearOpt) yearSel.value = y;
      monthSel.value = m;
      const loadBtn = document.querySelector('#panel-quickentry button[onclick*="loadQuickEntry"]');
      if (loadBtn) loadBtn.click();
      toast('📅 กลับเดือนก่อน', 'info');
    }
    return;
  }
  
  // '/' — focus search box
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    if (currentTab === 'quickentry') {
      const searchBox = document.getElementById('qeSearch');
      if (searchBox) searchBox.focus();
    } else if (currentTab === 'employees') {
      const searchBox = document.getElementById('empSearch');
      if (searchBox) searchBox.focus();
    }
    return;
  }
  
  // '?' — แสดง keyboard shortcuts help
  if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    showKeyboardHelp();
    return;
  }
  
  // Escape — ปิด modals/help
  if (e.key === 'Escape') {
    const helpModal = document.getElementById('kbHelpModal');
    if (helpModal && helpModal.style.display !== 'none') {
      helpModal.style.display = 'none';
      return;
    }
    if (document.getElementById('empModal').classList.contains('show')) {
      closeEmpModal();
      return;
    }
  }
}

function showKeyboardHelp() {
  let modal = document.getElementById('kbHelpModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'kbHelpModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:10000; display:flex; align-items:center; justify-content:center;';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const mod = isMac ? '⌘' : 'Ctrl';
    
    modal.innerHTML = '<div style="background:white; padding:24px 28px; border-radius:10px; max-width:500px; box-shadow:0 10px 40px rgba(0,0,0,0.3);">' +
      '<h2 style="margin:0 0 16px; color:#1a5276;">⌨️ Keyboard Shortcuts</h2>' +
      '<table style="width:100%; border-collapse:collapse;">' +
      kbRow(mod + ' + S', '💾 บันทึกข้อมูล') +
      kbRow(mod + ' + D', '📅 ไปเดือนถัดไป (ในหน้ากรอก)') +
      kbRow(mod + ' + Shift + D', '📅 กลับเดือนก่อน') +
      kbRow('/', '🔍 ไปที่ช่องค้นหา') +
      kbRow('Tab', '➡️ ไปช่องถัดไป (ในตาราง)') +
      kbRow('Shift + Tab', '⬅️ กลับช่องก่อน') +
      kbRow('?', '❓ แสดงหน้านี้') +
      kbRow('Esc', '❌ ปิดหน้าต่าง') +
      '</table>' +
      '<div style="margin-top:18px; text-align:right;">' +
      '<button onclick="document.getElementById(\'kbHelpModal\').style.display=\'none\'" style="padding:8px 20px; background:#2c5f8d; color:white; border:none; border-radius:4px; cursor:pointer; font-size:14px;">ปิด (Esc)</button>' +
      '</div></div>';
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}

function kbRow(keys, desc) {
  return '<tr><td style="padding:8px 0; width:150px;"><kbd style="background:#f0f4f8; padding:4px 10px; border:1px solid #ccc; border-radius:4px; font-family:monospace; font-size:13px;">' + keys + '</kbd></td><td style="padding:8px 0;">' + desc + '</td></tr>';
}

/* ============================================================
 * PWA: Service Worker + เวอร์ชัน
 * ============================================================ */
function registerServiceWorker() {
  // SW ทำงานเฉพาะ https (เช่น GitHub Pages) — เปิดไฟล์ตรงๆ (file://) จะข้าม
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
      console.log('[Payroll] SW registered, version', window.APP_VERSION);
      reg.update(); // เช็คเวอร์ชันใหม่ทุกครั้งที่เปิด
    })
    .catch(err => console.warn('[Payroll] SW register failed:', err));
}

function showAppVersion() {
  // แสดงเลขเวอร์ชันใต้โลโก้ใน header และหน้า login
  try {
    var header = document.querySelector('#appHeader h1') || document.querySelector('#appHeader');
    if (header && !document.getElementById('appVersionBadge')) {
      var badge = document.createElement('span');
      badge.id = 'appVersionBadge';
      badge.textContent = 'v' + window.APP_VERSION;
      badge.style.cssText = 'font-size:11px; color:#aed6f1; margin-left:8px; font-weight:normal; vertical-align:middle;';
      header.appendChild(badge);
    }
    var login = document.querySelector('#loginScreen p');
    if (login && login.textContent.indexOf('v' + window.APP_VERSION) === -1) {
      login.textContent += ' · v' + window.APP_VERSION;
    }
    var cell = document.getElementById('settingsVersionCell');
    if (cell) cell.textContent = window.APP_VERSION;
  } catch (e) {}
}

window.addEventListener('DOMContentLoaded', function () {
  registerServiceWorker();
  showAppVersion();
});
