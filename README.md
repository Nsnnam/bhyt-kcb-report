# BHYT Analytics Portal - Hệ Thống Tổng Hợp Báo Cáo KCB BHYT

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/Nsnnam/bhyt-kcb-report)
[![Deployment](https://img.shields.io/badge/deploy-GitHub%20Pages-success.svg)](https://nsnnam.github.io/bhyt-kcb-report/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20Client-teal.svg)](https://nsnnam.github.io/bhyt-kcb-report/)

> **Ứng dụng web chuyên sâu tổng hợp Báo cáo Khám chữa bệnh Bảo hiểm Y tế (BHYT)** tự động từ các tệp XML1, XML2, XML3, đối chiếu với Báo cáo 79/80a và ánh xạ qua Thư viện Danh mục tham chiếu Thuốc & Dịch vụ kỹ thuật theo mẫu chuẩn của **Sở Y tế Phú Thọ & Bảo hiểm Xã hội Việt Nam**.

🔗 **Trang web chạy trực tiếp (Live Demo):** [https://nsnnam.github.io/bhyt-kcb-report/](https://nsnnam.github.io/bhyt-kcb-report/)

---

## 🌟 Điểm Nổi Bật & Tính Năng Cốt Lõi

1. **Xử lý 100% Client-Side (Bảo mật Y tế Tuyệt đối):**
   - Toàn bộ thuật toán bóc tách dữ liệu XML và tính toán đều chạy trực tiếp trên trình duyệt của người dùng.
   - **Tuyệt đối không gửi dữ liệu bệnh nhân hay thông tin thẻ BHYT lên server trung gian**, đáp ứng 100% tiêu chuẩn bảo mật y tế và quy định của Bộ Y tế.
2. **Hỗ trợ trọn bộ 7 tệp dữ liệu nghiệp vụ:**
   - **Tệp 1 (XML1):** Bảng chỉ tiêu tổng hợp khám chữa bệnh BHYT (Lượt KCB nội/ngoại trú, ngày điều trị, số tiền BHYT thanh toán).
   - **Tệp 2 (XML3):** Bảng chỉ tiêu dịch vụ kỹ thuật và vật tư y tế (Số lượt CLS, chi phí tiền khám, giường, XN, CĐHA, PTTT, VTYT).
   - **Tệp 3 (XML2):** Bảng chỉ tiêu thuốc thanh toán BHYT (Chi phí kháng sinh, ung thư, corticoid, dịch truyền, vitamin, YHCT, thuốc khác, máu).
   - **Tệp 4 (79/80a):** Báo cáo thống kê chi phí KCB BHYT ngoại trú/nội trú gửi cơ quan BHXH.
   - **Tệp 5 (DM Thuốc):** Thư viện tham chiếu phân nhóm thuốc báo cáo (Hỗ trợ Thêm, Sửa, Xóa, Nhập/Xuất Excel).
   - **Tệp 6 (DM DVKT):** Thư viện tham chiếu phân nhóm chi phí và chỉ tiêu cận lâm sàng (Hỗ trợ Thêm, Sửa, Xóa, Nhập/Xuất Excel).
   - **Tệp 7 (Báo cáo KCB BHYT):** Mẫu đầu ra hoàn chỉnh được tổng hợp tự động với đầy đủ định dạng và công thức Excel động.
3. **Thư viện danh mục lưu trữ bền vững (IndexedDB):**
   - Đã nạp sẵn hơn **768 loại thuốc** và **7.340 dịch vụ kỹ thuật** chuẩn hóa.
   - Mọi thay đổi thêm/sửa/xóa của người dùng được tự động lưu vào bộ nhớ IndexedDB của trình duyệt, không bị mất khi tải lại trang.
4. **Đối chiếu chéo tự động (Cross-check 79/80):**
   - Tự động so sánh từng mục chi phí giữa tổng hợp từ XML và Mẫu 79/80a.
   - Cảnh báo trực quan các mục khớp chính xác hoặc có chênh lệch.
   - Tự động phát hiện các mã thuốc hoặc DVKT mới phát sinh chưa có trong danh mục.
5. **Xuất Excel Chuẩn Sở Y Tế:**
   - Xuất file `.xlsx` giữ nguyên 100% công thức chuẩn Excel (`=D8+D17`, `=D9/D8`, `=SUM(...)`, `=D25/D8`...).
   - Đúng cấu trúc cột, độ rộng, định dạng tiền tệ và phần trăm của Văn bản hướng dẫn Sở Y tế Phú Thọ.

---

## 🏗️ Kiến Trúc Kỹ Thuật

```
bhyt-kcb-report/
├── public/
│   └── data/                    # Dữ liệu danh mục tham chiếu JSON mặc định
│       ├── thuoc_default.json   # 768 thuốc BHYT đã phân nhóm
│       └── dvkt_default.json    # 7.340 dịch vụ kỹ thuật đã ánh xạ Cột T & U
├── src/
│   ├── components/              # Giao diện người dùng module hóa
│   │   ├── Navbar.tsx           # Thanh điều hướng, bộ chọn kỳ báo cáo
│   │   ├── DashboardTab.tsx     # Bảng điều khiển KPI, khu vực tải tệp kéo thả
│   │   ├── ReportTab.tsx        # Bảng hiển thị Báo cáo File 7, xuất Excel & in ấn
│   │   ├── CrossCheckTab.tsx    # Bảng đối chiếu chéo XML vs 79/80a
│   │   ├── DrugCatalogTab.tsx   # Quản lý CRUD Thư viện Thuốc (File 5)
│   │   ├── DVKTCatalogTab.tsx   # Quản lý CRUD Thư viện DVKT (File 6)
│   │   └── DocsTab.tsx          # Hướng dẫn chi tiết & Lịch sử phiên bản
│   ├── utils/                   # Bộ máy xử lý nghiệp vụ & tính toán
│   │   ├── constants.ts         # Danh sách danh mục, cấu hình mặc định
│   │   ├── excelParser.ts       # Bộ đọc & bóc tách tệp Excel tối ưu bộ nhớ
│   │   ├── reportCalculator.ts  # Bộ máy tính toán và phân bổ chỉ tiêu
│   │   ├── excelExporter.ts     # Trình tạo file Excel File 7 giữ nguyên công thức
│   │   ├── storage.ts           # Tầng lưu trữ IndexedDB bền vững
│   │   └── formatters.ts        # Định dạng tiền tệ, ngày tháng, phần trăm
│   ├── types/                   # Định nghĩa kiểu dữ liệu TypeScript
│   └── App.tsx                  # Điều phối trạng thái toàn cục ứng dụng
└── .github/workflows/deploy.yml # CI/CD tự động build & deploy lên GitHub Pages
```

---

## 📋 Bảng Đối Chiếu Chỉ Tiêu Nghiệp Vụ (File 7)

| STT | Tên chỉ tiêu | ĐVT | Công thức & Nguồn dữ liệu |
| :--- | :--- | :---: | :--- |
| **I** | **Số liệu KCB BHYT** | | |
| 1 | Tổng số lượt KCB BHYT | Lượt | `= 1.1 + 1.2` |
| 1.1 | Tổng số lượt NB điều trị nội trú | Lượt | Đếm số dòng XML1 có `MA_LOAI_KCB` là `03` hoặc `09` |
| 1.1.1 | Tổng số ngày điều trị nội trú | Ngày | Tổng cột `SO_NGAY_DTRI` XML1 khi `MA_LOAI_KCB` là `03;09` |
| 1.1.2 | Bình quân ngày điều trị nội trú | Ngày | `= D9 / D8` |
| 1.1.3 | Tỷ lệ vào điều trị nội trú | % | `= D8 / D7` |
| 1.1.4.1 | Số lượt xét nghiệm (nội trú) | Lượt | XML3 cột `SO_LUONG` theo DMKT Cột U: "Số lượt xét nghiệm" |
| 1.1.4.2 | Số lượt chụp X-Quang (nội trú) | Lượt | XML3 cột `SO_LUONG` theo DMKT Cột U: "Số lượt chụp X-Quang" |
| 1.1.4.3 | Số lượt siêu âm (nội trú) | Lượt | XML3 cột `SO_LUONG` theo DMKT Cột U: "Số lượt siêu âm" |
| 1.1.4.4 | Số lượt chụp CT/MRI (nội trú) | Lượt | XML3 cột `SO_LUONG` theo DMKT Cột U: "Số lượt chụp CT/MRI" |
| 1.2 | Tổng số lượt NB khám ngoại trú | Lượt | Đếm số dòng XML1 có `MA_LOAI_KCB` là `01;02;05;07` |
| 1.2.1 | Hoạt động CLS ngoại trú (1-4) | Lượt | Tương tự nội trú, lọc theo bệnh nhân ngoại trú |
| **II** | **Số liệu Chi phí KCB BHYT** | | |
| 1 | Tổng chi phí KCB BHYT chi trả | Đồng | `= Chi nội trú (1.1) + Chi ngoại trú (1.2)` |
| 1.1 | Chi cho KCB nội trú | Đồng | `= 3.1` (Tổng cơ cấu chi nội trú) |
| 1.2 | Chi cho KCB ngoại trú | Đồng | `= 3.2` (Tổng cơ cấu chi ngoại trú) |
| 2.1 | Chi phí BQ KCB Nội trú | Đồng | `= Chi nội trú / Số lượt nội trú` |
| 2.2 | Chi phí BQ KCB Ngoại trú | Đồng | `= Chi ngoại trú / Số lượt ngoại trú` |
| 3.1.1 | Tiền khám nội trú | Đồng | XML3 `THANH_TIEN_BV` tham chiếu DMKT Cột T: "Tiền khám" |
| 3.1.2 | Tiền giường nội trú | Đồng | XML3 `THANH_TIEN_BV` tham chiếu DMKT Cột T: "Tiền giường" |
| 3.1.3 | Xét nghiệm nội trú | Đồng | Tổng 5 nhóm: Hóa sinh, Huyết học, Vi sinh, GPB, XN khác |
| 3.1.4 | Chẩn đoán hình ảnh nội trú | Đồng | Tổng 7 nhóm: X-Quang, CT, MRI, Siêu âm, Nội soi TH, Nội soi TMH, Khác |
| 3.1.5 | Thuốc, dịch truyền nội trú | Đồng | Tổng 7 nhóm thuốc từ XML2 tham chiếu DM Thuốc Cột AJ |
| 3.1.6 | Máu nội trú | Đồng | XML2 tham chiếu DM Thuốc Cột AJ: "Máu" |
| 3.1.7 | Phẫu thuật, thủ thuật nội trú | Đồng | Tổng 5 nhóm PTTT: Đặc biệt, Loại I, Loại II, Loại III, PTTT khác |
| 3.1.8 | Vật tư y tế nội trú | Đồng | XML3 `THANH_TIEN_BV` của tất cả các dòng có cột `MA_VAT_TU` |
| 3.2 | Cơ cấu chi ngoại trú | Đồng | Tương tự nội trú, lọc theo hồ sơ ngoại trú |
| 4 | Tổng chi đề nghị BHXH thanh toán | Đồng | `= 4.1 + 4.2` (Tổng cột `T_BHTT` từ XML1) |
| 5 & 6 | BHXH từ chối / xuất toán | Đồng | Cho phép nhập số tiền đơn vị đồng ý / không đồng ý và lý do |

---

## 🚀 Hướng Dẫn Sử Dụng Nhanh

### Cách 1: Trải nghiệm tức thì với Dữ liệu mẫu (1 Click)
1. Truy cập [https://nsnnam.github.io/bhyt-kcb-report/](https://nsnnam.github.io/bhyt-kcb-report/).
2. Bấm nút **"Nạp dữ liệu mẫu"** ở góc trên thanh công cụ hoặc trên banner.
3. Toàn bộ các chỉ tiêu thực tế tháng 1/2026 sẽ được nạp ngay lập tức, hiển thị đầy đủ bảng KPI, cơ cấu chi phí, bảng đối chiếu 79/80 và cho phép xuất file Excel ngay!

### Cách 2: Tải tệp thực tế của đơn vị
1. Mở tab **"Tổng quan & Tải tệp"**.
2. Kéo thả các file Excel từ thư mục máy tính của bạn vào khung tải tệp:
   - File 1 (XML1)
   - File 2 (XML3)
   - File 3 (XML2)
   - File 4 (79/80a - Tùy chọn để đối chiếu chéo)
   - File 5 & 6 (Nếu có danh mục mới muốn ghi đè)
3. Bấm **"Tổng Hợp Báo Cáo KCB BHYT"**.
4. Chuyển sang tab **"Báo cáo KCB BHYT"** để kiểm tra số liệu, điều chỉnh số liệu xuất toán nếu có và bấm **"Xuất Excel File 7"**.

---

## 📜 Lịch Sử Phiên Bản Tăng Dần (Semantic Versioning)

### **v1.2.0 (07/11/2026) - Bản phát hành chính thức**
- **Mới:** Tích hợp Bảng Đối Chiếu Chéo tự động giữa XML và Báo cáo 79/80a (File 4).
- **Mới:** Bộ kiểm tra mã phát sinh: cảnh báo các mã thuốc/DVKT chưa có trong danh mục.
- **Mới:** Xuất file Excel (.xlsx) chuẩn Sở Y tế với công thức động (SUM, phép chia BQ, tỷ lệ %).
- **Mới:** Tích hợp bộ dữ liệu mẫu thực nghiệm tháng 1/2026 để demo 1-click.
- **Cải tiến:** Tối ưu hóa bộ nhớ đệm giúp đọc tệp XML3 dung lượng >15MB chỉ trong vài giây.
- **Triển khai:** Tự động build và host trực tiếp trên GitHub Pages qua GitHub Actions.

### **v1.1.0 (06/11/2026)**
- **Mới:** Giao diện Quản lý thư viện danh mục Thuốc (File 5) và DVKT (File 6) với đầy đủ CRUD (Thêm, Sửa, Xóa).
- **Mới:** Tầng lưu trữ bền vững IndexedDB giúp duy trì danh mục đã sửa đổi giữa các phiên làm việc.
- **Mới:** Bộ lọc danh mục theo Nhóm chi phí (Cột T) và Chỉ tiêu cận lâm sàng (Cột U).
- **Mới:** Tính năng Nhập/Xuất Excel cho từng thư viện danh mục.

### **v1.0.0 (05/11/2026)**
- **Khởi tạo:** Thiết kế kiến trúc SPA trên React 19, TypeScript, Tailwind CSS.
- **Lõi:** Thuật toán bóc tách dữ liệu XML1, XML2, XML3 theo chuẩn Quyết định 4210/QĐ-BYT.
- **Báo cáo:** Xây dựng cấu trúc bảng Báo cáo KCB BHYT (File 7) theo biểu mẫu Sở Y tế Phú Thọ.

---

## 💻 Cài Đặt & Chạy Cục Bộ (Local Development)

Yêu cầu môi trường: **Node.js >= 18.x** và **npm >= 9.x**.

```bash
# 1. Clone mã nguồn về máy
git clone https://github.com/Nsnnam/bhyt-kcb-report.git
cd bhyt-kcb-report

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển
npm run dev
# Mở trình duyệt tại: http://localhost:5173

# 4. Kiểm tra TypeScript & Đóng gói sản phẩm
npm run build

# 5. Triển khai thủ công lên GitHub Pages (nếu cần)
npm run deploy
```

---

## 📄 Bản Quyền & Giấy Phép

Phát triển bởi đội ngũ kỹ thuật y tế vì mục tiêu chuẩn hóa và tự động hóa quy trình giám định - thanh quyết toán BHYT.
Mã nguồn được phân phối dưới giấy phép **MIT License**.
