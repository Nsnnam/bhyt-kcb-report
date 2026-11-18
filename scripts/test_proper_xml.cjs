const fs = require('fs');
const JSZip = require('jszip');

async function testRowByRow() {
  const buf = fs.readFileSync('public/template/7.Bao_cao_KCB_BHYT_Template.xlsx');
  const zip = await JSZip.loadAsync(buf);
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  console.log('Original sheetXml length:', sheetXml.length);

  // Let's test row by row replacement for all rows 6 to 107
  for (let r = 6; r <= 107; r++) {
    const rowRegex = new RegExp(`(<row r="${r}"[^>]*>)(.*?)(</row>)`, 's');
    const rowMatch = sheetXml.match(rowRegex);
    if (!rowMatch) {
      // Row not found
      continue;
    }

    const rowStart = rowMatch[1];
    let rowContent = rowMatch[2];
    const rowEnd = rowMatch[3];

    // Find cell D inside rowContent only!
    // Note: Match self-closing FIRST or strictly without letting > match />
    const cellDRegex = new RegExp(`(<c r="D${r}"[^>]*?)(?:\\/>|>(?:.*?)</c>)`, 's');
    const dMatch = rowContent.match(cellDRegex);

    if (dMatch) {
      const fullTag = dMatch[0];
      const sMatch = fullTag.match(/s="(\d+)"/);
      const styleAttr = sMatch ? ` s="${sMatch[1]}"` : '';
      
      const newD = `<c r="D${r}"${styleAttr}><v>12345</v></c>`;
      rowContent = rowContent.replace(cellDRegex, newD);
      sheetXml = sheetXml.replace(rowRegex, `${rowStart}${rowContent}${rowEnd}`);
    } else {
      console.log(`Row ${r}: NO cell D found inside row content:`, rowContent);
    }
  }

  // Now verify every row from 6 to 107 has its A, B, C, D cells intact!
  console.log('--- Verifying rows after row-by-row replacement ---');
  let missingCount = 0;
  for (let r = 6; r <= 35; r++) {
    const rowRegex = new RegExp(`<row r="${r}"[^>]*>(.*?)</row>`, 's');
    const rowMatch = sheetXml.match(rowRegex);
    if (rowMatch) {
      const cells = rowMatch[1].match(/<c r="[A-Z]+\d+"[^>]*>.*?<\/c>|<c r="[A-Z]+\d+"[^>]*\/>/g) || [];
      const cellNames = cells.map(c => {
        const m = c.match(/r="([A-Z]+\d+)"/);
        return m ? m[1] : '';
      });
      console.log(`R${r}: cells = [${cellNames.join(', ')}]`);
      if (!cellNames.some(c => c.startsWith(`A${r}`))) {
        console.error(`ERROR: A${r} IS MISSING!`);
        missingCount++;
      }
    }
  }
  console.log('Missing A cells count:', missingCount);
}

testRowByRow();
