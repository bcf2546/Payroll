/* ระบบเงินเดือน ฟาร์มไก่ดำ (กาญจนบุรี) — โมดูล: Sample Data */
/* ============================================================
 * IMPORT SAMPLE
 * ============================================================ */
function importSample() {
  if (state.data.employees.length > 0) {
    if (!confirm('มีข้อมูลอยู่แล้ว ต้องการเพิ่มข้อมูลตัวอย่างเข้าไปด้วยหรือไม่?')) return;
  }
  
  const samples = getSampleData();
  let added = 0;
  samples.forEach(s => {
    if (!state.data.employees.find(e => e.empId === s.empId)) {
      state.data.employees.push(s);
      added++;
    }
  });
  
  schedulePush();
  renderCurrentTab();
  toast(`✅ นำเข้าข้อมูลตัวอย่าง ${added} คน`);
}

function getSampleData() {
  return [
    // ======= BCF ไทย (B###) =======
    {empId:'B001',firstName:'นิคม',lastName:'สุขมารถ',nameEn:'',position:'',idCard:'3 7199 00179 24 1',startDate:'01/06/2003',endDate:'',group:'BCF ไทย'},
    {empId:'B002',firstName:'ปัทมา',lastName:'สุขมารถ',nameEn:'',position:'',idCard:'3 1008 00843 92 8',startDate:'01/06/2003',endDate:'',group:'BCF ไทย'},
    {empId:'B003',firstName:'วันเพ็ญ',lastName:'คำดี',nameEn:'',position:'',idCard:'3 7005 00067 15 3',startDate:'11/08/2004',endDate:'',group:'BCF ไทย'},
    {empId:'B004',firstName:'เกศอัมพร',lastName:'เลิศบุญชัยกิจ',nameEn:'',position:'',idCard:'3 1008 00843 90 1',startDate:'04/01/2005',endDate:'',group:'BCF ไทย'},
    {empId:'B005',firstName:'พรชัย',lastName:'เลิศบุญชัยกิจ',nameEn:'',position:'',idCard:'3 1008 00843 89 8',startDate:'04/01/2005',endDate:'',group:'BCF ไทย'},
    {empId:'B006',firstName:'สุนีย์',lastName:'สายสุคนธ์',nameEn:'',position:'',idCard:'3 1008 00843 91 0',startDate:'03/01/2008',endDate:'08/07/2025',group:'BCF ไทย'},
    {empId:'B009',firstName:'สมยศ',lastName:'รูปโคม',nameEn:'',position:'',idCard:'1 7101 00024 49 3',startDate:'01/02/2007',endDate:'05/02/2025',group:'BCF ไทย'},
    {empId:'B010',firstName:'แสงจันทร์',lastName:'หลักทอง',nameEn:'',position:'',idCard:'6 6012 00178 01 6',startDate:'01/05/2009',endDate:'',group:'BCF ไทย'},
    {empId:'B016',firstName:'น้อย',lastName:'บุญน้อย',nameEn:'',position:'',idCard:'8 7107 73012 14 1',startDate:'20/07/2010',endDate:'05/02/2022',group:'BCF ไทย'},
    {empId:'B019',firstName:'นงคาร',lastName:'เขียวออน',nameEn:'',position:'',idCard:'3 5008 00104 13 7',startDate:'01/03/2011',endDate:'',group:'BCF ไทย'},
    {empId:'B020',firstName:'อุษา',lastName:'ทวีศรี',nameEn:'',position:'',idCard:'1 7302 00103 33 6',startDate:'25/04/2011',endDate:'',group:'BCF ไทย'},
    {empId:'B022',firstName:'ปรีชา',lastName:'กระต่าย',nameEn:'',position:'',idCard:'3 7101 00606 60 0',startDate:'29/05/2011',endDate:'',group:'BCF ไทย'},
    {empId:'B028',firstName:'ธีรวัฒน์',lastName:'สอนจันทร์',nameEn:'',position:'',idCard:'3 3601 01231 20 4',startDate:'03/01/2012',endDate:'',group:'BCF ไทย'},
    {empId:'B029',firstName:'สุนทร',lastName:'สอนจันทร์',nameEn:'',position:'',idCard:'3 3601 01231 18 2',startDate:'03/01/2012',endDate:'',group:'BCF ไทย'},
    {empId:'B035',firstName:'สมถวิล',lastName:'สายบุตร',nameEn:'',position:'',idCard:'3 3201 00589 18 1',startDate:'02/07/2012',endDate:'01/07/2023',group:'BCF ไทย'},
    {empId:'B036',firstName:'วัลยา',lastName:'สุดประเสริฐ',nameEn:'',position:'',idCard:'5 7101 00054 75 1',startDate:'25/08/2012',endDate:'',group:'BCF ไทย'},
    {empId:'B047',firstName:'ยศวีร์',lastName:'เลิศบุญชัยกิจ',nameEn:'',position:'',idCard:'1 1008 00562 28 1',startDate:'01/06/2013',endDate:'',group:'BCF ไทย'},
    {empId:'B051',firstName:'ศิริภรณ์',lastName:'ยิ่งมี',nameEn:'',position:'',idCard:'1 7101 00102 65 6',startDate:'19/07/2013',endDate:'25/05/2022',group:'BCF ไทย'},
    {empId:'B051-1',firstName:'ศิริภรณ์',lastName:'ยิ่งมี',nameEn:'',position:'',idCard:'1 7101 00102 65 6',startDate:'09/08/2022',endDate:'',group:'BCF ไทย'},
    {empId:'B062',firstName:'ดลพร',lastName:'เกษมโสตร',nameEn:'',position:'',idCard:'1 7101 00003 13 5',startDate:'19/06/2014',endDate:'',group:'BCF ไทย'},
    {empId:'B076',firstName:'สมพร',lastName:'หมดทุกข์',nameEn:'',position:'',idCard:'3 7199 00145 30 3',startDate:'14/07/2015',endDate:'',group:'BCF ไทย'},
    {empId:'B087',firstName:'ศรายุทธ',lastName:'อินทรประเสริฐ',nameEn:'',position:'',idCard:'1 7199 00208 42 2',startDate:'16/11/2015',endDate:'23/03/2022',group:'BCF ไทย'},
    {empId:'B101',firstName:'สุรสิทธิ์',lastName:'วิเศษปัดสา',nameEn:'',position:'',idCard:'3 4505 01014 52 8',startDate:'04/03/2016',endDate:'',group:'BCF ไทย'},
    {empId:'B102',firstName:'ขวัญชนก',lastName:'ก้อนคำ',nameEn:'',position:'',idCard:'3 6705 00635 34 9',startDate:'04/03/2016',endDate:'',group:'BCF ไทย'},
    {empId:'B104',firstName:'กรวีร์',lastName:'จารุนันท์กาญจน์',nameEn:'',position:'',idCard:'8 7107 73018 26 2',startDate:'05/04/2016',endDate:'01/03/2022',group:'BCF ไทย'},
    {empId:'B124',firstName:'กมลวรรณ',lastName:'สุขยิ่ง',nameEn:'',position:'',idCard:'1 7199 00390 76 0',startDate:'20/03/2017',endDate:'25/05/2022',group:'BCF ไทย'},
    {empId:'B125',firstName:'วิไลรัตน์',lastName:'เลิศบุญชัยกิจ',nameEn:'',position:'พนักงานฝ่ายขาย',idCard:'5 1008 00005 88 1',startDate:'01/04/2017',endDate:'',group:'BCF ไทย'},
    {empId:'B130',firstName:'สุรศักดิ์',lastName:'มัญชุพร',nameEn:'',position:'',idCard:'8 7107 76009 73 6',startDate:'01/02/2018',endDate:'',group:'BCF ไทย'},
    {empId:'B136',firstName:'นภัสพร',lastName:'ร่มโพธิ์เย็น',nameEn:'',position:'',idCard:'3 7106 00901 76 7',startDate:'01/04/2018',endDate:'31/12/2023',group:'BCF ไทย'},
    {empId:'B136-1',firstName:'นภัสพร',lastName:'ร่มโพธิ์เย็น',nameEn:'',position:'',idCard:'3 7106 00901 76 7',startDate:'23/01/2024',endDate:'',group:'BCF ไทย'},
    {empId:'B139',firstName:'หิรัญ',lastName:'เกษมโสตร',nameEn:'',position:'',idCard:'1 7199 00222 36 1',startDate:'02/07/2018',endDate:'15/01/2023',group:'BCF ไทย'},
    {empId:'B141',firstName:'อนุสรณ์',lastName:'ลาดเลียง',nameEn:'',position:'',idCard:'3 4406 00674 41 1',startDate:'01/09/2018',endDate:'',group:'BCF ไทย'},
    {empId:'B153',firstName:'ปริญญา',lastName:'โห้แพ',nameEn:'',position:'',idCard:'3 7109 00623 69 0',startDate:'11/03/2019',endDate:'01/07/2023',group:'BCF ไทย'},
    {empId:'B172',firstName:'มีนัต',lastName:'ศรีพันนา',nameEn:'',position:'',idCard:'1 4016 00103 12 4',startDate:'01/12/2019',endDate:'25/05/2022',group:'BCF ไทย'},
    {empId:'B173',firstName:'ศิริพร',lastName:'รุ่งเรือง',nameEn:'',position:'',idCard:'5 7109 00058 30 1',startDate:'03/12/2019',endDate:'',group:'BCF ไทย'},
    {empId:'B185',firstName:'ชลลัดดา',lastName:'ยางระหงษ์',nameEn:'',position:'',idCard:'3 7101 00929 60 3',startDate:'01/09/2020',endDate:'26/02/2022',group:'BCF ไทย'},
    {empId:'B187',firstName:'ชลธารินทร์',lastName:'จันทนุช',nameEn:'',position:'',idCard:'1 7199 00356 44 8',startDate:'01/09/2020',endDate:'23/06/2022',group:'BCF ไทย'},
    {empId:'B190',firstName:'ชวิศา',lastName:'ไชยยะ',nameEn:'',position:'',idCard:'1 7199 00446 51 0',startDate:'01/03/2021',endDate:'27/05/2022',group:'BCF ไทย'},
    {empId:'B192',firstName:'สมใจ',lastName:'บารมีสุข',nameEn:'',position:'',idCard:'8 5715 84207 17 6',startDate:'17/05/2021',endDate:'25/09/2023',group:'BCF ไทย'},
    {empId:'B193',firstName:'สุนิสา',lastName:'สังขวาปี',nameEn:'',position:'',idCard:'1 7098 00146 21 2',startDate:'04/08/2020',endDate:'30/08/2022',group:'BCF ไทย'},
    {empId:'B194',firstName:'เสาวลักษณ์',lastName:'ชนเชี่ยว',nameEn:'',position:'',idCard:'5 6205 01067 20 1',startDate:'13/08/2020',endDate:'01/04/2022',group:'BCF ไทย'},
    {empId:'B195',firstName:'อาทิตย์',lastName:'แก้วใจ',nameEn:'',position:'',idCard:'1 7107 00045 54 8',startDate:'13/08/2020',endDate:'26/03/2022',group:'BCF ไทย'},
    {empId:'B196',firstName:'ชาริน',lastName:'พรหมเงิน',nameEn:'',position:'',idCard:'3 7101 00240 92 3',startDate:'26/07/2021',endDate:'02/07/2022',group:'BCF ไทย'},
    {empId:'B197',firstName:'นิรันดร์',lastName:'ศิริเคน',nameEn:'',position:'',idCard:'1 3609 00057 42 0',startDate:'26/07/2021',endDate:'04/02/2022',group:'BCF ไทย'},
    {empId:'B198',firstName:'เนตรนภา',lastName:'ใจกล้า',nameEn:'',position:'',idCard:'1 7097 00189 56 4',startDate:'01/11/2021',endDate:'13/02/2022',group:'BCF ไทย'},
    {empId:'B199',firstName:'บุสบา',lastName:'ผลวาด',nameEn:'',position:'',idCard:'3 4601 00382 83 5',startDate:'01/12/2021',endDate:'15/03/2022',group:'BCF ไทย'},
    {empId:'B200',firstName:'นันทภัส',lastName:'เขมาพิพัฒน์',nameEn:'',position:'',idCard:'8 7107 76023 09 7',startDate:'01/02/2019',endDate:'13/03/2023',group:'BCF ไทย'},
    {empId:'B201',firstName:'ปราณทัย',lastName:'รักคง',nameEn:'',position:'',idCard:'3 7101 00437 73 5',startDate:'14/02/2022',endDate:'24/04/2022',group:'BCF ไทย'},
    {empId:'B202',firstName:'ชัยกมล',lastName:'ซุงรัมย์',nameEn:'',position:'',idCard:'1 7498 00224 93 1',startDate:'14/02/2022',endDate:'30/08/2022',group:'BCF ไทย'},
    {empId:'B203',firstName:'ประชาญ',lastName:'ยอดอินต๊ะ',nameEn:'',position:'',idCard:'3 5201 01188 11 1',startDate:'14/02/2022',endDate:'08/05/2022',group:'BCF ไทย'},
    {empId:'B204',firstName:'จรัล',lastName:'อินทรสร',nameEn:'',position:'',idCard:'3 7106 00132 63 1',startDate:'15/08/2022',endDate:'01/02/2023',group:'BCF ไทย'},
    {empId:'B204-1',firstName:'จรัล',lastName:'อินทรสร',nameEn:'',position:'',idCard:'3 7106 00132 63 1',startDate:'04/04/2023',endDate:'26/08/2024',group:'BCF ไทย'},
    {empId:'B205',firstName:'ณัฐกานต์',lastName:'จินจารักษ์',nameEn:'',position:'',idCard:'1 7199 00449 49 7',startDate:'27/02/2023',endDate:'05/06/2023',group:'BCF ไทย'},
    {empId:'B206',firstName:'ภักจิรา',lastName:'คงจันทร์',nameEn:'',position:'',idCard:'1 7098 00330 78 1',startDate:'06/03/2023',endDate:'07/10/2023',group:'BCF ไทย'},
    {empId:'B207',firstName:'อภิรักษ์ชัย',lastName:'สุขมารถ',nameEn:'',position:'',idCard:'1 1004 01059 96 8',startDate:'02/10/2023',endDate:'',group:'BCF ไทย'},
    {empId:'B208',firstName:'บงกช',lastName:'ภาคภูมิ',nameEn:'',position:'',idCard:'3 7103 00563 96 3',startDate:'07/12/2023',endDate:'08/02/2025',group:'BCF ไทย'},
    {empId:'B209',firstName:'ทศพร',lastName:'วรรณพงษ์',nameEn:'',position:'',idCard:'1 7105 00323 36 6',startDate:'07/12/2023',endDate:'01/11/2024',group:'BCF ไทย'},
    {empId:'B210',firstName:'วิชาญ',lastName:'เตื๋องวิวัฒน์',nameEn:'',position:'',idCard:'3 1016 00125 95 0',startDate:'07/12/2023',endDate:'22/02/2024',group:'BCF ไทย'},
    {empId:'B211',firstName:'ฐิติภรณ์',lastName:'นุชสองพี่น้อง',nameEn:'',position:'',idCard:'1 7199 00396 32 6',startDate:'11/01/2024',endDate:'26/05/2024',group:'BCF ไทย'},
    {empId:'B212',firstName:'นริสษา',lastName:'สำเนียงดี',nameEn:'',position:'ฝ่ายจัดซื้อ',idCard:'1 7199 00450 38 0',startDate:'15/01/2024',endDate:'01/08/2025',group:'BCF ไทย'},
    {empId:'B213',firstName:'เบญญทิพย์',lastName:'อาจหาญ',nameEn:'',position:'',idCard:'1 6699 00199 03 3',startDate:'15/01/2024',endDate:'13/03/2024',group:'BCF ไทย'},
    {empId:'B214',firstName:'ดาริกา',lastName:'แสงจันทร์',nameEn:'',position:'',idCard:'1 1037 03470 12 4',startDate:'01/03/2025',endDate:'01/03/2025',group:'BCF ไทย'},
    {empId:'B215',firstName:'เกศรินทร์',lastName:'เย็นจิตต์',nameEn:'',position:'',idCard:'1 9599 00196 06 6',startDate:'01/09/2025',endDate:'',group:'BCF ไทย'},
    
    // ======= BCF พม่า (T-##) =======
    {empId:'T-01',firstName:'นัยโซ (นาลิซู)',lastName:'',nameEn:'Mr. NAING SOE',position:'',idCard:'007 10112 48425',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-02',firstName:'นัยอู (อู)',lastName:'',nameEn:'Mr. NAING OO',position:'',idCard:'007 10112 48336',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-04',firstName:'ซานีมา (มันนี่)',lastName:'',nameEn:'Miss. SANAY MA',position:'',idCard:'601 55006 53503',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-07',firstName:'เอเมียตทูซอ (ไข่)',lastName:'',nameEn:'Miss. MA KHINE',position:'',idCard:'601 55006 53635',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-08',firstName:'เททเอ (เอ)',lastName:'',nameEn:'Miss. THET AYE',position:'',idCard:'601 55006 53619',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-09',firstName:'ซันดาทูน (บี)',lastName:'',nameEn:'Miss. SANDAR TUN',position:'',idCard:'601 55006 54186',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-10',firstName:'อ่าวอ่าว (เอาเอา)',lastName:'',nameEn:'Mr. AUNG AUNG',position:'',idCard:'601 55010 29081',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-11',firstName:'เอมิน (มินมิน)',lastName:'',nameEn:'Mr. MIN MIN',position:'',idCard:'601 55006 54178',startDate:'02/05/2012',endDate:'',group:'BCF พม่า'},
    {empId:'T-19',firstName:'โกโกหม่อง (กูมาว)',lastName:'',nameEn:'Mr. KO KO MAUNG',position:'',idCard:'007 10112 48395',startDate:'02/01/2014',endDate:'25/06/2023',group:'BCF พม่า'},
    {empId:'T-25',firstName:'ตินตินมู (แตมู)',lastName:'',nameEn:'Mr. TIN TIN MU',position:'',idCard:'007 10112 48352',startDate:'02/01/2014',endDate:'',group:'BCF พม่า'},
    {empId:'T-28',firstName:'ตูตู (ตู)',lastName:'',nameEn:'Mr. TU TU',position:'',idCard:'601 55006 54054',startDate:'09/03/2015',endDate:'',group:'BCF พม่า'},
    {empId:'T-29',firstName:'หม่องเอ',lastName:'',nameEn:'Mr. HLA SOE',position:'',idCard:'007 10112 48361',startDate:'01/06/2015',endDate:'',group:'BCF พม่า'},
    {empId:'T-33',firstName:'ชิดวิน (วินเล็ก)',lastName:'',nameEn:'Mr. CHIT WIN',position:'',idCard:'601 59014 75860',startDate:'01/11/2016',endDate:'',group:'BCF พม่า'},
    {empId:'T-36',firstName:'เพียวโซนโพ (พิว)',lastName:'',nameEn:'Mr. PYAE SONE PHYO',position:'',idCard:'601 59014 76921',startDate:'01/11/2016',endDate:'01/05/2022',group:'BCF พม่า'},
    {empId:'T-36-1',firstName:'เพียวโซนโพ',lastName:'',nameEn:'Mr. PYAE SONE PHYO',position:'',idCard:'601 65022 20923',startDate:'07/08/2022',endDate:'',group:'BCF พม่า'},
    {empId:'T-37',firstName:'วา วา ลวิน (วา)',lastName:'',nameEn:'Miss. WAR WAR LWIN',position:'',idCard:'601 59014 76891',startDate:'01/12/2021',endDate:'26/03/2022',group:'BCF พม่า'},
    {empId:'T-40',firstName:'ยีมินคาน (อะพู)',lastName:'',nameEn:'Mr. NYI MIN KHANT',position:'',idCard:'007 19910 24347',startDate:'01/11/2017',endDate:'01/05/2022',group:'BCF พม่า'},
    {empId:'T-40-1',firstName:'ยีมินคาน',lastName:'',nameEn:'Mr. NYI MIN KHANT',position:'',idCard:'601 65022 65617',startDate:'07/08/2022',endDate:'',group:'BCF พม่า'},
    {empId:'T-41',firstName:'ชิดลินอ่อง (ชูวิน)',lastName:'',nameEn:'Mr. CHIT LIN AUNG',position:'',idCard:'007 19910 24339',startDate:'01/11/2017',endDate:'',group:'BCF พม่า'},
    {empId:'T-47',firstName:'อองมินซอ (เอเมย์)',lastName:'',nameEn:'Mr. AUNG MYINT ZAW',position:'',idCard:'601 61051 98255',startDate:'01/12/2018',endDate:'',group:'BCF พม่า'},
    {empId:'T-49',firstName:'มูมูไข่ (ไข่2)',lastName:'',nameEn:'Mrs. MOE MOE KHAING',position:'',idCard:'601 61051 98298',startDate:'01/12/2018',endDate:'',group:'BCF พม่า'},
    {empId:'T-55',firstName:'เอมน',lastName:'',nameEn:'',position:'',idCard:'771 07000 16598',startDate:'01/02/2019',endDate:'01/01/2022',group:'BCF พม่า'},
    {empId:'T-59',firstName:'นันดาไล (นันดาฮยิ)',lastName:'',nameEn:'Miss. NANDAR HLAING',position:'',idCard:'601 62005 46702',startDate:'11/02/2019',endDate:'',group:'BCF พม่า'},
    {empId:'T-61',firstName:'นัยม่อน (ม่อน)',lastName:'',nameEn:'Mr. NAING MON',position:'',idCard:'007 10110 89874',startDate:'01/03/2019',endDate:'10/05/2023',group:'BCF พม่า'},
    {empId:'T-74',firstName:'เอเมียตทิน',lastName:'',nameEn:'Miss. AYE MYA THIN',position:'',idCard:'601 61029 90039',startDate:'14/01/2020',endDate:'',group:'BCF พม่า'},
    {empId:'T-75',firstName:'สิทโกนัย',lastName:'',nameEn:'Mr. SIT KO NAING',position:'',idCard:'601 59007 88091',startDate:'14/01/2020',endDate:'26/04/2022',group:'BCF พม่า'},
    {empId:'T-80',firstName:'ออ อ่อง',lastName:'',nameEn:'Mr. AUNG AUNG',position:'',idCard:'601 65003 28174',startDate:'18/01/2022',endDate:'',group:'BCF พม่า'},
    {empId:'T-81',firstName:'วินทินดาอูวิน',lastName:'',nameEn:'Miss. WIN THINDER OO',position:'',idCard:'601 65003 27992',startDate:'18/01/2022',endDate:'',group:'BCF พม่า'},
    {empId:'T-82',firstName:'น้ำหวาน',lastName:'',nameEn:'',position:'',idCard:'071 02891 03278',startDate:'14/02/2022',endDate:'21/03/2022',group:'BCF พม่า'},
    {empId:'T-83',firstName:'มิสจู',lastName:'',nameEn:'Miss Mee KYU',position:'',idCard:'601 65022 19950',startDate:'06/07/2022',endDate:'',group:'BCF พม่า'},
    {empId:'T-84',firstName:'นัยลิออง',lastName:'',nameEn:'Mr. NAING LIN AUNG',position:'',idCard:'601 65022 19801',startDate:'13/07/2022',endDate:'21/01/2024',group:'BCF พม่า'},
    {empId:'T-85',firstName:'เมียตาซิน',lastName:'',nameEn:'Miss. MYA THA ZIN',position:'',idCard:'601 65022 20168',startDate:'13/07/2022',endDate:'21/01/2024',group:'BCF พม่า'},
    {empId:'T-86',firstName:'เคทินวย',lastName:'',nameEn:'Miss. KAY THI NWE',position:'',idCard:'601 65022 20389',startDate:'13/07/2022',endDate:'01/10/2025',group:'BCF พม่า'},
    {empId:'T-87',firstName:'ซาเล่ (น้ำแข็ง)',lastName:'',nameEn:'Mr. SAI LAY',position:'',idCard:'601 65022 20737',startDate:'05/08/2022',endDate:'',group:'BCF พม่า'},
    {empId:'T-88',firstName:'ตีตินโซ (โซ)',lastName:'',nameEn:'Mr. THEIN TIN SOE',position:'',idCard:'601 65022 20532',startDate:'05/08/2022',endDate:'26/08/2025',group:'BCF พม่า'},
    {empId:'T-89',firstName:'ตานวิน',lastName:'',nameEn:'Mr. THAN WIN',position:'',idCard:'601 65022 65722',startDate:'09/08/2022',endDate:'25/09/2023',group:'BCF พม่า'},
    {empId:'T-90',firstName:'ยีวินทวย',lastName:'',nameEn:'Mr. YE WIN HTWE',position:'',idCard:'601 65022 65838',startDate:'09/08/2022',endDate:'25/07/2023',group:'BCF พม่า'},
    {empId:'T-91',firstName:'ซาซาวิน',lastName:'',nameEn:'Miss. ZAR ZAR WIN',position:'',idCard:'601 65022 65951',startDate:'09/08/2022',endDate:'25/09/2023',group:'BCF พม่า'},
    {empId:'T-92',firstName:'ชายวันนามิน',lastName:'',nameEn:'Mr. SHINE WANNA MIN',position:'',idCard:'601 65022 66176',startDate:'16/08/2022',endDate:'25/06/2023',group:'BCF พม่า'},
    {empId:'T-93',firstName:'แทะปายพิว',lastName:'',nameEn:'Mr. HTET PING PHYO',position:'',idCard:'601 65022 66206',startDate:'16/08/2022',endDate:'25/06/2023',group:'BCF พม่า'},
    {empId:'T-94',firstName:'โซ กอ ทู',lastName:'',nameEn:'Mr. SOE KYAW THU',position:'',idCard:'001 02211 77639',startDate:'01/06/2023',endDate:'25/07/2023',group:'BCF พม่า'},
    {empId:'T-95',firstName:'ตันเอวิน',lastName:'',nameEn:'Miss. THAN AYE WIN',position:'',idCard:'202 33079 48655',startDate:'01/09/2023',endDate:'',group:'BCF พม่า'},
    {empId:'T-96',firstName:'มอจอ',lastName:'',nameEn:'Mr. MG KYAW',position:'',idCard:'007 10112 76445',startDate:'02/10/2023',endDate:'30/12/2023',group:'BCF พม่า'},
    {empId:'T-97',firstName:'เตวิน',lastName:'',nameEn:'Mr. THAIN WIN',position:'',idCard:'601 68006 66318',startDate:'01/03/2025',endDate:'',group:'BCF พม่า'},
    {empId:'T-98',firstName:'เคเมียะมน',lastName:'',nameEn:'Mrs. KHIN MYA MON',position:'',idCard:'601 68006 66717',startDate:'01/03/2025',endDate:'',group:'BCF พม่า'},
    {empId:'T-99',firstName:'มิวมินแทะ',lastName:'',nameEn:'Mr. MYO MIN HTET',position:'',idCard:'601 68006 67381',startDate:'01/03/2025',endDate:'',group:'BCF พม่า'},
    {empId:'T-100',firstName:'เททไปซู',lastName:'',nameEn:'Mr. THET PAING SOE',position:'',idCard:'601 68006 67543',startDate:'01/03/2025',endDate:'',group:'BCF พม่า'},
    {empId:'T-101',firstName:'ซันมินติน',lastName:'',nameEn:'Mr. SAN MIN TIN',position:'',idCard:'601 68006 67730',startDate:'01/03/2025',endDate:'',group:'BCF พม่า'},
    {empId:'T-102',firstName:'เนลินอู',lastName:'',nameEn:'Mr. NAY LIN OO',position:'',idCard:'601 68006 67802',startDate:'01/03/2025',endDate:'',group:'BCF พม่า'}
  ];
}
