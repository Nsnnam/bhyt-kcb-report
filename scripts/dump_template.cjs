const fs = require('fs');
const XLSX = require('xlsx');

const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const wb = XLSX.readFile(templatePath, { cellStyles: true, cellFormula: true, cellNF: true });
const sheet = wb.Sheets[wb.SheetNames[0]];

const range = XLSX.utils.decode_range(sheet['!ref']);
const rows = [];
for (let R = range.s.r; R <= range.e.r; R++) {
  const rowData = { row: R + 1, cells: {} };
  for (let C = range.s.c; C <= range.e.c; C++) {
    const colName = XLSX.utils.encode_col(C);
    const addr = `${colName}${R + 1}`;
    const cell = sheet[addr];
    if (cell) {
      rowData.cells[colName] = {
        v: cell.v,
        f: cell.f,
        t: cell.t,
        z: cell.z,
        s: cell.s
      };
    }
  }
  rows.push(rowData);
}

fs.writeFileSync('scripts/template_dump.json', JSON.stringify({
  sheetName: wb.SheetNames[0],
  ref: sheet['!ref'],
  merges: sheet['!merges'],
  cols: sheet['!cols'],
  rows: sheet['!rows'],
  data: rows
}, null, 2), 'utf-8');

console.log('Saved template dump to scripts/template_dump.json');
