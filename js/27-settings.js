/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Settings / Import-Export */
/* ============================================================
 * SETTINGS / SETUP / IMPORT-EXPORT
 * ============================================================ */
function renderSettings() {
  const url = state.config.webAppUrl;
  const card = document.getElementById('syncStatusCard');
  const statsEl = document.getElementById('syncStatsInfo');
  const storageMode = document.getElementById('storageMode');
  
  if (url) {
    // Connected
    document.getElementById('connectStatus').innerHTML = '<span style="color:#27ae60;">✅ เชื่อมต่อแล้ว</span>';
    document.getElementById('connectUrl').textContent = url;
    if (card) card.style.borderLeftColor = '#27ae60';
    if (storageMode) storageMode.textContent = 'localStorage + Google Sheets (hybrid)';
    
    // Stats
    const lastPush = state.sync.lastPush ? new Date(state.sync.lastPush).toLocaleTimeString('th-TH') : '-';
    const lastPull = state.sync.lastPull ? new Date(state.sync.lastPull).toLocaleTimeString('th-TH') : '-';
    if (statsEl) {
      statsEl.innerHTML = '📤 Push ล่าสุด: <strong>' + lastPush + '</strong><br>📥 Pull ล่าสุด: <strong>' + lastPull + '</strong>';
    }
    
    document.getElementById('syncActionsConnected').style.display = '';
    document.getElementById('syncActionsNotConnected').style.display = 'none';
  } else {
    // Not connected
    document.getElementById('connectStatus').innerHTML = '<span style="color:#e67e22;">⚠️ ยังไม่ได้เชื่อมต่อ</span>';
    document.getElementById('connectUrl').textContent = '(ยังไม่ได้ตั้งค่า)';
    if (card) card.style.borderLeftColor = '#e67e22';
    if (storageMode) storageMode.textContent = 'localStorage เท่านั้น (ข้อมูลเก็บในเครื่องนี้!)';
    if (statsEl) statsEl.innerHTML = '';
    
    document.getElementById('syncActionsConnected').style.display = 'none';
    document.getElementById('syncActionsNotConnected').style.display = '';
  }
}

function connectSheets() {
  const url = prompt(
    '📋 กรุณาใส่ Google Apps Script Web App URL:\n\n' +
    '(URL ต้องขึ้นต้นด้วย https://script.google.com/macros/s/...)\n\n' +
    '💡 ถ้ายังไม่มี URL กด "ดูวิธีตั้งค่า" ก่อน',
    ''
  );
  if (!url) return;
  
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://script.google.com/')) {
    if (!confirm('⚠️ URL ไม่ได้ขึ้นต้นด้วย https://script.google.com/\nยืนยันการใช้ URL นี้?')) return;
  }
  
  state.config.webAppUrl = trimmed;
  saveConfig();
  renderSettings();
  updateSyncStatus('syncing', 'กำลังทดสอบ...');
  
  // ทดสอบเชื่อมต่อทันที
  testConnection(true);
}

async function testConnection(isFirstTime) {
  if (!state.config.webAppUrl) {
    toast('ยังไม่ได้ตั้งค่า URL', 'error');
    return;
  }
  
  updateSyncStatus('syncing', 'กำลังทดสอบ...');
  toast('🔍 กำลังทดสอบการเชื่อมต่อ...', 'info');
  
  try {
    const response = await fetch(state.config.webAppUrl + '?t=' + Date.now());
    const result = await response.json();
    
    if (result.success) {
      updateSyncStatus('', '✓ เชื่อมต่อแล้ว');
      
      if (isFirstTime) {
        // ครั้งแรก — ถามว่าจะใช้ข้อมูลจาก Sheets หรือ Push ของเครื่องนี้ขึ้นไป
        const serverEmps = (result.data && result.data.employees) ? result.data.employees.length : 0;
        const localEmps = state.data.employees.length;
        
        if (serverEmps > 0 && localEmps > 0) {
          const useServer = confirm(
            '🤔 พบข้อมูลทั้งบน Google Sheets และในเครื่องนี้:\n\n' +
            '☁️ บน Sheets: ' + serverEmps + ' คน\n' +
            '💻 ในเครื่อง: ' + localEmps + ' คน\n\n' +
            'กด OK เพื่อใช้ข้อมูลจาก Sheets (เขียนทับข้อมูลในเครื่อง)\n' +
            'กด Cancel เพื่อ Push ข้อมูลในเครื่องขึ้นไปใน Sheets (เขียนทับ Sheets)'
          );
          
          if (useServer) {
            await pullFromSheet(false);
            toast('✅ ดึงข้อมูลจาก Sheets สำเร็จ ' + serverEmps + ' คน', 'success');
          } else {
            await pushToSheet();
            toast('✅ ส่งข้อมูลขึ้น Sheets สำเร็จ ' + localEmps + ' คน', 'success');
          }
        } else if (serverEmps > 0) {
          await pullFromSheet(false);
          toast('✅ ดึงข้อมูลจาก Sheets สำเร็จ ' + serverEmps + ' คน', 'success');
        } else if (localEmps > 0) {
          await pushToSheet();
          toast('✅ ส่งข้อมูลในเครื่องขึ้น Sheets สำเร็จ ' + localEmps + ' คน', 'success');
        } else {
          toast('✅ เชื่อมต่อสำเร็จ! ยังไม่มีข้อมูล เริ่มต้นได้เลย', 'success');
        }
        
        startAutoPull();  // เริ่ม auto-pull ทุก 30 วิ
      } else {
        toast('✅ การเชื่อมต่อใช้งานได้ปกติ', 'success');
      }
      
      renderSettings();
      return true;
    } else {
      throw new Error(result.error || 'ไม่รู้จัก response');
    }
  } catch (err) {
    console.error('Test connection failed:', err);
    updateSyncStatus('error', 'เชื่อมต่อไม่ได้');
    toast('❌ เชื่อมต่อไม่สำเร็จ: ' + err.message + '\n\nตรวจสอบ URL หรือการ deploy Apps Script', 'error');
    return false;
  }
}

function showSheetsGuide() {
  // สร้าง modal guide
  let modal = document.getElementById('sheetsGuideModal');
  if (modal) { modal.style.display = 'flex'; return; }
  
  modal = document.createElement('div');
  modal.id = 'sheetsGuideModal';
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px; overflow-y:auto;';
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  
  const gsCode = (window.GS_CODE_TEMPLATE || '(Code.gs content)');
  
  modal.innerHTML =
    '<div style="background:white; padding:24px 28px; border-radius:10px; max-width:750px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3);">' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:2px solid #2c5f8d; padding-bottom:10px;">' +
    '<h2 style="margin:0; color:#1a5276;">📖 คู่มือเชื่อมต่อ Google Sheets</h2>' +
    '<button onclick="document.getElementById(\'sheetsGuideModal\').style.display=\'none\'" style="background:none; border:none; font-size:24px; cursor:pointer; color:#95a5a6;">✕</button>' +
    '</div>' +
    
    '<div style="background:#fff3cd; padding:12px 14px; border-left:4px solid #ffc107; border-radius:4px; margin-bottom:18px; font-size:14px;">' +
    '💡 <strong>ทำครั้งเดียวเท่านั้น</strong> — ประมาณ 5-10 นาที หลังจากนั้นเชื่อมต่อจากเครื่องอื่นแค่ใส่ URL เท่านั้น' +
    '</div>' +
    
    '<ol style="font-size:14px; line-height:1.9; padding-left:20px;">' +
    
    '<li style="margin-bottom:12px;"><strong>สร้าง Google Sheet ใหม่</strong><br>' +
    '<span style="color:#666;">ไปที่ <a href="https://sheets.new" target="_blank" style="color:#2c5f8d;">sheets.new</a> → ตั้งชื่อว่า "Payroll Data" หรืออะไรก็ได้</span></li>' +
    
    '<li style="margin-bottom:12px;"><strong>เปิด Apps Script</strong><br>' +
    '<span style="color:#666;">ในหน้า Sheet → เมนู <code style="background:#f0f0f0; padding:2px 6px; border-radius:3px;">Extensions</code> → <code style="background:#f0f0f0; padding:2px 6px; border-radius:3px;">Apps Script</code></span></li>' +
    
    '<li style="margin-bottom:12px;"><strong>วาง Code.gs</strong><br>' +
    '<span style="color:#666;">ลบ code เดิมในหน้า editor → กดปุ่มด้านล่างเพื่อคัดลอก code → วาง → กด Save (💾 หรือ Ctrl+S)</span><br>' +
    '<button onclick="copyGsCode()" style="background:#27ae60; color:white; padding:8px 14px; border:none; border-radius:4px; cursor:pointer; font-size:13px; margin-top:6px;">📋 คัดลอก Code.gs</button>' +
    '</li>' +
    
    '<li style="margin-bottom:12px;"><strong>Deploy เป็น Web App</strong><br>' +
    '<span style="color:#666; display:block; margin-top:4px;">กดปุ่ม <code style="background:#f0f0f0; padding:2px 6px; border-radius:3px;">Deploy</code> (มุมขวาบน) → <code style="background:#f0f0f0; padding:2px 6px; border-radius:3px;">New deployment</code></span>' +
    '<span style="color:#666; display:block; margin-top:4px;">• <strong>Type</strong>: ⚙️ กดไอคอนเฟือง → เลือก <strong>Web app</strong></span>' +
    '<span style="color:#666; display:block;">• <strong>Execute as</strong>: Me (ตัวเอง)</span>' +
    '<span style="color:#666; display:block;">• <strong>Who has access</strong>: <strong style="color:#d63031;">Anyone</strong> (สำคัญมาก!)</span>' +
    '<span style="color:#666; display:block; margin-top:4px;">→ กด <strong>Deploy</strong> → อนุญาตสิทธิ์ (กด Allow ทุกอัน)</span>' +
    '</li>' +
    
    '<li style="margin-bottom:12px;"><strong>คัดลอก Web App URL</strong><br>' +
    '<span style="color:#666;">หลัง Deploy สำเร็จ จะมี URL ขึ้นด้านล่าง — copy เก็บไว้ (เริ่มด้วย <code style="background:#f0f0f0; padding:2px 6px; border-radius:3px;">https://script.google.com/macros/s/...</code>)</span></li>' +
    
    '<li style="margin-bottom:12px;"><strong>กลับมาใส่ URL ในระบบ</strong><br>' +
    '<span style="color:#666;">ปิดหน้านี้ → กดปุ่ม <strong>"🔗 เชื่อมต่อ Google Sheets"</strong> → วาง URL → OK</span></li>' +
    
    '<li><strong>✅ เสร็จแล้ว!</strong><br>' +
    '<span style="color:#666;">ข้อมูลจะ sync อัตโนมัติ เปลี่ยนเครื่องใหม่ ใส่ URL เดิม ข้อมูลกลับมาทันที</span></li>' +
    '</ol>' +
    
    '<div style="background:#e8f5e9; padding:12px 14px; border-radius:6px; margin-top:18px; font-size:13px; color:#2e7d32;">' +
    '<strong>🔒 ปลอดภัยไหม?</strong><br>' +
    'แม้ตั้ง "Anyone" แต่ไม่มีใครเข้าถึงข้อมูลได้ถ้าไม่รู้ URL ของคุณ (URL ยาว+สุ่ม เดาไม่ได้) — เหมือน Google Drive link แบบ "anyone with the link"' +
    '</div>' +
    
    '<div style="text-align:right; margin-top:20px;">' +
    '<button onclick="document.getElementById(\'sheetsGuideModal\').style.display=\'none\'" style="background:#2c5f8d; color:white; padding:10px 24px; border:none; border-radius:5px; cursor:pointer; font-size:14px;">เข้าใจแล้ว</button>' +
    '</div>' +
    '</div>';
  
  document.body.appendChild(modal);
}

function copyGsCode() {
  if (!window.GS_CODE_TEMPLATE) {
    toast('ไม่มี Code template กรุณาดาวน์โหลดจาก output folder', 'error');
    return;
  }
  navigator.clipboard.writeText(window.GS_CODE_TEMPLATE).then(() => {
    toast('✅ คัดลอก Code.gs แล้ว — ไปวางใน Apps Script Editor', 'success');
  }).catch(err => {
    // Fallback: show in new window
    const w = window.open('', '_blank');
    w.document.write('<pre style="padding:20px; font-family:monospace; font-size:13px;">' + window.GS_CODE_TEMPLATE.replace(/</g, '&lt;') + '</pre>');
    toast('เปิดหน้าต่างใหม่แล้ว copy ด้วย Ctrl+A → Ctrl+C', 'info');
  });
}

async function downloadWithUrl() {
  if (!state.config.webAppUrl) {
    toast('ยังไม่ได้เชื่อมต่อ Google Sheets กรุณาตั้งค่าก่อน', 'error');
    return;
  }
  
  const currentUrl = state.config.webAppUrl;
  if (!confirm(
    '📌 ดาวน์โหลดไฟล์ HTML ที่ฝัง URL ไว้แล้ว\n\n' +
    'ไฟล์ใหม่จะมี URL นี้ฝังอยู่:\n' + currentUrl + '\n\n' +
    '✅ ข้อดี: เปลี่ยนเครื่อง เปิดไฟล์นี้ปุ๊บ sync ทันที ไม่ต้องใส่ URL ใหม่\n' +
    '⚠️ ความปลอดภัย: ใครได้ไฟล์นี้ไปก็เข้าถึงข้อมูลได้ เก็บไฟล์เป็นส่วนตัว\n\n' +
    'กด OK เพื่อดาวน์โหลด'
  )) return;
  
  toast('⏳ กำลังเตรียมไฟล์...', 'info');
  
  try {
    // ลองใช้ fetch ก่อน (ใช้ได้บน http/https - ดึง source ต้นฉบับ)
    let html;
    let usedFetch = false;
    try {
      const response = await fetch(window.location.href);
      if (!response.ok) throw new Error('fetch failed');
      html = await response.text();
      usedFetch = true;
    } catch (fetchErr) {
      // Fallback สำหรับ file:// protocol — ใช้ outerHTML
      html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    }
    
    // หา assignment ของ EMBEDDED_WEBAPP_URL แล้วแทนที่ด้วย URL ปัจจุบัน
    // Regex จับ: window.EMBEDDED_WEBAPP_URL = '...';
    const safeUrl = currentUrl.replace(/'/g, "\\'");
    const newAssignment = "window.EMBEDDED_WEBAPP_URL = '" + safeUrl + "';";
    const regex = /window\.EMBEDDED_WEBAPP_URL\s*=\s*['"][^'"]*['"]\s*;/;
    
    if (!regex.test(html)) {
      throw new Error('ไม่พบ EMBEDDED_WEBAPP_URL ในไฟล์');
    }
    
    html = html.replace(regex, newAssignment);
    
    // สร้างชื่อไฟล์ที่มีวันที่
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' +
                   String(now.getDate()).padStart(2, '0');
    const filename = 'payroll_connected_' + dateStr + '.html';
    
    // ดาวน์โหลด
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast('✅ ดาวน์โหลดแล้ว: ' + filename + ' — ส่งไฟล์นี้ไปเครื่องอื่นได้เลย!', 'success');
  } catch (err) {
    console.error('Download with URL failed:', err);
    toast('❌ ดาวน์โหลดไม่สำเร็จ: ' + err.message, 'error');
  }
}

function saveSetup() {
  const url = document.getElementById('setupUrl').value.trim();
  if (!url) {
    toast('กรุณาใส่ URL', 'error');
    return;
  }
  if (!url.startsWith('https://script.google.com/')) {
    if (!confirm('URL ไม่ได้ขึ้นต้นด้วย https://script.google.com/ - ยืนยันหรือไม่?')) return;
  }
  state.config.webAppUrl = url;
  saveConfig();
  showMainApp();
  // pull ก่อน (เทียบ timestamp ภายใน) แล้ว push ข้อมูลในเครื่องขึ้นไปถ้ามี
  // กันกรณีทำงาน offline มาก่อน → ข้อมูลต้องขึ้น Sheets ทันทีที่เชื่อม
  pullFromSheet(false).then(() => {
    if (state.data.employees.length > 0) schedulePush();
  });
  toast('✅ เชื่อมต่อสำเร็จ');
}

function skipSetup() {
  state.config.webAppUrl = '';
  saveConfig();
  showMainApp();
  toast('⚠️ ใช้งานแบบออฟไลน์', 'warning');
}

function showMainApp() {
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  updateSyncStatus(state.config.webAppUrl ? '' : 'offline', state.config.webAppUrl ? 'ออนไลน์' : 'โหมดออฟไลน์');
}

function changeUrl() {
  const newUrl = prompt('ใส่ Web App URL ใหม่:', state.config.webAppUrl);
  if (newUrl !== null) {
    state.config.webAppUrl = newUrl.trim();
    saveConfig();
    renderSettings();
    updateSyncStatus(state.config.webAppUrl ? '' : 'offline', state.config.webAppUrl ? 'ออนไลน์' : 'โหมดออฟไลน์');
    // sync ทันที: pull เทียบก่อน แล้ว push ข้อมูลในเครื่องขึ้นไป
    if (state.config.webAppUrl) {
      pullFromSheet(false).then(() => {
        if (state.data.employees.length > 0) schedulePush();
      });
    }
    toast('✅ อัพเดต URL แล้ว');
  }
}

function disconnect() {
  if (!confirm('ตัดการเชื่อมต่อ Google Sheets? (ข้อมูลในเครื่องยังอยู่)')) return;
  state.config.webAppUrl = '';
  saveConfig();
  renderSettings();
  updateSyncStatus('offline', 'โหมดออฟไลน์');
  toast('ตัดการเชื่อมต่อแล้ว');
}

function exportData() {
  const json = JSON.stringify(state.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payroll_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✅ ส่งออกสำเร็จ');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !Array.isArray(data.employees)) throw new Error('ไฟล์ไม่ถูกต้อง (ไม่พบรายชื่อพนักงาน)');
      if (data.salaries && typeof data.salaries !== 'object') throw new Error('ไฟล์ไม่ถูกต้อง (ข้อมูลเงินเดือนผิดรูปแบบ)');
      
      if (!confirm(`นำเข้าข้อมูล ${data.employees.length} คน? (ข้อมูลปัจจุบันจะถูกแทนที่ — กู้คืนได้จากหน้าตั้งค่า)`)) return;
      
      stashSnapshot('ก่อนนำเข้าข้อมูลจากไฟล์ JSON');
      state.data = data;
      if (!state.data.salaries) state.data.salaries = {};
      if (!state.data.bonuses) state.data.bonuses = {};
      
      schedulePush();
      renderCurrentTab();
      toast('✅ นำเข้าสำเร็จ');
    } catch (err) {
      toast('ไฟล์ไม่ถูกต้อง: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('⚠️ ลบข้อมูลทั้งหมด ทั้งในเครื่องและบน Google Sheets?')) return;
  if (!confirm('ยืนยันอีกครั้ง: ลบทั้งหมดจริงๆ?\n\n(ระบบจะดาวน์โหลดไฟล์สำรองให้อัตโนมัติก่อนลบ)')) return;
  
  // 1) ดาวน์โหลดไฟล์สำรองอัตโนมัติ — เผื่อเปลี่ยนใจทีหลัง
  if (state.data.employees && state.data.employees.length > 0) {
    exportData();
  }
  // 2) เก็บ snapshot ในเครื่อง — กู้คืนได้จากหน้าตั้งค่า
  stashSnapshot('ก่อนลบข้อมูลทั้งหมด');
  
  state.data = {
    employees: [],
    salaries: {},
    bonuses: {},
    version: 1,
    updatedAt: new Date().toISOString()
  };
  
  schedulePush();
  renderCurrentTab();
  toast('🗑️ ลบข้อมูลแล้ว — มีไฟล์สำรอง + กู้คืนได้ในหน้าตั้งค่า');
}

/* ============================================================
 * BACKUP บน GOOGLE SHEETS (วนลูป 30 วัน) — โหลดรายการ + กู้คืน
 * ============================================================ */
async function loadBackupList() {
  if (!state.config.webAppUrl) {
    toast('ยังไม่ได้เชื่อมต่อ Google Sheets', 'error');
    return;
  }
  const sel = document.getElementById('backupDateSelect');
  const btn = document.getElementById('btnLoadBackups');
  btn.disabled = true; btn.textContent = '⏳ กำลังโหลด...';
  try {
    const res = await fetch(state.config.webAppUrl + '?action=backups&t=' + Date.now());
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'โหลดรายการไม่สำเร็จ');
    
    sel.innerHTML = '';
    const backups = result.backups || [];
    if (backups.length === 0) {
      sel.innerHTML = '<option value="">— ยังไม่มีข้อมูลสำรอง (สร้างอัตโนมัติวันละครั้ง) —</option>';
      document.getElementById('btnRestoreBackup').disabled = true;
    } else {
      backups.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = '📅 ' + d;
        sel.appendChild(opt);
      });
      document.getElementById('btnRestoreBackup').disabled = false;
    }
    toast('พบข้อมูลสำรอง ' + backups.length + ' วัน');
  } catch (err) {
    toast('โหลดรายการสำรองไม่สำเร็จ: ' + err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '🔄 โหลดรายการสำรอง';
  }
}

async function restoreFromBackup() {
  const date = document.getElementById('backupDateSelect').value;
  if (!date) { toast('เลือกวันที่ก่อน', 'error'); return; }
  if (!confirm('กู้คืนข้อมูลจากวันที่ ' + date + '?\n\n• ข้อมูลปัจจุบันจะถูกแทนที่ (แต่เก็บสำรองในเครื่องไว้ให้ กดกู้กลับได้)\n• ข้อมูลที่กู้มาจะถูกบันทึกขึ้น Sheets ทันที')) return;
  
  try {
    const res = await fetch(state.config.webAppUrl + '?action=backup&date=' + encodeURIComponent(date) + '&t=' + Date.now());
    const result = await res.json();
    if (!result.success || !result.data) throw new Error(result.error || 'อ่านข้อมูลสำรองไม่ได้');
    
    stashSnapshot('ก่อนกู้คืน backup วันที่ ' + date);
    state.data = result.data;
    if (!state.data.employees) state.data.employees = [];
    if (!state.data.salaries) state.data.salaries = {};
    if (!state.data.bonuses) state.data.bonuses = {};
    // ตั้ง updatedAt ใหม่ → push ทับบน Sheets ได้
    state.data.updatedAt = new Date().toISOString();
    
    saveLocal();
    schedulePush();
    renderCurrentTab();
    toast('✅ กู้คืนข้อมูลวันที่ ' + date + ' แล้ว (' + state.data.employees.length + ' คน)', 'success');
  } catch (err) {
    toast('กู้คืนไม่สำเร็จ: ' + err.message, 'error');
  }
}
