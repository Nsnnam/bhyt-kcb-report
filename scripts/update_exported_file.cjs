const fs = require('fs');
const JSZip = require('jszip');
const XLSX = require('xlsx');

// 1. Read template
const templateBuf = fs.readFileSync('C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx');

// 2. Exact formula overrides matching Excel specifications
const formulaOverrides = {
  7: 'D8+D17',
  10: 'D9/D8',
  11: 'D8/D7',
  24: 'D25+D26',
  25: 'D31',
  26: 'D65',
  28: 'D25/D8',
  29: 'D26/D17',
  31: 'D32+D33+D34+D40+D48+D56+D57+D63+D64',
  34: 'SUM(D35:D39)',
  40: 'SUM(D41:D47)',
  48: 'SUM(D49:D55)',
  57: 'SUM(D58:D62)',
  65: 'D66+D67+D68+D74+D82+D90+D91+D97+D98',
  68: 'SUM(D69:D73)',
  74: 'SUM(D75:D81)',
  82: 'SUM(D83:D89)',
  91: 'SUM(D92:D96)',
  99: 'D100+D101',
  102: 'D103+D104',
  105: 'D106+D107'
};

async function generateExactTemplateReport(templateBuffer, rowValues, month = 1) {
  const zip = await JSZip.loadAsync(templateBuffer);
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  // Replace each D cell from row 6 to 107
  for (let r = 6; r <= 107; r++) {
    const val = rowValues[r];
    const formula = formulaOverrides[r];

    // Regex to match cell D in row r: <c r="D{r}" ...>...</c> or <c r="D{r}" .../>
    const cellRegex = new RegExp(`(<c r="D${r}"[^>]*>)(.*?)(<\\/c>)|(<c r="D${r}"[^>]*\\/>)`, 's');
    const match = sheetXml.match(cellRegex);

    if (match) {
      const fullCell = match[0];
      const sMatch = fullCell.match(/s="(\d+)"/);
      const styleAttr = sMatch ? ` s="${sMatch[1]}"` : '';

      let numVal = val;
      if (r === 11 && typeof val === 'number' && val > 1) {
        numVal = val / 100;
      }

      let newCellXml = '';
      if (formula && val !== undefined && val !== null) {
        newCellXml = `<c r="D${r}"${styleAttr}><f>${formula}</f><v>${numVal}</v></c>`;
      } else if (formula) {
        newCellXml = `<c r="D${r}"${styleAttr}><f>${formula}</f><v>0</v></c>`;
      } else if (val !== undefined && val !== null && val !== '') {
        newCellXml = `<c r="D${r}"${styleAttr}><v>${numVal}</v></c>`;
      } else {
        newCellXml = `<c r="D${r}"${styleAttr}/>`;
      }

      sheetXml = sheetXml.replace(cellRegex, newCellXml);
    }
  }

  // Update cell A1: BÁO CÁO THÁNG {month}
  const a1Regex = /(<c r="A1"[^>]*>)(.*?)(<\/c>)|(<c r="A1"[^>]*\/>)/s;
  const a1Match = sheetXml.match(a1Regex);
  if (a1Match) {
    const sMatch = a1Match[0].match(/s="(\d+)"/);
    const styleAttr = sMatch ? ` s="${sMatch[1]}"` : ' s="47"';
    sheetXml = sheetXml.replace(a1Regex, `<c r="A1"${styleAttr} t="inlineStr"><is><t>BÁO CÁO THÁNG ${month}</t></is></c>`);
  }

  // Force Excel to calculate all formulas on open
  let wbXml = await zip.file('xl/workbook.xml').async('text');
  if (wbXml.includes('<calcPr')) {
    wbXml = wbXml.replace(/<calcPr[^>]*\/>|<calcPr[^>]*>.*?<\/calcPr>/s, '<calcPr calcId="191029" fullCalcOnLoad="1"/>');
  } else {
    wbXml = wbXml.replace('</workbook>', '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>');
  }
  zip.file('xl/workbook.xml', wbXml);

  zip.file('xl/worksheets/sheet1.xml', sheetXml);
  return await zip.generateAsync({ type: 'nodebuffer' });
}

// Map from rawValues in sample_report.json to row numbers
function getValuesFromSample() {
  const sampleRaw = JSON.parse(fs.readFileSync('src/data/sample_report.json', 'utf-8'));
  const { rawValues } = sampleRaw;
  const {
    count_total, count_noi, total_ngay_noi, bq_ngay_noi, ty_le_noi, count_ngoai,
    cls_count_noi, cls_count_ngoai,
    tong_chi_noi, tong_chi_ngoai,
    kham_noi, giuong_noi, xn_noi, cdha_noi, thuoc_noi, mau_noi, pttt_noi, vtyt_noi,
    kham_ngoai, giuong_ngoai, xn_ngoai, cdha_ngoai, thuoc_ngoai, mau_ngoai, pttt_ngoai, vtyt_ngoai,
    total_bhtt_noi, total_bhtt_ngoai,
    dvkt_cost_noi, dvkt_cost_ngoai,
    drug_cost_noi, drug_cost_ngoai
  } = rawValues;

  const m = {};
  m[7] = count_total;
  m[8] = count_noi;
  m[9] = total_ngay_noi;
  m[10] = bq_ngay_noi;
  m[11] = ty_le_noi;
  m[13] = cls_count_noi['Số lượt xét nghiệm'] || 0;
  m[14] = cls_count_noi['Số lượt chụp X-Quang'] || 0;
  m[15] = cls_count_noi['Số lượt siêu âm'] || 0;
  m[16] = cls_count_noi['Số lượt chụp CT/MRI'] || 0;
  m[17] = count_ngoai;
  m[19] = cls_count_ngoai['Số lượt xét nghiệm'] || 0;
  m[20] = cls_count_ngoai['Số lượt chụp X-Quang'] || 0;
  m[21] = cls_count_ngoai['Số lượt siêu âm'] || 0;
  m[22] = cls_count_ngoai['Số lượt chụp CT/MRI'] || 0;
  m[24] = tong_chi_noi + tong_chi_ngoai;
  m[25] = tong_chi_noi;
  m[26] = tong_chi_ngoai;
  m[28] = Math.round(tong_chi_noi / count_noi);
  m[29] = Math.round(tong_chi_ngoai / count_ngoai);
  m[31] = tong_chi_noi;
  m[32] = kham_noi;
  m[33] = giuong_noi;
  m[34] = xn_noi;
  m[35] = dvkt_cost_noi['Sinh hóa'] || 0;
  m[36] = dvkt_cost_noi['Huyết học'] || 0;
  m[37] = dvkt_cost_noi['Vi sinh'] || 0;
  m[38] = dvkt_cost_noi['Miễn dịch'] || 0;
  m[39] = dvkt_cost_noi['Giải phẫu bệnh'] || 0;
  m[40] = cdha_noi;
  m[41] = dvkt_cost_noi['Chụp X-quang'] || 0;
  m[42] = dvkt_cost_noi['Chụp CT-Scanner'] || 0;
  m[43] = dvkt_cost_noi['Chụp MRI'] || 0;
  m[44] = dvkt_cost_noi['Siêu âm'] || 0;
  m[45] = dvkt_cost_noi['Nội soi'] || 0;
  m[46] = dvkt_cost_noi['Thăm dò chức năng'] || 0;
  m[47] = dvkt_cost_noi['CĐHA khác'] || 0;
  m[48] = thuoc_noi;
  m[49] = drug_cost_noi['Thuốc kháng sinh'] || 0;
  m[50] = drug_cost_noi['Thuốc điều trị ung thư'] || 0;
  m[51] = drug_cost_noi['Thuốc corticoid'] || 0;
  m[52] = drug_cost_noi['Dịch truyền'] || 0;
  m[53] = drug_cost_noi['Thuốc Vitamin'] || 0;
  m[54] = drug_cost_noi['Thuốc YHCT'] || 0;
  m[55] = drug_cost_noi['Tiền thuốc khác'] || 0;
  m[56] = mau_noi;
  m[57] = pttt_noi;
  m[58] = dvkt_cost_noi['PTTT Loại đặc biệt'] || 0;
  m[59] = dvkt_cost_noi['PTTT Loại I'] || 0;
  m[60] = dvkt_cost_noi['PTTT Loại II'] || 0;
  m[61] = dvkt_cost_noi['PTTT Loại III'] || 0;
  m[62] = dvkt_cost_noi['PTTT Loại khác'] || 0;
  m[63] = vtyt_noi;
  m[64] = 0;
  m[65] = tong_chi_ngoai;
  m[66] = kham_ngoai;
  m[67] = giuong_ngoai;
  m[68] = xn_ngoai;
  m[69] = dvkt_cost_ngoai['Sinh hóa'] || 0;
  m[70] = dvkt_cost_ngoai['Huyết học'] || 0;
  m[71] = dvkt_cost_ngoai['Vi sinh'] || 0;
  m[72] = dvkt_cost_ngoai['Miễn dịch'] || 0;
  m[73] = dvkt_cost_ngoai['Giải phẫu bệnh'] || 0;
  m[74] = cdha_ngoai;
  m[75] = dvkt_cost_ngoai['Chụp X-quang'] || 0;
  m[76] = dvkt_cost_ngoai['Chụp CT-Scanner'] || 0;
  m[77] = dvkt_cost_ngoai['Chụp MRI'] || 0;
  m[78] = dvkt_cost_ngoai['Siêu âm'] || 0;
  m[79] = dvkt_cost_ngoai['Nội soi'] || 0;
  m[80] = dvkt_cost_ngoai['Thăm dò chức năng'] || 0;
  m[81] = dvkt_cost_ngoai['CĐHA khác'] || 0;
  m[82] = thuoc_ngoai;
  m[83] = drug_cost_ngoai['Thuốc kháng sinh'] || 0;
  m[84] = drug_cost_ngoai['Thuốc điều trị ung thư'] || 0;
  m[85] = drug_cost_ngoai['Thuốc corticoid'] || 0;
  m[86] = drug_cost_ngoai['Dịch truyền'] || 0;
  m[87] = drug_cost_ngoai['Thuốc Vitamin'] || 0;
  m[88] = drug_cost_ngoai['Thuốc YHCT'] || 0;
  m[89] = drug_cost_ngoai['Tiền thuốc khác'] || 0;
  m[90] = mau_ngoai;
  m[91] = pttt_ngoai;
  m[92] = dvkt_cost_ngoai['PTTT Loại đặc biệt'] || 0;
  m[93] = dvkt_cost_ngoai['PTTT Loại I'] || 0;
  m[94] = dvkt_cost_ngoai['PTTT Loại II'] || 0;
  m[95] = dvkt_cost_ngoai['PTTT Loại III'] || 0;
  m[96] = dvkt_cost_ngoai['PTTT Loại khác'] || 0;
  m[97] = vtyt_ngoai;
  m[98] = 0;
  m[99] = total_bhtt_noi + total_bhtt_ngoai;
  m[100] = total_bhtt_ngoai;
  m[101] = total_bhtt_noi;
  m[102] = 0;
  m[103] = 0;
  m[104] = 0;
  m[105] = 0;
  m[106] = 0;
  m[107] = 0;
  return m;
}

async function run() {
  const valuesMap = getValuesFromSample();
  const outBuf = await generateExactTemplateReport(templateBuf, valuesMap, 1);
  const targetPath = 'C:/Users/Admin/Downloads/Bao_cao_KCB_BHYT_Thang_1_2026.xlsx';
  fs.writeFileSync(targetPath, outBuf);
  console.log('Successfully written file to:', targetPath);
  console.log('Size:', outBuf.length, 'bytes');

  // Inspect target
  const wb = XLSX.readFile(targetPath, { bookFiles: true });
  console.log('Sheets:', wb.SheetNames);
  console.log('Times New Roman:', Buffer.from(wb.files['xl/styles.xml'].content).toString('utf-8').includes('Times New Roman'));
  const s = wb.Sheets[wb.SheetNames[0]];
  console.log('D7:', s['D7']);
  console.log('D8:', s['D8']);
  console.log('D10:', s['D10']);
  console.log('D11:', s['D11']);
  console.log('D24:', s['D24']);
  console.log('D31:', s['D31']);
  console.log('D34:', s['D34']);
  console.log('D40:', s['D40']);
  console.log('D48:', s['D48']);
  console.log('D65:', s['D65']);
  console.log('D99:', s['D99']);
}

run();
