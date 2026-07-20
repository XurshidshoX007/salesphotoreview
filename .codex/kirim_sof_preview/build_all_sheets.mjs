import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';
console.warn=()=>{};
console.error=()=>{};

const source='C:/Users/Xursh/Desktop/1.LALAKU/Kirim SOF_LM.xlsx';
const outDir='C:/Users/Xursh/Desktop/disturibitsiya-avto-tekshiruv-1522-fix/disturibitsiya-sohasida-operatorman-sales-programmadan-kirib/outputs/kirim-sof-all-sheets';
await fs.mkdir(outDir,{recursive:true});
let themes=[
 {id:'1_tezkor_operatsion',title:'Tezkor operatsion',dark:'#12372A',accent:'#2F855A',soft:'#EAF5EF',stripe:'#F4F8F5',text:'#17372B',danger:'#C53F3F'},
 {id:'2_moliyaviy_nazorat',title:'Moliyaviy nazorat',dark:'#17324D',accent:'#2B6CB0',soft:'#E8F1FA',stripe:'#F3F7FB',text:'#17324D',danger:'#D97706'},
 {id:'3_minimal_premium',title:'Minimal premium',dark:'#28242B',accent:'#8A6A3F',soft:'#F2ECE3',stripe:'#F8F5F1',text:'#302A32',danger:'#B54747'},
];
const requested=process.argv[2];
if(requested) themes=themes.filter(t=>t.id===requested);
const noRender=process.argv.includes('--no-render');
const headerRows={MANUS:4,Pivot:6,'LM Kassa':4,'LM Savdo':9,'KASSA SOF':2,'SAVDO SOF':6};
const previewRanges={MANUS:'A1:O25',Pivot:'A1:P22','LM Kassa':'A1:W25','LM Savdo':'A1:P24','KASSA SOF':'A1:T24','SAVDO SOF':'A1:P24'};

try { for(const theme of themes){
 console.log('START',theme.id);
 const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(source));
 for(const s of wb.worksheets.items){
   const used=s.getUsedRange(); if(!used) continue;
   s.showGridLines=false;
   const hr=headerRows[s.name]||1;
   const maxRows=Math.min(used.rowCount,160);
   const maxCols=Math.min(used.columnCount,160);
   const data=s.getRangeByIndexes(0,0,maxRows,maxCols);
   data.format.font={name:'Aptos',size:10,color:theme.text};
   data.format.verticalAlignment='center';
   data.format.borders={insideHorizontal:{style:'thin',color:'#DDE4E8'}};
   if(hr>1){
     const top=s.getRangeByIndexes(0,0,hr-1,maxCols);
     top.format.fill=theme.soft;
     top.format.font={name:'Aptos Display',bold:true,color:theme.dark,size:11};
   }
   const head=s.getRangeByIndexes(hr-1,0,1,maxCols);
   head.format={fill:theme.dark,font:{name:'Aptos',bold:true,color:'#FFFFFF',size:10},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',borders:{preset:'all',style:'thin',color:'#FFFFFF'}};
   head.format.rowHeight=32;
   if(maxRows>hr){
     for(let r=hr;r<maxRows;r+=2)s.getRangeByIndexes(r,0,1,maxCols).format.fill=theme.stripe;
   }
   s.freezePanes.freezeRows(hr);
   s.freezePanes.freezeColumns(Math.min(2,maxCols));
   data.format.rowHeight=22;
   s.getRangeByIndexes(0,0,maxRows,1).format.font={name:'Aptos',bold:true,color:theme.text};
   for(let c=0;c<maxCols;c++)s.getRangeByIndexes(0,c,maxRows,1).format.columnWidth=(c===0?16:(c===1?19:13));
   const scanRows=Math.min(maxRows,12);
   const scan=s.getRangeByIndexes(0,0,scanRows,maxCols).values;
   const dangerCols=[];
   for(let c=0;c<maxCols;c++){
     const label=scan.map(r=>String(r?.[c]??'')).join(' ').toLowerCase();
     if(label.includes('farq')||label.includes('qarzdor')||label.includes('difference')) dangerCols.push(c);
   }
   for(const c of dangerCols){
     const col=s.getRangeByIndexes(hr,c,Math.max(1,maxRows-hr),1);
     col.conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FDE8E8',font:{bold:true,color:'#B42318'}}});
   }
   if(s.name==='Pivot'){
     data.format.font={name:'Aptos Narrow',size:9,color:theme.text};
     s.getRange('A1').values=[['YORDAMCHI HISOB-KITOBLAR · '+theme.title]];
     s.getRange('A1:H2').merge();
     s.getRange('A1:H2').format={fill:theme.dark,font:{bold:true,color:'#FFFFFF',size:16},verticalAlignment:'center'};
   }
 }
 const file=await SpreadsheetFile.exportXlsx(wb);
 await file.save(`${outDir}/Kirim_SOF_LM_${theme.id}.xlsx`);
 const previewDir=`${outDir}/${theme.id}_preview`;if(!noRender) await fs.mkdir(previewDir,{recursive:true});
 if(!noRender) for(const s of wb.worksheets.items){
   try{
     const png=await wb.render({sheetName:s.name,range:previewRanges[s.name],scale:0.9,format:'png'});
     await fs.writeFile(`${previewDir}/${s.name.replace(/[\\/:*?"<>|]/g,'_')}.png`,new Uint8Array(await png.arrayBuffer()));
   }catch(e){await fs.writeFile(`${previewDir}/${s.name.replace(/[\\/:*?"<>|]/g,'_')}.txt`,e.message)}
 }
 console.log('DONE',theme.id);
} } catch(e) { await fs.writeFile(`${outDir}/build-error.txt`,String(e?.stack||e)); console.log('FAILED',String(e?.message||e)); process.exitCode=1; }
