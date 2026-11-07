const fs = require('fs');
const JSZip = require('jszip');
const XLSX = require('xlsx');

async function testCalcPr() {
  const buf = fs.readFileSync('C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx');
  const zip = await JSZip.loadAsync(buf);
  let wbXml = await zip.file('xl/workbook.xml').async('text');
  console.log('Original workbook.xml:');
  console.log(wbXml);

  if (wbXml.includes('<calcPr')) {
    wbXml = wbXml.replace(/<calcPr[^>]*\/>|<calcPr[^>]*>.*?<\/calcPr>/s, '<calcPr fullCalcOnLoad="1"/>');
  } else {
    wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
  }
  console.log('Updated calcPr in workbook.xml');
}

testCalcPr();
