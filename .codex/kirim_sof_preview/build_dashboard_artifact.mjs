import fs from 'node:fs/promises';
const outDir='C:/Users/Xursh/Desktop/disturibitsiya-avto-tekshiruv-1522-fix/disturibitsiya-sohasida-operatorman-sales-programmadan-kirib/outputs/powerbi-kirim-sof';
const d=JSON.parse(await fs.readFile(`${outDir}/dashboard_data.json`,'utf8'));
const sourceId='kirim_sof_excel';
const artifact={
 surface:'dashboard',
 manifest:{version:1,surface:'dashboard',title:'Kirim va savdo nazorati',description:'LM va SOF bo‘yicha kirim, savdo, farq va qarzdorlik dashboardi.',generatedAt:new Date().toISOString(),
  filters:[
   {id:'brand_filter',label:'Brand',dataset:'branch_sales',field:'brand',includeAll:true,targets:[{dataset:'branch_sales',field:'brand'},{dataset:'branch_cash',field:'brand'},{dataset:'branch_model',field:'brand'}]},
   {id:'branch_filter',label:'Filial',dataset:'branch_sales',field:'filial',includeAll:true,targets:[{dataset:'branch_sales',field:'filial'},{dataset:'branch_cash',field:'filial'},{dataset:'branch_model',field:'filial'}]},
  ],
  cards:[
   {id:'sales_card',description:'LM va SOF bo‘yicha jami savdo.',dataset:'kpis',sourceId,metrics:[{label:'Jami savdo',field:'jami_savdo',format:'number',unit:'so‘m'}]},
   {id:'income_card',description:'LM va SOF bo‘yicha jami kirim.',dataset:'kpis',sourceId,metrics:[{label:'Jami kirim',field:'jami_kirim',format:'number',unit:'so‘m'}]},
   {id:'cash_card',description:'Kassa jadvalidagi jami naqd savdo.',dataset:'kpis',sourceId,metrics:[{label:'Naqd savdo',field:'naqd_savdo',format:'number',unit:'so‘m'}]},
   {id:'difference_card',description:'Kirim va programma o‘rtasidagi jami farq.',dataset:'kpis',sourceId,metrics:[{label:'Farq',field:'farq',format:'number',unit:'so‘m',signed:true}]},
   {id:'debt_card',description:'Barcha filiallarning jami qarzdorligi.',dataset:'kpis',sourceId,metrics:[{label:'Qarzdorlik',field:'qarzdorlik',format:'number',unit:'so‘m',signed:true}]},
   {id:'coverage_card',description:'Snapshotdagi filiallar soni.',dataset:'kpis',sourceId,metrics:[{label:'Filiallar',field:'filiallar',format:'number'}]},
  ],
  charts:[
   {id:'sales_branch',title:'Savdo filiallar bo‘yicha',subtitle:'LM va SOF, 11-iyul 2026 · so‘m',type:'bar',dataset:'branch_sales',sourceId,valueFormat:'number',encodings:{x:{field:'filial',type:'nominal',label:'Filial'},y:{field:'savdo',type:'quantitative',label:'Savdo, so‘m'},color:{field:'brand',type:'nominal',label:'Brand'},tooltip:[{field:'kirim',type:'quantitative',label:'Kirim',format:'number'}]}},
   {id:'debt_branch',title:'Qarzdorlik hajmi filiallar bo‘yicha',subtitle:'Absolyut qiymat · LM va SOF, so‘m',type:'bar',dataset:'branch_cash',sourceId,valueFormat:'number',encodings:{x:{field:'filial',type:'nominal',label:'Filial'},y:{field:'qarzdorlik_abs',type:'quantitative',label:'Qarzdorlik, so‘m'},color:{field:'brand',type:'nominal',label:'Brand'},tooltip:[{field:'farq',type:'quantitative',label:'Farq',format:'number'},{field:'qarzdorlik',type:'quantitative',label:'Qarzdorlik',format:'number'}]}},
   {id:'sales_income_scatter',title:'Savdo va kirim munosabati',subtitle:'Har nuqta — bitta brand-filial kombinatsiyasi',type:'scatter',dataset:'branch_model',sourceId,encodings:{x:{field:'kirim',type:'quantitative',label:'Kirim, so‘m'},y:{field:'savdo',type:'quantitative',label:'Savdo, so‘m'},color:{field:'brand',type:'nominal',label:'Brand'},tooltip:[{field:'filial',type:'nominal',label:'Filial'},{field:'qarzdorlik',type:'quantitative',label:'Qarzdorlik',format:'number'}]}},
   {id:'top_agents',title:'Eng katta agent to‘lovlari',subtitle:'Top 12 agent · aniq lookup uchun jadval pastda',type:'bar',dataset:'top_agents',sourceId,valueFormat:'number',encodings:{x:{field:'agent_kodi',type:'nominal',label:'Agent'},y:{field:'tolov',type:'quantitative',label:'To‘lov, so‘m'},tooltip:[{field:'brand',type:'nominal',label:'Brand'},{field:'rank',type:'quantitative',label:'O‘rin'}]}},
  ],
  tables:[
   {id:'branch_detail',title:'Filiallar bo‘yicha nazorat jadvali',subtitle:'Savdo, kirim, farq va qarzdorlikning aniq qiymatlari.',dataset:'branch_model',sourceId,defaultSort:{field:'qarzdorlik_abs',direction:'desc'},columns:[{field:'brand',label:'Brand',type:'text'},{field:'filial',label:'Filial',type:'text'},{field:'savdo',label:'Savdo',format:'number'},{field:'kirim',label:'Kirim',format:'number'},{field:'farq',label:'Farq',format:'number'},{field:'qarzdorlik',label:'Qarzdorlik',format:'number'},{field:'qarzdorlik_abs',label:'Qarzdorlik ABS',format:'number'}]},
  ],
  sources:[{id:sourceId,label:'Kirim SOF/LM Excel snapshot',path:'PowerBI_Kirim_SOF_manba.xlsx'}],
  blocks:[
   {id:'intro',type:'markdown',body:'# Kirim va savdo nazorati\n\nLM va SOF bo‘yicha operatsion holat · **11-iyul 2026**'},
   {id:'metrics',type:'metric-strip',cardIds:['sales_card','income_card','cash_card','difference_card','debt_card','coverage_card']},
   {id:'sales_chart',type:'chart',chartId:'sales_branch'},
   {id:'debt_chart',type:'chart',chartId:'debt_branch'},
   {id:'scatter_chart',type:'chart',chartId:'sales_income_scatter'},
   {id:'agents_chart',type:'chart',chartId:'top_agents'},
   {id:'detail_table',type:'table',tableId:'branch_detail'},
   {id:'method',type:'markdown',body:'## Metodologiya\n\n- **Farq** — manba faylidagi `FARQ` qiymati.\n- **Qarzdorlik** — manba faylidagi filial qarzdorligi.\n- Dashboard bir kunlik snapshot; vaqt trendi uchun keyingi sanalar shu modelga append qilinadi.'},
  ],
 },
 snapshot:{version:1,generatedAt:new Date().toISOString(),status:'ready',datasets:{
  kpis:[d.totals],branch_sales:d.sales,branch_cash:d.cash,branch_model:d.merged,top_agents:d.topAgents,
 },accessIssues:[]},
 sources:[{id:sourceId,label:'Kirim SOF/LM Excel snapshot',path:'PowerBI_Kirim_SOF_manba.xlsx',description:'Asl Kirim SOF_LM.xlsx faylidan tozalangan va Power BI uchun normalizatsiya qilingan snapshot.',query:{engine:'Power BI semantic model',language:'sql',sql:'SELECT * FROM Fact_Savdo;\nSELECT * FROM Fact_Kassa;\nSELECT * FROM Agent_Tolov;',description:'Power BI import modelidagi savdo, kassa va agent jadvallarini yuklaydi.',tables_used:['Fact_Savdo','Fact_Kassa','Agent_Tolov'],filters:{snapshot_date:'2026-07-11'},executed_at:new Date().toISOString(),metric_definitions:{jami_savdo:'SUM(Fact_Savdo[Savdo])',jami_kirim:'SUM(Fact_Savdo[Kirim])',naqd_savdo:'SUM(Fact_Kassa[Naqd Savdo])',farq:'SUM(Fact_Kassa[Farq])',qarzdorlik:'SUM(Fact_Kassa[Qarzdorlik])'}}}],
 package_info:{originUrl:'artifact://kirim-sof-powerbi-preview',controls:{edit:false,refresh:false}},
};
await fs.writeFile(`${outDir}/artifact.json`,JSON.stringify(artifact,null,2));
console.log(`${outDir}/artifact.json`);
