export const DRUG_CATEGORIES = [
  'Tiền thuốc kháng sinh',
  'Tiền thuốc ung thư',
  'Tiền thuốc Corticoid',
  'Tiền dịch truyền',
  'Tiền thuốc Vitamin',
  'Tiền thuốc cổ truyền, thuốc dược liệu',
  'Tiền thuốc khác',
  'Máu'
] as const;

export const DVKT_COST_CATEGORIES = [
  'Tiền khám',
  'Tiền giường',
  'Hóa sinh:',
  'Huyết học:',
  'Vi sinh:',
  'Giải phẫu bệnh:',
  'Xét nghiệm khác:',
  'X-Quang:',
  'Chụp cắt lớp vi tính/CT:',
  'Chụp cộng hưởng từ/MRI:',
  'Siêu âm:',
  'Nội soi Tiêu hóa:',
  'Nội soi Tai - Mũi - Họng:',
  'Khác:',
  'Loại đặc biệt:',
  'Loại I:',
  'Loại II:',
  'Loại III:',
  'PTTT loại khác'
] as const;

export const DVKT_CLS_CATEGORIES = [
  'Số lượt xét nghiệm',
  'Số lượt chụp X-Quang',
  'Số lượt siêu âm',
  'Số lượt chụp CT/MRI'
] as const;

export const DEFAULT_REPORT_CONFIG = {
  title: 'BÁO CÁO THÁNG 1',
  subtitle: 'Hoạt động khám bệnh, chữa bệnh bảo hiểm y tế',
  referenceDoc: '(Kèm theo Văn bản số         /SYT-BHYT&CNTT ngày 04/5/2026 của Sở Y tế Phú Thọ)',
  hospitalName: 'Bệnh viện Đa khoa / TTYT',
  month: 1,
  year: 2026,
  tuChoiDongY: 0,
  tuChoiKhongDongY: 0,
  tuChoiLyDo: '',
  xuatToanDongY: 0,
  xuatToanKhongDongY: 0,
  xuatToanLyDo: ''
};
