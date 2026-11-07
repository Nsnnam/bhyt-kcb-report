const fs = require('fs');
const XLSX = require('xlsx');

const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const buf = fs.readFileSync(templatePath);
const zip = XLSX.read(buf, { type: 'buffer', bookFiles: true });

console.log('--- sheet1.xml preview ---');
const sheet1Xml = zip.files['xl/worksheets/sheet1.xml'].content;
const strSheet1 = Buffer.from(sheet1Xml).toString('utf-8');
console.log('Length:', strSheet1.length);
console.log(strSheet1.slice(0, 1000));

console.log('--- styles.xml preview ---');
const stylesXml = zip.files['xl/styles.xml'].content;
const strStyles = Buffer.from(stylesXml).toString('utf-8');
console.log('Length:', strStyles.length);
console.log(strStyles.slice(0, 1000));
