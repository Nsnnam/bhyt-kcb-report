import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DrugItem } from '../types';
import { DRUG_CATEGORIES } from '../utils/constants';

interface DrugCatalogTabProps {
  drugs: DrugItem[];
  onSaveDrugs: (drugs: DrugItem[]) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const DrugCatalogTab: React.FC<DrugCatalogTabProps> = ({
  drugs,
  onSaveDrugs,
  onResetDefaults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DrugItem | null>(null);
  const [formValues, setFormValues] = useState<Partial<DrugItem>>({
    ma_thuoc: '',
    ten_hoat_chat: '',
    ten_thuoc: '',
    nhom_bao_cao: 'Tiền thuốc khác',
    don_vi_tinh: '',
    ham_luong: ''
  });

  const filteredDrugs = drugs.filter((d) => {
    const matchGroup = selectedGroup === 'ALL' || d.nhom_bao_cao === selectedGroup;
    if (!matchGroup) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.ma_thuoc.toLowerCase().includes(term) ||
      (d.ten_hoat_chat && d.ten_hoat_chat.toLowerCase().includes(term)) ||
      (d.ten_thuoc && d.ten_thuoc.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredDrugs.length / pageSize) || 1;
  const paginatedDrugs = filteredDrugs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormValues({
      ma_thuoc: '',
      ten_hoat_chat: '',
      ten_thuoc: '',
      nhom_bao_cao: 'Tiền thuốc khác',
      don_vi_tinh: '',
      ham_luong: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DrugItem) => {
    setEditingItem(item);
    setFormValues({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (ma_thuoc: string) => {
    if (confirm(`Bạn có chắc muốn xóa mã thuốc "${ma_thuoc}" khỏi danh mục?`)) {
      const next = drugs.filter((d) => d.ma_thuoc !== ma_thuoc);
      await onSaveDrugs(next);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.ma_thuoc) {
      alert('Vui lòng nhập Mã thuốc!');
      return;
    }

    const code = formValues.ma_thuoc.trim().toUpperCase();
    let next: DrugItem[];

    if (editingItem) {
      next = drugs.map((d) => (d.ma_thuoc === editingItem.ma_thuoc ? ({ ...d, ...formValues, ma_thuoc: code } as DrugItem) : d));
    } else {
      if (drugs.some((d) => d.ma_thuoc.toUpperCase() === code)) {
        alert('Mã thuốc này đã tồn tại trong danh mục!');
        return;
      }
      next = [formValues as DrugItem, ...drugs];
    }

    await onSaveDrugs(next);
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const wsData = [
      ['STT', 'Mã thuốc', 'Tên hoạt chất', 'Tên thuốc', 'ĐVT', 'Hàm lượng', 'Nhóm thuốc báo cáo'],
      ...drugs.map((d, i) => [
        i + 1,
        d.ma_thuoc,
        d.ten_hoat_chat || '',
        d.ten_thuoc || '',
        d.don_vi_tinh || '',
        d.ham_luong || '',
        d.nhom_bao_cao
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhMucThuoc');
    XLSX.writeFile(wb, 'DanhMuc_ThamChieu_Thuoc_BHYT.xlsx');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
        if (json.length < 2) return;

        const imported: DrugItem[] = [];
        const headers = json[0].map((h: any) => String(h || '').trim().toLowerCase());
        const codeIdx = headers.findIndex((h: string) => h.includes('mã thuốc') || h.includes('ma_thuoc'));
        const nameIdx = headers.findIndex((h: string) => h.includes('tên thuốc') || h.includes('ten_thuoc'));
        const hcIdx = headers.findIndex((h: string) => h.includes('hoạt chất') || h.includes('ten_hoat_chat'));
        const groupIdx = headers.findIndex((h: string) => h.includes('nhóm thuốc') || h.includes('nhom_bao_cao'));

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          const code = String(row[codeIdx !== -1 ? codeIdx : 1] || '').trim();
          if (!code) continue;

          imported.push({
            ma_thuoc: code,
            ten_thuoc: nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '',
            ten_hoat_chat: hcIdx !== -1 ? String(row[hcIdx] || '').trim() : '',
            nhom_bao_cao: groupIdx !== -1 ? String(row[groupIdx] || '').trim() : 'Tiền thuốc khác'
          });
        }

        if (imported.length > 0) {
          if (confirm(`Tìm thấy ${imported.length} thuốc từ file Excel. Bạn có muốn cập nhật danh mục?`)) {
            await onSaveDrugs(imported);
          }
        }
      } catch (err) {
        alert('Lỗi đọc file Excel: ' + String(err));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Thư Viện Danh Mục Tham Chiếu Thuốc (File số 5)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                {drugs.length} mục
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phân loại thuốc BHYT theo các nhóm báo cáo: Kháng sinh, Ung thư, Corticoid, Dịch truyền, Vitamin, YHCT, Thuốc khác, Máu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm thuốc</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập Excel</span>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            </label>

            <button
              onClick={onResetDefaults}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-medium transition-colors"
              title="Khôi phục danh mục chuẩn của Sở Y tế"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Gốc</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo Mã thuốc, Tên thuốc, Hoạt chất..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả nhóm báo cáo ({drugs.length})</option>
              {DRUG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({drugs.filter((d) => d.nhom_bao_cao === cat).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3 w-28 font-mono">Mã thuốc</th>
                <th className="py-2.5 px-4">Tên thuốc</th>
                <th className="py-2.5 px-4">Hoạt chất</th>
                <th className="py-2.5 px-3 w-20">ĐVT</th>
                <th className="py-2.5 px-4">Nhóm báo cáo</th>
                <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDrugs.map((d, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr key={d.ma_thuoc} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500">{globalIndex}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-brand-700">{d.ma_thuoc}</td>
                    <td className="py-2 px-4 font-medium text-slate-900">{d.ten_thuoc || '-'}</td>
                    <td className="py-2 px-4 text-slate-600">{d.ten_hoat_chat || '-'}</td>
                    <td className="py-2 px-3 text-slate-500">{d.don_vi_tinh || '-'}</td>
                    <td className="py-2 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {d.nhom_bao_cao}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.ma_thuoc)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedDrugs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy thuốc nào khớp với điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
            <span>
              Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredDrugs.length)} trên tổng {filteredDrugs.length} thuốc
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Trước
              </button>
              <span className="px-3 font-semibold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Drug */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-rose-600" />
                <span>{editingItem ? 'Sửa thông tin thuốc' : 'Thêm thuốc vào thư viện'}</span>
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã thuốc (MA_THUOC): *</label>
                <input
                  type="text"
                  required
                  value={formValues.ma_thuoc || ''}
                  onChange={(e) => setFormValues({ ...formValues, ma_thuoc: e.target.value })}
                  placeholder="Ví dụ: 40.1021 hoặc 2.7.KTNAT"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên thuốc:</label>
                <input
                  type="text"
                  value={formValues.ten_thuoc || ''}
                  onChange={(e) => setFormValues({ ...formValues, ten_thuoc: e.target.value })}
                  placeholder="Ví dụ: Natri clorid 0,9%"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên hoạt chất:</label>
                <input
                  type="text"
                  value={formValues.ten_hoat_chat || ''}
                  onChange={(e) => setFormValues({ ...formValues, ten_hoat_chat: e.target.value })}
                  placeholder="Ví dụ: Trimetazidin"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Đơn vị tính:</label>
                  <input
                    type="text"
                    value={formValues.don_vi_tinh || ''}
                    onChange={(e) => setFormValues({ ...formValues, don_vi_tinh: e.target.value })}
                    placeholder="Viên, Lọ, Túi..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hàm lượng:</label>
                  <input
                    type="text"
                    value={formValues.ham_luong || ''}
                    onChange={(e) => setFormValues({ ...formValues, ham_luong: e.target.value })}
                    placeholder="Ví dụ: 20mg"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nhóm thuốc báo cáo (Cột AJ File 5): *</label>
                <select
                  value={formValues.nhom_bao_cao}
                  onChange={(e) => setFormValues({ ...formValues, nhom_bao_cao: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {DRUG_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
