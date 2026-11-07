import React, { useState } from 'react';
import {
  Stethoscope,
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
import { DVKTItem } from '../types';
import { DVKT_COST_CATEGORIES, DVKT_CLS_CATEGORIES } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

interface DVKTCatalogTabProps {
  dvkt: DVKTItem[];
  onSaveDVKT: (dvkt: DVKTItem[]) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const DVKTCatalogTab: React.FC<DVKTCatalogTabProps> = ({
  dvkt,
  onSaveDVKT,
  onResetDefaults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCostGroup, setSelectedCostGroup] = useState<string>('ALL');
  const [selectedClsGroup, setSelectedClsGroup] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30;

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DVKTItem | null>(null);
  const [formValues, setFormValues] = useState<Partial<DVKTItem>>({
    ma_dich_vu: '',
    ten_dich_vu: '',
    gia: 0,
    nhom_chi_phi: '',
    nhom_cls: ''
  });

  const filteredDVKT = dvkt.filter((d) => {
    const matchCost = selectedCostGroup === 'ALL' || d.nhom_chi_phi === selectedCostGroup;
    const matchCls = selectedClsGroup === 'ALL' || d.nhom_cls === selectedClsGroup;
    if (!matchCost || !matchCls) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.ma_dich_vu.toLowerCase().includes(term) ||
      (d.ten_dich_vu && d.ten_dich_vu.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredDVKT.length / pageSize) || 1;
  const paginatedDVKT = filteredDVKT.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormValues({
      ma_dich_vu: '',
      ten_dich_vu: '',
      gia: 0,
      nhom_chi_phi: 'Xét nghiệm khác:',
      nhom_cls: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DVKTItem) => {
    setEditingItem(item);
    setFormValues({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (code: string) => {
    if (confirm(`Bạn có chắc muốn xóa mã DVKT "${code}" khỏi danh mục?`)) {
      const next = dvkt.filter((d) => d.ma_dich_vu !== code);
      await onSaveDVKT(next);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.ma_dich_vu) {
      alert('Vui lòng nhập Mã dịch vụ!');
      return;
    }

    const code = formValues.ma_dich_vu.trim().toUpperCase();
    let next: DVKTItem[];

    if (editingItem) {
      next = dvkt.map((d) => (d.ma_dich_vu === editingItem.ma_dich_vu ? ({ ...d, ...formValues, ma_dich_vu: code } as DVKTItem) : d));
    } else {
      if (dvkt.some((d) => d.ma_dich_vu.toUpperCase() === code)) {
        alert('Mã dịch vụ này đã tồn tại trong danh mục!');
        return;
      }
      next = [formValues as DVKTItem, ...dvkt];
    }

    await onSaveDVKT(next);
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const wsData = [
      ['STT', 'Mã DVKT (MA_DICH_VU)', 'Tên dịch vụ kỹ thuật', 'Mức giá', 'Nhóm chi phí KCB (Cột T)', 'Chỉ tiêu CLS KCB (Cột U)'],
      ...dvkt.map((d, i) => [
        i + 1,
        d.ma_dich_vu,
        d.ten_dich_vu || '',
        d.gia || 0,
        d.nhom_chi_phi || '',
        d.nhom_cls || ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhMucDVKT');
    XLSX.writeFile(wb, 'DanhMuc_ThamChieu_DVKT_BHYT.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">
                Thư Viện Danh Mục Tham Chiếu DVKT (File số 6)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold">
                {dvkt.length} dịch vụ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ánh xạ mã kỹ thuật BHYT vào Cột T (Nhóm chi phí: Tiền khám, Giường, XN, CĐHA, PTTT) và Cột U (Chỉ tiêu lượt CLS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm DVKT</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={onResetDefaults}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-medium transition-colors"
              title="Khôi phục danh mục gốc của Sở Y tế"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Gốc</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo Mã DVKT hoặc Tên dịch vụ..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedCostGroup}
              onChange={(e) => {
                setSelectedCostGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Nhóm chi phí (Cột T)</option>
              {DVKT_COST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({dvkt.filter((d) => d.nhom_chi_phi === cat).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedClsGroup}
              onChange={(e) => {
                setSelectedClsGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Chỉ tiêu CLS (Cột U)</option>
              {DVKT_CLS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({dvkt.filter((d) => d.nhom_cls === cat).length})
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
                <th className="py-2.5 px-3 w-32 font-mono">Mã DVKT</th>
                <th className="py-2.5 px-4">Tên dịch vụ kỹ thuật</th>
                <th className="py-2.5 px-3 w-28 text-right">Mức giá</th>
                <th className="py-2.5 px-4 w-48">Nhóm chi phí (Cột T)</th>
                <th className="py-2.5 px-4 w-44">Chỉ tiêu CLS (Cột U)</th>
                <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDVKT.map((d, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr key={d.ma_dich_vu} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500">{globalIndex}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-brand-700">{d.ma_dich_vu}</td>
                    <td className="py-2 px-4 font-medium text-slate-900">{d.ten_dich_vu || '-'}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {d.gia ? formatCurrency(d.gia) : '-'}
                    </td>
                    <td className="py-2 px-4">
                      {d.nhom_chi_phi ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {d.nhom_chi_phi}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa gán</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {d.nhom_cls ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {d.nhom_cls}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
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
                          onClick={() => handleDelete(d.ma_dich_vu)}
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
              {paginatedDVKT.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy dịch vụ nào khớp với điều kiện tìm kiếm.
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
              {Math.min(currentPage * pageSize, filteredDVKT.length)} trên tổng {filteredDVKT.length} dịch vụ
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

      {/* Modal Add / Edit DVKT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-brand-600" />
                <span>{editingItem ? 'Sửa thông tin dịch vụ kỹ thuật' : 'Thêm DVKT mới'}</span>
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã DVKT (MA_DICH_VU): *</label>
                <input
                  type="text"
                  required
                  value={formValues.ma_dich_vu || ''}
                  onChange={(e) => setFormValues({ ...formValues, ma_dich_vu: e.target.value })}
                  placeholder="Ví dụ: 03.0001.0001"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên dịch vụ kỹ thuật:</label>
                <input
                  type="text"
                  value={formValues.ten_dich_vu || ''}
                  onChange={(e) => setFormValues({ ...formValues, ten_dich_vu: e.target.value })}
                  placeholder="Tên xét nghiệm, thủ thuật hoặc kỹ thuật y tế..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mức giá phê duyệt (VNĐ):</label>
                <input
                  type="number"
                  value={formValues.gia || 0}
                  onChange={(e) => setFormValues({ ...formValues, gia: Number(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nhóm chi phí báo cáo (Cột T File 6):</label>
                <select
                  value={formValues.nhom_chi_phi || ''}
                  onChange={(e) => setFormValues({ ...formValues, nhom_chi_phi: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="">-- Không phân loại chi phí --</option>
                  {DVKT_COST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Chỉ tiêu cận lâm sàng (Cột U File 6):</label>
                <select
                  value={formValues.nhom_cls || ''}
                  onChange={(e) => setFormValues({ ...formValues, nhom_cls: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="">-- Không tính vào chỉ tiêu CLS --</option>
                  {DVKT_CLS_CATEGORIES.map((cat) => (
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
