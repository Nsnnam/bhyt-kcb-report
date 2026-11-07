import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { ReportTab } from './components/ReportTab';
import { CrossCheckTab } from './components/CrossCheckTab';
import { DrugCatalogTab } from './components/DrugCatalogTab';
import { DVKTCatalogTab } from './components/DVKTCatalogTab';
import { DocsTab } from './components/DocsTab';
import {
  DrugItem,
  DVKTItem,
  ProcessedReportData,
  ReportConfig,
  UploadedFileMetadata
} from './types';
import { DEFAULT_REPORT_CONFIG } from './utils/constants';
import {
  getDrugsCatalog,
  saveDrugsCatalog,
  getDVKTCatalog,
  saveDVKTCatalog,
  resetAllCatalogs,
  getSavedReport,
  saveReportData,
  getSavedConfig,
  saveConfig
} from './utils/storage';
import {
  detectFileType,
  parseExcelWorkbook,
  parseXML1Sheet,
  parseXML2Sheet,
  parseXML3Sheet,
  parse7980Sheet,
  parseDrugCatalogSheet,
  parseDVKTCatalogSheet,
  ParsedXML1Row,
  ParsedXML2Row,
  ParsedXML3Row,
  Parsed7980Row
} from './utils/excelParser';
import { calculateReport } from './utils/reportCalculator';
import { exportReportToExcel } from './utils/excelExporter';
import { getSampleProcessedReport } from './utils/sampleDataHelper';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);
  const [drugs, setDrugs] = useState<DrugItem[]>([]);
  const [dvkt, setDVKT] = useState<DVKTItem[]>([]);
  const [reportData, setReportData] = useState<ProcessedReportData | null>(null);

  // Uploaded Files State
  const [files, setFiles] = useState<Record<string, UploadedFileMetadata | null>>({
    xml1: null,
    xml2: null,
    xml3: null,
    report7980: null,
    drugCatalog: null,
    dvktCatalog: null
  });

  // Parsed row data in memory
  const [parsedRows, setParsedRows] = useState<{
    xml1: ParsedXML1Row[];
    xml2: ParsedXML2Row[];
    xml3: ParsedXML3Row[];
    report7980: Parsed7980Row[];
  }>({
    xml1: [],
    xml2: [],
    xml3: [],
    report7980: []
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 100, message: '' });

  // Initial load from IndexedDB
  useEffect(() => {
    async function init() {
      const [savedDrugs, savedDVKT, savedRep, savedCfg] = await Promise.all([
        getDrugsCatalog(),
        getDVKTCatalog(),
        getSavedReport(),
        getSavedConfig()
      ]);
      setDrugs(savedDrugs);
      setDVKT(savedDVKT);
      if (savedCfg) setConfig(savedCfg);
      if (savedRep) setReportData(savedRep);
    }
    init();
  }, []);

  // Handle File Uploads (Supports batch drag & drop)
  const handleFileUpload = async (fileList: FileList) => {
    setIsProcessing(true);
    const newFiles = { ...files };
    const newParsed = { ...parsedRows };

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setProcessProgress({
        current: Math.round(((i + 1) / fileList.length) * 100),
        total: 100,
        message: `Đang đọc tệp ${file.name}...`
      });

      try {
        const buffer = await file.arrayBuffer();
        const wb = parseExcelWorkbook(buffer);
        const firstSheet = wb.Sheets[wb.SheetNames[0]];

        // Sample headers
        const headerRows = parseExcelWorkbook(buffer.slice(0, 50000));
        const sampleSheet = headerRows.Sheets[headerRows.SheetNames[0]];
        const sampleJson = Object.keys(sampleSheet || {});

        const detected = detectFileType(file.name, sampleJson);

        const meta: UploadedFileMetadata = {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          detectedType: detected
        };

        if (detected === 'XML1') {
          const rows = parseXML1Sheet(firstSheet);
          meta.rowCount = rows.length;
          newFiles.xml1 = meta;
          newParsed.xml1 = rows;
        } else if (detected === 'XML2') {
          const rows = parseXML2Sheet(firstSheet);
          meta.rowCount = rows.length;
          newFiles.xml2 = meta;
          newParsed.xml2 = rows;
        } else if (detected === 'XML3') {
          const rows = parseXML3Sheet(firstSheet);
          meta.rowCount = rows.length;
          newFiles.xml3 = meta;
          newParsed.xml3 = rows;
        } else if (detected === 'REPORT_79_80') {
          const rows = parse7980Sheet(firstSheet);
          meta.rowCount = rows.length;
          newFiles.report7980 = meta;
          newParsed.report7980 = rows;
        } else if (detected === 'CATALOG_THUOC') {
          const items = parseDrugCatalogSheet(firstSheet);
          if (items.length > 0) {
            newFiles.drugCatalog = meta;
            setDrugs(items);
            await saveDrugsCatalog(items);
          }
        } else if (detected === 'CATALOG_DVKT') {
          const items = parseDVKTCatalogSheet(firstSheet);
          if (items.length > 0) {
            newFiles.dvktCatalog = meta;
            setDVKT(items);
            await saveDVKTCatalog(items);
          }
        } else {
          // If ambiguous, try detecting by content
          if (file.name.toLowerCase().includes('1.')) {
            newParsed.xml1 = parseXML1Sheet(firstSheet);
            meta.detectedType = 'XML1';
            newFiles.xml1 = meta;
          } else if (file.name.toLowerCase().includes('2.')) {
            newParsed.xml3 = parseXML3Sheet(firstSheet);
            meta.detectedType = 'XML3';
            newFiles.xml3 = meta;
          } else if (file.name.toLowerCase().includes('3.')) {
            newParsed.xml2 = parseXML2Sheet(firstSheet);
            meta.detectedType = 'XML2';
            newFiles.xml2 = meta;
          } else if (file.name.toLowerCase().includes('4.')) {
            newParsed.report7980 = parse7980Sheet(firstSheet);
            meta.detectedType = 'REPORT_79_80';
            newFiles.report7980 = meta;
          }
        }
      } catch (err) {
        console.error(`Lỗi đọc file ${file.name}:`, err);
        alert(`Không thể đọc file "${file.name}": ${String(err)}`);
      }
    }

    setFiles(newFiles);
    setParsedRows(newParsed);
    setIsProcessing(false);
  };

  const handleRemoveFile = (fileKey: string) => {
    setFiles((prev) => ({ ...prev, [fileKey]: null }));
    if (fileKey === 'xml1') setParsedRows((p) => ({ ...p, xml1: [] }));
    if (fileKey === 'xml2') setParsedRows((p) => ({ ...p, xml2: [] }));
    if (fileKey === 'xml3') setParsedRows((p) => ({ ...p, xml3: [] }));
    if (fileKey === 'report7980') setParsedRows((p) => ({ ...p, report7980: [] }));
  };

  // Run Calculation
  const handleProcess = () => {
    if (!files.xml1 || !files.xml2 || !files.xml3) {
      alert('Vui lòng tải đủ 3 tệp XML1, XML2 và XML3 để bắt đầu tổng hợp!');
      return;
    }

    setIsProcessing(true);
    setProcessProgress({ current: 20, total: 100, message: 'Đang tổng hợp dữ liệu XML1, XML2, XML3...' });

    setTimeout(async () => {
      try {
        const result = calculateReport(
          parsedRows.xml1,
          parsedRows.xml2,
          parsedRows.xml3,
          parsedRows.report7980,
          drugs,
          dvkt,
          config
        );

        setReportData(result);
        await saveReportData(result);
        await saveConfig(config);
        setIsProcessing(false);
        setActiveTab('report');
      } catch (err) {
        setIsProcessing(false);
        alert('Lỗi tính toán tổng hợp: ' + String(err));
      }
    }, 100);
  };

  // Load sample demo
  const handleLoadSample = async () => {
    setIsProcessing(true);
    setProcessProgress({ current: 50, total: 100, message: 'Đang tải bộ dữ liệu mẫu tháng 1/2026...' });
    setTimeout(async () => {
      const sample = getSampleProcessedReport();
      setReportData(sample);
      setConfig(sample.config);

      setFiles({
        xml1: { name: '1.XML1_20260101-20260131.xlsx', size: 3716265, lastModified: Date.now(), rowCount: 7864, detectedType: 'XML1' },
        xml2: { name: '3.XML2_20260101-20260131.xlsx', size: 6400235, lastModified: Date.now(), rowCount: 31135, detectedType: 'XML2' },
        xml3: { name: '2.XML3_20260101-20260131.xlsx', size: 14743803, lastModified: Date.now(), rowCount: 94812, detectedType: 'XML3' },
        report7980: { name: '4.7980a_26193_202601_GUIBHXH.xlsx', size: 1625267, lastModified: Date.now(), rowCount: 7864, detectedType: 'REPORT_79_80' },
        drugCatalog: { name: '5.Danh mục tham chiếu (Thuốc).xlsx', size: 178438, lastModified: Date.now(), detectedType: 'CATALOG_THUOC' },
        dvktCatalog: { name: '6.Danh mục tham chiếu (DVKT).xlsx', size: 2669399, lastModified: Date.now(), detectedType: 'CATALOG_DVKT' }
      });

      await saveReportData(sample);
      setIsProcessing(false);
      setActiveTab('dashboard');
    }, 250);
  };

  // Export Excel action
  const handleExportExcel = () => {
    if (!reportData) {
      alert('Chưa có dữ liệu báo cáo để xuất file!');
      return;
    }
    exportReportToExcel(reportData);
  };

  // Update drugs library and recalculate if data exists
  const handleSaveDrugs = async (newDrugs: DrugItem[]) => {
    setDrugs(newDrugs);
    await saveDrugsCatalog(newDrugs);
    if (parsedRows.xml1.length > 0 && parsedRows.xml2.length > 0 && parsedRows.xml3.length > 0) {
      const result = calculateReport(
        parsedRows.xml1,
        parsedRows.xml2,
        parsedRows.xml3,
        parsedRows.report7980,
        newDrugs,
        dvkt,
        config
      );
      setReportData(result);
      await saveReportData(result);
    }
  };

  // Update DVKT library and recalculate if data exists
  const handleSaveDVKT = async (newDVKT: DVKTItem[]) => {
    setDVKT(newDVKT);
    await saveDVKTCatalog(newDVKT);
    if (parsedRows.xml1.length > 0 && parsedRows.xml2.length > 0 && parsedRows.xml3.length > 0) {
      const result = calculateReport(
        parsedRows.xml1,
        parsedRows.xml2,
        parsedRows.xml3,
        parsedRows.report7980,
        drugs,
        newDVKT,
        config
      );
      setReportData(result);
      await saveReportData(result);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Bạn có chắc muốn khôi phục lại danh mục tham chiếu Thuốc và DVKT gốc của Sở Y tế? Mọi sửa đổi trước đó sẽ được đặt lại.')) {
      const { drugs: d, dvkt: dv } = await resetAllCatalogs();
      setDrugs(d);
      setDVKT(dv);
      alert('Đã khôi phục thành công danh mục gốc!');
    }
  };

  // Update report state safely
  const handleUpdateReport = (updater: (prev: ProcessedReportData) => ProcessedReportData) => {
    setReportData((prev) => {
      if (!prev) return null;
      const next = updater(prev);
      saveReportData(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        setConfig={setConfig}
        hasReportData={Boolean(reportData)}
        onExportExcel={handleExportExcel}
        onLoadSample={handleLoadSample}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            files={files}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            isProcessing={isProcessing}
            processProgress={processProgress}
            onProcess={handleProcess}
            onLoadSample={handleLoadSample}
            reportData={reportData}
            onNavigateToReport={() => setActiveTab('report')}
            onNavigateToCrossCheck={() => setActiveTab('crosscheck')}
          />
        )}

        {activeTab === 'report' && (
          <ReportTab
            reportData={reportData}
            onExportExcel={handleExportExcel}
            onUpdateConfig={handleUpdateReport}
          />
        )}

        {activeTab === 'crosscheck' && (
          <CrossCheckTab reportData={reportData} />
        )}

        {activeTab === 'drugs' && (
          <DrugCatalogTab
            drugs={drugs}
            onSaveDrugs={handleSaveDrugs}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {activeTab === 'dvkt' && (
          <DVKTCatalogTab
            dvkt={dvkt}
            onSaveDVKT={handleSaveDVKT}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {activeTab === 'docs' && <DocsTab />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 BHYT Analytics Portal • Chuẩn hóa theo Sở Y tế Phú Thọ & Bảo hiểm Xã hội Việt Nam</p>
          <p className="flex items-center gap-2">
            <span>Bản quyền dữ liệu y tế an toàn 100% tại Client (Trình duyệt)</span>
            <span>•</span>
            <span className="font-mono text-slate-400">Phiên bản 1.2.0</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
