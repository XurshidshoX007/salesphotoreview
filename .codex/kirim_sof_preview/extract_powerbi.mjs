import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
console.warn=()=>{}; console.error=()=>{};
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load('C:/Users/Xursh/Desktop/1.LALAKU/Kirim SOF_LM.xlsx'));
const ranges={
  manus_branch:['MANUS','A4:J24'],
  manus_agents:['MANUS','N1:O97'],
  lm_cash:['LM Kassa','A3:G40'],
  sof_cash:['KASSA SOF','A1:G40'],
  lm_sales:['LM Savdo','H9:O40'],
  sof_sales:['SAVDO SOF','H4:O40'],
};
const out={};
for(const [id,[sheet,range]] of Object.entries(ranges)) out[id]=wb.worksheets.getItem(sheet).getRange(range).values;
await fs.writeFile('powerbi_extract.json',JSON.stringify(out,null,2));
console.log(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,[v.length,v[0]?.length]])));
