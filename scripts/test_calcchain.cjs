const fs = require('fs');
const JSZip = require('jszip');

async function testFix() {
  const file = 'C:/Users/Admin/Downloads/Bao_cao_KCB_BHYT_Thang_1_2026 (3).xlsx';
  const buf = fs.readFileSync(file);
  const zip = await JSZip.loadAsync(buf);

  // 1. Inspect calcChain.xml and its references
  const calcChain = zip.file('xl/calcChain.xml');
  console.log('calcChain exists in zip?', !!calcChain);

  let contentTypes = await zip.file('[Content_Types].xml').async('text');
  console.log('contentTypes has calcChain?', contentTypes.includes('calcChain'));

  let wbRels = await zip.file('xl/_rels/workbook.xml.rels').async('text');
  console.log('wbRels has calcChain?', wbRels.includes('calcChain'));

  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  console.log('sheetXml has $G<row?', sheetXml.includes('$G<row'));
}

testFix();
