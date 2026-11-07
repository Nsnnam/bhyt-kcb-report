const fs = require('fs');
const JSZip = require('jszip');
const XLSX = require('xlsx');

async function test() {
  const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
  const buf = fs.readFileSync(templatePath);

  const zip = await JSZip.loadAsync(buf);
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  // Let's inspect all <c r="D..."> elements in sheet1.xml
  const dCells = sheetXml.match(/<c r="D\d+"[^>]*>.*?<\/c>|<c r="D\d+"[^>]*\/>/g) || [];
  console.log('Total D cells in sheet1.xml:', dCells.length);
  for (let i = 0; i < Math.min(15, dCells.length); i++) {
    console.log(dCells[i]);
  }
}

test();
