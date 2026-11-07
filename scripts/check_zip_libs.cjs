const fs = require('fs');
const XLSX = require('xlsx');

// Let's use JSZip or fflate to unzip, modify sheet1.xml, and rezip!
// Does XLSX have its own zip engine exposed or can we use jszip / fflate?
console.log('Checking available zip modules...');
try {
  const jszip = require('jszip');
  console.log('jszip available');
} catch (e) {
  console.log('jszip not installed');
}
