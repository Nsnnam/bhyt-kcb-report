const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const buf = fs.readFileSync('C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx');
  const zip = await JSZip.loadAsync(buf);
  const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  console.log('--- Inspecting all D cells from R6 to R107 ---');
  for (let r = 6; r <= 107; r++) {
    // Match cell D in row r
    // Regex looks inside row r: <row r="r" ...> ... </row>
    const rowMatch = sheetXml.match(new RegExp(`<row r="${r}"[^>]*>(.*?)</row>`, 's'));
    if (!rowMatch) {
      console.log(`Row ${r} NOT FOUND`);
      continue;
    }
    const rowContent = rowMatch[1];
    const dMatch = rowContent.match(new RegExp(`<c r="D${r}"([^>]*)>(.*?)</c>|<c r="D${r}"([^>]*)/?>`, 's'));
    if (dMatch) {
      const fullCell = dMatch[0];
      const sMatch = fullCell.match(/s="(\d+)"/);
      const styleId = sMatch ? sMatch[1] : 'none';
      const isString = fullCell.includes('t="s"') || fullCell.includes('t="inlineStr"');
      console.log(`R${r}: style=${styleId}, isStr=${isString}, raw=${fullCell.slice(0, 80)}`);
    } else {
      console.log(`R${r}: NO D CELL in row`);
    }
  }
}

test();
