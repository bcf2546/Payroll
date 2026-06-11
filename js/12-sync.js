/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Sync Manager */
/* ============================================================
 * SYNC MANAGER (Pull-Push with Debounce)
 * ============================================================ */
function updateSyncStatus(status, text) {
  const dot = document.getElementById('syncDot');
  const txt = document.getElementById('syncText');
  dot.className = 'sync-dot ' + status;
  txt.textContent = text;
}

async function pushToSheet() {
  if (!state.config.webAppUrl) {
    updateSyncStatus('offline', 'โหมดออฟไลน์');
    return false;
  }
  if (!state.sync.isOnline) {
    updateSyncStatus('error', 'ไม่มีเน็ต');
    state.sync.pendingPush = true;
    return false;
  }
  
  updateSyncStatus('syncing', 'กำลังบันทึก...');
  
  try {
    // ใช้ no-cors mode เพื่อหลบ CORS preflight (Apps Script ไม่รองรับ preflight)
    // ⚠️ no-cors = response เป็น opaque ตรวจผลตรงๆ ไม่ได้ → ต้อง verify ด้วย GET ทีหลัง
    await fetch(state.config.webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(state.data)
    });
    
    state.sync.lastPush = Date.now();
    state.sync.lastPushedAt = state.data.updatedAt;  // จำ timestamp ที่ push ไป ไว้ verify
    state.sync.pendingPush = false;
    updateSyncStatus('', '✓ บันทึกแล้ว');
    scheduleVerifyPush();  // ตรวจสอบจริงว่าข้อมูลถึง Sheets
    return true;
  } catch (err) {
    console.error('Push failed:', err);
    updateSyncStatus('error', 'บันทึกไม่สำเร็จ');
    state.sync.pendingPush = true;
    return false;
  }
}

/* ตรวจสอบว่า push ขึ้น Sheets สำเร็จจริง (no-cors มองไม่เห็น error ของ server)
 * วิธี: รอ 2.5 วิ แล้ว GET ข้อมูลจาก server มาเทียบ updatedAt
 * ถ้า server ยังเก่ากว่าที่ push ไป = push ล้มเหลว → เตือน + ลองใหม่ */
function scheduleVerifyPush() {
  if (state.sync.verifyTimer) clearTimeout(state.sync.verifyTimer);
  state.sync.verifyTimer = setTimeout(verifyPush, 2500);
}

async function verifyPush() {
  state.sync.verifyTimer = null;
  if (!state.config.webAppUrl || !state.sync.lastPushedAt) return;
  // ถ้ามี push ใหม่กำลังรอ ไม่ต้อง verify รอบนี้ (จะ verify หลัง push รอบใหม่)
  if (state.sync.pushTimer) return;
  
  try {
    const response = await fetch(state.config.webAppUrl + '?t=' + Date.now());
    const result = await response.json();
    if (!result.success || !result.data) throw new Error('Invalid response');
    
    const serverTime = new Date(result.data.updatedAt || 0).getTime();
    const pushedTime = new Date(state.sync.lastPushedAt).getTime();
    
    if (serverTime >= pushedTime) {
      // ข้อมูลถึง Sheets แน่นอนแล้ว
      state.sync.verifyFails = 0;
      updateSyncStatus('', '✓ บันทึกขึ้น Sheets แล้ว');
    } else {
      // server ยังเก่ากว่าที่ push = push ไม่สำเร็จจริง!
      state.sync.verifyFails = (state.sync.verifyFails || 0) + 1;
      state.sync.pendingPush = true;
      updateSyncStatus('error', '⚠️ ข้อมูลยังไม่ขึ้น Sheets');
      if (state.sync.verifyFails >= 3) {
        toast('⚠️ บันทึกขึ้น Google Sheets ไม่สำเร็จ! ข้อมูลอยู่ในเครื่องนี้เท่านั้น กรุณาตรวจการเชื่อมต่อในหน้าตั้งค่า', 'error');
      } else {
        // ลอง push ใหม่อัตโนมัติ
        setTimeout(pushToSheet, 1500);
      }
    }
  } catch (err) {
    // GET ไม่ได้ = เน็ตหรือ URL มีปัญหา → ถือว่า push อาจไม่สำเร็จ
    console.error('Verify failed:', err);
    state.sync.pendingPush = true;
    updateSyncStatus('error', '⚠️ ตรวจสอบการบันทึกไม่ได้');
  }
}

async function pullFromSheet(silent) {
  if (!state.config.webAppUrl) return false;
  if (!state.sync.isOnline) {
    if (!silent) toast('ไม่มีการเชื่อมต่ออินเทอร์เน็ต', 'error');
    return false;
  }
  
  // ⚠️ สำคัญ: ถ้ามีข้อมูลรอส่งอยู่ ห้ามดึงมาทับ! ส่งของเราขึ้นไปก่อน
  // (กัน auto-pull ทับข้อมูลที่แก้ไว้ตอน offline/push ค้าง)
  if (state.sync.pendingPush || state.sync.pushTimer) {
    await pushToSheet();
    return true;
  }
  
  if (!silent) updateSyncStatus('syncing', 'กำลังดึงข้อมูล...');
  
  try {
    const response = await fetch(state.config.webAppUrl + '?t=' + Date.now());
    const result = await response.json();
    
    if (result.success && result.data) {
      // เปรียบเทียบ updatedAt - ถ้าข้อมูลจากเซิร์ฟเวอร์ใหม่กว่า ให้ใช้แทน
      const serverTime = new Date(result.data.updatedAt || 0).getTime();
      const localTime = new Date(state.data.updatedAt || 0).getTime();
      
      // เครื่องนี้ว่างเปล่าแต่ Sheets มีข้อมูล → รับมาเสมอ (ไม่สน timestamp)
      // กันเคสเครื่องใหม่ที่ updatedAt ในเครื่องบังเอิญใหม่กว่า server
      const localEmpty = !state.data.employees || state.data.employees.length === 0;
      const serverHasData = result.data.employees && result.data.employees.length > 0;
      
      if (serverTime > localTime || (localEmpty && serverHasData)) {
        stashSnapshot('ก่อนรับข้อมูลจาก Sheets มาแทนที่');
        state.data = result.data;
        if (!state.data.employees) state.data.employees = [];
        if (!state.data.salaries) state.data.salaries = {};
        if (!state.data.bonuses) state.data.bonuses = {};
        saveLocal();
        
        // Re-render ที่เปิดอยู่
        renderCurrentTab();
        if (!silent) toast('🔄 อัพเดตข้อมูลแล้ว');
      }
      
      state.sync.lastPull = Date.now();
      updateSyncStatus('', '✓ เชื่อมต่อแล้ว');
      
      // ถ้าข้อมูลใน Sheets เก่ากว่าในเครื่อง = มีข้อมูลที่ยังไม่ถูกส่งขึ้นไป → ส่งเลย
      const localTime2 = new Date(state.data.updatedAt || 0).getTime();
      if (serverTime < localTime2 && state.data.employees.length > 0) {
        setTimeout(pushToSheet, 500);
      }
      return true;
    } else {
      throw new Error(result.error || 'Invalid response');
    }
  } catch (err) {
    console.error('Pull failed:', err);
    updateSyncStatus('error', 'ดึงข้อมูลไม่สำเร็จ');
    if (!silent) toast('ดึงข้อมูลไม่สำเร็จ: ' + err.message, 'error');
    return false;
  }
}

function schedulePush() {
  saveLocal();
  if (!state.config.webAppUrl) return;
  
  if (state.sync.pushTimer) clearTimeout(state.sync.pushTimer);
  state.sync.pushTimer = setTimeout(async () => {
    state.sync.pushTimer = null;  // ล้าง timer ก่อนทำงาน (กัน manualSync push ซ้ำ)
    await pushToSheet();
  }, PUSH_DEBOUNCE_MS);
}

/* ส่งข้อมูลแบบเร่งด่วนตอนกำลังจะปิดแท็บ/สลับแอป
 * sendBeacon ทำงานได้แม้หน้าเว็บกำลังปิด (fetch ปกติจะถูกยกเลิก) */
function flushPushBeacon() {
  if (!state.config.webAppUrl) return false;
  if (!state.sync.pushTimer && !state.sync.pendingPush) return false; // ไม่มีอะไรค้าง
  
  try {
    saveLocal();
    const blob = new Blob([JSON.stringify(state.data)], { type: 'text/plain;charset=utf-8' });
    const ok = navigator.sendBeacon(state.config.webAppUrl, blob);
    if (ok) {
      if (state.sync.pushTimer) { clearTimeout(state.sync.pushTimer); state.sync.pushTimer = null; }
      state.sync.pendingPush = false;
      state.sync.lastPushedAt = state.data.updatedAt;
    }
    return ok;
  } catch (e) {
    console.error('Beacon failed:', e);
    return false;
  }
}

// ปิดแท็บ/ปิดเบราว์เซอร์ — เก็บ draft + ส่งข้อมูลค้างทันที + เตือนถ้ายังส่งไม่ได้
window.addEventListener('beforeunload', (e) => {
  try { if (typeof saveQeDraft === 'function') saveQeDraft(); } catch (err) {}
  if (state.sync.pushTimer || state.sync.pendingPush) {
    const sent = flushPushBeacon();
    if (!sent) {
      // ส่งไม่ได้ (เช่น offline) → เตือนผู้ใช้ก่อนปิด
      e.preventDefault();
      e.returnValue = 'ข้อมูลยังบันทึกขึ้น Google Sheets ไม่เสร็จ';
      return e.returnValue;
    }
  }
});

// สลับแอป/ย่อหน้าจอ (สำคัญบนมือถือ ที่ beforeunload อาจไม่ทำงาน)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    try { if (typeof saveQeDraft === 'function') saveQeDraft(); } catch (err) {}
    flushPushBeacon();
  }
});

function startAutoPull() {
  if (state.sync.pullTimer) clearInterval(state.sync.pullTimer);
  state.sync.pullTimer = setInterval(() => {
    pullFromSheet(true);
  }, PULL_INTERVAL_MS);
}

async function manualSync() {
  // Push ก่อน Pull เสมอ เพื่อไม่ให้ทับข้อมูล
  if (state.sync.pendingPush || state.sync.pushTimer) {
    await pushToSheet();
  }
  await pullFromSheet(false);
  toast('🔄 Sync เสร็จสิ้น');
}

window.addEventListener('online', () => {
  state.sync.isOnline = true;
  updateSyncStatus('', 'ออนไลน์');
  if (state.sync.pendingPush) {
    setTimeout(pushToSheet, 500);
  }
});

window.addEventListener('offline', () => {
  state.sync.isOnline = false;
  updateSyncStatus('offline', 'ออฟไลน์');
});
