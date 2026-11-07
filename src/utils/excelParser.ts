import * as XLSX from 'xlsx';
import { DrugItem, DVKTItem, UploadedFileMetadata } from '../types';

export interface ParsedXML1Row {
  ma_lk: string;
  ma_bn?: string;
  ma_loai_kcb: string;
  so_ngay_dtri: number;
  t_bhtt: number;
  t_tongchi_bv?: number;
}

export interface ParsedXML2Row {
  ma_lk: string;
  ma_thuoc: string;
  so_luong: number;
  thanh_tien_bv: number;
  thanh_tien_bh: number;
  t_bhtt: number;
}

export interface ParsedXML3Row {
  ma_lk: string;
  ma_dich_vu: string;
  ma_vat_tu: string;
  so_luong: number;
  thanh_tien_bv: number;
  thanh_tien_bh: number;
  t_bhtt: number;
}

export interface Parsed7980Row {
  ma_bn: string;
  ma_loai_kcb: string;
  t_tongchi: number;
  t_xn: number;
  t_cdha: number;
  t_thuoc: number;
  t_mau: number;
  t_pttt: number;
  t_vtyt: number;
  t_kham: number;
  t_giuong: number;
  t_vchuyen: number;
  t_bntt: number;
  t_bhtt: number;
}

export function detectFileType(fileName: string, headerCols: string[]): UploadedFileMetadata['detectedType'] {
  const name = fileName.toLowerCase();
  
  if (name.includes('xml1')) return 'XML1';
  if (name.includes('xml2')) return 'XML2';
  if (name.includes('xml3')) return 'XML3';
  if (name.includes('7980') || name.includes('79_80') || name.includes('guibhxh') || name.includes('report_79')) return 'REPORT_79_80';
  if (name.includes('thuoc') || name.includes('thuốc')) return 'CATALOG_THUOC';
  if (name.includes('dvkt')) return 'CATALOG_DVKT';

  // Fallback to headers
  const hSet = new Set(headerCols.map(h => String(h || '').trim().toUpperCase()));
  if (hSet.has('MA_LOAI_KCB') && hSet.has('SO_NGAY_DTRI')) return 'XML1';
  if (hSet.has('MA_THUOC') && (hSet.has('THANH_TIEN_BV') || hSet.has('DUONG_DUNG'))) return 'XML2';
  if (hSet.has('MA_DICH_VU') && hSet.has('MA_VAT_TU')) return 'XML3';
  if (hSet.has('MA_LOAIKCB') && hSet.has('T_TONGCHI')) return 'REPORT_79_80';
  if (hSet.has('MA_THUOC') && hSet.has('TEN_HOAT_CHAT')) return 'CATALOG_THUOC';
  if (hSet.has('MÃ KỸ THUẬT') || (hSet.has('MA_DICH_VU') && hSet.has('MỨC GIÁ'))) return 'CATALOG_DVKT';

  return 'UNKNOWN';
}

function safeFloat(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/,/g, '').trim();
  const f = parseFloat(str);
  return isNaN(f) ? 0 : f;
}

export function parseExcelWorkbook(data: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(data, {
    type: 'array',
    cellFormula: false,
    cellHTML: false,
    dense: true
  });
}

export function parseXML1Sheet(sheet: XLSX.WorkSheet): ParsedXML1Row[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const result: ParsedXML1Row[] = [];
  
  for (const r of rows) {
    const ma_lk = String(r['MA_LK'] || '').trim();
    if (!ma_lk) continue;
    
    result.push({
      ma_lk,
      ma_bn: String(r['MA_BN'] || '').trim(),
      ma_loai_kcb: String(r['MA_LOAI_KCB'] || '').trim(),
      so_ngay_dtri: safeFloat(r['SO_NGAY_DTRI']),
      t_bhtt: safeFloat(r['T_BHTT']),
      t_tongchi_bv: safeFloat(r['T_TONGCHI_BV'])
    });
  }
  return result;
}

export function parseXML2Sheet(sheet: XLSX.WorkSheet): ParsedXML2Row[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const result: ParsedXML2Row[] = [];
  
  for (const r of rows) {
    const ma_lk = String(r['MA_LK'] || '').trim();
    if (!ma_lk || ma_lk.startsWith('=')) continue;
    
    result.push({
      ma_lk,
      ma_thuoc: String(r['MA_THUOC'] || '').trim(),
      so_luong: safeFloat(r['SO_LUONG']),
      thanh_tien_bv: safeFloat(r['THANH_TIEN_BV']),
      thanh_tien_bh: safeFloat(r['THANH_TIEN_BH']),
      t_bhtt: safeFloat(r['T_BHTT'])
    });
  }
  return result;
}

export function parseXML3Sheet(sheet: XLSX.WorkSheet): ParsedXML3Row[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const result: ParsedXML3Row[] = [];
  
  for (const r of rows) {
    const ma_lk = String(r['MA_LK'] || '').trim();
    if (!ma_lk || ma_lk.startsWith('=')) continue;
    
    result.push({
      ma_lk,
      ma_dich_vu: String(r['MA_DICH_VU'] || '').trim(),
      ma_vat_tu: String(r['MA_VAT_TU'] || '').trim(),
      so_luong: safeFloat(r['SO_LUONG']),
      thanh_tien_bv: safeFloat(r['THANH_TIEN_BV']),
      thanh_tien_bh: safeFloat(r['THANH_TIEN_BH']),
      t_bhtt: safeFloat(r['T_BHTT'])
    });
  }
  return result;
}

export function parse7980Sheet(sheet: XLSX.WorkSheet): Parsed7980Row[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const result: Parsed7980Row[] = [];
  
  for (const r of rows) {
    const ma_bn = String(r['MA_BN'] || r['MA_BA'] || '').trim();
    if (!ma_bn) continue;
    
    result.push({
      ma_bn,
      ma_loai_kcb: String(r['MA_LOAIKCB'] || r['MA_LOAI_KCB'] || '').trim(),
      t_tongchi: safeFloat(r['T_TONGCHI']),
      t_xn: safeFloat(r['T_XN']),
      t_cdha: safeFloat(r['T_CDHA']),
      t_thuoc: safeFloat(r['T_THUOC']),
      t_mau: safeFloat(r['T_MAU']),
      t_pttt: safeFloat(r['T_PTTT']),
      t_vtyt: safeFloat(r['T_VTYT']),
      t_kham: safeFloat(r['T_KHAM']),
      t_giuong: safeFloat(r['T_GIUONG']),
      t_vchuyen: safeFloat(r['T_VCHUYEN']),
      t_bntt: safeFloat(r['T_BNTT']),
      t_bhtt: safeFloat(r['T_BHTT'])
    });
  }
  return result;
}

export function parseDrugCatalogSheet(sheet: XLSX.WorkSheet): DrugItem[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map(h => String(h || '').trim());
  const maThuocIdx = headers.findIndex(h => h.toUpperCase() === 'MA_THUOC');
  const hoatChatIdx = headers.findIndex(h => h.toUpperCase() === 'TEN_HOAT_CHAT');
  const tenThuocIdx = headers.findIndex(h => h.toUpperCase() === 'TEN_THUOC');
  const nhomBvIdx = headers.findIndex(h => h.toUpperCase() === 'NHOM_THUOC');
  const dvtIdx = headers.findIndex(h => h.toUpperCase() === 'DON_VI_TINH');
  const hamLuongIdx = headers.findIndex(h => h.toUpperCase() === 'HAM_LUONG');
  const duongDungIdx = headers.findIndex(h => h.toUpperCase() === 'DUONG_DUNG');
  const sdkIdx = headers.findIndex(h => h.toUpperCase() === 'SO_DANG_KY');
  const giaBhIdx = headers.findIndex(h => h.toUpperCase() === 'DON_GIA_BH');
  
  // Col AJ is usually index 35 or header 'Nhóm thuốc' / 'nhom_bao_cao'
  let nhomBcIdx = headers.findIndex(h => h.toLowerCase().includes('nhóm thuốc') || h.toLowerCase().includes('nhom_bao_cao'));
  if (nhomBcIdx === -1 && headers.length > 35) {
    nhomBcIdx = 35; // Column AJ
  }

  const result: DrugItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.length === 0) continue;
    const code = String(row[maThuocIdx !== -1 ? maThuocIdx : 1] || '').trim();
    if (!code) continue;

    result.push({
      ma_thuoc: code,
      ten_hoat_chat: hoatChatIdx !== -1 ? String(row[hoatChatIdx] || '').trim() : '',
      ten_thuoc: tenThuocIdx !== -1 ? String(row[tenThuocIdx] || '').trim() : '',
      nhom_bv: nhomBvIdx !== -1 ? String(row[nhomBvIdx] || '').trim() : '',
      don_vi_tinh: dvtIdx !== -1 ? String(row[dvtIdx] || '').trim() : '',
      ham_luong: hamLuongIdx !== -1 ? String(row[hamLuongIdx] || '').trim() : '',
      duong_dung: duongDungIdx !== -1 ? String(row[duongDungIdx] || '').trim() : '',
      so_dang_ky: sdkIdx !== -1 ? String(row[sdkIdx] || '').trim() : '',
      don_gia_bh: giaBhIdx !== -1 ? safeFloat(row[giaBhIdx]) : 0,
      nhom_bao_cao: nhomBcIdx !== -1 ? String(row[nhomBcIdx] || '').trim() : 'Tiền thuốc khác'
    });
  }
  return result;
}

export function parseDVKTCatalogSheet(sheet: XLSX.WorkSheet): DVKTItem[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map(h => String(h || '').trim());
  let maDvIdx = headers.findIndex(h => h.includes('MA_DICH_VU') || h.includes('Mã DVKT'));
  if (maDvIdx === -1) maDvIdx = 3; // Column D

  let tenDvIdx = headers.findIndex(h => h.includes('Tên dịch vụ'));
  if (tenDvIdx === -1) tenDvIdx = 4; // Column E

  let giaIdx = headers.findIndex(h => h.includes('Mức giá'));
  if (giaIdx === -1) giaIdx = 6; // Column G

  let colTIdx = headers.findIndex(h => h.includes('SỐ LIỆU CHI PHÍ KCB BHYT') || h.includes('CHI PHÍ'));
  if (colTIdx === -1 && headers.length > 19) colTIdx = 19; // Column T

  let colUIdx = headers.findIndex(h => h.includes('Số liệu KCB BHYT') || h.includes('CLS'));
  if (colUIdx === -1 && headers.length > 20) colUIdx = 20; // Column U

  const result: DVKTItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.length === 0) continue;
    const code = String(row[maDvIdx] || '').trim();
    if (!code) continue;

    result.push({
      ma_dich_vu: code,
      ten_dich_vu: String(row[tenDvIdx] || '').trim(),
      gia: safeFloat(row[giaIdx]),
      nhom_chi_phi: colTIdx !== -1 ? String(row[colTIdx] || '').trim() : '',
      nhom_cls: colUIdx !== -1 ? String(row[colUIdx] || '').trim() : ''
    });
  }
  return result;
}
