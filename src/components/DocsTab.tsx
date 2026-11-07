import React from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  GitBranch,
  ShieldAlert,
  HelpCircle,
  FolderOpen,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const DocsTab: React.FC = () => {
  const versions = [
    {
      version: 'v1.2.0',
      date: '07/11/2026',
      badge: 'Bản phát hành hiện tại',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      highlights: [
        'Tích hợp Module Đối Chiếu Chéo tự động giữa XML và Báo cáo 79/80a (File 4).',
        'Phát hiện và cảnh báo các mã Thuốc / DVKT mới phát sinh chưa có trong danh mục tham chiếu.',
        'Nâng cấp bộ máy xuất Excel (.xlsx) giữ nguyên 100% công thức động (SUM, phép chia BQ, tỷ lệ %) theo đúng mẫu chuẩn của Sở Y tế.',
        'Tối ưu hóa bộ nhớ và tốc độ xử lý: đọc file XML3 lớn hơn 15MB trong vài giây mà không làm đơ giao diện.',
        'Hỗ trợ chế độ "Nạp dữ liệu mẫu tháng 1" để trải nghiệm ngay lập tức mà không cần tệp gốc.'
      ]
    },
    {
      version: 'v1.1.0',
      date: '06/11/2026',
      highlights: [
        'Xây dựng giao diện CRUD trực quan cho Thư viện Danh mục Thuốc (File số 5) và DVKT (File số 6).',
        'Lưu trữ dữ liệu danh mục tham chiếu bền vững trên trình duyệt người dùng qua IndexedDB.',
        'Hỗ trợ tìm kiếm, lọc theo nhóm chi phí (Cột T) và chỉ tiêu cận lâm sàng (Cột U).',
        'Bổ sung tính năng Nhập/Xuất Excel riêng cho từng bộ thư viện danh mục.'
      ]
    },
    {
      version: 'v1.0.0',
      date: '05/11/2026',
      highlights: [
        'Khởi tạo kiến trúc ứng dụng web Single Page Application chuẩn React + TypeScript + Tailwind CSS.',
        'Xây dựng thuật toán bóc tách dữ liệu XML1, XML2, XML3 theo chuẩn Quyết định 4210/QĐ-BYT và Quyết định 130/QĐ-BYT.',
        'Tạo lập bảng tính toán chỉ tiêu Báo cáo KCB BHYT (File số 7) theo mẫu Văn bản Sở Y tế Phú Thọ.'
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-100 text-brand-700 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Hướng Dẫn Sử Dụng & Lịch Sử Phiên Bản Ứng Dụng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tài liệu kỹ thuật tổng hợp báo cáo KCB BHYT theo chuẩn Sở Y tế Phú Thọ & Bảo hiểm Xã hội Việt Nam.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
          <Layers className="w-5 h-5 text-brand-600" />
          <span>Quy Trình 5 Bước Vận Hành & Lập Báo Cáo</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs mb-2">1</span>
            <h5 className="font-bold text-slate-800">Chuẩn bị tệp dữ liệu</h5>
            <p className="text-slate-500 mt-1 leading-relaxed">
              Xuất các file dữ liệu XML1, XML2, XML3 và báo cáo 79/80a từ hệ thống HIS/LIS hoặc cổng giám định BHYT.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs mb-2">2</span>
            <h5 className="font-bold text-slate-800">Tải tệp lên hệ thống</h5>
            <p className="text-slate-500 mt-1 leading-relaxed">
              Kéo thả đồng thời các tệp vào ô nhận diện tại tab "Tổng quan". Hệ thống tự động phân loại từng file.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs mb-2">3</span>
            <h5 className="font-bold text-slate-800">Tổng hợp báo cáo</h5>
            <p className="text-slate-500 mt-1 leading-relaxed">
              Bấm nút "Tổng hợp Báo Cáo". Hệ thống bóc tách, ánh xạ danh mục và tính toán toàn bộ chỉ tiêu trong 2-3 giây.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs mb-2">4</span>
            <h5 className="font-bold text-slate-800">Đối chiếu chéo & Kiểm tra</h5>
            <p className="text-slate-500 mt-1 leading-relaxed">
              Chuyển sang tab "Đối chiếu chéo (79/80)" để so khớp từng mục chi phí. Kiểm tra mã mới phát sinh nếu có.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 relative">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs mb-2">5</span>
            <h5 className="font-bold text-emerald-900">Xuất file Excel chuẩn</h5>
            <p className="text-emerald-700 mt-1 leading-relaxed">
              Xem trước báo cáo tại tab "Báo cáo KCB BHYT", bổ sung số liệu xuất toán nếu có và bấm "Xuất Excel File 7".
            </p>
          </div>
        </div>
      </div>

      {/* Business Logic & Data Dictionary */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
          <HelpCircle className="w-5 h-5 text-brand-600" />
          <span>Nguyên Lý Tính Toán & Ánh Xạ Dữ Liệu Chi Tiết</span>
        </h4>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">1. Phân loại Nội trú / Ngoại trú:</strong>
            Dựa vào cột <code>MA_LOAI_KCB</code> trong file XML1:
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
              <li><strong>Nội trú:</strong> Mã loại là <code>03</code> (Điều trị nội trú) hoặc <code>09</code> (Điều trị ban ngày).</li>
              <li><strong>Ngoại trú:</strong> Mã loại là <code>01</code> (Khám bệnh), <code>02</code> (Điều trị ngoại trú), <code>05</code>, <code>07</code>.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">2. Ánh xạ Dịch vụ kỹ thuật & Cận lâm sàng (Từ XML3):</strong>
            Mã dịch vụ ở cột <code>MA_DICH_VU</code> (cột C) của XML3 được tham chiếu sang Thư viện DVKT (File số 6):
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
              <li><strong>Chỉ tiêu số lượt CLS (Mục I):</strong> Lấy tổng <code>SO_LUONG</code> (cột M) tham chiếu theo Cột U của danh mục (Xét nghiệm, X-quang, Siêu âm, CT/MRI).</li>
              <li><strong>Cơ cấu chi phí (Mục II):</strong> Lấy tổng <code>THANH_TIEN_BV</code> tham chiếu theo Cột T của danh mục (Tiền khám, Tiền giường, 5 nhóm XN, 7 nhóm CĐHA, 5 nhóm PTTT).</li>
              <li><strong>Vật tư y tế (Mục 3.1.8 & 3.2.8):</strong> Lấy tổng <code>THANH_TIEN_BV</code> của tất cả các dòng có mã tại cột <code>MA_VAT_TU</code> (cột E).</li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">3. Ánh xạ Thuốc & Dịch truyền (Từ XML2):</strong>
            Mã thuốc ở cột <code>MA_THUOC</code> (cột C) của XML2 được tham chiếu sang Thư viện Thuốc (File số 5) để lấy nhóm báo cáo ở Cột AJ:
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
              <li>Phân nhóm tự động: Kháng sinh, Ung thư, Corticoid, Dịch truyền, Vitamin, Thuốc cổ truyền/dược liệu, Thuốc khác.</li>
              <li>Nhóm "Máu" được phân bổ độc lập vào Mục 3.1.6 (Nội trú) và Mục 3.2.6 (Ngoại trú).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Semantic Versioning History */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3 border-slate-100">
          <GitBranch className="w-5 h-5 text-brand-600" />
          <span>Lịch Sử Phiên Bản & Nhật Ký Cập Nhật (Changelog)</span>
        </h4>

        <div className="space-y-6">
          {versions.map((ver, idx) => (
            <div key={idx} className="relative pl-6 border-l-2 border-brand-200 pb-2">
              <div className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white ring-2 ring-brand-100" />
              <div className="flex items-center space-x-2.5">
                <span className="font-mono text-sm font-black text-brand-800">{ver.version}</span>
                <span className="text-xs text-slate-400 font-medium">({ver.date})</span>
                {ver.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ver.badgeColor}`}>
                    {ver.badge}
                  </span>
                )}
              </div>
              <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                {ver.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
