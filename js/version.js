/* เวอร์ชันระบบ — แก้เลขนี้ทุกครั้งที่ deploy เวอร์ชันใหม่
 * Service worker ใช้เลขนี้สร้าง cache ใหม่ → ผู้ใช้ได้เวอร์ชันล่าสุดเสมอ
 * ใช้ self (ไม่ใช่ window) เพราะไฟล์นี้ถูกโหลดทั้งในหน้าเว็บและใน service worker
 * — ใน service worker ไม่มี window จะพังทันที ส่วนในหน้าเว็บ self === window */
self.APP_VERSION = '3.2.5';
