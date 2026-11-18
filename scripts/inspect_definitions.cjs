const fs = require('fs');
const XLSX = require('xlsx');

// Let's read the template 7.Bao cao KCB BHYT.xlsx
const wbT = XLSX.readFile('public/template/7.Bao_cao_KCB_BHYT_Template.xlsx');
const sheetT = wbT.Sheets[wbT.SheetNames[0]];

console.log('--- Template instructions vs web calculations ---');
for (let r = 5; r <= 45; r++) {
  const stt = sheetT['A' + r] ? sheetT['A' + r].v : '';
  const name = sheetT['B' + r] ? sheetT['B' + r].v : '';
  const dvt = sheetT['C' + r] ? sheetT['C' + r].v : '';
  const formula = sheetT['D' + r] ? sheetT['D' + r].v : '';
  console.log(`R${r} [${stt}] | ${name} | ${dvt} | Def: ${String(formula).slice(0, 70)}`);
}
