import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { ProcessedReportData } from '../types';
import { TEMPLATE_FILE_7_BASE64 } from './templateBase64';

// Exact formulas defined for File 7
const FORMULA_OVERRIDES: Record<number, string> = {
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Xuất file Báo cáo KCB BHYT (File 7) CHUẨN 100% ĐỊNH DẠNG MẪU SỞ Y TẾ
 * Sử dụng trực tiếp phôi gốc của File 7 (bảo toàn 100% font Times New Roman,
 * cỡ chữ, viền kẻ bảng, căn lề, độ rộng cột, chiều cao hàng, merge tiêu đề và công thức Excel động).
 */
export async function exportReportToExcel(reportData: ProcessedReportData): Promise<void> {
  const { config, rows } = reportData;

  // 1. Load official template ZIP package
  const templateBuf = base64ToArrayBuffer(TEMPLATE_FILE_7_BASE64);
  const zip = await JSZip.loadAsync(templateBuf);

  // 2. Map row values
  const valuesMap: Record<number, number | string | null> = {};
  for (const r of rows) {
    valuesMap[r.row_id] = r.so_lieu;
  }

  // 3. Read sheet1.xml
  let sheetXml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');

  // 4. Update data and formulas in Column D (rows 6 to 107) while preserving cell styles (s="...")
  for (let r = 6; r <= 107; r++) {
    const val = valuesMap[r];
    const formula = FORMULA_OVERRIDES[r];

    const cellRegex = new RegExp(`(<c r="D${r}"[^>]*>)(.*?)(<\\/c>)|(<c r="D${r}"[^>]*\\/>)`, 's');
    const match = sheetXml.match(cellRegex);

    if (match) {
      const fullCell = match[0];
      const sMatch = fullCell.match(/s="(\d+)"/);
      const styleAttr = sMatch ? ` s="${sMatch[1]}"` : '';

      let numVal = val;
      // In Excel, percentage format 0% requires ratio 0.0 - 1.0
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

  // 5. Update header title in A1 with dynamic month
  const a1Regex = /(<c r="A1"[^>]*>)(.*?)(<\/c>)|(<c r="A1"[^>]*\/>)/s;
  const a1Match = sheetXml.match(a1Regex);
  if (a1Match) {
    const sMatch = a1Match[0].match(/s="(\d+)"/);
    const styleAttr = sMatch ? ` s="${sMatch[1]}"` : ' s="47"';
    sheetXml = sheetXml.replace(
      a1Regex,
      `<c r="A1"${styleAttr} t="inlineStr"><is><t>BÁO CÁO THÁNG ${config.month || 1}</t></is></c>`
    );
  }

  // 6. Force Excel to calculate all formulas upon opening
  let wbXml = await zip.file('xl/workbook.xml')!.async('text');
  if (wbXml.includes('<calcPr')) {
    wbXml = wbXml.replace(/<calcPr[^>]*\/>|<calcPr[^>]*>.*?<\/calcPr>/s, '<calcPr calcId="191029" fullCalcOnLoad="1"/>');
  } else {
    wbXml = wbXml.replace('</workbook>', '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>');
  }
  zip.file('xl/workbook.xml', wbXml);

  // 7. Save updated sheet1.xml
  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  // 8. Generate Excel file blob
  const outBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const fileName = `Bao_cao_KCB_BHYT_Thang_${config.month || 1}_${config.year || 2026}.xlsx`;

  // 9. Trigger browser download
  const url = URL.createObjectURL(outBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất riêng Bảng đối chiếu chéo XML vs 79/80a ra file Excel có định dạng chuyên nghiệp
 */
export function exportCrossCheckToExcel(reportData: ProcessedReportData): void {
  const { config, crossCheckResults } = reportData;
  const wb = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    [`BẢNG ĐỐI CHIẾU DỮ LIỆU XML1-2-3 VỚI BÁO CÁO 79/80a THÁNG ${config.month || 1}/${config.year || 2026}`],
    ['Đơn vị:', config.hospitalName || 'Bệnh viện Đa khoa'],
    ['Kỳ báo cáo:', `Tháng ${config.month || 1} năm ${config.year || 2026}`],
    [''],
    [
      'Chỉ tiêu chi phí',
      'XML Nội trú (đ)',
      '79/80 Nội trú (đ)',
      'Chênh lệch Nội (đ)',
      'XML Ngoại trú (đ)',
      '79/80 Ngoại trú (đ)',
      'Chênh lệch Ngoại (đ)',
      'XML Tổng cộng (đ)',
      '79/80 Tổng cộng (đ)',
      'Tổng chênh lệch (đ)',
      'Đánh giá'
    ]
  ];

  for (const c of crossCheckResults) {
    data.push([
      c.label,
      c.xml_noi,
      c.r4_noi,
      c.diff_noi,
      c.xml_ngoai,
      c.r4_ngoai,
      c.diff_ngoai,
      c.xml_total,
      c.r4_total,
      c.diff_total,
      c.status === 'MATCH' ? 'Khớp chính xác' : c.status === 'MISMATCH' ? 'Có chênh lệch' : 'Chưa có dữ liệu'
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Đối chiếu XML vs 79-80');
  const fileName = `Bang_doi_chieu_XML_vs_7980_Thang_${config.month || 1}_${config.year || 2026}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
