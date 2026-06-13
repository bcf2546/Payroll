/* ระบบเงินเดือน ฟาร์มไก่ดำ — โมดูล: Secure Embedded URL
 *
 * ฝัง Web App URL แบบ "เข้ารหัส AES-256" ลงในโค้ดสาธารณะได้อย่างปลอดภัย
 * กุญแจถอดรหัส = ID + Password ที่ใช้ login → คนที่ไม่รู้รหัสอ่าน URL ไม่ได้
 *
 * วิธีสร้างค่า ENCRYPTED_WEBAPP_URL:
 *   เปิดไฟล์ tools/encrypt-url.html → กรอก ID / Password / URL → copy บรรทัดที่ได้มาวางแทนด้านล่าง
 *
 * เทคนิค: PBKDF2 (310,000 รอบ, SHA-256) → AES-GCM 256 bit
 */

window.ENCRYPTED_WEBAPP_URL = 'eyJzIjoiSnpTYkt1Rzl3MGJMSi9hZzdmOGVxdz09IiwiaXYiOiJDY2lLNFlGd3Z2V1ptWjJNIiwiY3QiOiJ4OHFRcllkbFA1ODUrQnVNaHl1NU05U283dDQ5TlJLODJCaExNOHRLcUFrY3g2d1hqeG8xcjRHeWRSbFpVSHlPVDY5N2dMaEMzRjVyWEpHcHgwVVFRMks0b0RhSTgrUnlUVzM0ZFRTeHZoZ3ZudGM4emZrczYzSkpPOEEzbWFQb2YrcG9HSVNLZHEzWmVYM3l3VitwUS9sTEZGZllUY1FRTTZvMytoZitmQnAwSFE9PSJ9';   // ← วางค่าที่ได้จาก tools/encrypt-url.html ตรงนี้

/* ถอดรหัส URL ด้วย id+password — คืน URL string หรือ null ถ้าถอดไม่ได้/ไม่มีค่า */
async function decryptEmbeddedUrl(id, ps) {
  const blob = window.ENCRYPTED_WEBAPP_URL;
  if (!blob || typeof blob !== 'string' || blob.length < 20) return null;
  if (!window.crypto || !window.crypto.subtle) return null;

  try {
    const payload = JSON.parse(atob(blob));
    const salt = Uint8Array.from(atob(payload.s), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(payload.ct), c => c.charCodeAt(0));

    const secret = id + ':' + ps + ':' + AUTH_SALT;   // ใช้ salt ตัวเดียวกับระบบ login
    const baseKey = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 310000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false, ['decrypt']
    );
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    const url = new TextDecoder().decode(plain);
    return url.startsWith('https://script.google.com/') ? url : null;
  } catch (e) {
    // รหัสไม่ตรง/ค่าเสีย — เงียบไว้ ให้ระบบใช้วิธีเชื่อมต่อปกติแทน
    console.warn('[Payroll] ถอดรหัส URL ที่ฝังไม่สำเร็จ');
    return null;
  }
}

/* เรียกหลัง login สำเร็จ: ถ้าเครื่องนี้ยังไม่มี URL → ถอดรหัสจากที่ฝังแล้วใช้เลย */
async function applyEmbeddedSecureUrl(id, ps) {
  try {
    if (state.config.webAppUrl) return;   // เครื่องนี้ตั้งค่าไว้แล้ว ไม่ทับ
    const url = await decryptEmbeddedUrl(id, ps);
    if (url) {
      state.config.webAppUrl = url;
      saveConfig();
      console.log('[Payroll] ใช้ URL ที่ฝังแบบเข้ารหัส — เชื่อมต่ออัตโนมัติ');
    }
  } catch (e) { /* ไม่เป็นไร ใช้ flow ปกติ */ }
}
