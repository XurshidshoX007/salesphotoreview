import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const wb = await SpreadsheetFile.importXlsx(await FileBlob.load('C:/Users/Xursh/Desktop/1.LALAKU/Kirim SOF_LM.xlsx'));
const out = [];
for (const s of wb.worksheets.items) {
  const used = s.getUsedRange();
  const address = used?.address || '';
  let sample = [];
  let formulas = [];
  if (used) {
    const rows = Math.min(15, used.rowCount || 15);
    const cols = Math.min(16, used.columnCount || 16);
    const r = s.getRangeByIndexes(0,0,rows,cols);
    sample = r.values;
    formulas = r.formulas;
  }
  out.push({name:s.name,address, rowCount:used?.rowCount, columnCount:used?.columnCount, tables:s.tables.items.map(t=>({name:t.name,address:t.getRange().address})), charts:s.charts.items.length, sample, formulas});
}
await fs.writeFile('analysis.json', JSON.stringify(out,null,2));
console.log(out.map(x=>({name:x.name,address:x.address,tables:x.tables,charts:x.charts})));
