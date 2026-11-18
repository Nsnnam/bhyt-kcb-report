const JSZip = require('jszip');
const fs = require('fs');

async function testFullExport() {
  const buf = fs.readFileSync('C:/Users/Admin/Downloads/other/09_Code_LapTrinh_Web/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx');
  const zip = await JSZip.loadAsync(buf);
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  // Strip G cells SAFELY (self-closing first, or specific to G65)
  sheetXml = sheetXml.replace(/<c r="G\d+"[^>]*?\/>|<c r="G\d+"[^>]*?>[\s\S]*?<\/c>/g, '');

  console.log('After stripping G cells, checking rows 1 to 107:');
  let missingRows = 0;
  for (let r = 1; r <= 107; r++) {
    const re = new RegExp('<row r="' + r + '"[^>]*>[\\s\\S]*?<\\/row>');
    if (!sheetXml.match(re)) {
      console.log(`Row ${r} is MISSING!`);
      missingRows++;
    }
  }
  console.log('Total missing rows:', missingRows);
}
testFullExport().catch(console.error);
