const fs = require('fs');
const JSZip = require('jszip');

async function check() {
  const buf = fs.readFileSync('public/template/7.Bao_cao_KCB_BHYT_Template.xlsx');
  const zip = await JSZip.loadAsync(buf);
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  for (let r of [7, 8, 12, 13, 18, 19, 23, 24, 27, 28, 30, 31]) {
    const cellRegex = new RegExp(`(<c r="D${r}"[^>]*>)(.*?)(<\\/c>)|(<c r="D${r}"[^>]*\\/>)`, 's');
    const match = sheetXml.match(cellRegex);
    console.log(`--- R${r} Match (${match ? match[0].length : 0} chars) ---`);
    console.log(match ? match[0] : 'NO MATCH');
  }
}
check();
