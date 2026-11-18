const fs = require('fs');
const JSZip = require('jszip');

async function check() {
  const buf = fs.readFileSync('public/template/7.Bao_cao_KCB_BHYT_Template.xlsx');
  const zip = await JSZip.loadAsync(buf);
  const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  const idx = sheetXml.indexOf('r="65"');
  console.log('Index of r="65":', idx);
  console.log(sheetXml.slice(idx - 100, idx + 600));
}
check();
