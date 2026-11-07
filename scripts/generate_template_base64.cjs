const fs = require('fs');

const srcPath = 'C:/Users/Admin/Downloads/Hồ sơ gửi Nam/7.Báo cáo KCB BHYT.xlsx';
const buf = fs.readFileSync(srcPath);
const base64 = buf.toString('base64');

// 1. Write src/utils/templateBase64.ts
const tsContent = `// Base64 representation of official template "7.Báo cáo KCB BHYT.xlsx"
// Used to ensure 100% exact styling, fonts, borders, merges, formulas, and column widths
export const TEMPLATE_FILE_7_BASE64 = "${base64}";
`;
fs.writeFileSync('src/utils/templateBase64.ts', tsContent, 'utf-8');
console.log('Created src/utils/templateBase64.ts with size:', tsContent.length);

// 2. Ensure public/template directory exists
if (!fs.existsSync('public/template')) {
  fs.mkdirSync('public/template', { recursive: true });
}
fs.writeFileSync('public/template/7.Bao_cao_KCB_BHYT_Template.xlsx', buf);
console.log('Copied to public/template/7.Bao_cao_KCB_BHYT_Template.xlsx');
