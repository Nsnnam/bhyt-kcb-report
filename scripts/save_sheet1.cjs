const fs = require('fs');
const XLSX = require('xlsx');

const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const buf = fs.readFileSync(templatePath);
const zip = XLSX.read(buf, { type: 'buffer', bookFiles: true });

const sheet1Xml = Buffer.from(zip.files['xl/worksheets/sheet1.xml'].content).toString('utf-8');
fs.writeFileSync('scripts/template_sheet1.xml', sheet1Xml, 'utf-8');
console.log('Saved sheet1.xml, length:', sheet1Xml.length);
