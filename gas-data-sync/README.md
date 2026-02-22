# GY-Nail Pro 3 🎀

ระบบจองคิวทำเล็บออนไลน์ (Google Apps Script + Tailwind CSS)

## ✨ ฟีเจอร์

- **จองคิวออนไลน์** - เลือกบริการ วันที่ เวลา ได้ง่าย
- **แอดมินพาเนล** - จัดการคิว อนุมัติ/ยกเลิก ดูสถิติ
- **AI ผู้ช่วย "น้องยุ้ยคนสวย"** - ตอบคำถามเกี่ยวกับบริการ
- **ช่องทางติดต่อ** - LINE, Facebook, TikTok, Phone (ตั้งค่าได้)
- **ป้ายข้อคว่ง** - แามวิสดงโปรโมชั่น/ข้อความสำคัญ
- **หิมะตก** - เอฟเฟกต์หิมะ (seasonal)
- **รีวิวลูกค้า** - แสดงรีวิวและคะแนน
- **แกลเลอรี่ผลงาน** - เชื่อมต่อ Google Drive
- **Google Calendar** - แจ้งเตือนนัดหมาย
- **Responsive** - รองรับมือถือ/แท็บเล็ต/เดสก์ท็อป

## 🚀 การติดตั้ง

### 1. Clone โปรเจกต์
```bash
git clone https://github.com/nattharika1509-rgb/GY-Nail-Pro-3.git
cd GY-Nail-Pro-3
```

### 2. ติดตั้ง clasp (ถ้ายังไม่มี)
```bash
npm install -g @google/clasp
clasp login
```

### 3. Pull จาก Google Apps Script
```bash
clasp pull
```

### 4. แก้ไขโค้ดและ Push
```bash
clasp push
```

### 5. Deploy
```bash
clasp deploy
```

## ⚙️ การตั้งค่า

### Google Sheets
สร้าง Spreadsheet และตั้งชื่อ sheets:
- `จองคิว` - ข้อมูลการจอง
- `บริการ` - รายการบริการและราคา
- `ช่าง` - ข้อมูลช่าง
- `รีวิว` - รีวิวลูกค้า
- `ตั้งค่า` - การตั้งค่าร้าน

### Admin Settings (ในแอป)
- ชื่อร้าน
- รอบเวลา
- Email แจ้งเตือน
- ข้อความป้ายวิ่ง
- ช่องทางติดต่อ (LINE, Facebook, TikTok, Phone)

## 📁 โครงสร้าง

```
gas-data-sync/
├── src/
│   ├── Code.js        # Backend (Google Apps Script)
│   ├── index.html     # Frontend
│   └── appsscript.json
├── index.html         # Synced for GitHub Pages
├── package.json
└── .clasp.json
```

## 🎨 เทคโนโลยี

- **Frontend**: HTML, Tailwind CSS, Vanilla JS
- **Backend**: Google Apps Script
- **Storage**: Google Sheets
- **Deployment**: Google Apps Script + GitHub Pages

## 📄 License

MIT

---

Made with 💅 by GY-Nail
