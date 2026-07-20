import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outDir = 'C:/Users/Xursh/Desktop/disturibitsiya-avto-tekshiruv-1522-fix/disturibitsiya-sohasida-operatorman-sales-programmadan-kirib/outputs/kirim-sof-design-preview';
await fs.mkdir(outDir,{recursive:true});
const wb=Workbook.create();
const rows=[
  ['Andijon',3895101,3895101,3895101,0,-35122377],
  ["Namangan",4925400,9194200,4925400,0,-114336000],
  ["Farg'ona",874000,874000,874000,0,-40300400],
  ['Qoqon',4318400,4318400,4318400,0,-85361320],
  ['Yunusobod',279000,279000,279000,0,-28982000],
  ['Samarqand',25034400,18444400,25034400,6590000,-148200000],
  ['Buxoro',12335000,3486000,12335000,-8849000,-92700000],
  ['Navoiy',4008000,3060000,4008000,-948000,-53600000],
];
const themes=[
 {name:'1. Tezkor operatsion',dark:'#12372A',accent:'#2F855A',soft:'#EAF5EF',bg:'#F4F7F5',warn:'#C2413B',desc:'Kundalik operator ishlashi uchun ixcham va tez o‘qiladigan.'},
 {name:'2. Moliyaviy nazorat',dark:'#17324D',accent:'#2B6CB0',soft:'#EAF2FA',bg:'#F3F6FA',warn:'#D97706',desc:'Farq va qarzdorlikni tez topishga yo‘naltirilgan.'},
 {name:'3. Minimal premium',dark:'#28242B',accent:'#8A6A3F',soft:'#F4EFE7',bg:'#F7F5F2',warn:'#B54747',desc:'Rahbariyatga taqdimot va chop etish uchun sokin ko‘rinish.'},
];

for(const [idx,t] of themes.entries()){
 const s=wb.worksheets.add(t.name);
 s.showGridLines=false;
 s.getRange('A1:L32').format.fill=t.bg;
 s.getRange('A1:L2').merge(); s.getRange('A1').values=[['KIRIM · SOF / LM NAZORAT PANELI']];
 s.getRange('A1:L2').format={fill:t.dark,font:{bold:true,color:'#FFFFFF',size:20},verticalAlignment:'center',horizontalAlignment:'left'};
 s.getRange('A3:L3').merge(); s.getRange('A3').values=[[t.desc+'  ·  11.07.2026']];
 s.getRange('A3:L3').format={fill:t.dark,font:{color:'#D9E6E1',size:10},verticalAlignment:'center'};
 const cards=[['A5:C7','JAMI KIRIM',70385501],['D5:F7','NAQD SAVDO',55274901],['G5:I7','PROGRAMMA',71881501],['J5:L7','FARQ',-1496000]];
 for(const [range,label,value] of cards){
   const r=s.getRange(range);r.merge();r.values=[[`${label}\n${value.toLocaleString('ru-RU')} so‘m`]];
   r.format={fill:label==='FARQ'?t.warn:'#FFFFFF',font:{bold:true,color:label==='FARQ'?'#FFFFFF':t.dark,size:14},wrapText:true,verticalAlignment:'center',horizontalAlignment:'center',borders:{preset:'outside',style:'thin',color:'#D6DEE3'}};
 }
 s.getRange('A9:F9').values=[['FILIAL','KIRIM KASSA','NAQD SAVDO','PROGRAMMA','FARQ','QARZDORLIK']];
 s.getRange('A10:F17').values=rows;
 s.getRange('A9:F17').format.borders={preset:'all',style:'thin',color:'#D9E1E6'};
 s.getRange('A9:F9').format={fill:t.accent,font:{bold:true,color:'#FFFFFF'},verticalAlignment:'center',horizontalAlignment:'center',wrapText:true};
 s.getRange('A10:A17').format.font={bold:true,color:t.dark};
 s.getRange('B10:F17').format.numberFormat='#,##0';
 s.getRange('A10:F17').format.fill='#FFFFFF';
 for(let r=11;r<=17;r+=2)s.getRange(`A${r}:F${r}`).format.fill=t.soft;
 s.getRange('E10:E17').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FDECEC',font:{bold:true,color:'#B42318'}}});
 s.getRange('G9:L9').merge();s.getRange('G9').values=[['FILIAL BO‘YICHA KIRIM']];s.getRange('G9:L9').format={fill:t.soft,font:{bold:true,color:t.dark},horizontalAlignment:'left'};
 s.getRange('G10:H18').values=[['Filial','Kirim'],...rows.map(r=>[r[0],r[1]])];
 if(idx===1){
   s.getRange('I10:L12').merge();s.getRange('I10').values=[['KRITIK FARQ\nBuxoro · −8 849 000']];
   s.getRange('I13:L15').merge();s.getRange('I13').values=[['YUQORI QARZDORLIK\nSamarqand · −148 200 000']];
   s.getRange('I16:L18').merge();s.getRange('I16').values=[['TEKSHIRISH KERAK\nNavoiy · −948 000']];
   s.getRange('I10:L18').format={fill:'#FFFFFF',font:{bold:true,color:t.dark,size:12},wrapText:true,verticalAlignment:'center',horizontalAlignment:'center',borders:{preset:'all',style:'thin',color:'#D6DEE3'}};
   s.getRange('I10:L12').format.fill='#FEE2E2';s.getRange('I13:L15').format.fill='#FFF7ED';s.getRange('I16:L18').format.fill=t.soft;
 } else {
   const chart=s.charts.add('bar',s.getRange('G10:H18'));chart.title='Top filiallar';chart.hasLegend=false;chart.setPosition('I10','L22');
 }
 s.getRange('A20:F20').merge();s.getRange('A20').values=[['NAZORAT VA AMALLAR']];s.getRange('A20:F20').format={fill:t.dark,font:{bold:true,color:'#FFFFFF'}};
 const actions=[['A21:C23','1  Kirimni tekshirish'],['D21:F23','2  Farqlarni yopish'],['A24:C26','3  Qarzdorlik nazorati'],['D24:F26','4  Hisobotni eksport qilish']];
 for(const [range,label] of actions){const r=s.getRange(range);r.merge();r.values=[[label]];r.format={fill:'#FFFFFF',font:{bold:true,color:t.dark},horizontalAlignment:'center',verticalAlignment:'center',borders:{preset:'outside',style:'thin',color:'#CBD5DC'}}}
 s.getRange('G24:L26').merge();s.getRange('G24').values=[['⚠  Eng katta farqlar qizil bilan ajratiladi. Filial, sana va brend filtrlari yuqorida joylashadi.']];s.getRange('G24:L26').format={fill:'#FFF7ED',font:{color:'#9A3412',bold:true},wrapText:true,verticalAlignment:'center',borders:{preset:'outside',style:'thin',color:'#FED7AA'}};
 s.freezePanes.freezeRows(3);
 s.getRange('A:L').format.columnWidth=14;
 s.getRange('A:A').format.columnWidth=18;
 s.getRange('A1:L3').format.rowHeight=26;
}

for(const s of wb.worksheets.items){
 const png=await wb.render({sheetName:s.name,range:'A1:L27',scale:1.25,format:'png'});
 await fs.writeFile(`${outDir}/${s.name[0]}-preview.png`,new Uint8Array(await png.arrayBuffer()));
}
const file=await SpreadsheetFile.exportXlsx(wb);
await file.save(`${outDir}/Kirim_SOF_LM_dizayn_variantlari.xlsx`);
console.log(outDir);
