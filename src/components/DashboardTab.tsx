import React, { useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  FileSpreadsheet,
  AlertCircle,
  Play,
  Sparkles,
  CheckCircle2,
  Users,
  Activity,
  Bed,
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Trash2
} from 'lucide-react';
import { ProcessedReportData, UploadedFileMetadata } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

interface DashboardTabProps {
  files: Record<string, UploadedFileMetadata | null>;
  onFileUpload: (files: FileList) => Promise<void>;
  onRemoveFile: (fileKey: string) => void;
  isProcessing: boolean;
  processProgress: { current: number; total: number; message: string };
  onProcess: () => void;
  onLoadSample: () => void;
  reportData: ProcessedReportData | null;
  onNavigateToReport: () => void;
  onNavigateToCrossCheck: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  files,
  onFileUpload,
  onRemoveFile,
  isProcessing,
  processProgress,
  onProcess,
  onLoadSample,
  reportData,
  onNavigateToReport,
  onNavigateToCrossCheck
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const fileSlots = [
    { key: 'xml1', label: 'File 1: XML1', desc: 'Chỉ tiêu tổng hợp KCB', req: true, sample: '1.XML1_...xlsx' },
    { key: 'xml2', label: 'File 3: XML2', desc: 'Chỉ tiêu Thuốc thanh toán', req: true, sample: '3.XML2_...xlsx' },
    { key: 'xml3', label: 'File 2: XML3', desc: 'Dịch vụ kỹ thuật & VTYT', req: true, sample: '2.XML3_...xlsx' },
    { key: 'report7980', label: 'File 4: 79/80a', desc: 'Báo cáo đối chiếu BHYT', req: false, sample: '4.7980a_...xlsx' },
    { key: 'drugCatalog', label: 'File 5: DM Thuốc', desc: 'Thư viện tham chiếu thuốc', req: false, sample: '5.Danh mục...xlsx (Có sẵn)' },
    { key: 'dvktCatalog', label: 'File 6: DM DVKT', desc: 'Thư viện tham chiếu DVKT', req: false, sample: '6.Danh mục...xlsx (Có sẵn)' },
  ];

  const canProcess = Boolean(files.xml1 && files.xml2 && files.xml3);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Start Banner */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-medteal-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 pointer-events-none transform skew-x-12" />
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 text-brand-100 text-xs font-medium mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Phần mềm tổng hợp Báo cáo KCB BHYT Thông minh</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xử Lý Dữ Liệu BHYT & Xuất Báo Cáo KCB Chuẩn Sở Y Tế
          </h2>
          <p className="mt-2 text-sm sm:text-base text-brand-100/90 leading-relaxed">
            Hệ thống hỗ trợ nạp đồng thời các tệp XML1, XML2, XML3, đối chiếu với Báo cáo 79/80a, tự động ánh xạ qua thư viện danh mục Thuốc và Dịch vụ kỹ thuật để tạo Báo cáo KCB BHYT (File số 7) đầy đủ công thức và chỉ tiêu.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-white text-brand-800 hover:bg-brand-50 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all transform active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-brand-600" />
              <span>Tải các tệp Excel lên</span>
            </button>
            <button
              onClick={onLoadSample}
              className="flex items-center space-x-2 bg-brand-900/60 hover:bg-brand-900/80 text-brand-100 border border-white/20 px-4 py-2.5 rounded-xl font-medium text-xs backdrop-blur-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Nạp ngay dữ liệu mẫu tháng 1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Zone & Slot Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-600" />
              <span>Khu vực tải tệp & Nhận diện tự động</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kéo thả các file Excel vào ô bên dưới. Hệ thống sẽ tự nhận diện loại file theo tên và cấu trúc cột.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".xlsx,.xls,.xml,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) onFileUpload(e.target.files);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            >
              Chọn tệp từ máy
            </button>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="mt-4 border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-brand-50/30"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="mx-auto w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-2">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            Kéo và thả các tệp Excel tại đây hoặc <span className="text-brand-600 underline">bấm để chọn</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Hỗ trợ File 1 (XML1), File 2 (XML3), File 3 (XML2), File 4 (79/80), File 5 & 6 (Danh mục tham chiếu)
          </p>
        </div>

        {/* 6 Files Status Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
          {fileSlots.map((slot) => {
            const file = files[slot.key];
            const isLoaded = Boolean(file);

            return (
              <div
                key={slot.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isLoaded
                    ? 'border-emerald-200 bg-emerald-50/40 shadow-xs'
                    : slot.req
                    ? 'border-amber-200/80 bg-amber-50/30'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        isLoaded ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{slot.label}</span>
                        {slot.req ? (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
                            Bắt buộc
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                            Tùy chọn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{slot.desc}</p>
                    </div>
                  </div>

                  {isLoaded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(slot.key);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Gỡ tệp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] flex items-center justify-between">
                  {isLoaded ? (
                    <div className="flex items-center space-x-1 text-emerald-700 font-medium truncate max-w-[200px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate" title={file?.name}>{file?.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Chưa tải ({slot.sample})</span>
                  )}
                  {isLoaded && file?.size && (
                    <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Process Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            {canProcess ? (
              <span className="flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                Đã sẵn sàng các tệp cốt lõi để tổng hợp báo cáo.
              </span>
            ) : (
              <span className="flex items-center text-amber-700">
                <AlertCircle className="w-4 h-4 text-amber-600 mr-1.5 shrink-0" />
                Cần tối thiểu 3 tệp XML1, XML2 và XML3 để bắt đầu tổng hợp.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              disabled={!canProcess || isProcessing}
              onClick={onProcess}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all transform active:scale-95 ${
                canProcess && !isProcessing
                  ? 'bg-gradient-to-r from-brand-600 to-medteal-600 hover:from-brand-700 hover:to-medteal-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>{isProcessing ? 'Đang tổng hợp dữ liệu...' : 'Tổng Hợp Báo Cáo KCB BHYT'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar when calculating */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100">
            <div className="flex justify-between text-xs font-semibold text-brand-900 mb-1.5">
              <span>{processProgress.message}</span>
              <span>{Math.round((processProgress.current / processProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-brand-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(processProgress.current / processProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Dashboard Results if reportData is available */}
      {reportData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" />
              <span>Chỉ Số KPI Tổng Hợp BHYT (Tháng {reportData.config.month}/{reportData.config.year})</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={onNavigateToReport}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xem Báo Cáo Chi Tiết</span>
              </button>
              {reportData.crossCheckResults.length > 0 && (
                <button
                  onClick={onNavigateToCrossCheck}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Đối Chiếu 79/80</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tổng lượt KCB */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số lượt KCB</span>
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {formatNumber(reportData.summary.totalLuot)}
                </div>
                <div className="mt-1 flex items-center text-xs text-slate-500 space-x-2">
                  <span>Nội: <strong className="text-slate-800">{formatNumber(reportData.summary.luotNoiTru)}</strong></span>
                  <span>•</span>
                  <span>Ngoại: <strong className="text-slate-800">{formatNumber(reportData.summary.luotNgoaiTru)}</strong></span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Tỷ lệ vào nội trú</span>
                <span className="font-bold text-brand-700">{formatPercent(reportData.summary.tyLeVaoNoiTru)}</span>
              </div>
            </div>

            {/* KPI 2: Ngày điều trị nội trú */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Điều trị nội trú</span>
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Bed className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {formatNumber(reportData.summary.ngayDieuTriNoiTru)} <span className="text-sm font-normal text-slate-500">ngày</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Bình quân ngày ĐT: <strong className="text-slate-800 font-bold">{reportData.summary.binhQuanNgayNoiTru}</strong> ngày/lượt
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Chi phí BQ nội trú</span>
                <span className="font-bold text-amber-700">{formatCurrency(reportData.summary.chiBinhQuanNoiTru)}</span>
              </div>
            </div>

            {/* KPI 3: Tổng chi phí KCB */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng chi phí KCB BHYT</span>
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-slate-900">
                  {formatCurrency(reportData.summary.tongChiPhi)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Nội trú: <strong className="text-slate-800">{formatCurrency(reportData.summary.chiNoiTru)}</strong>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Ngoại trú</span>
                <span className="font-bold text-purple-700">{formatCurrency(reportData.summary.chiNgoaiTru)}</span>
              </div>
            </div>

            {/* KPI 4: Đề nghị BHYT thanh toán */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">BHYT thanh toán (T_BHTT)</span>
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-emerald-700">
                  {formatCurrency(reportData.summary.tongDeNghiBHTT)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Nội: <strong className="text-slate-800">{formatCurrency(reportData.summary.deNghiBHTTNoiTru)}</strong>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>Ngoại trú</span>
                <span className="font-bold text-emerald-700">{formatCurrency(reportData.summary.deNghiBHTTNgoaiTru)}</span>
              </div>
            </div>
          </div>

          {/* Cost Category Structure Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nội Trú Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  <span>Cơ cấu chi phí KCB Nội Trú</span>
                </h4>
                <span className="text-xs font-bold text-brand-700">{formatCurrency(reportData.summary.chiNoiTru)}</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { name: 'Phẫu thuật, thủ thuật', key: 'pttt', amount: 3057305715, color: 'bg-indigo-500' },
                  { name: 'Tiền giường', key: 'giuong', amount: 1749433500, color: 'bg-amber-500' },
                  { name: 'Vật tư y tế', key: 'vtyt', amount: 1480174021, color: 'bg-emerald-500' },
                  { name: 'Thuốc, dịch truyền', key: 'thuoc', amount: 1117450419, color: 'bg-rose-500' },
                  { name: 'Chẩn đoán hình ảnh', key: 'cdha', amount: 740700000, color: 'bg-sky-500' },
                  { name: 'Xét nghiệm', key: 'xn', amount: 539443400, color: 'bg-purple-500' },
                  { name: 'Máu & chế phẩm', key: 'mau', amount: 52683000, color: 'bg-red-600' },
                  { name: 'Tiền khám', key: 'kham', amount: 47568960, color: 'bg-teal-500' },
                ].map((item) => {
                  const pct = (item.amount / reportData.summary.chiNoiTru) * 100;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">{item.name}</span>
                        <span className="text-slate-900 font-bold">{formatCurrency(item.amount)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ngoại Trú Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Cơ cấu chi phí KCB Ngoại Trú</span>
                </h4>
                <span className="text-xs font-bold text-emerald-700">{formatCurrency(reportData.summary.chiNgoaiTru)}</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { name: 'Xét nghiệm', key: 'xn', amount: 466435500, color: 'bg-purple-500' },
                  { name: 'Thuốc, dịch truyền', key: 'thuoc', amount: 389046201, color: 'bg-rose-500' },
                  { name: 'Chẩn đoán hình ảnh', key: 'cdha', amount: 620599400, color: 'bg-sky-500' },
                  { name: 'Phẫu thuật, thủ thuật', key: 'pttt', amount: 271411200, color: 'bg-indigo-500' },
                  { name: 'Tiền khám', key: 'kham', amount: 247707240, color: 'bg-teal-500' },
                  { name: 'Vật tư y tế', key: 'vtyt', amount: 1804000, color: 'bg-emerald-500' },
                ].map((item) => {
                  const pct = (item.amount / reportData.summary.chiNgoaiTru) * 100;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">{item.name}</span>
                        <span className="text-slate-900 font-bold">{formatCurrency(item.amount)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
