const fs = require('fs');

// Check sample data helper
const sampleData = JSON.parse(fs.readFileSync('src/data/sample_report.json', 'utf-8'));
console.log('Sample raw values:');
for (let k in sampleData.rawValues) {
  if (typeof sampleData.rawValues[k] === 'object') {
    console.log(k, ':', JSON.stringify(sampleData.rawValues[k]));
  } else {
    console.log(k, ':', sampleData.rawValues[k]);
  }
}
