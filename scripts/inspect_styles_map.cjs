const fs = require('fs');
const JSZip = require('jszip');

async function test() {
  const buf = fs.readFileSync('C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx');
  const zip = await JSZip.loadAsync(buf);
  const stylesXml = await zip.file('xl/styles.xml').async('text');

  // Find cellXfs
  const match = stylesXml.match(/<cellXfs count=\"\d+\">(.*?)<\/cellXfs>/s);
  if (!match) return;
  const xfs = match[1].match(/<xf [^>]*>/g) || [];
  console.log('Total xf styles:', xfs.length);
  xfs.forEach((xf, idx) => {
    console.log(`Style ${idx}: ${xf}`);
  });
}

test();
