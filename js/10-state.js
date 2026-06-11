/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Global State */
const STORAGE_KEY = 'payroll_data_v2';
const CONFIG_KEY = 'payroll_config_v2';
const PULL_INTERVAL_MS = 30000;  // 30 วินาที
const PUSH_DEBOUNCE_MS = 800;
const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

const CONFIG_DEFAULTS = {
  COMPANY_NAME: 'บริษัท ฟาร์มไก่ดำ (กาญจนบุรี) จำกัด',
  COMPANY_ADDRESS: '300/13 ถ.แสงชูโตเหนือ ต.ท่ามะขาม อ.เมือง จ.กาญจนบุรี 71000',
  COMPANY_TEL: 'โทร. (034) 515999 , 518999',
  COMPANY_TAX_ID: '0 7155 46000 22 1',     // เลขประจำตัวผู้เสียภาษีบริษัท
  PVD_LICENSE: '23/2536',                    // เลขที่ใบอนุญาต PVD
  EMPLOYER_SSO_NO: '7100029244',             // เลขที่บัญชีนายจ้าง (ประกันสังคม)
  WHT_SIGNER_NAME: 'Jiw',                    // ผู้ลงนามในหนังสือรับรอง
  SSO_RATE: 0.05,
  SSO_MAX: 875,           // 17,500 × 5% — กฎใหม่ พ.ศ. 2569-2571
  SSO_MAX_BASE: 17500,    // ฐานค่าจ้างสูงสุด
  SSO_MIN_BASE: 1650      // ฐานค่าจ้างต่ำสุด
};

let state = {
  data: {
    employees: [],
    salaries: {},   // key: "empId_year_month" -> salary object
    bonuses: {},    // key: "empId_year" -> bonus object
    version: 1,
    // เริ่มต้นด้วยเวลาเก่าสุด — เครื่องใหม่ที่ยังไม่มีข้อมูลต้อง "แพ้" ข้อมูลบน Sheets เสมอ
    // (saveLocal จะประทับเวลาปัจจุบันให้เองเมื่อมีการบันทึกจริง)
    updatedAt: '1970-01-01T00:00:00.000Z'
  },
  config: {
    webAppUrl: ''
  },
  ui: {
    currentEmp: null,
    searchQuery: ''
  },
  sync: {
    lastPush: 0,
    lastPull: 0,
    pushTimer: null,
    pullTimer: null,
    verifyTimer: null,     // timer ตรวจสอบว่า push ถึง Sheets จริง
    lastPushedAt: null,    // updatedAt ของข้อมูลที่ push ล่าสุด (ไว้เทียบตอน verify)
    verifyFails: 0,        // นับครั้งที่ verify ไม่ผ่านติดกัน
    isOnline: navigator.onLine,
    pendingPush: false
  }
};
