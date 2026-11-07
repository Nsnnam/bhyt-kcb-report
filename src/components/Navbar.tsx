import React from 'react';
import {
  FileSpreadsheet,
  BarChart3,
  FileCheck2,
  Pill,
  Stethoscope,
  BookOpen,
  Download,
  Calendar,
  Building2,
  Sparkles
} from 'lucide-react';
import { ReportConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: ReportConfig;
  setConfig: React.Dispatch<React.SetStateAction<ReportConfig>>;
  hasReportData: boolean;
  onExportExcel: () => void;
  onLoadSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  setConfig,
  hasReportData,
  onExportExcel,
  onLoadSample
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Tổng quan & Tải tệp', icon: BarChart3 },
    { id: 'report', label: 'Báo cáo KCB BHYT', icon: FileSpreadsheet, badge: hasReportData ? 'Sẵn sàng' : undefined },
    { id: 'crosscheck', label: 'Đối chiếu chéo (79/80)', icon: FileCheck2 },
    { id: 'drugs', label: 'Thư viện Thuốc', icon: Pill },
    { id: 'dvkt', label: 'Thư viện DVKT', icon: Stethoscope },
    { id: 'docs', label: 'Hướng dẫn & Phiên bản', icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm no-print">
      {/* Top Banner */}
      <div className="bg-brand-900 text-white px-4 py-1.5 text-xs flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Building2 className="w-3.5 h-3.5 text-brand-300" />
          <span className="font-semibold text-brand-100 uppercase tracking-wide">
            Cổng nghiệp vụ giám định & tổng hợp dữ liệu BHYT
          </span>
          <span className="hidden sm:inline text-brand-400">|</span>
          <span className="hidden sm:inline text-brand-300">Chuẩn hóa dữ liệu theo Sở Y tế Phú Thọ & Bộ Y tế</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onLoadSample}
            className="flex items-center space-x-1 bg-brand-700/80 hover:bg-brand-600 text-white px-2.5 py-0.5 rounded-full transition-colors text-[11px] font-medium"
            title="Tải nhanh dữ liệu mẫu thực tế tháng 1/2026"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Nạp dữ liệu mẫu</span>
          </button>
          <span className="bg-brand-800 text-brand-200 px-2 py-0.5 rounded text-[11px] font-mono">
            v1.2.0
          </span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-brand-700 to-medteal-500 text-white p-2.5 rounded-xl shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>BHYT Analytics Portal</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-md border border-blue-200">
                  Phú Thọ
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Tổng hợp báo cáo khám chữa bệnh BHYT tự động từ XML 1-2-3 & Danh mục
              </p>
            </div>
          </div>

          {/* Month/Year selector & Global Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1.5" />
              <span className="text-slate-500 mr-1 hidden sm:inline">Kỳ báo cáo:</span>
              <select
                value={config.month}
                onChange={(e) => setConfig({ ...config, month: parseInt(e.target.value) || 1 })}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <span className="text-slate-400">/</span>
              <select
                value={config.year}
                onChange={(e) => setConfig({ ...config, year: parseInt(e.target.value) || 2026 })}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer pl-1"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {hasReportData && (
              <button
                onClick={onExportExcel}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất Excel (File 7)</span>
                <span className="sm:hidden">Xuất Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-px border-t border-slate-100 text-xs font-medium">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-brand-600 text-brand-700 font-semibold bg-brand-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
