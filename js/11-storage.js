/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Storage + Snapshot */
/* ============================================================
 * STORAGE MANAGER
 * ============================================================ */
function saveLocal() {
  try {
    state.data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    return true;
  } catch (e) {
    console.error('Save local failed:', e);
    toast('บันทึกข้อมูลในเครื่องไม่สำเร็จ', 'error');
    return false;
  }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state.data = JSON.parse(raw);
      if (!state.data.employees) state.data.employees = [];
      if (!state.data.salaries) state.data.salaries = {};
      if (!state.data.bonuses) state.data.bonuses = {};
    }
  } catch (e) {
    console.error('Load local failed:', e);
  }
}

function saveConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) state.config = Object.assign(state.config, JSON.parse(raw));
  } catch (e) { console.error(e); }
  
  // ถ้าไฟล์ถูก "ฝัง URL" มาแล้ว (ดาวน์โหลดมาจากเครื่องอื่น) ให้ใช้ URL นั้น
  // ซึ่งจะเขียนทับ localStorage หากยังไม่มี URL ในเครื่องนี้
  if (window.EMBEDDED_WEBAPP_URL && window.EMBEDDED_WEBAPP_URL.startsWith('https://script.google.com/')) {
    if (!state.config.webAppUrl) {
      state.config.webAppUrl = window.EMBEDDED_WEBAPP_URL;
      saveConfig();
      console.log('[Payroll] Using embedded URL from HTML file');
    }
  }
}

/* ============================================================
 * SNAPSHOT (กันข้อมูลถูกทับ/ลบโดยไม่ตั้งใจ — กู้คืนได้ 1 ครั้งล่าสุด)
 * ============================================================ */
const SNAPSHOT_KEY = 'payroll_snapshot_v1';

function stashSnapshot(reason) {
  try {
    if (!state.data.employees || state.data.employees.length === 0) return; // ไม่เก็บ snapshot ว่าง
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      reason: reason,
      at: new Date().toISOString(),
      data: state.data
    }));
  } catch (e) {
    console.error('Snapshot failed (อาจเต็ม):', e);
  }
}

function restoreSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) { toast('ไม่มีข้อมูลสำรองให้กู้คืน', 'error'); return; }
    const snap = JSON.parse(raw);
    const when = new Date(snap.at).toLocaleString('th-TH');
    if (!confirm('กู้คืนข้อมูล ณ ' + when + '\n(' + (snap.reason || '') + ')\nจำนวนพนักงาน ' + (snap.data.employees || []).length + ' คน\n\nข้อมูลปัจจุบันจะสลับไปเก็บเป็นข้อมูลสำรองแทน — ดำเนินการ?')) return;
    
    // สลับ: เก็บปัจจุบันเป็น snapshot ใหม่ แล้วเอา snapshot เดิมมาใช้
    const current = state.data;
    state.data = snap.data;
    if (!state.data.employees) state.data.employees = [];
    if (!state.data.salaries) state.data.salaries = {};
    if (!state.data.bonuses) state.data.bonuses = {};
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ reason: 'ก่อนกู้คืน', at: new Date().toISOString(), data: current }));
    } catch (e) {}
    
    saveLocal();
    schedulePush();
    renderCurrentTab();
    toast('✅ กู้คืนข้อมูลแล้ว (' + state.data.employees.length + ' คน)', 'success');
  } catch (e) {
    toast('กู้คืนไม่สำเร็จ: ' + e.message, 'error');
  }
}
