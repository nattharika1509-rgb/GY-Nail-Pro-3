/**
 * ============================================
 * GY-Nail Booking System - Google Apps Script Backend
 * Version: 3.0 (Consolidated & Fixed)
 * ============================================
 * 
 * Setup Instructions:
 * 1. Create new Google Apps Script project
 * 2. Paste this entire code into Code.gs
 * 3. Set SHEET_ID to your Google Sheets ID
 * 4. Set CALENDAR_ID to your Google Calendar email
 * 5. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 6. Copy the Web App URL and paste it in the frontend
 * 
 * Required Sheets (will auto-create):
 * - Bookings: การจองทั้งหมด
 * - Staffs: ข้อมูลช่าง
 * - Services: รายการบริการ
 * - Customers: ข้อมูลลูกค้า/CRM
 * - ServiceRecords: ประวัติการบริการ
 * - Settings: ตั้งค่าระบบ
 */

const CONFIG = {
  // ⚠️ แก้ไขตรงนี้
  SHEET_ID: '1BJq47HiG2iaBA5HegYKSAMqfSy7fqKeQxe_7ZLQemX0',
  CALENDAR_ID: 'nattharika1509@gmail.com',
  
  // Google Gemini API Key (สำหรับ AI Nail Consultant)
  // สมัครได้ที่: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: 'AIzaSyBcSWAFdHtcS0y2PFi__zA88MBcW1tiz4I',
  
  // ตั้งค่า Line (optional)
  LINE_TOKEN: '',
  LINE_ADMIN_ID: '',
  
  // Sheety.co API (optional - สำหรับปุ่มทางลัด)
  SHEETY_API_URL: '1BJq47HiG2iaBA5HegYKSAMqfSy7fqKeQxe_7ZLQemX0',
  
  SHEETS: {
    BOOKINGS: 'Bookings',
    STAFFS: 'Staffs',
    SERVICES: 'Services',
    CUSTOMERS: 'Customers',
    SERVICE_RECORDS: 'ServiceRecords',
    SETTINGS: 'Settings',
    REVIEWS: 'Reviews'
  },
  
  STATUS: {
    PENDING_PAYMENT: 'รอชำระเงิน',
    PAYMENT_UPLOADED: 'แจ้งชำระแล้ว',
    CONFIRMED: 'ยืนยันแล้ว',
    IN_SERVICE: 'กำลังให้บริการ',
    COMPLETED: 'เสร็จสิ้น',
    CANCELLED: 'ยกเลิก'
  }
};

// ============================================
// MAIN ENTRY POINTS
// ============================================

function doPost(e) {
  // Check if called directly from Apps Script editor
  if (!e || typeof e !== 'object') {
    console.log('[doPost] Called directly from editor, not via HTTP');
    return jsonResponse({ 
      status: 'info', 
      message: 'This function must be called via HTTP POST request, not directly',
      hint: 'Use the Web App URL to test this function'
    });
  }
  
  const lock = LockService.getScriptLock();
  const startTime = new Date().getTime();
  
  try {
    if (!lock.tryLock(10000)) {
      return jsonResponse({ status: 'error', message: 'Server busy, try again' });
    }
    
    const action = e.parameter?.action;
    console.log(`[doPost] Action: ${action}, Time: ${new Date().toISOString()}`);
    
    if (!action) {
      return jsonResponse({ status: 'error', message: 'Action required' });
    }
    
    const data = parseRequest(e);
    console.log(`[doPost] Data received:`, JSON.stringify(data).substring(0, 100));
    
    const result = routeRequest(action, data);
    
    const endTime = new Date().getTime();
    console.log(`[doPost] Completed in ${endTime - startTime}ms`);
    
    return jsonResponse(result);
    
  } catch (error) {
    console.error('[doPost Error]', error);
    return jsonResponse({ 
      status: 'error', 
      message: error.toString(),
      action: e?.parameter?.action || 'unknown',
      debug: 'e is ' + (e === undefined ? 'undefined' : typeof e)
    });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (!e || !e.parameter) {
    console.error('[doGet] Error: Invalid request object');
    return jsonResponse({ 
      status: 'error', 
      message: 'Invalid request',
      debug: 'e is ' + (e === undefined ? 'undefined' : typeof e)
    });
  }
  
  const action = e.parameter.action;
  console.log('[doGet] Action:', action);
  
  if (!action) {
    return jsonResponse({
      status: 'success',
      message: 'GY-Nail API',
      version: '3.0',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const data = {};
    for (const key in e.parameter) {
      if (key === 'action') continue;
      try { data[key] = JSON.parse(e.parameter[key]); }
      catch (err) { data[key] = e.parameter[key]; }
    }
    return jsonResponse(routeRequest(action, data));
  } catch (error) {
    console.error('[doGet Error]', error);
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

// ============================================
// REQUEST ROUTER
// ============================================

function routeRequest(action, data) {
  const routes = {
    // Core API
    'getPublicSettings': () => getPublicSettings(),
    'getBookedSlots': () => getBookedSlots(data),
    'submitBooking': () => submitBooking(data),
    'searchBooking': () => searchBooking(data),
    'adminLogin': () => adminLogin(data),
    'getAdminData': () => getAdminData(),
    'updateBookingStatus': () => updateBookingStatus(data),
    'deleteBooking': () => deleteBooking(data),
    'saveSettings': () => saveSettings(data),
    
    // Extended API
    'getServices': () => getServices(data),
    'getStaffs': () => getStaffs(data),
    'getAvailableSlots': () => getAvailableSlots(data),
    'getBookingsByDate': () => getBookingsByDate(data),
    'getCustomers': () => getCustomers(data),
    'getCustomerProfile': () => getCustomerProfile(data),
    'getRevenueReport': () => getRevenueReport(data),
    'getDashboardStats': () => getDashboardStats(data),
    
    // Shop Status & Calendar
    'getShopStatus': () => getShopStatus(),
    'setShopStatus': () => setShopStatus(data),
    'getSpecialDates': () => getSpecialDates(),
    'addSpecialDate': () => addSpecialDate(data),
    'removeSpecialDate': () => removeSpecialDate(data),
    
    // Reviews & AI
    'submitReview': () => submitReview(data),
    'getReviews': () => getReviews(data),
    'updateReviewStatus': () => updateReviewStatus(data),
    'getAIAdvice': () => getAIAdvice(data)
  };
  
  const handler = routes[action];
  if (!handler) throw new Error(`Unknown action: ${action}`);
  
  return handler();
}

// ============================================
// CORE API FUNCTIONS
// ============================================

function getPublicSettings() {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) settings[data[i][0]] = data[i][1];
  }
  
  return settings;
}

function getBookedSlots(data) {
  const date = String(data.date).trim();

  const shopCheck = checkShopAvailability(date);
  const serverNow = getNowTime();

  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  const rows = sheet.getDataRange().getValues();
  const booked = [];
  
  for (let i = 1; i < rows.length; i++) {
    const rowDate = formatDateISO(rows[i][1]);
    const status = rows[i][15];
    
    if (status === CONFIG.STATUS.CANCELLED) continue;

    if (rowDate === date) {
      booked.push({
        time: String(rows[i][2]).trim(),
        staffId: rows[i][3],
        status: status,
        orderId: rows[i][0]
      });
    }
  }
  
  return {
    booked: booked,
    shopStatus: shopCheck.status === 'ok' ? 'open' : 'closed',
    shopMessage: shopCheck.message || '',
    serverDate: serverNow.date,
    serverTime: serverNow.time
  };
}

function submitBooking(data) {
  const required = ['service', 'date', 'time', 'name', 'phone'];
  for (const field of required) {
    if (!data[field]) return { status: 'error', message: `Missing: ${field}` };
  }
  
  const shopCheck = checkShopAvailability(data.date);
  if (shopCheck.status === 'error') return shopCheck;

  if (isSlotInPast(data.date, data.time)) {
    return { status: 'error', message: 'เวลานี้ผ่านไปแล้ว กรุณาเลือกเวลาอื่น' };
  }

  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  const existingBookings = sheet.getDataRange().getValues();

  const cleanPhone = String(data.phone).replace(/-/g, '');

  for (let i = 1; i < existingBookings.length; i++) {
    const rowDate = formatDateISO(existingBookings[i][1]);
    const rowTime = String(existingBookings[i][2]).trim();
    const rowPhone = String(existingBookings[i][5]).replace(/-/g, '');
    const rowStatus = existingBookings[i][15];
    
    if (rowStatus === CONFIG.STATUS.CANCELLED) continue;

    if (rowDate === data.date && rowTime === data.time) {
      const isBlockingStatus = [
        CONFIG.STATUS.CONFIRMED,
        CONFIG.STATUS.PAYMENT_UPLOADED,
        CONFIG.STATUS.IN_SERVICE,
        CONFIG.STATUS.COMPLETED,
        CONFIG.STATUS.PENDING_PAYMENT
      ].includes(rowStatus);
      
      if (isBlockingStatus) {
        return { status: 'error', message: 'เวลานี้ถูกจองแล้ว กรุณาเลือกเวลาอื่น' };
      }
    }

    if (rowDate === data.date && rowPhone === cleanPhone) {
      const activeStatus = [
        CONFIG.STATUS.CONFIRMED,
        CONFIG.STATUS.PAYMENT_UPLOADED,
        CONFIG.STATUS.IN_SERVICE,
        CONFIG.STATUS.PENDING_PAYMENT
      ].includes(rowStatus);
      
      if (activeStatus) {
        return { status: 'error', message: 'เบอร์นี้มีคิวจองในวันเดียวกันแล้ว กรุณาตรวจสอบสถานะการจอง' };
      }
    }
  }
  
  const orderId = 'GY-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMddHHmmss');
  
  sheet.appendRow([
    orderId, data.date, data.time, data.staffId || '-',
    data.name, data.phone, data.service, data.service,
    data.design || '-', data.extension || '-', 60,
    data.details || '-', data.locationType || 'ทำที่ร้าน',
    data.address || '-', data.price || '0',
    CONFIG.STATUS.PENDING_PAYMENT, '', new Date(), '', '', '', ''
  ]);
  
  return { status: 'success', orderId: orderId };
}

function searchBooking(data) {
  const key = String(data.key).trim();
  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = rows.length - 1; i >= 1; i--) {
    const orderId = String(rows[i][0]);
    const phone = String(rows[i][5]).replace(/-/g, '');
    const searchKey = key.replace(/-/g, '');
    
    if (orderId === key || phone === searchKey) {
      return {
        status: 'found',
        data: {
          orderId: rows[i][0], service: rows[i][7],
          date: formatDateISO(rows[i][1]), time: rows[i][2],
          location: rows[i][12], price: rows[i][14],
          status: rows[i][15], slipUrl: rows[i][16]
        }
      };
    }
  }
  
  return { status: 'not_found' };
}

function adminLogin(data) {
  console.log('[adminLogin] Received data:', JSON.stringify(data));
  
  if (!data) {
    console.log('[adminLogin] Error: No data received');
    return { status: 'error', message: 'No data received' };
  }
  
  if (!data.pass) {
    console.log('[adminLogin] Error: Password missing. Data keys:', Object.keys(data));
    return { status: 'error', message: 'Password required' };
  }
  
  const settings = getPublicSettings();
  console.log('[adminLogin] Settings loaded, adminPassword exists:', !!settings.adminPassword);
  
  const pass = settings.adminPassword || 'admin123';
  console.log('[adminLogin] Checking password...');
  
  if (data.pass === pass) {
    console.log('[adminLogin] Success');
    return { status: 'success' };
  }
  
  console.log('[adminLogin] Failed: Password mismatch');
  return { status: 'error', message: 'Invalid password' };
}

function getAdminData() {
  try {
    console.log('[getAdminData] Starting...');
    const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
    console.log('[getAdminData] Sheet loaded');
    
    const rows = sheet.getDataRange().getValues();
    console.log('[getAdminData] Total rows:', rows.length);
    
    const bookings = [];
    const maxRows = Math.min(rows.length, 1000); // Limit to prevent timeout
    
    for (let i = 1; i < maxRows; i++) {
      try {
        bookings.push({
          row: i + 1, orderId: rows[i][0], date: formatDateISO(rows[i][1]),
          time: rows[i][2], staffId: rows[i][3], name: rows[i][4],
          phone: rows[i][5], service: rows[i][7], status: rows[i][15],
          price: rows[i][14], slipUrl: rows[i][16]
        });
      } catch (rowError) {
        console.log('[getAdminData] Error at row', i, ':', rowError.toString());
      }
    }
    
    bookings.reverse();
    console.log('[getAdminData] Bookings processed:', bookings.length);
    
    const settings = getPublicSettings();
    console.log('[getAdminData] Settings loaded');
    
    return { status: 'success', settings: settings, bookings: bookings };
  } catch (error) {
    console.error('[getAdminData] Error:', error);
    return { status: 'error', message: error.toString() };
  }
}

function updateBookingStatus(data) {
  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  const row = parseInt(data.rowIndex);
  
  sheet.getRange(row, 16).setValue(data.status);
  
  // Get booking details for calendar
  const bookingRow = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const booking = {
    orderId: bookingRow[0], date: bookingRow[1], time: bookingRow[2],
    service: bookingRow[7], customerName: bookingRow[4],
    phone: bookingRow[5], location: bookingRow[12], price: bookingRow[14]
  };
  
  if (data.status === CONFIG.STATUS.CONFIRMED) {
    sheet.getRange(row, 20).setValue('Admin');
    sheet.getRange(row, 21).setValue(new Date());
    addBookingToCalendar(booking);
  }
  
  if (data.status === CONFIG.STATUS.CANCELLED) {
    removeBookingFromCalendar(booking.orderId);
  }
  
  return { status: 'success' };
}

function deleteBooking(data) {
  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  sheet.deleteRow(parseInt(data.rowIndex));
  return { status: 'success' };
}

function saveSettings(data) {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  
  for (const key in data.settings) {
    const rows = sheet.getDataRange().getValues();
    let found = false;
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(data.settings[key]);
        found = true;
        break;
      }
    }
    
    if (!found) sheet.appendRow([key, data.settings[key]]);
  }
  
  return { status: 'success' };
}

// ============================================
// EXTENDED API FUNCTIONS
// ============================================

function getServices(data) {
  const sheet = getSheet(CONFIG.SHEETS.SERVICES);
  const rows = sheet.getDataRange().getValues();
  const services = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][7] !== false && rows[i][7] !== 'FALSE') {
      services.push({
        id: rows[i][0], name: rows[i][1], category: rows[i][2],
        price: parseFloat(rows[i][3]) || 0, duration: parseInt(rows[i][4]) || 60,
        description: rows[i][5], imageUrl: rows[i][6]
      });
    }
  }
  
  return { status: 'success', data: services };
}

function getStaffs(data) {
  const sheet = getSheet(CONFIG.SHEETS.STAFFS);
  const rows = sheet.getDataRange().getValues();
  const staffs = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][6] !== false && rows[i][6] !== 'FALSE') {
      staffs.push({
        id: rows[i][0], name: rows[i][1], nickname: rows[i][2],
        specialties: rows[i][3] ? String(rows[i][3]).split(',') : [],
        bio: rows[i][4], imageUrl: rows[i][5]
      });
    }
  }
  
  return { status: 'success', data: staffs };
}

function getAvailableSlots(data) {
  const { date, staffId } = data;
  const settings = getPublicSettings();
  const timeSlots = settings.timeSlots || '10:00,11:30,13:00,14:30,16:00,17:30';
  const allSlots = timeSlots.split(',').map(s => s.trim());
  
  const bookedSlots = getBookedSlots({ date });
  
  const availableSlots = allSlots.filter(slot => {
    const isBooked = bookedSlots.some(booked => booked.time === slot);
    return !isBooked;
  });
  
  return { status: 'success', data: availableSlots };
}

function getBookingsByDate(data) {
  const date = data.date;
  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  const rows = sheet.getDataRange().getValues();
  const bookings = [];
  
  for (let i = 1; i < rows.length; i++) {
    const rowDate = formatDateISO(rows[i][1]);
    const status = rows[i][15];
    
    if (rowDate === date && status !== CONFIG.STATUS.CANCELLED) {
      bookings.push({
        orderId: rows[i][0], time: rows[i][2], service: rows[i][7],
        customerName: rows[i][4], status: status
      });
    }
  }
  
  bookings.sort((a, b) => a.time.localeCompare(b.time));
  return { status: 'success', data: bookings };
}

function getCustomers(data) {
  const { search, limit = 50 } = data;
  const sheet = getSheet(CONFIG.SHEETS.CUSTOMERS);
  const rows = sheet.getDataRange().getValues();
  const customers = [];
  
  for (let i = 1; i < rows.length && customers.length < limit; i++) {
    if (search) {
      const name = String(rows[i][2] || '').toLowerCase();
      const phone = String(rows[i][1] || '');
      if (!name.includes(search.toLowerCase()) && !phone.includes(search)) continue;
    }
    
    customers.push({
      id: rows[i][0], phone: rows[i][1], name: rows[i][2],
      hairType: rows[i][6], totalVisits: rows[i][11] || 0, lastVisit: rows[i][13]
    });
  }
  
  return { status: 'success', data: customers };
}

function getCustomerProfile(data) {
  const { customerId } = data;
  const sheet = getSheet(CONFIG.SHEETS.CUSTOMERS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === customerId) {
      return {
        status: 'success',
        data: {
          id: rows[i][0], phone: rows[i][1], name: rows[i][2],
          birthday: rows[i][5], hairType: rows[i][6], hairCondition: rows[i][7],
          allergies: rows[i][8], preferences: rows[i][9], history: rows[i][10],
          totalVisits: rows[i][11], totalSpent: rows[i][12], lastVisit: rows[i][13], notes: rows[i][14]
        }
      };
    }
  }
  
  return { status: 'error', message: 'Customer not found' };
}

function getRevenueReport(data) {
  const { startDate, endDate } = data;
  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  const rows = sheet.getDataRange().getValues();
  const report = {};
  
  for (let i = 1; i < rows.length; i++) {
    const date = formatDateISO(rows[i][1]);
    const status = rows[i][15];
    const price = parseFloat(rows[i][14]) || 0;
    
    if (status !== CONFIG.STATUS.COMPLETED) continue;
    if (startDate && date < startDate) continue;
    if (endDate && date > endDate) continue;
    
    if (!report[date]) report[date] = { date: date, revenue: 0, count: 0 };
    report[date].revenue += price;
    report[date].count += 1;
  }
  
  return { status: 'success', data: Object.values(report).sort((a, b) => a.date.localeCompare(b.date)) };
}

function getDashboardStats(data) {
  const today = formatDateISO(new Date());
  const monthStart = today.substring(0, 7) + '-01';
  
  const sheet = getSheet(CONFIG.SHEETS.BOOKINGS);
  const rows = sheet.getDataRange().getValues();
  
  let todayRevenue = 0, todayCount = 0;
  let monthRevenue = 0, monthCount = 0;
  let pendingCount = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const date = formatDateISO(rows[i][1]);
    const status = rows[i][15];
    const price = parseFloat(rows[i][14]) || 0;
    
    if (date === today && status === CONFIG.STATUS.COMPLETED) { todayRevenue += price; todayCount++; }
    if (date >= monthStart && date <= today && status === CONFIG.STATUS.COMPLETED) { monthRevenue += price; monthCount++; }
    if (status === CONFIG.STATUS.PAYMENT_UPLOADED) pendingCount++;
  }
  
  return { status: 'success', data: { today: { revenue: todayRevenue, count: todayCount }, month: { revenue: monthRevenue, count: monthCount }, pending: pendingCount } };
}

// ============================================
// SHOP STATUS & CALENDAR
// ============================================

function getShopStatus() {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  let isOpen = true;
  let specialDates = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'shopOpen') isOpen = data[i][1] === 'true' || data[i][1] === true;
    if (data[i][0] === 'specialDates') {
      try { specialDates = JSON.parse(data[i][1]) || []; } catch(e) { specialDates = []; }
    }
  }
  
  const today = formatDateISO(new Date());
  const todaySpecial = specialDates.find(d => d.date === today);
  
  return {
    status: 'success',
    data: { isOpen: isOpen, specialDates: specialDates, todayStatus: todaySpecial ? todaySpecial.status : (isOpen ? 'open' : 'closed'), todayNote: todaySpecial ? todaySpecial.note : '' }
  };
}

function setShopStatus(data) {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  const rows = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'shopOpen') {
      sheet.getRange(i + 1, 2).setValue(data.isOpen ? 'true' : 'false');
      found = true;
      break;
    }
  }
  
  if (!found) sheet.appendRow(['shopOpen', data.isOpen ? 'true' : 'false']);
  return { status: 'success', message: data.isOpen ? 'Shop opened' : 'Shop closed' };
}

function getSpecialDates() {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'specialDates') {
      try { return { status: 'success', data: JSON.parse(rows[i][1]) || [] }; } catch(e) { return { status: 'success', data: [] }; }
    }
  }
  return { status: 'success', data: [] };
}

function addSpecialDate(data) {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  const rows = sheet.getDataRange().getValues();
  let specialDates = [];
  let rowIndex = -1;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'specialDates') {
      try { specialDates = JSON.parse(rows[i][1]) || []; } catch(e) { specialDates = []; }
      rowIndex = i + 1;
      break;
    }
  }
  
  specialDates.push(data.date);
  
  if (rowIndex > 0) sheet.getRange(rowIndex, 2).setValue(JSON.stringify(specialDates));
  else sheet.appendRow(['specialDates', JSON.stringify(specialDates)]);
  
  return { status: 'success' };
}

function removeSpecialDate(data) {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'specialDates') {
      try {
        let specialDates = JSON.parse(rows[i][1]) || [];
        specialDates.splice(data.index, 1);
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(specialDates));
        return { status: 'success' };
      } catch(e) { return { status: 'error', message: e.toString() }; }
    }
  }
  return { status: 'error', message: 'Special dates not found' };
}

// ============================================
// GOOGLE CALENDAR INTEGRATION
// ============================================

function addBookingToCalendar(booking) {
  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    if (!calendar) { console.error('Calendar not found'); return; }
    
    const dateParts = String(booking.date).split('-');
    const timeParts = String(booking.time).split(':');
    
    const startTime = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), parseInt(timeParts[0]), parseInt(timeParts[1]));
    const endTime = new Date(startTime.getTime() + (60 * 60 * 1000));
    
    const event = calendar.createEvent(
      `[GY-Nail] ${booking.service} - ${booking.customerName}`,
      startTime, endTime,
      {
        description: `รหัสจอง: ${booking.orderId}\nบริการ: ${booking.service}\nลูกค้า: ${booking.customerName}\nเบอร์โทร: ${booking.phone}\nสถานที่: ${booking.location}\nราคา: ${booking.price} บาท`,
        location: booking.location === 'ทำที่ร้าน' ? 'GY-Nail Shop' : booking.location
      }
    );
    
    event.addEmailReminder(60);
    event.addPopupReminder(30);
    console.log('Event added:', event.getId());
    return event;
  } catch (error) { console.error('Calendar error:', error); }
}

function removeBookingFromCalendar(orderId) {
  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    if (!calendar) return;
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const events = calendar.getEvents(startDate, endDate);
    
    for (const event of events) {
      if (event.getDescription().includes(orderId)) {
        event.deleteEvent();
        console.log('Event removed:', orderId);
        break;
      }
    }
  } catch (error) { console.error('Calendar error:', error); }
}

// ============================================
// REVIEWS & RATINGS SYSTEM
// ============================================

function submitReview(data) {
  const { orderId, rating, review, customerName } = data;
  
  if (!orderId || !rating) {
    return { status: 'error', message: 'กรุณาระบุรหัสจองและคะแนน' };
  }
  
  const sheet = getSheet('Reviews');
  
  // Check if already reviewed
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === orderId) {
      return { status: 'error', message: 'รายการนี้ได้รีวิวไปแล้ว' };
    }
  }
  
  sheet.appendRow([
    orderId,
    customerName || 'Anonymous',
    parseInt(rating),
    review || '',
    new Date(),
    'pending' // status: pending, approved, rejected
  ]);
  
  return { status: 'success', message: 'ขอบคุณสำหรับรีวิวค่ะ' };
}

function getReviews(data) {
  const { status = 'approved', limit = 10 } = data;
  const sheet = getSheet('Reviews');
  const rows = sheet.getDataRange().getValues();
  const reviews = [];
  
  for (let i = rows.length - 1; i >= 1 && reviews.length < limit; i--) {
    if (rows[i][5] === status || status === 'all') {
      reviews.push({
        orderId: rows[i][0],
        customerName: rows[i][1],
        rating: rows[i][2],
        review: rows[i][3],
        date: rows[i][4],
        status: rows[i][5]
      });
    }
  }
  
  // Calculate average rating
  const allApproved = rows.slice(1).filter(r => r[5] === 'approved');
  const avgRating = allApproved.length > 0 
    ? (allApproved.reduce((sum, r) => sum + r[2], 0) / allApproved.length).toFixed(1)
    : 0;
  
  return { 
    status: 'success', 
    data: reviews,
    summary: {
      average: avgRating,
      total: allApproved.length
    }
  };
}

// ============================================
// AI NAIL CONSULTANT (Gemini API)
// ============================================

function getAIAdvice(data) {
  const { question, nailCondition, preferredStyle } = data;
  
  if (!question) {
    return { status: 'error', message: 'กรุณาระบุคำถาม' };
  }
  
  try {
    // Build prompt for nail consultant
    let prompt = `คุณเป็นผู้เชี่ยวชาญด้านการทำเล็บมืออาชีพ (Nail Technician) ชื่อ "น้องยุ้ยคนสวย" จากร้าน GY-Nail\n\n`;
    prompt += `ให้คำแนะนำเกี่ยวกับการทำเล็บแบบมืออาชีพ เข้าใจง่าย เป็นกันเอง ใช้ภาษาไทยเป็นหลัก พูดจาน่ารักสดใส\n\n`;
    
    if (nailCondition) {
      prompt += `สภาพเล็บลูกค้า: ${nailCondition}\n`;
    }
    if (preferredStyle) {
      prompt += `สไตล์ที่ชอบ: ${preferredStyle}\n`;
    }
    
    prompt += `\nคำถาม: ${question}\n\n`;
    prompt += `ให้คำแนะนำที่เป็นประโยชน์ ครบถ้วน และปลอดภัย หากเป็นเรื่องที่ต้องให้ช่างดูตัวจริง ให้แนะนำให้มาปรึกษาที่ร้าน`;
    
    // Call Gemini API
    const apiKey = CONFIG.GEMINI_API_KEY || '';
    if (!apiKey) {
      // Fallback to mock response if no API key
      return {
        status: 'success',
        data: {
          advice: getMockAIResponse(question, nailCondition, preferredStyle),
          isAI: false
        }
      };
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });
    
    const result = JSON.parse(response.getContentText());
    const advice = result.candidates[0].content.parts[0].text;
    
    return {
      status: 'success',
      data: {
        advice: advice,
        isAI: true
      }
    };
    
  } catch (error) {
    console.error('AI Error:', error);
    // Return mock response on error
    return {
      status: 'success',
      data: {
        advice: getMockAIResponse(question, nailCondition, preferredStyle),
        isAI: false
      }
    };
  }
}

function getMockAIResponse(question, nailCondition, preferredStyle) {
  const responses = [
    `สวัสดีค่ะ! น้องยุ้ยเองนะคะ 😊\n\nจากที่เล่ามา${nailCondition ? ' เล็บ' + nailCondition : ''} แนะนำให้:\n\n1. **พักเล็บ** 2-3 สัปดาห์ก่อนต่อใหม่\n2. ทา **บำรุงเล็บ** วันละ 2 ครั้ง\n3. เลือกสีที่อ่อนโยน เช่น นู้ด หรือชมพูอ่อน\n\nถ้าไม่แน่ใจ แนะนำให้มาปรึกษาที่ร้านก่อนนะคะ น้องยุ้ยจะดูสภาพเล็บจริงๆ ให้ค่ะ 💅`,
    
    `หวัดดีค่ะ! น้องยุ้ยตอบนะคะ ✨\n\nสำหรับ${preferredStyle || 'สไตล์ที่ชอบ'} แนะนำ:\n\n• **ทรงเล็บ Almond** - ดูเรียวยาว นิ้วดูยาว\n• **สีเจลสีนู้ด** หรือ **French** - คลาสสิก ใช้ได้ทุกโอกาส\n• แอดออน **เพชรเล็กๆ** 1-2 เม็ด - ดูหรูหราแต่ไม่เยอะ\n\nราคาประมาณ 200-350 บาทค่ะ\n\nต้องการจองคิวสอบถามเพิ่มเติมได้เลยนะคะ 💕`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function updateReviewStatus(data) {
  const { orderId, status } = data;
  const sheet = getSheet('Reviews');
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === orderId) {
      sheet.getRange(i + 1, 6).setValue(status);
      return { status: 'success' };
    }
  }
  
  return { status: 'error', message: 'Review not found' };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSheet(sheetName) {
  try {
    if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE') {
      throw new Error('SHEET_ID not configured');
    }
    
    console.log(`[getSheet] Opening sheet: ${sheetName}`);
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      console.log(`[getSheet] Creating new sheet: ${sheetName}`);
      sheet = ss.insertSheet(sheetName);
      setupSheetHeaders(sheet, sheetName);
    }
    
    return sheet;
  } catch (error) {
    console.error(`[getSheet] Error:`, error);
    throw new Error(`Cannot access sheet "${sheetName}": ${error.message}`);
  }
}

function setupSheetHeaders(sheet, sheetName) {
  const headers = {
    [CONFIG.SHEETS.BOOKINGS]: ['OrderID', 'Date', 'Time', 'StaffID', 'CustomerName', 'Phone', 'ServiceID', 'ServiceName', 'Design', 'Addons', 'Duration', 'Details', 'Location', 'Address', 'Price', 'Status', 'SlipURL', 'Timestamp', 'CustomerID', 'ApprovedBy', 'ApprovedAt', 'Notes'],
    [CONFIG.SHEETS.STAFFS]: ['StaffID', 'Name', 'Nickname', 'Specialties', 'Bio', 'ImageURL', 'Active'],
    [CONFIG.SHEETS.SERVICES]: ['ServiceID', 'Name', 'Category', 'Price', 'Duration', 'Description', 'ImageURL', 'Active'],
    [CONFIG.SHEETS.CUSTOMERS]: ['CustomerID', 'Phone', 'Name', 'LineUserID', 'Birthday', 'HairType', 'HairCondition', 'Allergies', 'Preferences', 'History', 'TotalVisits', 'TotalSpent', 'LastVisit', 'Notes', 'CreatedAt', 'UpdatedAt'],
    [CONFIG.SHEETS.SERVICE_RECORDS]: ['RecordID', 'OrderID', 'Date', 'StaffID', 'CustomerID', 'ServicesDone', 'ProductsUsed', 'BeforePhotoURL', 'AfterPhotoURL', 'CustomerFeedback', 'StaffNotes', 'NextAppointment'],
    [CONFIG.SHEETS.SETTINGS]: ['Key', 'Value'],
    [CONFIG.SHEETS.REVIEWS]: ['OrderID', 'CustomerName', 'Rating', 'Review', 'Date', 'Status']
  };
  
  const header = headers[sheetName];
  if (header) {
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#ffe4e6');
    sheet.setFrozenRows(1);
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function parseRequest(e) {
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) { return {}; }
  }
  return e.parameter || {};
}

function formatDateISO(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  try { return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
  catch (e) { return String(date); }
}

function checkShopAvailability(dateStr) {
  const sheet = getSheet(CONFIG.SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  let isOpen = true;
  let specialDates = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'shopOpen') isOpen = data[i][1] === 'true' || data[i][1] === true;
    if (data[i][0] === 'specialDates') {
      try { specialDates = JSON.parse(data[i][1]) || []; } catch(e) { specialDates = []; }
    }
  }

  const special = specialDates.find(d => d.date === dateStr);
  if (special && special.status === 'closed') {
    return { status: 'error', message: 'ร้านปิดในวันที่เลือก' + (special.note ? ': ' + special.note : '') };
  }

  if (!isOpen && !(special && special.status === 'open')) {
    return { status: 'error', message: 'ขณะนี้ร้านปิดรับจองชั่วคราว' };
  }

  return { status: 'ok' };
}

function isSlotInPast(dateStr, timeStr) {
  const tz = Session.getScriptTimeZone();
  const now = new Date();
  const nowStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  if (dateStr > nowStr) return false;
  if (dateStr < nowStr) return true;
  const nowTime = Utilities.formatDate(now, tz, 'HH:mm');
  return timeStr <= nowTime;
}

function getNowTime() {
  const tz = Session.getScriptTimeZone();
  const now = new Date();
  return {
    date: Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
    time: Utilities.formatDate(now, tz, 'HH:mm')
  };
}

// ============================================
// INITIAL SETUP (Run once)
// ============================================

function initialSetup() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  Object.values(CONFIG.SHEETS).forEach(sheetName => {
    if (!ss.getSheetByName(sheetName)) {
      const sheet = ss.insertSheet(sheetName);
      setupSheetHeaders(sheet, sheetName);
    }
  });
  
  const servicesSheet = ss.getSheetByName(CONFIG.SHEETS.SERVICES);
  if (servicesSheet.getLastRow() <= 1) {
    servicesSheet.appendRow(['S001', 'ทาสีเจล (สีพื้น)', 'บริการหลัก', 150, 60, 'ทาสีเจลพื้นฐาน', '', true]);
    servicesSheet.appendRow(['S002', 'ทาสีเจล (ลูกแก้ว)', 'บริการหลัก', 200, 90, 'ทาสีเจลแบบลูกแก้ว', '', true]);
    servicesSheet.appendRow(['S003', 'ต่อ PVC (สีพื้น)', 'บริการหลัก', 250, 120, 'ต่อเล็บ PVC', '', true]);
  }
  
  const staffsSheet = ss.getSheetByName(CONFIG.SHEETS.STAFFS);
  if (staffsSheet.getLastRow() <= 1) {
    staffsSheet.appendRow(['ST001', 'ช่างเอ', 'พี่เอ', 'ทำเล็บ,เพ้นท์ลาย', 'ช่างประสบการณ์ 5 ปี', '', true]);
    staffsSheet.appendRow(['ST002', 'ช่างบี', 'พี่บี', 'ต่อเล็บ,เสริมเล็บ', 'เชี่ยวชาญการต่อเล็บ', '', true]);
  }
  
  const settingsSheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(['shopName', 'GY - Nail']);
    settingsSheet.appendRow(['timeSlots', '10:00,11:30,13:00,14:30,16:00,17:30']);
    settingsSheet.appendRow(['adminPassword', 'admin123']);
    settingsSheet.appendRow(['shopOpen', 'true']);
    settingsSheet.appendRow(['specialDates', '[]']);
  }
  
  console.log('Setup completed!');
}
