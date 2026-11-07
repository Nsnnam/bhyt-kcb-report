const fs = require('fs');
const XLSX = require('xlsx');

const expPath = 'C:/Users/Admin/Downloads/Bao_cao_KCB_BHYT_Thang_1_2026.xlsx';
if (!fs.existsSync(expPath)) {
  console.log('File does not exist:', expPath);
  process.exit(0);
}
const wb = XLSX.readFile(expPath, { cellStyles: true });
console.log('Exported sheets:', wb.SheetNames);
const sheet = wb.Sheets[wb.SheetNames[0]];
console.log('Ref:', sheet['!ref']);
console.log('Cols:', JSON.stringify(sheet['!cols']));
console.log('Merges:', JSON.stringify(sheet['!merges'], null, 2));

const range = XLSX.utils.decode_range(sheet['!ref']);
for (let R = 0; R <= Math.min(25, range.e.r); R++) {
  let cells = [];
  for (let C = 0; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C });
    const cell = sheet[addr];
    if (cell && (cell.v !== undefined || cell.f)) {
      cells.push(`${addr}: ${JSON.stringify(cell.v)}${cell.f ? ' [=' + cell.f + ']' : ''}`);
    }
  }
  if (cells.length > 0) {
    console.log(`R${R + 1}: ${cells.join(' | ')}`);
  }
}
