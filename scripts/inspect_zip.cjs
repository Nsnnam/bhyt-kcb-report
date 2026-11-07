const fs = require('fs');
const XLSX = require('xlsx');

const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const buf = fs.readFileSync(templatePath);
const zip = XLSX.read(buf, { type: 'buffer', bookFiles: true });
console.log('Book files in template:');
for (const k in zip.files) {
  console.log(' -', k);
}
