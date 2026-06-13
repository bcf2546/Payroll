/* Service Worker — ระบบเงินเดือน ฟาร์มไก่ดำ
 * กลยุทธ์: NETWORK-FIRST → ออนไลน์ได้เวอร์ชันใหม่ล่าสุดเสมอ, ออฟไลน์ใช้ cache
 * เวอร์ชัน cache ผูกกับ APP_VERSION ใน js/version.js — เปลี่ยนเลข = ล้าง cache เก่าอัตโนมัติ */
importScripts('js/version.js');

const CACHE_NAME = 'payroll-' + self.APP_VERSION;

const PRECACHE = [
  './',
  './index.html',
  './css/app.css',
  './manifest.json',
  './js/version.js',
  './js/00-logo.js',
  './js/01-embedded-url.js',
  './js/02-gs-template.js',
  './js/03-secure-url.js',
  './js/10-state.js',
  './js/11-storage.js',
  './js/12-sync.js',
  './js/13-utils.js',
  './js/20-dashboard.js',
  './js/21-employees.js',
  './js/22-salary.js',
  './js/23-print.js',
  './js/24-quickentry.js',
  './js/25-summary.js',
  './js/26-print-templates.js',
  './js/27-settings.js',
  './js/28-sample-data.js',
  './js/30-init.js',
  './js/31-auth.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())   // ใช้เวอร์ชันใหม่ทันที ไม่รอปิดแท็บ
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ห้ามแตะ request ไป Google Apps Script (sync ข้อมูล) — ปล่อยผ่านตรงๆ
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // NETWORK-FIRST: ลองเน็ตก่อนเสมอ (จะได้ไฟล์ใหม่) → fail ค่อยใช้ cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
