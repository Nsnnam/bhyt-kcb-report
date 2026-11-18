const fs = require('fs');
const JSZip = require('jszip');
const XLSX = require('xlsx');

// Exact formulas defined for File 7
const FORMULA_OVERRIDES = {
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

async function generateFixedReport(templateBuffer, valuesMap, month = 1) {
  const zip = await JSZip.loadAsync(templateBuffer);
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  // Process strictly row by row from row 6 to 107
  for (let r = 6; r <= 107; r++) {
    const rowRegex = new RegExp(`(<row r="${r}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
    const rowMatch = sheetXml.match(rowRegex);
    if (!rowMatch) continue;

    const rowStart = rowMatch[1];
    let rowContent = rowMatch[2];
    const rowEnd = rowMatch[3];

    const val = valuesMap[r];
    const formula = FORMULA_OVERRIDES[r];

    // Strictly match cell D in this row:
    // Case 1: self-closing tag <c r="D..." .../>
    // Case 2: tag with content <c r="D..." ...>...</c>
    const cellDRegex = new RegExp(`(<c r="D${r}"[^>]*?\\/>)|(<c r="D${r}"[^>]*?>[\\s\\S]*?<\\/c>)`);
    const dMatch = rowContent.match(cellDRegex);

    let styleAttr = '';
    if (dMatch) {
      const fullCell = dMatch[0];
      const sMatch = fullCell.match(/s="(\d+)"/);
      if (sMatch) styleAttr = ` s="${sMatch[1]}"`;
    } else {
      // Default style based on row type if not present
      if (r === 7 || r === 24 || r === 65 || r === 99 || r === 102 || r === 105) styleAttr = ' s="13"';
      else if (r === 10) styleAttr = ' s="43"';
      else if (r === 11) styleAttr = ' s="44"';
      else styleAttr = ' s="41"';
    }

    let numVal = val;
    // In Excel, percentage format 0% requires 0.0 - 1.0
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

    if (dMatch) {
      rowContent = rowContent.replace(cellDRegex, newCellXml);
    } else {
      // If cell D wasn't in this row, insert before cell E or before end of row
      const eMatch = rowContent.match(new RegExp(`<c r="E${r}"`));
      if (eMatch && eMatch.index !== undefined) {
        rowContent = rowContent.slice(0, eMatch.index) + newCellXml + rowContent.slice(eMatch.index);
      } else {
        rowContent = rowContent + newCellXml;
      }
    }

    sheetXml = sheetXml.replace(rowRegex, `${rowStart}${rowContent}${rowEnd}`);
  }

  // Update header title in A1 with dynamic month
  const a1RowRegex = /(<row r="1"[^>]*>)([\s\S]*?)(<\/row>)/;
  const a1RowMatch = sheetXml.match(a1RowRegex);
  if (a1RowMatch) {
    const a1CellRegex = /(<c r="A1"[^>]*?\/>)|(<c r="A1"[^>]*?>[\s\S]*?<\/c>)/;
    const newA1 = `<c r="A1" s="47" t="inlineStr"><is><t>BÁO CÁO THÁNG ${month}</t></is></c>`;
    const updatedRow1 = a1RowMatch[2].replace(a1CellRegex, newA1);
    sheetXml = sheetXml.replace(a1RowRegex, `${a1RowMatch[1]}${updatedRow1}${a1RowMatch[3]}`);
  }

  // Enable fullCalcOnLoad in workbook.xml
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

async function verify() {
  const sampleData = JSON.parse(fs.readFileSync('src/data/sample_report.json', 'utf-8'));
  const templateBuf = fs.readFileSync('public/template/7.Bao_cao_KCB_BHYT_Template.xlsx');

  // Build valuesMap from sampleData
  const { rawValues } = sampleData;
  const m = {};
  m[7] = rawValues.count_total;
  m[8] = rawValues.count_noi;
  m[9] = rawValues.total_ngay_noi;
  m[10] = rawValues.bq_ngay_noi;
  m[11] = rawValues.ty_le_noi;
  m[13] = rawValues.cls_count_noi['Số lượt xét nghiệm'] || 0;
  m[14] = rawValues.cls_count_noi['Số lượt chụp X-Quang'] || 0;
  m[15] = rawValues.cls_count_noi['Số lượt siêu âm'] || 0;
  m[16] = rawValues.cls_count_noi['Số lượt chụp CT/MRI'] || 0;
  m[17] = rawValues.count_ngoai;
  m[19] = rawValues.cls_count_ngoai['Số lượt xét nghiệm'] || 0;
  m[20] = rawValues.cls_count_ngoai['Số lượt chụp X-Quang'] || 0;
  m[21] = rawValues.cls_count_ngoai['Số lượt siêu âm'] || 0;
  m[22] = rawValues.cls_count_ngoai['Số lượt chụp CT/MRI'] || 0;
  m[24] = rawValues.tong_chi_noi + rawValues.tong_chi_ngoai;
  m[25] = rawValues.tong_chi_noi;
  m[26] = rawValues.tong_chi_ngoai;
  m[28] = Math.round(rawValues.tong_chi_noi / rawValues.count_noi);
  m[29] = Math.round(rawValues.tong_chi_ngoai / rawValues.count_ngoai);
  m[31] = rawValues.tong_chi_noi;
  m[32] = rawValues.kham_noi;
  m[33] = rawValues.giuong_noi;
  m[34] = rawValues.xn_noi;
  m[35] = rawValues.dvkt_cost_noi['Hóa sinh:'] || 0;
  m[36] = rawValues.dvkt_cost_noi['Huyết học:'] || 0;
  m[37] = rawValues.dvkt_cost_noi['Vi sinh:'] || 0;
  m[38] = rawValues.dvkt_cost_noi['Giải phẫu bệnh:'] || 0;
  m[39] = rawValues.dvkt_cost_noi['Xét nghiệm khác:'] || 0;
  m[40] = rawValues.cdha_noi;
  m[41] = rawValues.dvkt_cost_noi['X-Quang:'] || 0;
  m[42] = rawValues.dvkt_cost_noi['Chụp cắt lớp vi tính/CT:'] || 0;
  m[43] = rawValues.dvkt_cost_noi['Chụp cộng hưởng từ/MRI:'] || 0;
  m[44] = rawValues.dvkt_cost_noi['Siêu âm:'] || 0;
  m[45] = rawValues.dvkt_cost_noi['Nội soi Tiêu hóa:'] || 0;
  m[46] = rawValues.dvkt_cost_noi['Nội soi Tai - Mũi - Họng:'] || 0;
  m[47] = rawValues.dvkt_cost_noi['Khác:'] || 0;
  m[48] = rawValues.thuoc_noi;
  m[49] = rawValues.drug_cost_noi['Tiền thuốc kháng sinh'] || 0;
  m[50] = rawValues.drug_cost_noi['Tiền thuốc ung thư'] || 0;
  m[51] = rawValues.drug_cost_noi['Tiền thuốc Corticoid'] || 0;
  m[52] = rawValues.drug_cost_noi['Tiền dịch truyền'] || 0;
  m[53] = rawValues.drug_cost_noi['Tiền thuốc Vitamin'] || 0;
  m[54] = rawValues.drug_cost_noi['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0;
  m[55] = rawValues.drug_cost_noi['Tiền thuốc khác'] || 0;
  m[56] = rawValues.mau_noi;
  m[57] = rawValues.pttt_noi;
  m[58] = rawValues.dvkt_cost_noi['Loại đặc biệt:'] || 0;
  m[59] = rawValues.dvkt_cost_noi['Loại I:'] || 0;
  m[60] = rawValues.dvkt_cost_noi['Loại II:'] || 0;
  m[61] = rawValues.dvkt_cost_noi['Loại III:'] || 0;
  m[62] = rawValues.dvkt_cost_noi['PTTT loại khác'] || 0;
  m[63] = rawValues.vtyt_noi;
  m[64] = 0;
  m[65] = rawValues.tong_chi_ngoai;
  m[66] = rawValues.kham_ngoai;
  m[67] = rawValues.giuong_ngoai;
  m[68] = rawValues.xn_ngoai;
  m[69] = rawValues.dvkt_cost_ngoai['Hóa sinh:'] || 0;
  m[70] = rawValues.dvkt_cost_ngoai['Huyết học:'] || 0;
  m[71] = rawValues.dvkt_cost_ngoai['Vi sinh:'] || 0;
  m[72] = rawValues.dvkt_cost_ngoai['Giải phẫu bệnh:'] || 0;
  m[73] = rawValues.dvkt_cost_ngoai['Xét nghiệm khác:'] || 0;
  m[74] = rawValues.cdha_ngoai;
  m[75] = rawValues.dvkt_cost_ngoai['X-Quang:'] || 0;
  m[76] = rawValues.dvkt_cost_ngoai['Chụp cắt lớp vi tính/CT:'] || 0;
  m[77] = rawValues.dvkt_cost_ngoai['Chụp cộng hưởng từ/MRI:'] || 0;
  m[78] = rawValues.dvkt_cost_ngoai['Siêu âm:'] || 0;
  m[79] = rawValues.dvkt_cost_ngoai['Nội soi Tiêu hóa:'] || 0;
  m[80] = rawValues.dvkt_cost_ngoai['Nội soi Tai - Mũi - Họng:'] || 0;
  m[81] = rawValues.dvkt_cost_ngoai['Khác:'] || 0;
  m[82] = rawValues.thuoc_ngoai;
  m[83] = rawValues.drug_cost_ngoai['Tiền thuốc kháng sinh'] || 0;
  m[84] = rawValues.drug_cost_ngoai['Tiền thuốc ung thư'] || 0;
  m[85] = rawValues.drug_cost_ngoai['Tiền thuốc Corticoid'] || 0;
  m[86] = rawValues.drug_cost_ngoai['Tiền dịch truyền'] || 0;
  m[87] = rawValues.drug_cost_ngoai['Tiền thuốc Vitamin'] || 0;
  m[88] = rawValues.drug_cost_ngoai['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0;
  m[89] = rawValues.drug_cost_ngoai['Tiền thuốc khác'] || 0;
  m[90] = rawValues.mau_ngoai;
  m[91] = rawValues.pttt_ngoai;
  m[92] = rawValues.dvkt_cost_ngoai['Loại đặc biệt:'] || 0;
  m[93] = rawValues.dvkt_cost_ngoai['Loại I:'] || 0;
  m[94] = rawValues.dvkt_cost_ngoai['Loại II:'] || 0;
  m[95] = rawValues.dvkt_cost_ngoai['Loại III:'] || 0;
  m[96] = rawValues.dvkt_cost_ngoai['PTTT loại khác'] || 0;
  m[97] = rawValues.vtyt_ngoai;
  m[98] = 0;
  m[99] = rawValues.total_bhtt_noi + rawValues.total_bhtt_ngoai;
  m[100] = rawValues.total_bhtt_ngoai;
  m[101] = rawValues.total_bhtt_noi;
  m[102] = 0;
  m[103] = 0;
  m[104] = 0;
  m[105] = 0;
  m[106] = 0;
  m[107] = 0;

  const outBuf = await generateFixedReport(templateBuf, m, 1);
  const targetPath = 'C:/Users/Admin/Downloads/Bao_cao_KCB_BHYT_Thang_1_2026.xlsx';
  fs.writeFileSync(targetPath, outBuf);
  console.log('Successfully written to:', targetPath);

  // Now read back and print rows 5 to 35
  const wb = XLSX.readFile(targetPath, { bookFiles: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  console.log('--- Checking exported rows ---');
  for (let r = 5; r <= 35; r++) {
    const a = sheet['A' + r] ? sheet['A' + r].v : '';
    const b = sheet['B' + r] ? sheet['B' + r].v : '';
    const c = sheet['C' + r] ? sheet['C' + r].v : '';
    const d = sheet['D' + r] ? sheet['D' + r].v : '';
    const f = sheet['D' + r] ? sheet['D' + r].f : '';
    console.log(`R${r} -> A: "${a}" | B: "${b}" | C: "${c}" | D: ${d}${f ? ' [=' + f + ']' : ''}`);
  }
}

verify();
