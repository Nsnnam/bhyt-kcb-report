import * as XLSX from 'xlsx';
import { ProcessedReportData } from '../types';

export function exportReportToExcel(reportData: ProcessedReportData): void {
  const { config, rows } = reportData;
  const wb = XLSX.utils.book_new();

  // Create worksheet data matrix
  const wsData: (string | number | null | { t: string; f?: string; v?: number | string })[][] = [];

  // Rows 1-4: Header
  wsData.push([config.title || `BÁO CÁO THÁNG ${config.month}`, '', '', '', '']);
  wsData.push([config.subtitle || 'Hoạt động khám bệnh, chữa bệnh bảo hiểm y tế', '', '', '', '']);
  wsData.push([config.referenceDoc || '(Kèm theo Văn bản số         /SYT-BHYT&CNTT của Sở Y tế)', '', '', '', '']);
  wsData.push(['', '', '', '', '']);

  // Row 5: Column Headers
  wsData.push(['Stt', 'Nội dung', 'ĐVT', 'Số liệu', 'Ghi chú']);

  // Row mapping for formulas (Excel 1-indexed)
  // Row 5 is header, so row_id 6 is Excel row 6, row_id 7 is Excel row 7, etc.
  const formulaOverrides: Record<number, string> = {
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
    105: 'D106+D107',
  };

  for (const r of rows) {
    const f = formulaOverrides[r.row_id];
    let cellD: unknown = r.so_lieu;
    if (f) {
      cellD = { t: 'n', f, v: r.so_lieu !== null ? r.so_lieu : 0 };
    } else if (r.so_lieu === null) {
      cellD = '';
    }

    wsData.push([
      r.stt,
      r.noi_dung,
      r.dvt,
      cellD as string | number | null,
      r.ghi_chu || ''
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // A: Stt
    { wch: 64 }, // B: Nội dung
    { wch: 10 }, // C: ĐVT
    { wch: 26 }, // D: Số liệu
    { wch: 30 }  // E: Ghi chú
  ];

  // Apply number formatting to column D
  for (let r = 6; r <= 107; r++) {
    const cellRef = `D${r}`;
    if (ws[cellRef]) {
      const cell = ws[cellRef];
      if (r === 11) {
        cell.z = '0.00%';
      } else if (r === 10) {
        cell.z = '0.00';
      } else if (typeof cell.v === 'number') {
        cell.z = '#,##0';
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Lại theo tổng chi');

  // Also include Cross-Check sheet if report7980 was provided
  if (reportData.crossCheckResults.length > 0) {
    const checkData: (string | number)[][] = [
      ['BẢNG ĐỐI CHIẾU DỮ LIỆU XML VỚI BÁO CÁO 79/80'],
      ['Chỉ tiêu', 'XML Nội trú', '79/80 Nội trú', 'Chênh lệch Nội', 'XML Ngoại trú', '79/80 Ngoại trú', 'Chênh lệch Ngoại', 'XML Tổng', '79/80 Tổng', 'Tổng chênh lệch', 'Trạng thái']
    ];

    for (const c of reportData.crossCheckResults) {
      checkData.push([
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
        c.status === 'MATCH' ? 'Khớp' : 'Lệch'
      ]);
    }
    const wsCheck = XLSX.utils.aoa_to_sheet(checkData);
    wsCheck['!cols'] = [
      { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
      { wch: 18 }, { wch: 18 }, { wch: 16 },
      { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsCheck, 'Đối chiếu 79-80');
  }

  // Generate file download
  const fileName = `Bao_cao_KCB_BHYT_Thang_${config.month}_${config.year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
