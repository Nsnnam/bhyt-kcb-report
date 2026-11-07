import React, { useState } from 'react';
import {
  Download,
  Printer,
  Search,
  HelpCircle,
  Edit3,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { ProcessedReportData, ReportRow } from '../types';
import { formatValueByDVT } from '../utils/formatters';

interface ReportTabProps {
  reportData: ProcessedReportData | null;
  onExportExcel: () => void;
  onUpdateConfig: (updater: (prev: ProcessedReportData) => ProcessedReportData) => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  reportData,
  onExportExcel,
  onUpdateConfig
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(true);
  const [editingConfig, setEditingConfig] = useState(false);

  if (!reportData) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="mx-auto w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Chưa có dữ liệu báo cáo</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
          Vui lòng tải các tệp XML1, XML2, XML3 hoặc bấm <strong>"Nạp dữ liệu mẫu"</strong> ở tab Tổng quan để xem bảng báo cáo KCB BHYT.
        </p>
      </div>
    );
  }

  const { config, rows } = reportData;

  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.stt.toLowerCase().includes(term) ||
      r.noi_dung.toLowerCase().includes(term) ||
      r.ghi_chu.toLowerCase().includes(term)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateAdjustments = (field: string, value: any) => {
    onUpdateConfig((prev) => {
      const nextConfig = { ...prev.config, [field]: value };
      const nextRows = prev.rows.map((r) => {
        if (r.row_id === 103 && field === 'tuChoiDongY') return { ...r, so_lieu: Number(value) || 0 };
        if (r.row_id === 104) {
          if (field === 'tuChoiKhongDongY') return { ...r, so_lieu: Number(value) || 0 };
          if (field === 'tuChoiLyDo') return { ...r, ghi_chu: String(value) };
        }
        if (r.row_id === 102) {
          const dy = field === 'tuChoiDongY' ? Number(value) || 0 : nextConfig.tuChoiDongY;
          const kdy = field === 'tuChoiKhongDongY' ? Number(value) || 0 : nextConfig.tuChoiKhongDongY;
          return { ...r, so_lieu: dy + kdy };
        }
        if (r.row_id === 106 && field === 'xuatToanDongY') return { ...r, so_lieu: Number(value) || 0 };
        if (r.row_id === 107) {
          if (field === 'xuatToanKhongDongY') return { ...r, so_lieu: Number(value) || 0 };
          if (field === 'xuatToanLyDo') return { ...r, ghi_chu: String(value) };
        }
        if (r.row_id === 105) {
          const dy = field === 'xuatToanDongY' ? Number(value) || 0 : nextConfig.xuatToanDongY;
          const kdy = field === 'xuatToanKhongDongY' ? Number(value) || 0 : nextConfig.xuatToanKhongDongY;
          return { ...r, so_lieu: dy + kdy };
        }
        return r;
      });

      return {
        ...prev,
        config: nextConfig,
        rows: nextRows
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo STT hoặc nội dung chỉ tiêu..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <label className="flex items-center space-x-1.5 text-xs text-slate-600 mr-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFormulaTooltip}
              onChange={(e) => setShowFormulaTooltip(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
            />
            <span>Hiện nguồn công thức</span>
          </label>

          <button
            onClick={() => setEditingConfig(!editingConfig)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingConfig ? 'Đóng cấu hình' : 'Sửa tiêu đề'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / PDF</span>
          </button>

          <button
            onClick={onExportExcel}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel File 7</span>
          </button>
        </div>
      </div>

      {/* Editable Report Header Settings */}
      {editingConfig && (
        <div className="bg-brand-50/60 rounded-2xl p-5 border border-brand-200 text-xs space-y-4 no-print">
          <div className="flex items-center justify-between pb-2 border-b border-brand-200">
            <span className="font-bold text-brand-900 text-sm">Cấu hình tiêu đề & thông tin pháp lý báo cáo</span>
            <button
              onClick={() => setEditingConfig(false)}
              className="text-brand-700 font-semibold hover:underline"
            >
              Lưu & đóng
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Tiêu đề chính:</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => onUpdateConfig(p => ({ ...p, config: { ...p.config, title: e.target.value } }))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Tiêu đề phụ:</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => onUpdateConfig(p => ({ ...p, config: { ...p.config, subtitle: e.target.value } }))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-medium mb-1">Căn cứ / Kèm theo văn bản:</label>
              <input
                type="text"
                value={config.referenceDoc}
                onChange={(e) => onUpdateConfig(p => ({ ...p, config: { ...p.config, referenceDoc: e.target.value } }))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Official Report Paper View */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header matching File 7 */}
        <div className="text-center mb-8 border-b pb-6 border-slate-100">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {config.title || `BÁO CÁO THÁNG ${config.month}`}
          </h2>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            {config.subtitle || 'Hoạt động khám bệnh, chữa bệnh bảo hiểm y tế'}
          </p>
          <p className="text-xs italic text-slate-500 mt-1">
            {config.referenceDoc || '(Kèm theo Văn bản số         /SYT-BHYT&CNTT ngày 04/5/2026 của Sở Y tế Phú Thọ)'}
          </p>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse print-table text-xs">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 text-slate-800 font-bold">
                <th className="py-2.5 px-3 w-16 text-center">Stt</th>
                <th className="py-2.5 px-4">Nội dung</th>
                <th className="py-2.5 px-3 w-20 text-center">ĐVT</th>
                <th className="py-2.5 px-4 w-44 text-right">Số liệu</th>
                <th className="py-2.5 px-4 w-60">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((row) => {
                const isSectionHeader = row.level === 0;
                const isMajorSum = row.level === 1;
                const isSubSum = row.level === 2;
                const isSubItem = row.level === 3;
                const isLeafItem = row.level === 4;

                // Indentation styling
                let paddingLeft = 'pl-4';
                if (isSubSum) paddingLeft = 'pl-7';
                else if (isSubItem) paddingLeft = 'pl-10';
                else if (isLeafItem) paddingLeft = 'pl-14';

                // Row background
                let rowBg = 'hover:bg-slate-50/80 transition-colors';
                if (isSectionHeader) rowBg = 'bg-slate-200/90 font-bold text-slate-900';
                else if (isMajorSum) rowBg = 'bg-brand-50/50 font-bold text-slate-900';
                else if (isSubSum && row.is_summary) rowBg = 'bg-slate-50/70 font-semibold text-slate-800';

                // Check editable rows for sections 5 and 6
                const isEditableAmount = [103, 104, 106, 107].includes(row.row_id);
                const isEditableNote = [104, 107].includes(row.row_id);

                return (
                  <tr key={row.row_id} className={rowBg}>
                    {/* Col A: Stt */}
                    <td className={`py-2 px-3 text-center ${isSectionHeader ? 'font-black' : isMajorSum ? 'font-bold' : ''}`}>
                      {row.stt}
                    </td>

                    {/* Col B: Nội dung */}
                    <td className={`py-2 pr-3 ${paddingLeft}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={isSectionHeader ? 'text-sm font-extrabold uppercase text-brand-900' : isMajorSum ? 'font-bold text-slate-900' : isSubSum ? 'font-semibold text-slate-800' : 'text-slate-700'}>
                          {row.noi_dung}
                        </span>
                        {showFormulaTooltip && row.formula_desc && (
                          <span className="no-print text-slate-400 hover:text-brand-600 cursor-help" title={`Công thức: ${row.formula_desc}`}>
                            <HelpCircle className="w-3 h-3 inline" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Col C: ĐVT */}
                    <td className="py-2 px-3 text-center text-slate-600 font-medium">
                      {row.dvt}
                    </td>

                    {/* Col D: Số liệu */}
                    <td className={`py-2 px-4 text-right font-mono ${isSectionHeader ? '' : isMajorSum ? 'font-black text-slate-900 text-sm' : isSubSum ? 'font-bold text-slate-800' : 'text-slate-700'}`}>
                      {isEditableAmount ? (
                        <input
                          type="number"
                          value={row.so_lieu ?? 0}
                          onChange={(e) => {
                            if (row.row_id === 103) handleUpdateAdjustments('tuChoiDongY', e.target.value);
                            if (row.row_id === 104) handleUpdateAdjustments('tuChoiKhongDongY', e.target.value);
                            if (row.row_id === 106) handleUpdateAdjustments('xuatToanDongY', e.target.value);
                            if (row.row_id === 107) handleUpdateAdjustments('xuatToanKhongDongY', e.target.value);
                          }}
                          className="w-32 py-1 px-2 text-right bg-amber-50 border border-amber-300 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      ) : (
                        formatValueByDVT(row.so_lieu, row.dvt)
                      )}
                    </td>

                    {/* Col E: Ghi chú */}
                    <td className="py-2 px-4 text-slate-500 text-[11px]">
                      {isEditableNote ? (
                        <input
                          type="text"
                          value={row.ghi_chu}
                          placeholder="Ghi rõ lý do, căn cứ pháp lý..."
                          onChange={(e) => {
                            if (row.row_id === 104) handleUpdateAdjustments('tuChoiLyDo', e.target.value);
                            if (row.row_id === 107) handleUpdateAdjustments('xuatToanLyDo', e.target.value);
                          }}
                          className="w-full py-1 px-2 bg-amber-50 border border-amber-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      ) : (
                        <span>{row.ghi_chu}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Report Footer Signatures */}
        <div className="mt-12 pt-6 grid grid-cols-2 text-center text-xs text-slate-800 break-inside-avoid">
          <div>
            <p className="font-semibold uppercase">Người lập biểu</p>
            <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
            <div className="h-16" />
          </div>
          <div>
            <p className="italic text-slate-500">Phú Thọ, ngày ..... tháng ..... năm 2026</p>
            <p className="font-bold uppercase mt-1">Giám đốc đơn vị</p>
            <p className="text-[11px] text-slate-400 italic mt-0.5">(Ký, đóng dấu, ghi rõ họ tên)</p>
            <div className="h-16" />
          </div>
        </div>
      </div>
    </div>
  );
};
