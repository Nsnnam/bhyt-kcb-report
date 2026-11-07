export interface DrugItem {
  id?: string;
  ma_thuoc: string;
  ten_hoat_chat?: string;
  ten_thuoc?: string;
  nhom_bv?: string;
  don_vi_tinh?: string;
  ham_luong?: string;
  duong_dung?: string;
  so_dang_ky?: string;
  don_gia_bh?: number;
  nhom_bao_cao: string; // e.g. Tiền thuốc kháng sinh, Tiền thuốc ung thư, etc.
}

export interface DVKTItem {
  ma_dich_vu: string;
  ma_tuong_duong?: string;
  ten_dich_vu?: string;
  gia?: number;
  nhom_chi_phi?: string; // Col T: Tiền khám, Tiền giường, Hóa sinh:, etc.
  nhom_cls?: string;     // Col U: Số lượt xét nghiệm, Số lượt chụp X-Quang, etc.
}

export interface UploadedFileMetadata {
  name: string;
  size: number;
  lastModified: number;
  rowCount?: number;
  detectedType: 'XML1' | 'XML2' | 'XML3' | 'REPORT_79_80' | 'CATALOG_THUOC' | 'CATALOG_DVKT' | 'UNKNOWN';
}

export interface ReportRow {
  row_id: number;
  stt: string;
  noi_dung: string;
  dvt: string;
  so_lieu: number | null;
  so_lieu_text?: string;
  ghi_chu: string;
  is_header?: boolean;
  is_summary?: boolean;
  level: number; // 0: Section header (I, II), 1: 1., 2: 1.1, 3: 1.1.1, 4: 1.1.4.1
  formula_desc: string;
}

export interface CrossCheckItem {
  category: string;
  label: string;
  xml_noi: number;
  r4_noi: number;
  diff_noi: number;
  xml_ngoai: number;
  r4_ngoai: number;
  diff_ngoai: number;
  xml_total: number;
  r4_total: number;
  diff_total: number;
  status: 'MATCH' | 'MISMATCH' | 'NA';
}

export interface UnmappedItem {
  type: 'THUOC' | 'DVKT';
  code: string;
  name?: string;
  count: number;
  totalAmount: number;
}

export interface ReportConfig {
  title: string;
  subtitle: string;
  referenceDoc: string;
  hospitalName: string;
  month: number;
  year: number;
  tuChoiDongY: number;
  tuChoiKhongDongY: number;
  tuChoiLyDo: string;
  xuatToanDongY: number;
  xuatToanKhongDongY: number;
  xuatToanLyDo: string;
}

export interface ProcessedReportData {
  config: ReportConfig;
  rows: ReportRow[];
  summary: {
    totalLuot: number;
    luotNoiTru: number;
    luotNgoaiTru: number;
    ngayDieuTriNoiTru: number;
    binhQuanNgayNoiTru: number;
    tyLeVaoNoiTru: number;
    tongChiPhi: number;
    chiNoiTru: number;
    chiNgoaiTru: number;
    chiBinhQuanNoiTru: number;
    chiBinhQuanNgoaiTru: number;
    tongDeNghiBHTT: number;
    deNghiBHTTNoiTru: number;
    deNghiBHTTNgoaiTru: number;
  };
  crossCheckResults: CrossCheckItem[];
  unmappedDrugs: UnmappedItem[];
  unmappedDVKT: UnmappedItem[];
}
