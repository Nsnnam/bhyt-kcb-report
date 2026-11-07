import {
  DrugItem,
  DVKTItem,
  ProcessedReportData,
  ReportConfig,
  ReportRow,
  CrossCheckItem,
  UnmappedItem
} from '../types';
import {
  ParsedXML1Row,
  ParsedXML2Row,
  ParsedXML3Row,
  Parsed7980Row
} from './excelParser';

export function calculateReport(
  xml1Rows: ParsedXML1Row[],
  xml2Rows: ParsedXML2Row[],
  xml3Rows: ParsedXML3Row[],
  report7980Rows: Parsed7980Row[],
  drugCatalog: DrugItem[],
  dvktCatalog: DVKTItem[],
  config: ReportConfig
): ProcessedReportData {
  // Build lookup maps
  const drugMap = new Map<string, string>();
  for (const d of drugCatalog) {
    if (d.ma_thuoc) {
      drugMap.set(d.ma_thuoc.trim().toUpperCase(), d.nhom_bao_cao || 'Tiền thuốc khác');
    }
  }

  const dvktCostMap = new Map<string, string>();
  const dvktClsMap = new Map<string, string>();
  for (const dv of dvktCatalog) {
    if (dv.ma_dich_vu) {
      const code = dv.ma_dich_vu.trim().toUpperCase();
      if (dv.nhom_chi_phi) dvktCostMap.set(code, dv.nhom_chi_phi.trim());
      if (dv.nhom_cls) dvktClsMap.set(code, dv.nhom_cls.trim());
    }
  }

  // 1. Process XML1 to partition MA_LK into Noi tru / Ngoai tru
  const noiLKs = new Set<string>();
  const ngoaiLKs = new Set<string>();
  let totalNgayNoi = 0;
  let totalBhttNoi = 0;
  let totalBhttNgoai = 0;

  for (const r of xml1Rows) {
    const lk = r.ma_lk.trim();
    const kcb = r.ma_loai_kcb.trim();

    if (kcb === '03' || kcb === '09') {
      noiLKs.add(lk);
      totalNgayNoi += r.so_ngay_dtri || 0;
      totalBhttNoi += r.t_bhtt || 0;
    } else if (kcb === '01' || kcb === '02' || kcb === '05' || kcb === '07') {
      ngoaiLKs.add(lk);
      totalBhttNgoai += r.t_bhtt || 0;
    }
  }

  const countNoi = noiLKs.size;
  const countNgoai = ngoaiLKs.size;
  const countTotal = countNoi + countNgoai;
  const bqNgayNoi = countNoi > 0 ? totalNgayNoi / countNoi : 0;
  const tyLeNoi = countTotal > 0 ? (countNoi / countTotal) * 100 : 0;

  // 2. Process XML3 (DVKT & CLS & VTYT)
  const clsCountNoi: Record<string, number> = {};
  const clsCountNgoai: Record<string, number> = {};
  const dvktCostNoi: Record<string, number> = {};
  const dvktCostNgoai: Record<string, number> = {};
  let vtytNoi = 0;
  let vtytNgoai = 0;

  const unmappedDVKTMap = new Map<string, { count: number; totalAmount: number }>();

  for (const r of xml3Rows) {
    const lk = r.ma_lk.trim();
    const isNoi = noiLKs.has(lk);
    const isNgoai = ngoaiLKs.has(lk);
    if (!isNoi && !isNgoai) continue;

    const dvCode = r.ma_dich_vu.trim().toUpperCase();
    const vtCode = r.ma_vat_tu.trim();
    const sl = r.so_luong || 0;
    const amount = r.thanh_tien_bv || 0;

    // Check VTYT (cột E MA_VAT_TU có mã)
    if (vtCode !== '') {
      if (isNoi) vtytNoi += amount;
      else if (isNgoai) vtytNgoai += amount;
    }

    if (dvCode !== '') {
      // CLS count check (Col U)
      const clsCat = dvktClsMap.get(dvCode);
      if (clsCat) {
        if (isNoi) clsCountNoi[clsCat] = (clsCountNoi[clsCat] || 0) + sl;
        else if (isNgoai) clsCountNgoai[clsCat] = (clsCountNgoai[clsCat] || 0) + sl;
      }

      // Cost check (Col T)
      const costCat = dvktCostMap.get(dvCode);
      if (costCat) {
        if (isNoi) dvktCostNoi[costCat] = (dvktCostNoi[costCat] || 0) + amount;
        else if (isNgoai) dvktCostNgoai[costCat] = (dvktCostNgoai[costCat] || 0) + amount;
      } else {
        const cur = unmappedDVKTMap.get(dvCode) || { count: 0, totalAmount: 0 };
        cur.count += 1;
        cur.totalAmount += amount;
        unmappedDVKTMap.set(dvCode, cur);
      }
    }
  }

  // 3. Process XML2 (Thuốc & Máu)
  const drugCostNoi: Record<string, number> = {};
  const drugCostNgoai: Record<string, number> = {};
  const unmappedDrugMap = new Map<string, { count: number; totalAmount: number }>();

  for (const r of xml2Rows) {
    const lk = r.ma_lk.trim();
    const isNoi = noiLKs.has(lk);
    const isNgoai = ngoaiLKs.has(lk);
    if (!isNoi && !isNgoai) continue;

    const drugCode = r.ma_thuoc.trim().toUpperCase();
    const amount = r.thanh_tien_bv || 0;
    const cat = drugMap.get(drugCode);

    if (cat) {
      if (isNoi) drugCostNoi[cat] = (drugCostNoi[cat] || 0) + amount;
      else if (isNgoai) drugCostNgoai[cat] = (drugCostNgoai[cat] || 0) + amount;
    } else {
      // Default to "Tiền thuốc khác" if not explicitly mapped, but record as unmapped
      const fallbackCat = 'Tiền thuốc khác';
      if (isNoi) drugCostNoi[fallbackCat] = (drugCostNoi[fallbackCat] || 0) + amount;
      else if (isNgoai) drugCostNgoai[fallbackCat] = (drugCostNgoai[fallbackCat] || 0) + amount;

      const cur = unmappedDrugMap.get(drugCode) || { count: 0, totalAmount: 0 };
      cur.count += 1;
      cur.totalAmount += amount;
      unmappedDrugMap.set(drugCode, cur);
    }
  }

  // Sub-aggregations for Nội trú
  const xnNoi =
    (dvktCostNoi['Hóa sinh:'] || 0) +
    (dvktCostNoi['Huyết học:'] || 0) +
    (dvktCostNoi['Vi sinh:'] || 0) +
    (dvktCostNoi['Giải phẫu bệnh:'] || 0) +
    (dvktCostNoi['Xét nghiệm khác:'] || 0);

  const cdhaNoi =
    (dvktCostNoi['X-Quang:'] || 0) +
    (dvktCostNoi['Chụp cắt lớp vi tính/CT:'] || 0) +
    (dvktCostNoi['Chụp cộng hưởng từ/MRI:'] || 0) +
    (dvktCostNoi['Siêu âm:'] || 0) +
    (dvktCostNoi['Nội soi Tiêu hóa:'] || 0) +
    (dvktCostNoi['Nội soi Tai - Mũi - Họng:'] || 0) +
    (dvktCostNoi['Khác:'] || 0);

  const thuocNoi =
    (drugCostNoi['Tiền thuốc kháng sinh'] || 0) +
    (drugCostNoi['Tiền thuốc ung thư'] || 0) +
    (drugCostNoi['Tiền thuốc Corticoid'] || 0) +
    (drugCostNoi['Tiền dịch truyền'] || 0) +
    (drugCostNoi['Tiền thuốc Vitamin'] || 0) +
    (drugCostNoi['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0) +
    (drugCostNoi['Tiền thuốc khác'] || 0);

  const mauNoi = drugCostNoi['Máu'] || 0;

  const ptttNoi =
    (dvktCostNoi['Loại đặc biệt:'] || 0) +
    (dvktCostNoi['Loại I:'] || 0) +
    (dvktCostNoi['Loại II:'] || 0) +
    (dvktCostNoi['Loại III:'] || 0) +
    (dvktCostNoi['PTTT loại khác'] || 0);

  const khamNoi = dvktCostNoi['Tiền khám'] || 0;
  const giuongNoi = dvktCostNoi['Tiền giường'] || 0;
  const vchuyenNoi = 0;

  const tongChiNoi =
    khamNoi + giuongNoi + xnNoi + cdhaNoi + thuocNoi + mauNoi + ptttNoi + vtytNoi + vchuyenNoi;

  // Sub-aggregations for Ngoại trú
  const xnNgoai =
    (dvktCostNgoai['Hóa sinh:'] || 0) +
    (dvktCostNgoai['Huyết học:'] || 0) +
    (dvktCostNgoai['Vi sinh:'] || 0) +
    (dvktCostNgoai['Giải phẫu bệnh:'] || 0) +
    (dvktCostNgoai['Xét nghiệm khác:'] || 0);

  const cdhaNgoai =
    (dvktCostNgoai['X-Quang:'] || 0) +
    (dvktCostNgoai['Chụp cắt lớp vi tính/CT:'] || 0) +
    (dvktCostNgoai['Chụp cộng hưởng từ/MRI:'] || 0) +
    (dvktCostNgoai['Siêu âm:'] || 0) +
    (dvktCostNgoai['Nội soi Tiêu hóa:'] || 0) +
    (dvktCostNgoai['Nội soi Tai - Mũi - Họng:'] || 0) +
    (dvktCostNgoai['Khác:'] || 0);

  const thuocNgoai =
    (drugCostNgoai['Tiền thuốc kháng sinh'] || 0) +
    (drugCostNgoai['Tiền thuốc ung thư'] || 0) +
    (drugCostNgoai['Tiền thuốc Corticoid'] || 0) +
    (drugCostNgoai['Tiền dịch truyền'] || 0) +
    (drugCostNgoai['Tiền thuốc Vitamin'] || 0) +
    (drugCostNgoai['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0) +
    (drugCostNgoai['Tiền thuốc khác'] || 0);

  const mauNgoai = drugCostNgoai['Máu'] || 0;

  const ptttNgoai =
    (dvktCostNgoai['Loại đặc biệt:'] || 0) +
    (dvktCostNgoai['Loại I:'] || 0) +
    (dvktCostNgoai['Loại II:'] || 0) +
    (dvktCostNgoai['Loại III:'] || 0) +
    (dvktCostNgoai['PTTT loại khác'] || 0);

  const khamNgoai = dvktCostNgoai['Tiền khám'] || 0;
  const giuongNgoai = 0;
  const vchuyenNgoai = 0;

  const tongChiNgoai =
    khamNgoai + giuongNgoai + xnNgoai + cdhaNgoai + thuocNgoai + mauNgoai + ptttNgoai + vtytNgoai + vchuyenNgoai;

  const tongChiToanVien = tongChiNoi + tongChiNgoai;
  const bqChiNoi = countNoi > 0 ? tongChiNoi / countNoi : 0;
  const bqChiNgoai = countNgoai > 0 ? tongChiNgoai / countNgoai : 0;

  // 4. Build exactly the ReportRow array matching rows 6 to 107 of File 7!
  const rows: ReportRow[] = [
    // Header
    { row_id: 6, stt: 'I', noi_dung: 'Số liệu KCB BHYT', dvt: '', so_lieu: null, ghi_chu: '', is_header: true, level: 0, formula_desc: '' },
    { row_id: 7, stt: '1', noi_dung: 'Tổng số lượt KCB BHYT (1= 1.1 + 1.2)', dvt: 'Lượt', so_lieu: countTotal, ghi_chu: '', is_summary: true, level: 1, formula_desc: '= 1.1 + 1.2' },
    { row_id: 8, stt: '1.1.', noi_dung: 'Tổng số lượt NB điều trị nội trú', dvt: 'Lượt', so_lieu: countNoi, ghi_chu: '', level: 2, formula_desc: 'Tổng số lượt XML1 cột MA_LOAI_KCB là 03 hoặc 09' },
    { row_id: 9, stt: '1.1.1', noi_dung: 'Tổng số ngày điều trị nội trú:', dvt: 'Ngày', so_lieu: totalNgayNoi, ghi_chu: '', level: 3, formula_desc: 'Tổng SO_NGAY_DTRI XML1 khi MA_LOAI_KCB là 03 hoặc 09' },
    { row_id: 10, stt: '1.1.2', noi_dung: 'Bình quân ngày điều trị nội trú:', dvt: 'Ngày', so_lieu: Math.round(bqNgayNoi * 100) / 100, ghi_chu: '', level: 3, formula_desc: '= 1.1.1 / 1.1' },
    { row_id: 11, stt: '1.1.3', noi_dung: 'Tỷ lệ vào điều trị nội trú:', dvt: '%', so_lieu: Math.round(tyLeNoi * 100) / 100, ghi_chu: '', level: 3, formula_desc: '= 1.1 / 1' },
    { row_id: 12, stt: '1.1.4', noi_dung: 'Hoạt động cận lâm sàng, gồm:', dvt: '', so_lieu: null, ghi_chu: '', level: 2, formula_desc: '' },
    { row_id: 13, stt: '1.1.4.1', noi_dung: 'Số lượt xét nghiệm', dvt: 'Lượt', so_lieu: clsCountNoi['Số lượt xét nghiệm'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, nội trú' },
    { row_id: 14, stt: '1.1.4.2', noi_dung: 'Số lượt chụp X-Quang', dvt: 'Lượt', so_lieu: clsCountNoi['Số lượt chụp X-Quang'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, nội trú' },
    { row_id: 15, stt: '1.1.4.3', noi_dung: 'Số lượt siêu âm', dvt: 'Lượt', so_lieu: clsCountNoi['Số lượt siêu âm'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, nội trú' },
    { row_id: 16, stt: '1.1.4.4', noi_dung: 'Số lượt chụp CT/MRI', dvt: 'Lượt', so_lieu: clsCountNoi['Số lượt chụp CT/MRI'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, nội trú' },
    { row_id: 17, stt: '1.2.', noi_dung: 'Tổng số lượt người bệnh khám, điều trị ngoại trú', dvt: 'Lượt', so_lieu: countNgoai, ghi_chu: '', level: 2, formula_desc: 'Tổng số lượt XML1 cột MA_LOAI_KCB là 01;02;05;07' },
    { row_id: 18, stt: '1.2.1', noi_dung: 'Hoạt động cận lâm sàng, gồm:', dvt: '', so_lieu: null, ghi_chu: '', level: 2, formula_desc: '' },
    { row_id: 19, stt: '1.2.1.1', noi_dung: 'Số lượt xét nghiệm', dvt: 'Lượt', so_lieu: clsCountNgoai['Số lượt xét nghiệm'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, ngoại trú' },
    { row_id: 20, stt: '1.2.1.2', noi_dung: 'Số lượt chụp X-Quang', dvt: 'Lượt', so_lieu: clsCountNgoai['Số lượt chụp X-Quang'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, ngoại trú' },
    { row_id: 21, stt: '1.2.1.3', noi_dung: 'Số lượt siêu âm', dvt: 'Lượt', so_lieu: clsCountNgoai['Số lượt siêu âm'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, ngoại trú' },
    { row_id: 22, stt: '1.2.1.4', noi_dung: 'Số lượt chụp CT/MRI', dvt: 'Lượt', so_lieu: clsCountNgoai['Số lượt chụp CT/MRI'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 cột M (Số lượng) tham chiếu DMKT cột U, ngoại trú' },

    // Section II
    { row_id: 23, stt: 'II', noi_dung: 'SỐ LIỆU CHI PHÍ KCB BHYT', dvt: '', so_lieu: null, ghi_chu: '', is_header: true, level: 0, formula_desc: '' },
    { row_id: 24, stt: '1', noi_dung: 'Tổng chi phí KCB BHYT tri trả (1= 1.1+1.2)', dvt: 'Đồng', so_lieu: tongChiToanVien, ghi_chu: '', is_summary: true, level: 1, formula_desc: '= Chi nội trú + Chi ngoại trú' },
    { row_id: 25, stt: '1.1.', noi_dung: 'Chi cho KCB nội trú: (1.1=3.1)', dvt: 'Đồng', so_lieu: tongChiNoi, ghi_chu: '', is_summary: true, level: 2, formula_desc: '= 3.1' },
    { row_id: 26, stt: '1.2.', noi_dung: 'Chi cho KCB ngoại trú: (1.2 =3.2)', dvt: 'Đồng', so_lieu: tongChiNgoai, ghi_chu: '', is_summary: true, level: 2, formula_desc: '= 3.2' },
    { row_id: 27, stt: '2', noi_dung: 'Chí phí Bình quân KCB BHYT (Tổng chi/số lượt)', dvt: 'Đồng', so_lieu: null, ghi_chu: '', level: 1, formula_desc: '' },
    { row_id: 28, stt: '2.1.', noi_dung: 'Chi phí BQ KCB Nội trú: (Tổng chi nội trú/Số lượt kcb nội trú)', dvt: 'Đồng', so_lieu: Math.round(bqChiNoi), ghi_chu: '', level: 2, formula_desc: '= Chi nội trú / Lượt nội trú' },
    { row_id: 29, stt: '2.2.', noi_dung: 'Chi phí BQ KCB Ngoại trú: (Tổng chi ngoại trú/số lượt kcb ngoại trú)', dvt: 'Đồng', so_lieu: Math.round(bqChiNgoai), ghi_chu: '', level: 2, formula_desc: '= Chi ngoại trú / Lượt ngoại trú' },
    { row_id: 30, stt: '3', noi_dung: 'Cơ cấu chi phí KCB BHYT', dvt: '', so_lieu: null, ghi_chu: '', level: 1, formula_desc: '' },
    { row_id: 31, stt: '3.1.', noi_dung: 'Cơ cấu chi cho KCB nội trú:(3.1 = 3.1.1+3.1.2+3.1.3+….+3.1.8=3.1.9)', dvt: 'Đồng', so_lieu: tongChiNoi, ghi_chu: '', is_summary: true, level: 2, formula_desc: '= Tổng các nhóm chi phí nội trú' },
    { row_id: 32, stt: '3.1.1', noi_dung: 'Tiền khám', dvt: 'Đồng', so_lieu: khamNoi, ghi_chu: '', level: 3, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Tiền khám", nội trú' },
    { row_id: 33, stt: '3.1.2', noi_dung: 'Tiền giường', dvt: 'Đồng', so_lieu: giuongNoi, ghi_chu: '', level: 3, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Tiền giường", nội trú' },
    { row_id: 34, stt: '3.1.3', noi_dung: 'Xét nghiệm:', dvt: 'Đồng', so_lieu: xnNoi, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.1.3.1 + ... + 3.1.3.5' },
    { row_id: 35, stt: '3.1.3.1', noi_dung: 'Hóa sinh:', dvt: 'Đồng', so_lieu: dvktCostNoi['Hóa sinh:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Hóa sinh:", nội trú' },
    { row_id: 36, stt: '3.1.3.2', noi_dung: 'Huyết học:', dvt: 'Đồng', so_lieu: dvktCostNoi['Huyết học:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Huyết học:", nội trú' },
    { row_id: 37, stt: '3.1.3.3', noi_dung: 'Vi sinh:', dvt: 'Đồng', so_lieu: dvktCostNoi['Vi sinh:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Vi sinh:", nội trú' },
    { row_id: 38, stt: '3.1.3.4', noi_dung: 'Giải phẫu bệnh:', dvt: 'Đồng', so_lieu: dvktCostNoi['Giải phẫu bệnh:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Giải phẫu bệnh:", nội trú' },
    { row_id: 39, stt: '3.1.3.5', noi_dung: 'Xét nghiệm khác:', dvt: 'Đồng', so_lieu: dvktCostNoi['Xét nghiệm khác:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Xét nghiệm khác:", nội trú' },
    { row_id: 40, stt: '3.1.4', noi_dung: 'Chẩn đoán hình ảnh:', dvt: 'Đồng', so_lieu: cdhaNoi, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.1.4.1 + ... + 3.1.4.7' },
    { row_id: 41, stt: '3.1.4.1', noi_dung: 'X-Quang:', dvt: 'Đồng', so_lieu: dvktCostNoi['X-Quang:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "X-Quang:", nội trú' },
    { row_id: 42, stt: '3.1.4.2', noi_dung: 'Chụp cắt lớp vi tính/CT:', dvt: 'Đồng', so_lieu: dvktCostNoi['Chụp cắt lớp vi tính/CT:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Chụp cắt lớp vi tính/CT:", nội trú' },
    { row_id: 43, stt: '3.1.4.3', noi_dung: 'Chụp cộng hưởng từ/MRI:', dvt: 'Đồng', so_lieu: dvktCostNoi['Chụp cộng hưởng từ/MRI:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Chụp cộng hưởng từ/MRI:", nội trú' },
    { row_id: 44, stt: '3.1.4.4', noi_dung: 'Siêu âm:', dvt: 'Đồng', so_lieu: dvktCostNoi['Siêu âm:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Siêu âm:", nội trú' },
    { row_id: 45, stt: '3.1.4.5', noi_dung: 'Nội soi Tiêu hóa:', dvt: 'Đồng', so_lieu: dvktCostNoi['Nội soi Tiêu hóa:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Nội soi Tiêu hóa:", nội trú' },
    { row_id: 46, stt: '3.1.4.6', noi_dung: 'Nội soi Tai - Mũi - Họng:', dvt: 'Đồng', so_lieu: dvktCostNoi['Nội soi Tai - Mũi - Họng:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Nội soi Tai - Mũi - Họng:", nội trú' },
    { row_id: 47, stt: '3.1.4.7', noi_dung: 'Khác:', dvt: 'Đồng', so_lieu: dvktCostNoi['Khác:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Khác:", nội trú' },
    { row_id: 48, stt: '3.1.5', noi_dung: 'Thuốc, dịch truyển', dvt: 'Đồng', so_lieu: thuocNoi, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.1.5.1 + ... + 3.1.5.7' },
    { row_id: 49, stt: '3.1.5.1', noi_dung: 'Tiền thuốc kháng sinh', dvt: 'Đồng', so_lieu: drugCostNoi['Tiền thuốc kháng sinh'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc kháng sinh", nội trú' },
    { row_id: 50, stt: '3.1.5.2', noi_dung: 'Tiền thuốc ung thư', dvt: 'Đồng', so_lieu: drugCostNoi['Tiền thuốc ung thư'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc ung thư", nội trú' },
    { row_id: 51, stt: '3.1.5.3', noi_dung: 'Tiền thuốc Corticoid', dvt: 'Đồng', so_lieu: drugCostNoi['Tiền thuốc Corticoid'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc Corticoid", nội trú' },
    { row_id: 52, stt: '3.1.5.4', noi_dung: 'Tiền dịch truyền', dvt: 'Đồng', so_lieu: drugCostNoi['Tiền dịch truyền'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền dịch truyền", nội trú' },
    { row_id: 53, stt: '3.1.5.5', noi_dung: 'Tiền thuốc Vitamin', dvt: 'Đồng', so_lieu: drugCostNoi['Tiền thuốc Vitamin'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc Vitamin", nội trú' },
    { row_id: 54, stt: '3.1.5.6', noi_dung: 'Tiền thuốc cổ truyền, thuốc dược liệu', dvt: 'Đồng', so_lieu: drugCostNoi['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc cổ truyền", nội trú' },
    { row_id: 55, stt: '3.1.5.7', noi_dung: 'Tiền thuốc khác', dvt: 'Đồng', so_lieu: drugCostNoi['Tiền thuốc khác'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc khác", nội trú' },
    { row_id: 56, stt: '3.1.6', noi_dung: 'Máu', dvt: 'Đồng', so_lieu: mauNoi, ghi_chu: '', level: 3, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Máu", nội trú' },
    { row_id: 57, stt: '3.1.7', noi_dung: 'Phẫu thuật, thủ thuật:', dvt: 'Đồng', so_lieu: ptttNoi, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.1.7.1 + ... + 3.1.7.5' },
    { row_id: 58, stt: '3.1.7.1', noi_dung: 'Loại đặc biệt:', dvt: 'Đồng', so_lieu: dvktCostNoi['Loại đặc biệt:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại đặc biệt:", nội trú' },
    { row_id: 59, stt: '3.1.7.2', noi_dung: 'Loại I:', dvt: 'Đồng', so_lieu: dvktCostNoi['Loại I:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại I:", nội trú' },
    { row_id: 60, stt: '3.1.7.3', noi_dung: 'Loại II:', dvt: 'Đồng', so_lieu: dvktCostNoi['Loại II:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại II:", nội trú' },
    { row_id: 61, stt: '3.1.7.4', noi_dung: 'Loại III:', dvt: 'Đồng', so_lieu: dvktCostNoi['Loại III:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại III:", nội trú' },
    { row_id: 62, stt: '3.1.7.5', noi_dung: 'PTTT loại khác', dvt: 'Đồng', so_lieu: dvktCostNoi['PTTT loại khác'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "PTTT loại khác", nội trú' },
    { row_id: 63, stt: '3.1.8', noi_dung: 'Vật tư y tế:', dvt: 'Đồng', so_lieu: vtytNoi, ghi_chu: '', level: 3, formula_desc: 'XML3 thành tiền các dòng có cột MA_VAT_TU, nội trú' },
    { row_id: 64, stt: '3.1.9', noi_dung: 'Chi phí vận chuyển', dvt: 'Đồng', so_lieu: vchuyenNoi, ghi_chu: '', level: 3, formula_desc: 'Chi phí vận chuyển nội trú' },

    // Ngoại trú
    { row_id: 65, stt: '3.2.', noi_dung: 'Cơ cấu chi KCB BHYT Ngoại trú: (3.2=3.2.1+3.2.2+3.2.3+….+3.2.8)', dvt: 'Đồng', so_lieu: tongChiNgoai, ghi_chu: '', is_summary: true, level: 2, formula_desc: '= Tổng các nhóm chi phí ngoại trú' },
    { row_id: 66, stt: '3.2.1', noi_dung: 'Tiền khám', dvt: 'Đồng', so_lieu: khamNgoai, ghi_chu: '', level: 3, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Tiền khám", ngoại trú' },
    { row_id: 67, stt: '3.2.2', noi_dung: 'Tiền giường', dvt: 'Đồng', so_lieu: 0, ghi_chu: 'Không cần nhập', level: 3, formula_desc: 'Không áp dụng ngoại trú' },
    { row_id: 68, stt: '3.2.3', noi_dung: 'Xét nghiệm:', dvt: 'Đồng', so_lieu: xnNgoai, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.2.3.1 + ... + 3.2.3.5' },
    { row_id: 69, stt: '3.2.3.1', noi_dung: 'Hóa sinh:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Hóa sinh:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Hóa sinh:", ngoại trú' },
    { row_id: 70, stt: '3.2.3.2', noi_dung: 'Huyết học:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Huyết học:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Huyết học:", ngoại trú' },
    { row_id: 71, stt: '3.2.3.3', noi_dung: 'Vi sinh:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Vi sinh:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Vi sinh:", ngoại trú' },
    { row_id: 72, stt: '3.2.3.4', noi_dung: 'Giải phẫu bệnh:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Giải phẫu bệnh:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Giải phẫu bệnh:", ngoại trú' },
    { row_id: 73, stt: '3.2.3.5', noi_dung: 'Xét nghiệm khác:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Xét nghiệm khác:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Xét nghiệm khác:", ngoại trú' },
    { row_id: 74, stt: '3.2.4', noi_dung: 'Chẩn đoán hình ảnh:', dvt: 'Đồng', so_lieu: cdhaNgoai, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.2.4.1 + ... + 3.2.4.7' },
    { row_id: 75, stt: '3.2.4.1', noi_dung: 'X-Quang:', dvt: 'Đồng', so_lieu: dvktCostNgoai['X-Quang:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "X-Quang:", ngoại trú' },
    { row_id: 76, stt: '3.2.4.2', noi_dung: 'Chụp cắt lớp vi tính/CT:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Chụp cắt lớp vi tính/CT:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Chụp cắt lớp vi tính/CT:", ngoại trú' },
    { row_id: 77, stt: '3.2.4.3', noi_dung: 'Chụp cộng hưởng từ/MRI:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Chụp cộng hưởng từ/MRI:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Chụp cộng hưởng từ/MRI:", ngoại trú' },
    { row_id: 78, stt: '3.2.4.4', noi_dung: 'Siêu âm:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Siêu âm:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Siêu âm:", ngoại trú' },
    { row_id: 79, stt: '3.2.4.5', noi_dung: 'Nội soi Tiêu hóa:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Nội soi Tiêu hóa:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Nội soi Tiêu hóa:", ngoại trú' },
    { row_id: 80, stt: '3.2.4.6', noi_dung: 'Nội soi Tai - Mũi - Họng:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Nội soi Tai - Mũi - Họng:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Nội soi Tai - Mũi - Họng:", ngoại trú' },
    { row_id: 81, stt: '3.2.4.7', noi_dung: 'Khác:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Khác:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Khác:", ngoại trú' },
    { row_id: 82, stt: '3.2.5', noi_dung: 'Thuốc, dịch truyển', dvt: 'Đồng', so_lieu: thuocNgoai, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.2.5.1 + ... + 3.2.5.7' },
    { row_id: 83, stt: '3.2.5.1', noi_dung: 'Tiền thuốc kháng sinh', dvt: 'Đồng', so_lieu: drugCostNgoai['Tiền thuốc kháng sinh'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc kháng sinh", ngoại trú' },
    { row_id: 84, stt: '3.2.5.2', noi_dung: 'Tiền thuốc ung thư', dvt: 'Đồng', so_lieu: drugCostNgoai['Tiền thuốc ung thư'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc ung thư", ngoại trú' },
    { row_id: 85, stt: '3.2.5.3', noi_dung: 'Tiền thuốc Corticoid', dvt: 'Đồng', so_lieu: drugCostNgoai['Tiền thuốc Corticoid'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc Corticoid", ngoại trú' },
    { row_id: 86, stt: '3.2.5.4', noi_dung: 'Tiền dịch truyền', dvt: 'Đồng', so_lieu: drugCostNgoai['Tiền dịch truyền'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền dịch truyền", ngoại trú' },
    { row_id: 87, stt: '3.2.5.5', noi_dung: 'Tiền thuốc Vitamin', dvt: 'Đồng', so_lieu: drugCostNgoai['Tiền thuốc Vitamin'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc Vitamin", ngoại trú' },
    { row_id: 88, stt: '3.2.5.6', noi_dung: 'Tiền thuốc cổ truyền, thuốc dược liệu', dvt: 'Đồng', so_lieu: drugCostNgoai['Tiền thuốc cổ truyền, thuốc dược liệu'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc cổ truyền", ngoại trú' },
    { row_id: 89, stt: '3.2.5.7', noi_dung: 'Tiền thuốc khác', dvt: 'Đồng', so_lieu: drugCostNgoai['Tiền thuốc khác'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Tiền thuốc khác", ngoại trú' },
    { row_id: 90, stt: '3.2.6', noi_dung: 'Máu', dvt: 'Đồng', so_lieu: mauNgoai, ghi_chu: '', level: 3, formula_desc: 'XML2 thành tiền theo DM Thuốc nhóm "Máu", ngoại trú' },
    { row_id: 91, stt: '3.2.7', noi_dung: 'Phẫu thuật, thủ thuật:', dvt: 'Đồng', so_lieu: ptttNgoai, ghi_chu: '', is_summary: true, level: 3, formula_desc: '= 3.2.7.1 + ... + 3.2.7.5' },
    { row_id: 92, stt: '3.2.7.1', noi_dung: 'Loại đặc biệt:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Loại đặc biệt:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại đặc biệt:", ngoại trú' },
    { row_id: 93, stt: '3.2.7.2', noi_dung: 'Loại I:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Loại I:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại I:", ngoại trú' },
    { row_id: 94, stt: '3.2.7.3', noi_dung: 'Loại II:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Loại II:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại II:", ngoại trú' },
    { row_id: 95, stt: '3.2.7.4', noi_dung: 'Loại III:', dvt: 'Đồng', so_lieu: dvktCostNgoai['Loại III:'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "Loại III:", ngoại trú' },
    { row_id: 96, stt: '3.1.7.5', noi_dung: 'PTTT loại khác', dvt: 'Đồng', so_lieu: dvktCostNgoai['PTTT loại khác'] || 0, ghi_chu: '', level: 4, formula_desc: 'XML3 thành tiền theo DVKT nhóm "PTTT loại khác", ngoại trú' },
    { row_id: 97, stt: '3.2.8', noi_dung: 'Vật tư y tế', dvt: 'Đồng', so_lieu: vtytNgoai, ghi_chu: '', level: 3, formula_desc: 'XML3 thành tiền các dòng có cột MA_VAT_TU, ngoại trú' },
    { row_id: 98, stt: '3.2.9', noi_dung: 'Chi phí vận chuyển:', dvt: 'Đồng', so_lieu: vchuyenNgoai, ghi_chu: '', level: 3, formula_desc: 'Chi phí vận chuyển ngoại trú' },

    // BHYT đề nghị thanh toán
    { row_id: 99, stt: '4', noi_dung: 'Tổng chi phí KCB BHYT đề nghị BHXH thanh toán (2 = 4.1 + 4.2):', dvt: 'Đồng', so_lieu: totalBhttNoi + totalBhttNgoai, ghi_chu: '', is_summary: true, level: 1, formula_desc: '= 4.1 + 4.2' },
    { row_id: 100, stt: '4.1.', noi_dung: 'Chi cho KCB BHYT ngoại trú:', dvt: 'Đồng', so_lieu: totalBhttNgoai, ghi_chu: '', level: 2, formula_desc: 'Tổng T_BHTT XML1 khi MA_LOAI_KCB là 01;02;05;07' },
    { row_id: 101, stt: '4.2.', noi_dung: 'Chi cho KCB BHYT nội trú:', dvt: 'Đồng', so_lieu: totalBhttNoi, ghi_chu: '', level: 2, formula_desc: 'Tổng T_BHTT XML1 khi MA_LOAI_KCB là 03;09' },

    // BHXH từ chối / xuất toán
    { row_id: 102, stt: '5', noi_dung: 'Tổng chi phí KCB BHYT BHXH từ chối thanh toán  (5= 5.1 + 5.2)', dvt: 'Đồng', so_lieu: (config.tuChoiDongY || 0) + (config.tuChoiKhongDongY || 0), ghi_chu: '', is_summary: true, level: 1, formula_desc: '= 5.1 + 5.2' },
    { row_id: 103, stt: '5.1.', noi_dung: 'Đơn vị đồng ý', dvt: 'Đồng', so_lieu: config.tuChoiDongY || 0, ghi_chu: '', level: 2, formula_desc: 'Số tiền cơ sở y tế đồng ý giảm trừ' },
    { row_id: 104, stt: '5.2.', noi_dung: 'Đơn vị không đồng ý', dvt: 'Đồng', so_lieu: config.tuChoiKhongDongY || 0, ghi_chu: config.tuChoiLyDo || 'Ghi rõ lý do,căn cứ pháp lý', level: 2, formula_desc: 'Số tiền cơ sở y tế kiến nghị bảo lưu' },
    { row_id: 105, stt: '6', noi_dung: 'Tổng chi phí KCB BHYT BHXH đã thanh toán nay đưa vào xuất toán', dvt: 'Đồng', so_lieu: (config.xuatToanDongY || 0) + (config.xuatToanKhongDongY || 0), ghi_chu: '', is_summary: true, level: 1, formula_desc: '= 6.1 + 6.2' },
    { row_id: 106, stt: '6.1.', noi_dung: 'Đơn vị đồng ý', dvt: 'Đồng', so_lieu: config.xuatToanDongY || 0, ghi_chu: '', level: 2, formula_desc: 'Số tiền cơ sở y tế chấp thuận xuất toán' },
    { row_id: 107, stt: '6.2.', noi_dung: 'Đơn vị không đồng ý', dvt: 'Đồng', so_lieu: config.xuatToanKhongDongY || 0, ghi_chu: config.xuatToanLyDo || 'Ghi rõ lý do, căn cứ pháp lý', level: 2, formula_desc: 'Số tiền cơ sở y tế kiến nghị giải trình' },
  ];

  // 5. Cross-check against File 4 (Report 79/80) if available
  const crossCheckResults: CrossCheckItem[] = [];
  if (report7980Rows && report7980Rows.length > 0) {
    let r4TongChiNoi = 0, r4TongChiNgoai = 0;
    let r4XnNoi = 0, r4XnNgoai = 0;
    let r4CdhaNoi = 0, r4CdhaNgoai = 0;
    let r4ThuocNoi = 0, r4ThuocNgoai = 0;
    let r4MauNoi = 0, r4MauNgoai = 0;
    let r4PtttNoi = 0, r4PtttNgoai = 0;
    let r4VtytNoi = 0, r4VtytNgoai = 0;
    let r4KhamNoi = 0, r4KhamNgoai = 0;
    let r4GiuongNoi = 0, r4GiuongNgoai = 0;
    let r4BhttNoi = 0, r4BhttNgoai = 0;

    for (const r of report7980Rows) {
      const kcb = r.ma_loai_kcb.trim();
      const isNoi = kcb === '03' || kcb === '09';
      const isNgoai = kcb === '01' || kcb === '02' || kcb === '05' || kcb === '07';

      if (isNoi) {
        r4TongChiNoi += r.t_tongchi || 0;
        r4XnNoi += r.t_xn || 0;
        r4CdhaNoi += r.t_cdha || 0;
        r4ThuocNoi += r.t_thuoc || 0;
        r4MauNoi += r.t_mau || 0;
        r4PtttNoi += r.t_pttt || 0;
        r4VtytNoi += r.t_vtyt || 0;
        r4KhamNoi += r.t_kham || 0;
        r4GiuongNoi += r.t_giuong || 0;
        r4BhttNoi += r.t_bhtt || 0;
      } else if (isNgoai) {
        r4TongChiNgoai += r.t_tongchi || 0;
        r4XnNgoai += r.t_xn || 0;
        r4CdhaNgoai += r.t_cdha || 0;
        r4ThuocNgoai += r.t_thuoc || 0;
        r4MauNgoai += r.t_mau || 0;
        r4PtttNgoai += r.t_pttt || 0;
        r4VtytNgoai += r.t_vtyt || 0;
        r4KhamNgoai += r.t_kham || 0;
        r4GiuongNgoai += r.t_giuong || 0;
        r4BhttNgoai += r.t_bhtt || 0;
      }
    }

    const checkList = [
      { cat: 'T_TONGCHI', label: 'Tổng chi phí KCB', xmlNoi: tongChiNoi, r4Noi: r4TongChiNoi, xmlNgoai: tongChiNgoai, r4Ngoai: r4TongChiNgoai },
      { cat: 'T_KHAM', label: 'Tiền khám', xmlNoi: khamNoi, r4Noi: r4KhamNoi, xmlNgoai: khamNgoai, r4Ngoai: r4KhamNgoai },
      { cat: 'T_GIUONG', label: 'Tiền giường', xmlNoi: giuongNoi, r4Noi: r4GiuongNoi, xmlNgoai: giuongNgoai, r4Ngoai: r4GiuongNgoai },
      { cat: 'T_XN', label: 'Xét nghiệm', xmlNoi: xnNoi, r4Noi: r4XnNoi, xmlNgoai: xnNgoai, r4Ngoai: r4XnNgoai },
      { cat: 'T_CDHA', label: 'Chẩn đoán hình ảnh', xmlNoi: cdhaNoi, r4Noi: r4CdhaNoi, xmlNgoai: cdhaNgoai, r4Ngoai: r4CdhaNgoai },
      { cat: 'T_THUOC', label: 'Thuốc, dịch truyền', xmlNoi: thuocNoi, r4Noi: r4ThuocNoi, xmlNgoai: thuocNgoai, r4Ngoai: r4ThuocNgoai },
      { cat: 'T_MAU', label: 'Máu', xmlNoi: mauNoi, r4Noi: r4MauNoi, xmlNgoai: mauNgoai, r4Ngoai: r4MauNgoai },
      { cat: 'T_PTTT', label: 'Phẫu thuật thủ thuật', xmlNoi: ptttNoi, r4Noi: r4PtttNoi, xmlNgoai: ptttNgoai, r4Ngoai: r4PtttNgoai },
      { cat: 'T_VTYT', label: 'Vật tư y tế', xmlNoi: vtytNoi, r4Noi: r4VtytNoi, xmlNgoai: vtytNgoai, r4Ngoai: r4VtytNgoai },
      { cat: 'T_BHTT', label: 'BHYT thanh toán', xmlNoi: totalBhttNoi, r4Noi: r4BhttNoi, xmlNgoai: totalBhttNgoai, r4Ngoai: r4BhttNgoai },
    ];

    for (const item of checkList) {
      const diffNoi = Math.abs(item.xmlNoi - item.r4Noi);
      const diffNgoai = Math.abs(item.xmlNgoai - item.r4Ngoai);
      const xmlTot = item.xmlNoi + item.xmlNgoai;
      const r4Tot = item.r4Noi + item.r4Ngoai;
      const diffTot = Math.abs(xmlTot - r4Tot);
      const isMatch = diffTot < 1; // within 1 VND rounding tolerance

      crossCheckResults.push({
        category: item.cat,
        label: item.label,
        xml_noi: item.xmlNoi,
        r4_noi: item.r4Noi,
        diff_noi: item.xmlNoi - item.r4Noi,
        xml_ngoai: item.xmlNgoai,
        r4_ngoai: item.r4Ngoai,
        diff_ngoai: item.xmlNgoai - item.r4Ngoai,
        xml_total: xmlTot,
        r4_total: r4Tot,
        diff_total: xmlTot - r4Tot,
        status: isMatch ? 'MATCH' : 'MISMATCH'
      });
    }
  }

  // 6. Convert unmapped items to array
  const unmappedDrugs: UnmappedItem[] = [];
  unmappedDrugMap.forEach((v, k) => {
    unmappedDrugs.push({
      type: 'THUOC',
      code: k,
      count: v.count,
      totalAmount: v.totalAmount
    });
  });

  const unmappedDVKT: UnmappedItem[] = [];
  unmappedDVKTMap.forEach((v, k) => {
    unmappedDVKT.push({
      type: 'DVKT',
      code: k,
      count: v.count,
      totalAmount: v.totalAmount
    });
  });

  return {
    config,
    rows,
    summary: {
      totalLuot: countTotal,
      luotNoiTru: countNoi,
      luotNgoaiTru: countNgoai,
      ngayDieuTriNoiTru: totalNgayNoi,
      binhQuanNgayNoiTru: Math.round(bqNgayNoi * 100) / 100,
      tyLeVaoNoiTru: Math.round(tyLeNoi * 100) / 100,
      tongChiPhi: tongChiToanVien,
      chiNoiTru: tongChiNoi,
      chiNgoaiTru: tongChiNgoai,
      chiBinhQuanNoiTru: Math.round(bqChiNoi),
      chiBinhQuanNgoaiTru: Math.round(bqChiNgoai),
      tongDeNghiBHTT: totalBhttNoi + totalBhttNgoai,
      deNghiBHTTNoiTru: totalBhttNoi,
      deNghiBHTTNgoaiTru: totalBhttNgoai
    },
    crossCheckResults,
    unmappedDrugs,
    unmappedDVKT
  };
}
