const fs = require('fs');
const XLSX = require('xlsx');

const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const exportedPath = 'C:/Users/Admin/Downloads/Bao_cao_KCB_BHYT_Thang_1_2026.xlsx';

const wbTemplate = XLSX.readFile(templatePath, { cellStyles: true, cellNF: true });
console.log('Template sheets:', wbTemplate.SheetNames);
const sheetT = wbTemplate.Sheets[wbTemplate.SheetNames[0]];
console.log('Template !ref:', sheetT['!ref']);
console.log('Template !merges:', JSON.stringify(sheetT['!merges'], null, 2));
console.log('Template !cols:', JSON.stringify(sheetT['!cols']));
console.log('Template !rows:', JSON.stringify(sheetT['!rows']));

const range = XLSX.utils.decode_range(sheetT['!ref']);
console.log('Total Rows:', range.e.r + 1, 'Total Cols:', range.e.c + 1);

for (let R = 0; R <= range.e.r; R++) {
  let cells = [];
  for (let C = 0; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C });
    const cell = sheetT[addr];
    if (cell && (cell.v !== undefined || cell.f)) {
      const val = cell.v !== undefined ? String(cell.v).replace(/\n/g, ' ') : '';
      const formula = cell.f ? ` [=${cell.f}]` : '';
      cells.push(`${addr}: "${val}"${formula}`);
    }
  }
  if (cells.length > 0) {
    console.log(`R${R + 1}: ${cells.join(' | ')}`);
  }
}
