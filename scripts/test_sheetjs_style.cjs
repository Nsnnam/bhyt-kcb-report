const fs = require('fs');
const XLSX = require('xlsx');

const templatePath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const wb = XLSX.readFile(templatePath, { cellStyles: true });
const sheet = wb.Sheets[wb.SheetNames[0]];

// Modify D8
sheet['D8'] = { t: 'n', v: 1712 };
// Modify D7
sheet['D7'] = { t: 'n', f: 'D8+D17', v: 7864 };

XLSX.writeFile(wb, 'scripts/test_out_sheetjs.xlsx', { cellStyles: true });

// Now read it back and check if styles were preserved
const wbOut = XLSX.readFile('scripts/test_out_sheetjs.xlsx', { bookFiles: true });
console.log('test_out_sheetjs.xlsx styles.xml exists?', !!wbOut.files && !!wbOut.files['xl/styles.xml']);
