const fs = require('fs');
const JSZip = require('jszip');

async function testCleanExport() {
  const file = 'public/template/7.Bao_cao_KCB_BHYT_Template.xlsx';
  const buf = fs.readFileSync(file);
  const zip = await JSZip.loadAsync(buf);

  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  // Clean up any stray broken #REF! formulas in col G if present
  sheetXml = sheetXml.replace(/<c r="G\d+"[^>]*>.*?<\/c>|<c r="G\d+"[^>]*\/>/gs, '');

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

  const sampleData = JSON.parse(fs.readFileSync('src/data/sample_report.json', 'utf-8'));
  const { rawValues } = sampleData;
  const valuesMap = {};
  valuesMap[7] = rawValues.count_total;
  valuesMap[8] = rawValues.count_noi;
  valuesMap[9] = rawValues.total_ngay_noi;
  valuesMap[10] = rawValues.bq_ngay_noi;
  valuesMap[11] = rawValues.ty_le_noi;
  valuesMap[13] = rawValues.cls_count_noi['Số lượt xét nghiệm'] || 0;
  valuesMap[14] = rawValues.cls_count_noi['Số lượt chụp X-Quang'] || 0;
  valuesMap[15] = rawValues.cls_count_noi['Số lượt siêu âm'] || 0;
  valuesMap[16] = rawValues.cls_count_noi['Số lượt chụp CT/MRI'] || 0;
  valuesMap[17] = rawValues.count_ngoai;
  valuesMap[19] = rawValues.cls_count_ngoai['Số lượt xét nghiệm'] || 0;
  valuesMap[20] = rawValues.cls_count_ngoai['Số lượt chụp X-Quang'] || 0;
  valuesMap[21] = rawValues.cls_count_ngoai['Số lượt siêu âm'] || 0;
  valuesMap[22] = rawValues.cls_count_ngoai['Số lượt chụp CT/MRI'] || 0;
  valuesMap[24] = rawValues.tong_chi_noi + rawValues.tong_chi_ngoai;
  valuesMap[25] = rawValues.tong_chi_noi;
  valuesMap[26] = rawValues.tong_chi_ngoai;
  valuesMap[28] = Math.round(rawValues.tong_chi_noi / rawValues.count_noi);
  valuesMap[29] = Math.round(rawValues.tong_chi_ngoai / rawValues.count_ngoai);
  valuesMap[31] = rawValues.tong_chi_noi;
  valuesMap[32] = rawValues.kham_noi;
  valuesMap[33] = rawValues.giuong_noi;
  valuesMap[34] = rawValues.xn_noi;
  valuesMap[35] = rawValues.dvkt_cost_noi['Hóa sinh:'] || 0;
  valuesMap[36] = rawValues.dvkt_cost_noi['Huyết học:'] || 0;
  valuesMap[37] = rawValues.dvkt_cost_noi['Vi sinh:'] || 0;
  valuesMap[38] = rawValues.dvkt_cost_noi['Giải phẫu bệnh:'] || 0;
  valuesMap[39] = rawValues.dvkt_cost_noi['Xét nghiệm khác:'] || 0;
  valuesMap[40] = rawValues.cdha_noi;
  valuesMap[41] = rawValues.dvkt_cost_noi['X-Quang:'] || 0;
  valuesMap[42] = rawValues.dvkt_cost_noi['Chụp cắt lớp vi tính/CT:'] || 0;
  valuesMap[43] = rawValues.dvkt_cost_noi['Chụp cộng hưởng từ/MRI:'] || 0;
  valuesMap[44] = rawValues.dvkt_cost_noi['Siêu âm:'] || 0;
  valuesMap[45] = rawValues.dvkt_cost_noi['Nội soi Tiêu hóa:'] || 0;
  valuesMap[46] = rawValues.dvkt_cost_noi['Nội soi Tai - Mũi - Họng:'] || 0;
  valuesMap[47] = rawValues.dvkt_cost_noi['Khác:'] || 0;
  valuesMap[48] = rawValues.thuoc_noi;
  valuesMap[49] = rawValues.drug_cost_noi['Tiền thuốc kháng sinh'] || 0;
  valuesMap[50] = rawValues.drug_cost_noi['Tiền thuốc ung thư'] || 0;
  valuesMap[51] = rawValues.drug_cost_noi['Tiền thuốc Corticoid'] || 0;
  valuesMap[52] = rawValues.drug_cost_noi['Tiền dịch truyền'] || 0;
  valuesMap[53] = rawValues.drug_cost_noi['Tiền thuốc Vitamin'] || 0;
  valuesMap[54] = rawValues.drug_cost_noi['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0;
  valuesMap[55] = rawValues.drug_cost_noi['Tiền thuốc khác'] || 0;
  valuesMap[56] = rawValues.mau_noi;
  valuesMap[57] = rawValues.pttt_noi;
  valuesMap[58] = rawValues.dvkt_cost_noi['Loại đặc biệt:'] || 0;
  valuesMap[59] = rawValues.dvkt_cost_noi['Loại I:'] || 0;
  valuesMap[60] = rawValues.dvkt_cost_noi['Loại II:'] || 0;
  valuesMap[61] = rawValues.dvkt_cost_noi['Loại III:'] || 0;
  valuesMap[62] = rawValues.dvkt_cost_noi['PTTT loại khác'] || 0;
  valuesMap[63] = rawValues.vtyt_noi;
  valuesMap[64] = 0;
  valuesMap[65] = rawValues.tong_chi_ngoai;
  valuesMap[66] = rawValues.kham_ngoai;
  valuesMap[67] = rawValues.giuong_ngoai;
  valuesMap[68] = rawValues.xn_ngoai;
  valuesMap[69] = rawValues.dvkt_cost_ngoai['Hóa sinh:'] || 0;
  valuesMap[70] = rawValues.dvkt_cost_ngoai['Huyết học:'] || 0;
  valuesMap[71] = rawValues.dvkt_cost_ngoai['Vi sinh:'] || 0;
  valuesMap[72] = rawValues.dvkt_cost_ngoai['Giải phẫu bệnh:'] || 0;
  valuesMap[73] = rawValues.dvkt_cost_ngoai['Xét nghiệm khác:'] || 0;
  valuesMap[74] = rawValues.cdha_ngoai;
  valuesMap[75] = rawValues.dvkt_cost_ngoai['X-Quang:'] || 0;
  valuesMap[76] = rawValues.dvkt_cost_ngoai['Chụp cắt lớp vi tính/CT:'] || 0;
  valuesMap[77] = rawValues.dvkt_cost_ngoai['Chụp cộng hưởng từ/MRI:'] || 0;
  valuesMap[78] = rawValues.dvkt_cost_ngoai['Siêu âm:'] || 0;
  valuesMap[79] = rawValues.dvkt_cost_ngoai['Nội soi Tiêu hóa:'] || 0;
  valuesMap[80] = rawValues.dvkt_cost_ngoai['Nội soi Tai - Mũi - Họng:'] || 0;
  valuesMap[81] = rawValues.dvkt_cost_ngoai['Khác:'] || 0;
  valuesMap[82] = rawValues.thuoc_ngoai;
  valuesMap[83] = rawValues.drug_cost_ngoai['Tiền thuốc kháng sinh'] || 0;
  valuesMap[84] = rawValues.drug_cost_ngoai['Tiền thuốc ung thư'] || 0;
  valuesMap[85] = rawValues.drug_cost_ngoai['Tiền thuốc Corticoid'] || 0;
  valuesMap[86] = rawValues.drug_cost_ngoai['Tiền dịch truyền'] || 0;
  valuesMap[87] = rawValues.drug_cost_ngoai['Tiền thuốc Vitamin'] || 0;
  valuesMap[88] = rawValues.drug_cost_ngoai['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0;
  valuesMap[89] = rawValues.drug_cost_ngoai['Tiền thuốc khác'] || 0;
  valuesMap[90] = rawValues.mau_ngoai;
  valuesMap[91] = rawValues.pttt_ngoai;
  valuesMap[92] = rawValues.dvkt_cost_ngoai['Loại đặc biệt:'] || 0;
  valuesMap[93] = rawValues.dvkt_cost_ngoai['Loại I:'] || 0;
  valuesMap[94] = rawValues.dvkt_cost_ngoai['Loại II:'] || 0;
  valuesMap[95] = rawValues.dvkt_cost_ngoai['Loại III:'] || 0;
  valuesMap[96] = rawValues.dvkt_cost_ngoai['PTTT loại khác'] || 0;
  valuesMap[97] = rawValues.vtyt_ngoai;
  valuesMap[98] = 0;
  valuesMap[99] = rawValues.total_bhtt_noi + rawValues.total_bhtt_ngoai;
  valuesMap[100] = rawValues.total_bhtt_ngoai;
  valuesMap[101] = rawValues.total_bhtt_noi;
  valuesMap[102] = 0;
  valuesMap[103] = 0;
  valuesMap[104] = 0;
  valuesMap[105] = 0;
  valuesMap[106] = 0;
  valuesMap[107] = 0;

  for (let r = 6; r <= 107; r++) {
    const rowRegex = new RegExp(`(<row r="${r}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
    const rowMatch = sheetXml.match(rowRegex);
    if (!rowMatch) continue;

    const rowStart = rowMatch[1];
    let rowContent = rowMatch[2];
    const rowEnd = rowMatch[3];

    const val = valuesMap[r];
    const formula = FORMULA_OVERRIDES[r];

    const cellDRegex = new RegExp(`(<c r="D${r}"[^>]*?\\/>)|(<c r="D${r}"[^>]*?>[\\s\\S]*?<\\/c>)`);
    const dMatch = rowContent.match(cellDRegex);

    let styleAttr = '';
    if (dMatch) {
      const fullCell = dMatch[0];
      const sMatch = fullCell.match(/s="(\d+)"/);
      if (sMatch) styleAttr = ` s="${sMatch[1]}"`;
    } else {
      if (r === 7 || r === 24 || r === 65 || r === 99 || r === 102 || r === 105) styleAttr = ' s="13"';
      else if (r === 10) styleAttr = ' s="43"';
      else if (r === 11) styleAttr = ' s="44"';
      else styleAttr = ' s="41"';
    }

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

    if (dMatch) {
      rowContent = rowContent.replace(cellDRegex, () => newCellXml);
    } else {
      const eMatch = rowContent.match(new RegExp(`<c r="E${r}"`));
      if (eMatch && eMatch.index !== undefined) {
        rowContent = rowContent.slice(0, eMatch.index) + newCellXml + rowContent.slice(eMatch.index);
      } else {
        rowContent = rowContent + newCellXml;
      }
    }

    // USE FUNCTION REPLACEMENT TO AVOID $1, $2 TOKEN CORRUPTION!
    sheetXml = sheetXml.replace(rowRegex, () => `${rowStart}${rowContent}${rowEnd}`);
  }

  // Update header title in A1
  const a1RowRegex = /(<row r="1"[^>]*>)([\s\S]*?)(<\/row>)/;
  const a1RowMatch = sheetXml.match(a1RowRegex);
  if (a1RowMatch) {
    const a1CellRegex = /(<c r="A1"[^>]*?\/>)|(<c r="A1"[^>]*?>[\s\S]*?<\/c>)/;
    const newA1 = `<c r="A1" s="47" t="inlineStr"><is><t>BÁO CÁO THÁNG 1</t></is></c>`;
    const updatedRow1 = a1RowMatch[2].replace(a1CellRegex, () => newA1);
    sheetXml = sheetXml.replace(a1RowRegex, () => `${a1RowMatch[1]}${updatedRow1}${a1RowMatch[3]}`);
  }

  // Force Excel to calculate all formulas on open
  let wbXml = await zip.file('xl/workbook.xml').async('text');
  if (wbXml.includes('<calcPr')) {
    wbXml = wbXml.replace(/<calcPr[^>]*\/>|<calcPr[^>]*>.*?<\/calcPr>/s, '<calcPr calcId="191029" fullCalcOnLoad="1"/>');
  } else {
    wbXml = wbXml.replace('</workbook>', '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>');
  }
  zip.file('xl/workbook.xml', wbXml);

  // Remove calcChain.xml and its relationships to avoid "Removed Records: Formula from /xl/calcChain.xml"
  zip.remove('xl/calcChain.xml');

  let contentTypes = await zip.file('[Content_Types].xml').async('text');
  contentTypes = contentTypes.replace(/<Override[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '');
  zip.file('[Content_Types].xml', contentTypes);

  let wbRels = await zip.file('xl/_rels/workbook.xml.rels').async('text');
  wbRels = wbRels.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/g, '');
  zip.file('xl/_rels/workbook.xml.rels', wbRels);

  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  const outPath = 'C:/Users/Admin/Downloads/Bao_cao_KCB_BHYT_Thang_1_2026.xlsx';
  fs.writeFileSync(outPath, outBuf);
  console.log('Clean export generated successfully at:', outPath);

  // Inspect XML validity of sheet1.xml
  const checkZip = await JSZip.loadAsync(outBuf);
  const checkXml = await checkZip.file('xl/worksheets/sheet1.xml').async('text');
  console.log('Contains $G<row?', checkXml.includes('$G<row'));
  console.log('Contains any unclosed <f>?', /<f>[^<]*<[a-z]/i.test(checkXml));

  // Check XML parsing with DOM
  try {
    const { XMLParser } = require('fast-xml-parser');
    // If fast-xml-parser exists
  } catch (e) {
    // Check with standard regex for tag balance
    const openTags = (checkXml.match(/<[a-zA-Z0-9]+(?:\s[^>]*?)?(?<!\/)>/g) || []).length;
    const closeTags = (checkXml.match(/<\/[a-zA-Z0-9]+>/g) || []).length;
    console.log(`Open tags: ${openTags}, Close tags: ${closeTags}, diff: ${openTags - closeTags}`);
  }
}

testCleanExport();
