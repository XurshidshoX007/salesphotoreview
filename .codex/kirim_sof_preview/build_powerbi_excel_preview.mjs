import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const outDir='C:/Users/Xursh/Desktop/disturibitsiya-avto-tekshiruv-1522-fix/disturibitsiya-sohasida-operatorman-sales-programmadan-kirib/outputs/powerbi-kirim-sof';
const d=JSON.parse(await fs.readFile(`${outDir}/dashboard_data.json`,'utf8'));
const wb=Workbook.create();const s=wb.worksheets.add('Dashboard');s.showGridLines=false;
s.getRange('A1:N34').format.fill='#F3F7F8';
s.getRange('A1:N2').merge();s.getRange('A1').values=[['KIRIM VA SAVDO NAZORATI']];s.getRange('A1:N2').format={fill:'#143B4A',font:{bold:true,color:'#FFFFFF',size:20},verticalAlignment:'center'};
s.getRange('A3:N3').merge();s.getRange('A3').values=[['LM va SOF · 11-iyul 2026 · Power BI dashboard konsepti']];s.getRange('A3:N3').format={fill:'#143B4A',font:{color:'#D9E9ED',size:10}};
const t=d.totals,fmt=v=>Math.abs(v)>=1e9?`${(Math.abs(v)/1e9).toFixed(2)} mlrd`:`${(Math.abs(v)/1e6).toFixed(1)} mln`;
const cards=[['A5:C7','JAMI SAVDO',fmt(t.jami_savdo),'#0F766E'],['D5:F7','JAMI KIRIM',fmt(t.jami_kirim),'#2563EB'],['G5:I7','NAQD SAVDO',fmt(t.naqd_savdo),'#0F766E'],['J5:K7','FARQ','−'+fmt(t.farq),'#C2413B'],['L5:M7','QARZDORLIK','−'+fmt(t.qarzdorlik),'#D97706'],['N5:N7','FILIAL',String(t.filiallar),'#64748B']];
for(const [range,label,value,accent] of cards){const r=s.getRange(range);r.merge();r.values=[[`${label}\n${value}`]];r.format={fill:'#FFFFFF',font:{bold:true,color:accent,size:14},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',borders:{preset:'outside',style:'thin',color:'#D9E4E8'}}}
const sales={};for(const r of d.sales){sales[r.filial]??={LM:0,SOF:0};sales[r.filial][r.brand]+=r.savdo}
const topSales=Object.entries(sales).sort((a,b)=>b[1].LM+b[1].SOF-a[1].LM-a[1].SOF).slice(0,10);
s.getRange('A10:C20').values=[['Filial','LM','SOF'],...topSales.map(([k,v])=>[k,v.LM,v.SOF])];
s.getRange('A10:C10').format={fill:'#DDEEF3',font:{bold:true,color:'#143B4A'}};s.getRange('B11:C20').format.numberFormat='#,##0';
const chart1=s.charts.add('bar',s.getRange('A10:C20'));chart1.title='Savdo filiallar bo‘yicha · Top 10';chart1.hasLegend=true;chart1.setPosition('E9','N20');
const debts={};for(const r of d.cash)debts[r.filial]=(debts[r.filial]||0)+r.qarzdorlik_abs;
const topDebt=Object.entries(debts).sort((a,b)=>b[1]-a[1]).slice(0,10);
s.getRange('A23:B33').values=[['Filial','Qarzdorlik'],...topDebt];s.getRange('A23:B23').format={fill:'#FCE7D2',font:{bold:true,color:'#9A3412'}};s.getRange('B24:B33').format.numberFormat='#,##0';
const chart2=s.charts.add('bar',s.getRange('A23:B33'));chart2.title='Qarzdorlik hajmi · Top 10';chart2.hasLegend=false;chart2.setPosition('E22','N34');
s.getRange('A:N').format.columnWidth=13;s.getRange('A:A').format.columnWidth=18;s.freezePanes.freezeRows(3);
const png=await wb.render({sheetName:'Dashboard',range:'A1:N34',scale:1.15,format:'png'});await fs.writeFile(`${outDir}/Kirim_SOF_PowerBI_preview.png`,new Uint8Array(await png.arrayBuffer()));
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(`${outDir}/Kirim_SOF_PowerBI_preview.xlsx`);
console.log('done');
