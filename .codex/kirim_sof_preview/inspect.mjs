import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const input = 'C:/Users/Xursh/Desktop/1.LALAKU/Kirim SOF_LM.xlsx';
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
const summary = await wb.inspect({
  kind: 'workbook,sheet,table,drawing,definedName',
  include: 'id,name,range,values,formulas',
  maxChars: 18000,
  tableMaxRows: 8,
  tableMaxCols: 14,
  tableMaxCellChars: 100,
});
console.log(summary.ndjson);
for (const sheet of wb.worksheets.items) {
  const used = sheet.getUsedRange();
  console.log(JSON.stringify({sheet: sheet.name, used: used?.address ?? null}));
  if (!used) continue;
  const region = await wb.inspect({kind:'region', sheetId:sheet.name, range:used.address, maxChars:5000, tableMaxRows:12, tableMaxCols:16});
  console.log(region.ndjson);
}
const errors = await wb.inspect({kind:'match', searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options:{useRegex:true,maxResults:100}, summary:'formula errors'});
console.log(errors.ndjson);

await fs.mkdir('previews-original', {recursive:true});
for (const sheet of wb.worksheets.items) {
  try {
    const png = await wb.render({sheetName:sheet.name, autoCrop:'all', scale:1, format:'png'});
    await fs.writeFile(`previews-original/${sheet.name.replace(/[\\/:*?"<>|]/g,'_')}.png`, new Uint8Array(await png.arrayBuffer()));
  } catch (e) { console.error(`RENDER ${sheet.name}: ${e.message}`); }
}
