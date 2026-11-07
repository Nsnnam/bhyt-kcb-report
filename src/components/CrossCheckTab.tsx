import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  Download
} from 'lucide-react';
import { ProcessedReportData, UnmappedItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { exportCrossCheckToExcel } from '../utils/excelExporter';

interface CrossCheckTabProps {
  reportData: ProcessedReportData | null;
  onAddDrugToCatalog?: (code: string) => void;
  onAddDVKTToCatalog?: (code: string) => void;
}

export const CrossCheckTab: React.FC<CrossCheckTabProps> = ({
  reportData,
  onAddDrugToCatalog,
  onAddDVKTToCatalog
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MISMATCH' | 'MATCH'>('ALL');

  if (!reportData) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="mx-auto w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
          <FileCheck2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Chưa có dữ liệu đối chiếu</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
          Vui lòng tải thêm tệp File 4 (7980a) và tổng hợp báo cáo để xem bảng đối chiếu chéo số liệu.
        </p>
      </div>
    );
  }

  const { crossCheckResults, unmappedDrugs, unmappedDVKT } = reportData;

  const filteredChecks = crossCheckResults.filter((c) => {
    if (selectedFilter === 'MATCH') return c.status === 'MATCH';
    if (selectedFilter === 'MISMATCH') return c.status === 'MISMATCH';
    return true;
  });

  const totalMatches = crossCheckResults.filter(c => c.status === 'MATCH').length;
  const totalMismatches = crossCheckResults.filter(c => c.status === 'MISMATCH').length;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng chỉ tiêu đối chiếu</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{crossCheckResults.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">So khớp XML vs Báo cáo 79/80</p>
          </div>
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase">Khớp chính xác 100%</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{totalMatches}</div>
            <p className="text-[11px] text-emerald-600 mt-0.5">Không có chênh lệch</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Chỉ tiêu có chênh lệch</span>
            <div className={`text-2xl font-black mt-1 ${totalMismatches > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {totalMismatches}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalMismatches > 0 ? 'Cần kiểm tra lại mã ánh xạ' : 'Dữ liệu hoàn toàn khớp'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${totalMismatches > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <span>Bảng Đối Chiếu Chéo Chi Phí: XML1/2/3 vs Mẫu 79a/80a</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Xác thực tính toàn vẹn và mức độ chính xác giữa dữ liệu chi tiết XML và số liệu tổng hợp BHYT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({crossCheckResults.length})
              </button>
              <button
                onClick={() => setSelectedFilter('MATCH')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedFilter === 'MATCH' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khớp ({totalMatches})
              </button>
              <button
                onClick={() => setSelectedFilter('MISMATCH')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedFilter === 'MISMATCH' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lệch ({totalMismatches})
              </button>
            </div>

            <button
              onClick={() => exportCrossCheckToExcel(reportData)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              title="Xuất bảng đối chiếu chéo ra file Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Xuất Excel Đối Chiếu</span>
            </button>
          </div>
        </div>

        {crossCheckResults.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <p>Chưa có tệp <strong>4.7980a</strong> nào được nạp. Hãy tải thêm tệp số 4 để kích hoạt tính năng đối chiếu chéo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                  <th className="py-2.5 px-3">Chỉ tiêu chi phí</th>
                  <th className="py-2.5 px-3 text-right">XML Nội trú</th>
                  <th className="py-2.5 px-3 text-right">79/80 Nội trú</th>
                  <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                  <th className="py-2.5 px-3 text-right">XML Ngoại trú</th>
                  <th className="py-2.5 px-3 text-right">79/80 Ngoại trú</th>
                  <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                  <th className="py-2.5 px-3 text-right">Tổng XML</th>
                  <th className="py-2.5 px-3 text-right">Tổng 79/80</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredChecks.map((item, idx) => {
                  const isMatch = item.status === 'MATCH';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{item.label}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.xml_noi)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(item.r4_noi)}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-semibold ${item.diff_noi !== 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {item.diff_noi === 0 ? '-' : formatCurrency(item.diff_noi)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.xml_ngoai)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(item.r4_ngoai)}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-semibold ${item.diff_ngoai !== 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {item.diff_ngoai === 0 ? '-' : formatCurrency(item.diff_ngoai)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.xml_total)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">{formatCurrency(item.r4_total)}</td>
                      <td className="py-2.5 px-3 text-center">
                        {isMatch ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Khớp
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Lệch
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unmapped Items Inspector */}
      {(unmappedDrugs.length > 0 || unmappedDVKT.length > 0) && (
        <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Phát hiện mã phát sinh chưa có trong Thư viện Danh mục</span>
          </h4>
          <p className="text-xs text-amber-800 mt-1">
            Một số mã thuốc hoặc dịch vụ kỹ thuật trong file XML chưa được gán nhóm chi phí báo cáo. Bạn có thể bấm thêm nhanh vào danh mục để hoàn thiện phân loại.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {unmappedDrugs.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-slate-800">Mã thuốc chưa phân nhóm ({unmappedDrugs.length})</span>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {unmappedDrugs.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded">
                      <span className="font-mono font-semibold text-slate-800">{d.code}</span>
                      <span className="text-slate-500 font-mono">{formatCurrency(d.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unmappedDVKT.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-slate-800">Mã DVKT chưa phân nhóm ({unmappedDVKT.length})</span>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {unmappedDVKT.map((dv, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded">
                      <span className="font-mono font-semibold text-slate-800">{dv.code}</span>
                      <span className="text-slate-500 font-mono">{formatCurrency(dv.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
