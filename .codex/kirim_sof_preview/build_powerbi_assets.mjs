import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const input=JSON.parse(await fs.readFile('powerbi_extract.json','utf8'));
const outDir='C:/Users/Xursh/Desktop/disturibitsiya-avto-tekshiruv-1522-fix/disturibitsiya-sohasida-operatorman-sales-programmadan-kirib/outputs/powerbi-kirim-sof';
await fs.mkdir(outDir,{recursive:true});
const snapshotDate='2026-07-11';
const cleanBranch=v=>String(v??'').trim().replace(/^Fargona$/,"Farg'ona").replace(/^Qoqon$/,'Qoqon');
const num=v=>Number(v)||0;

function cashRows(matrix,brand){
  return matrix.slice(3).filter(r=>Number.isFinite(Number(r?.[0]))&&r?.[1]).map(r=>({
    sana:snapshotDate,brand,filial:cleanBranch(r[1]),kirim_kassa:num(r[2]),naqd_savdo:num(r[3]),programma:num(r[4]),farq:num(r[5]),qarzdorlik:num(r[6]),farq_abs:Math.abs(num(r[5])),qarzdorlik_abs:Math.abs(num(r[6]))
  }));
}
function salesRows(matrix,brand){
  return matrix.slice(3).filter(r=>r?.[0]&&typeof r[0]==='string'&&Number.isFinite(Number(r?.[2]))).map(r=>({
    sana:snapshotDate,brand,filial:cleanBranch(r[0]),ombor:String(r[1]??'').trim(),savdo:num(r[2]),kirim:num(r[5])
  }));
}
const cash=[...cashRows(input.lm_cash,'LM'),...cashRows(input.sof_cash,'SOF')];
const sales=[...salesRows(input.lm_sales,'LM'),...salesRows(input.sof_sales,'SOF')];
const agents=input.manus_agents.slice(1).filter(r=>r?.[0]&&Number.isFinite(Number(r?.[1]))).map(r=>({agent_kodi:String(r[0]),tolov:num(r[1]),brand:String(r[0]).startsWith('JY')?'SOF':'LM'}));
const branches=[...new Set([...cash.map(r=>r.filial),...sales.map(r=>r.filial)])].sort();
const totals={
  jami_savdo:sales.reduce((a,r)=>a+r.savdo,0), jami_kirim:sales.reduce((a,r)=>a+r.kirim,0),
  naqd_savdo:cash.reduce((a,r)=>a+r.naqd_savdo,0), farq:cash.reduce((a,r)=>a+r.farq,0), qarzdorlik:cash.reduce((a,r)=>a+r.qarzdorlik,0),
  filiallar:branches.length, agentlar:agents.length,
};
const merged=sales.map(s=>({...s,...cash.find(c=>c.brand===s.brand&&c.filial===s.filial)})).filter(r=>r.brand);
const topAgents=[...agents].sort((a,b)=>b.tolov-a.tolov).slice(0,12).map((r,i)=>({...r,rank:i+1}));

const wb=Workbook.create();
const readme=wb.worksheets.add('README');
readme.getRange('A1:F2').merge();readme.getRange('A1').values=[['POWER BI · KIRIM / SAVDO NAZORAT MODELI']];
readme.getRange('A1:F2').format={fill:'#143B4A',font:{bold:true,color:'#FFFFFF',size:18},verticalAlignment:'center'};
readme.getRange('A4:B10').values=[
  ['Manba','Kirim SOF_LM.xlsx'],['Snapshot sanasi',snapshotDate],['Fact_Kassa donadorligi','1 qator = sana + brend + filial'],['Fact_Savdo donadorligi','1 qator = sana + brend + filial'],['Agent_Tolov donadorligi','1 qator = agent'],['Tavsiya etilgan aloqa','Brand + Filial + Sana'],['Yangilash','Manba yangilanganda Power BI Refresh'],
];
readme.getRange('A4:A10').format={fill:'#DDEEF3',font:{bold:true,color:'#143B4A'}};readme.getRange('A4:B10').format.borders={preset:'all',style:'thin',color:'#CBD8DE'};
readme.getRange('A:A').format.columnWidth=28;readme.getRange('B:B').format.columnWidth=48;readme.showGridLines=false;

function addTable(name,headers,rows,tableName){
 const s=wb.worksheets.add(name);s.showGridLines=false;
 s.getRangeByIndexes(0,0,rows.length+1,headers.length).values=[headers,...rows];
 s.getRangeByIndexes(0,0,1,headers.length).format={fill:'#143B4A',font:{bold:true,color:'#FFFFFF'},wrapText:true};
 s.getRangeByIndexes(1,0,rows.length,headers.length).format.borders={insideHorizontal:{style:'thin',color:'#E2E8EC'}};
 for(let r=2;r<=rows.length;r+=2)s.getRangeByIndexes(r,0,1,headers.length).format.fill='#F2F7F8';
 s.freezePanes.freezeRows(1);s.getRangeByIndexes(0,0,rows.length+1,headers.length).format.rowHeight=22;
 for(let c=0;c<headers.length;c++)s.getRangeByIndexes(0,c,rows.length+1,1).format.columnWidth=headers[c].length>14?18:14;
 s.tables.add(s.getRangeByIndexes(0,0,rows.length+1,headers.length).address,true,tableName);
 return s;
}
addTable('Fact_Kassa',['Sana','Brand','Filial','Kirim Kassa','Naqd Savdo','Programma','Farq','Qarzdorlik','Farq ABS','Qarzdorlik ABS'],cash.map(r=>[r.sana,r.brand,r.filial,r.kirim_kassa,r.naqd_savdo,r.programma,r.farq,r.qarzdorlik,r.farq_abs,r.qarzdorlik_abs]),'FactKassa');
addTable('Fact_Savdo',['Sana','Brand','Filial','Ombor','Savdo','Kirim'],sales.map(r=>[r.sana,r.brand,r.filial,r.ombor,r.savdo,r.kirim]),'FactSavdo');
addTable('Agent_Tolov',['Agent kodi','To‘lov','Brand'],agents.map(r=>[r.agent_kodi,r.tolov,r.brand]),'AgentTolov');
addTable('Dim_Filial',['Filial'],branches.map(x=>[x]),'DimFilial');

for(const s of wb.worksheets.items){
 const u=s.getUsedRange(); if(!u)continue;
 for(const header of ['Kirim Kassa','Naqd Savdo','Programma','Farq','Qarzdorlik','Farq ABS','Qarzdorlik ABS','Savdo','Kirim','To‘lov']){
   const row=s.getRangeByIndexes(0,0,1,u.columnCount).values[0];const c=row.indexOf(header);if(c>=0)s.getRangeByIndexes(1,c,Math.max(1,u.rowCount-1),1).format.numberFormat='#,##0';
 }
}
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(`${outDir}/PowerBI_Kirim_SOF_manba.xlsx`);
await fs.writeFile(`${outDir}/dashboard_data.json`,JSON.stringify({snapshotDate,cash,sales,agents,merged,topAgents,totals,branches},null,2));
console.log(JSON.stringify({outDir,counts:{cash:cash.length,sales:sales.length,agents:agents.length,branches:branches.length},totals},null,2));
