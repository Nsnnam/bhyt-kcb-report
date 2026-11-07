const fs = require('fs');
const XLSX = require('xlsx');

const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const wb = XLSX.readFile(templatePath);
const sheet = wb.Sheets[wb.SheetNames[0]];

const range = XLSX.utils.decode_range(sheet['!ref']);
console.log('Cells in col F or G with values:');
for (let R = 0; R <= range.e.r; R++) {
  const fCell = sheet[XLSX.utils.encode_cell({ r: R, c: 5 })];
  const gCell = sheet[XLSX.utils.encode_cell({ r: R, c: 6 })];
  if (fCell && fCell.v !== undefined && fCell.v !== '') {
    console.log(`F${R + 1}: ${fCell.v}`);
  }
  if (gCell && gCell.v !== undefined && gCell.v !== '') {
    console.log(`G${R + 1}: ${gCell.v}`);
  }
}
