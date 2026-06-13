/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Authentication */
/* ============================================================
 * AUTHENTICATION (Client-side hash check + auto-logout)
 * ============================================================ */
const AUTH_HASH = '8ee2039414c03b65036c41eb14310ec0a98fb57a55c6cb49e1796f962acf64fa';
const AUTH_SALT = 'blackchicken2568';
const AUTH_SESSION_KEY = 'payroll_auth_v2';
const AUTH_TIMEOUT_MS = 15 * 60 * 1000;  // 15 นาที

let authInactivityTimer = null;

async function sha256(msg) {
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function attemptLogin() {
  const id = document.getElementById('loginId').value.trim();
  const ps = document.getElementById('loginPs').value;
  const errEl = document.getElementById('loginError');
  
  if (!id || !ps) {
    errEl.textContent = '⚠️ กรุณาใส่ ID และ Password';
    errEl.style.display = 'block';
    return;
  }
  
  const combo = id + ':' + ps + ':' + AUTH_SALT;
  const hash = await sha256(combo);
  
  if (hash === AUTH_HASH) {
    // success
    const session = { loginAt: Date.now(), lastActivity: Date.now() };
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    
    errEl.style.display = 'none';
    document.getElementById('loginPs').value = '';  // clear password
    
    // ถ้ามี URL ฝังแบบเข้ารหัส → ถอดด้วยรหัสที่เพิ่ง login (เครื่องใหม่เชื่อมต่อเองทันที)
    // ต้องทำก่อน init เพราะ initAfterAuth จะอ่าน state.config.webAppUrl
    loadConfig();
    if (typeof applyEmbeddedSecureUrl === 'function') {
      await applyEmbeddedSecureUrl(id, ps);
    }
    
    // เรียก init จริง
    hideLoginShowApp();
    startAuthTimer();
  } else {
    errEl.textContent = '❌ ID หรือ Password ไม่ถูกต้อง';
    errEl.style.display = 'block';
    document.getElementById('loginPs').value = '';
    document.getElementById('loginPs').focus();
  }
}

function checkExistingSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    const elapsed = Date.now() - session.lastActivity;
    if (elapsed > AUTH_TIMEOUT_MS) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function startAuthTimer() {
  // Reset timer ทุกครั้งที่มี activity
  const resetTimer = () => {
    if (authInactivityTimer) clearTimeout(authInactivityTimer);
    
    try {
      const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        s.lastActivity = Date.now();
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(s));
      }
    } catch (e) {}
    
    authInactivityTimer = setTimeout(() => {
      // ก่อน reload: เก็บข้อมูลที่พิมพ์ค้าง + ส่งข้อมูลที่รอ push ขึ้น Sheets
      try { if (typeof saveQeDraft === 'function') saveQeDraft(); } catch (e) {}
      try { if (typeof flushPushBeacon === 'function') flushPushBeacon(); } catch (e) {}
      alert('⏰ หมดเวลาการใช้งาน (15 นาที) — กรุณาเข้าสู่ระบบใหม่\n(ข้อมูลที่พิมพ์ค้างไว้จะถูกเก็บ กู้คืนได้หลัง login)');
      logout();
    }, AUTH_TIMEOUT_MS);
  };
  
  // Listen activity
  ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(ev => {
    document.addEventListener(ev, resetTimer, { passive: true });
  });
  
  resetTimer();  // start
}

function logout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  if (authInactivityTimer) clearTimeout(authInactivityTimer);
  location.reload();
}

function hideLoginShowApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appHeader').style.display = '';
  
  // ทำ init ต่อ
  initAfterAuth();
}

function initAfterAuth() {
  loadLocal();
  loadConfig();
  initYearSelectors();
  bindEvents();
  
  if (!state.config.webAppUrl && state.data.employees.length === 0) {
    document.getElementById('setupScreen').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
  } else {
    showMainApp();
    renderCurrentTab();
    
    if (state.config.webAppUrl) {
      pullFromSheet(true);
      startAutoPull();
    }
  }
}

function init() {
  // Set logo ทั้ง 2 ที่
  document.getElementById('headerLogo').src = window.LOGO_BASE64;
  document.getElementById('loginLogo').src = window.LOGO_BASE64;
  
  // เช็คว่ามี session อยู่แล้วไหม (รีเฟรชหน้า ไม่ต้อง login ใหม่)
  if (checkExistingSession()) {
    hideLoginShowApp();
    startAuthTimer();
  } else {
    // แสดง login screen + focus ที่ช่อง ID
    document.getElementById('loginScreen').style.display = 'flex';
    setTimeout(() => document.getElementById('loginId').focus(), 100);
  }
}

// Go!
window.addEventListener('DOMContentLoaded', init);

