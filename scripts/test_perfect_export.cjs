const fs = require('fs');
const JSZip = require('jszip');
const XLSX = require('xlsx');

// Formulas for column D
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

async function generatePerfectReport(templateBuffer, rowValues, month = 1) {
  const zip = await JSZip.loadAsync(templateBuffer);
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  // Parse rows from sheetXml
  // For each row R from 6 to 107:
  for (let r = 6; r <= 107; r++) {
    const val = rowValues[r];
    const formula = formulaOverrides[r];

    // Regex to match cell D in row r
    // e.g. <c r="D8" ...>...</c> or <c r="D8" .../>
    const cellRegex = new RegExp(`(<c r="D${r}"[^>]*>)(.*?)(<\\/c>)|(<c r="D${r}"[^>]*\\/>)`, 's');
    const match = sheetXml.match(cellRegex);

    if (match) {
      const fullCell = match[0];
      // Extract existing style 's' attribute if present
      const sMatch = fullCell.match(/s="(\d+)"/);
      const styleAttr = sMatch ? ` s="${sMatch[1]}"` : '';

      let newCellXml = '';
      if (formula && val !== undefined && val !== null) {
        newCellXml = `<c r="D${r}"${styleAttr}><f>${formula}</f><v>${val}</v></c>`;
      } else if (formula) {
        newCellXml = `<c r="D${r}"${styleAttr}><f>${formula}</f><v>0</v></c>`;
      } else if (val !== undefined && val !== null && val !== '') {
        // Special case: row 11 percentage
        let numVal = val;
        if (r === 11 && typeof val === 'number' && val > 1) {
          // If in percent 0-100, excel percentage format expects 0-1
          numVal = val / 100;
        }
        newCellXml = `<c r="D${r}"${styleAttr}><v>${numVal}</v></c>`;
      } else {
        newCellXml = `<c r="D${r}"${styleAttr}/>`;
      }

      sheetXml = sheetXml.replace(cellRegex, newCellXml);
    }
  }

  // Update cell A1 for month title: replace <c r="A1" ...>...</c> with inlineStr
  const a1Regex = /(<c r="A1"[^>]*>)(.*?)(<\/c>)|(<c r="A1"[^>]*\/>)/s;
  const a1Match = sheetXml.match(a1Regex);
  if (a1Match) {
    const sMatch = a1Match[0].match(/s="(\d+)"/);
    const styleAttr = sMatch ? ` s="${sMatch[1]}"` : ' s="47"';
    sheetXml = sheetXml.replace(a1Regex, `<c r="A1"${styleAttr} t="inlineStr"><is><t>BÁO CÁO THÁNG ${month}</t></is></c>`);
  }

  zip.file('xl/worksheets/sheet1.xml', sheetXml);
  return await zip.generateAsync({ type: 'nodebuffer' });
}

async function run() {
  const templateBuf = fs.readFileSync('C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx');
  
  // Sample calculated values from reportData
  const sampleValues = {
    7: 7864,
    8: 1712,
    9: 9094,
    10: 5.31,
    11: 21.77,
    13: 18707,
    14: 1204,
    15: 1313,
    16: 636,
    17: 6152,
    19: 15355,
    20: 1774,
    21: 3669,
    22: 0,
    24: 11382134056,
    25: 9386862015,
    26: 1995272041,
    28: 5482980,
    29: 324329,
    31: 9386862015,
    32: 0,
    33: 1515286500,
    34: 494000300,
    35: 472658800,
    36: 18721500,
    37: 0,
    38: 2620000,
    39: 0,
    40: 3824041180,
    41: 1714102980,
    42: 124500000,
    43: 0,
    44: 512000000,
    45: 84000000,
    46: 0,
    47: 1389438200,
    48: 104523000,
    56: 0,
    57: 1948831035,
    58: 124500000,
    59: 612000000,
    60: 712331035,
    61: 500000000,
    62: 0,
    63: 1500180000,
    64: 0,
    65: 1995272041,
    66: 193788000,
    67: 0,
    68: 562140000,
    69: 388140000,
    70: 162000000,
    71: 12000000,
    72: 0,
    73: 0,
    74: 673544041,
    75: 312544041,
    76: 12000000,
    77: 0,
    78: 89000000,
    79: 15000000,
    80: 0,
    81: 245000000,
    82: 0,
    90: 0,
    91: 0,
    92: 0,
    93: 0,
    94: 0,
    95: 0,
    96: 0,
    97: 565800000,
    98: 0,
    99: 10729798056,
    100: 1878345000,
    101: 8851453056,
    102: 0,
    103: 0,
    104: 0,
    105: 0,
    106: 0,
    107: 0
  };

  const outBuf = await generatePerfectReport(templateBuf, sampleValues, 1);
  const outPath = 'C:/Users/Admin/Downloads/Bao_cao_KCB_BHYT_Thang_1_2026_ChuanMau.xlsx';
  fs.writeFileSync(outPath, outBuf);
  console.log('Saved to:', outPath);

  // Now verify with XLSX reader
  const wbCheck = XLSX.readFile(outPath, { cellStyles: true, bookFiles: true });
  console.log('Check sheet names:', wbCheck.SheetNames);
  const sheetCheck = wbCheck.Sheets[wbCheck.SheetNames[0]];
  console.log('D7:', sheetCheck['D7']);
  console.log('D8:', sheetCheck['D8']);
  console.log('D10:', sheetCheck['D10']);
  console.log('D11:', sheetCheck['D11']);
  console.log('D24:', sheetCheck['D24']);

  const stylesStr = Buffer.from(wbCheck.files['xl/styles.xml'].content).toString('utf-8');
  console.log('Includes Times New Roman?', stylesStr.includes('Times New Roman'));
  console.log('Check !merges:', sheetCheck['!merges']);
  console.log('Check !cols length:', sheetCheck['!cols'].length);
}

run();
