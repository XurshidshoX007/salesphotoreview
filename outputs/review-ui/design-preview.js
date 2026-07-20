(function(){
  'use strict';

  var app=document.getElementById('previewApp');
  var host=document.getElementById('viewHost');
  var viewSelect=document.getElementById('viewSelect');
  var device=document.getElementById('device');
  var currentTheme='topbar';
  var currentView='photo';
  var previewPhotos=[];

  var themes={
    topbar:{
      number:'Variant 01',
      name:'Topbar Studio',
      description:"Yon panelsiz, yuqori navigatsiyali va keng ish maydoniga ega zamonaviy struktura.",
      traits:['Yangi struktura','Keng maydon','Tavsiya'],
      hint:'Tanlash uchun: 1-variant'
    },
    dock:{
      number:'Variant 02',
      name:'Review Cockpit',
      description:"Ingichka boshqaruv relsi, markazda katta ish maydoni va tezkor nazorat oqimi.",
      traits:['Tezkor','Foto markazda','Ixcham rels'],
      hint:'Tanlash uchun: 2-variant'
    },
    queue:{
      number:'Variant 03',
      name:'Queue Workspace',
      description:"Bo'limlar, agent navbati va asosiy ish maydoni uchta aniq qatlamga ajratilgan.",
      traits:['Agent navbati','Uch ustun','Operator uchun'],
      hint:'Tanlash uchun: 3-variant'
    },
    canvas:{
      number:'Variant 04',
      name:'Minimal Canvas',
      description:"Doimiy yon panelsiz, pastki suzuvchi dock va maksimal toza ish maydoni.",
      traits:['Minimal','Suzuvchi dock','Eng skromni'],
      hint:'Tanlash uchun: 4-variant'
    }
  };

  var views={
    photo:{eyebrow:'Foto nazorati',title:"TO'LQINOVA MAMURAXON",subtitle:'2026-07-09 · SOF · JYAN103'},
    review:{eyebrow:'Rasm tekshirish',title:'JYAN103 #14',subtitle:"BARAKA SAVDO · Buyurtma yo'q · 14:32"},
    minus:{eyebrow:'Hisobot',title:"Minus ro'yxati",subtitle:'SOF · 2026-07-09 · 38 ta minus'},
    table:{eyebrow:'Davomat',title:'Tabel',subtitle:'2026-yil iyul · barcha xodimlar'},
    stats:{eyebrow:'Nazorat',title:'Admin statistika',subtitle:'Bot va web faoliyati · real vaqt'},
    collect:{eyebrow:'Jarayon',title:"Ma'lumot yig'ish",subtitle:"Sales sahifasidan foto hisobot ma'lumotlarini yig'ish"},
    brand:{eyebrow:'Sozlamalar',title:'Brend sozlamalari',subtitle:"Brend, agent prefiksi va Telegram guruhini boshqarish"},
    auto:{eyebrow:'Tekshiruv',title:'Avto tekshiruv',subtitle:'Qoidalar bo‘yicha shubhali fotolar'},
    reports:{eyebrow:'Hisobot',title:'Excel hisobotlari',subtitle:'Tayyor formatlarda yuklab olish'}
  };

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function button(label,kind){
    return '<button class="uiButton '+(kind||'')+'">'+esc(label)+'</button>';
  }

  function filters(extra){
    return [
      '<div class="filterBar">',
        '<div class="filterControl">SOF</div>',
        '<div class="filterControl">09.07.2026</div>',
        '<div class="filterControl wide">JYAN103 · 941 600 · 22 foto</div>',
        extra||'',
      '</div>'
    ].join('');
  }

  function metric(label,value,kind){
    return '<div class="metricCard '+(kind||'')+'"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';
  }

  function photoCard(index,flagged){
    return [
      '<article class="photoCard '+(flagged?'flagged':'')+'">',
        '<div class="photoVisual">',
          '<div class="photoFallback">FOTO '+index+'</div>',
          '<img data-photo="'+(index-1)+'" alt="Savdo nuqtasi fotosi">',
        '</div>',
        '<div class="photoCaption">',
          '<b>JYAN103 #'+index+'</b>',
          '<span>'+(index===1?'BARAKA SAVDO':index===2?'MUMTOZ MARKET':index===3?'SAHOVAT SAVDO':'ORZUGUL MARKET')+'<br>Vaqt: '+(14+index)+':'+(index*7<10?'0':'')+(index*7)+'</span>',
          flagged?'<div class="tagRow"><span class="tag bad">MINUS</span><span class="tag warn">Kamera yopilgan</span></div>':'',
        '</div>',
      '</article>'
    ].join('');
  }

  function renderPhoto(){
    return [
      '<div class="viewBody photoView">',
        filters(button('Tun')+button("Sanani o'chirish",'danger')),
        '<div class="metricGrid">',
          metric('Agent','71'),
          metric('Foto','1710'),
          metric('Minus','29','danger'),
        '</div>',
        '<div class="photoGrid">',
          photoCard(1,false),photoCard(2,false),photoCard(3,true),photoCard(4,true),
        '</div>',
        '<div class="bottomBar">',
          button('Oldingi'),button('Resume','primary'),button('Keyingi'),button('3.5s'),
        '</div>',
      '</div>'
    ].join('');
  }

  function reasonRow(text,selected){
    return '<div class="reasonRow '+(selected?'selected':'')+'"><span class="checkMock"></span><span>'+esc(text)+'</span></div>';
  }

  function renderReview(){
    return [
      '<div class="viewBody reviewView">',
        '<div class="reviewLayout">',
          '<div class="reviewPhoto">',
            '<div class="photoVisual"><div class="photoFallback">TANLANGAN FOTO</div><img data-photo="2" alt="Tekshirilayotgan foto"></div>',
          '</div>',
          '<aside class="reviewPanel">',
            '<div class="reviewPanelHead"><div><b>Sababni belgilang</b><span>Bir yoki bir nechta sabab tanlang</span></div><span class="statusPill warn">Audit</span></div>',
            '<div class="reasonList">',
              reasonRow("Ish vaqtidan tashqari olingan foto",false),
              reasonRow("Kamera yopilgan yoki to'sib olingan foto",true),
              reasonRow("Bitta do'kondan takroriy foto",false),
              reasonRow("Ekrandan qayta olingan foto",false),
              reasonRow("Katalogdan olingan rasm",false),
              reasonRow("Faqat mahsulot rasmi",false),
              reasonRow("Foto talabga javob bermaydi",false),
            '</div>',
            '<label class="fieldLabel" style="margin-top:9px">Qo‘shimcha izoh<div class="inputMock area">Ixtiyoriy izoh...</div></label>',
            '<div class="reviewActions">'+button('OK')+button('Minus','danger')+'</div>',
          '</aside>',
        '</div>',
      '</div>'
    ].join('');
  }

  var agentRows=[
    ['JYAN006','TULYAKOV HUSANBOY','11','Kamera yopilgan'],
    ['JYAN103',"TO'LQINOVA MAMURAXON",'13','Takroriy foto'],
    ['JYFA002','MUMINOVA NARGIZA','7','Ekran rasmi'],
    ['JYGL004','UMAROV DALERJON','4','Mahsulot rasmi'],
    ['JYJZ002','SHAMSIDINOV SHOXRUX','3','Talabga javob bermaydi'],
    ['JYT004','PULATOV RAHMATULLA','2','Kamera yopilgan']
  ];

  function renderMinusRows(){
    return agentRows.map(function(row){
      return [
        '<tr>',
          '<td style="width:34px"><div class="tableCheck"></div></td>',
          '<td><strong>'+esc(row[0])+'</strong><small>'+esc(row[1])+'</small></td>',
          '<td><span class="statusPill">'+esc(row[2])+' ta foto</span></td>',
          '<td>09.07.2026</td>',
          '<td>'+esc(row[3])+'</td>',
          '<td><span class="statusPill warn">Yangi 2</span></td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  function renderMinus(){
    return [
      '<div class="viewBody">',
        '<div class="panelSurface">',
          '<div class="sectionToolbar">',
            '<div class="filterControl">SOF (319)</div>',
            '<div class="filterControl">09.07.2026</div>',
            '<span class="toolbarSpacer"></span>',
            button('Tanlanganlarni yuborish'),
            button('Yangi hammasi (12)','primary'),
          '</div>',
          '<div class="summaryStrip">',
            '<div class="summaryItem"><span>Agent</span><b>31</b></div>',
            '<div class="summaryItem"><span>Jami minus</span><b>95</b></div>',
            '<div class="summaryItem"><span>Yuborilgan</span><b>83</b></div>',
            '<div class="summaryItem"><span>Yangi</span><b>12</b></div>',
          '</div>',
          '<table class="dataTable"><thead><tr><th style="width:34px"></th><th>Agent / foto</th><th>Holat</th><th>Sana</th><th>Sabab</th><th>Yuborish</th></tr></thead><tbody>',
            renderMinusRows(),
          '</tbody></table>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderTable(){
    var people=[
      ['JYAN005','MAHMUDOVA MOHINUR','SOF agent','Ishda'],
      ['JYAN006','TULYAKOV HUSANBOY','SOF agent','Ishda'],
      ['JYAN102','MAXMUDOV DONIYORBEK','SOF agent','Dam'],
      ['JYAN103',"TO'LQINOVA MAMURAXON",'SOF agent','Ishda'],
      ['JYBX002','YORQULOV BILOLBEK','SOF agent','Ishda']
    ];
    var rows=people.map(function(p,i){
      var days='';
      for(var d=1;d<=8;d++)days+='<td><span class="dayCell '+((d+i)%5===0?'off':'ok')+'">'+((d+i)%5===0?'D':'8h')+'</span></td>';
      return '<tr><td><strong>'+esc(p[0])+'</strong><small>'+esc(p[1])+'</small></td><td>'+esc(p[2])+'</td>'+days+'<td><span class="statusPill '+(p[3]==='Dam'?'warn':'')+'">'+esc(p[3])+'</span></td></tr>';
    }).join('');
    return [
      '<div class="viewBody">',
        filters(button('Yuklash','primary')+button('Excel')),
        '<div class="panelSurface">',
          '<table class="dataTable"><thead><tr><th style="width:190px">Xodim</th><th style="width:90px">Lavozim</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th style="width:80px">Holat</th></tr></thead><tbody>',
            rows,
          '</tbody></table>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderStats(){
    return [
      '<div class="viewBody">',
        '<div class="statsGrid">',
          metric('Foydalanuvchi','24'),metric('Start bosildi','61'),metric('Yuborilgan foto','1 842'),metric('Xato foto','3','danger'),
        '</div>',
        '<div class="statsBody">',
          '<section class="chartPanel">',
            '<div class="panelTitle"><b>7 kunlik faoliyat</b><span>Yuborilgan fotolar</span></div>',
            '<div class="barChart">',
              '<div class="bar" style="--h:42%" data-label="Du"></div><div class="bar" style="--h:68%" data-label="Se"></div><div class="bar" style="--h:54%" data-label="Ch"></div><div class="bar" style="--h:86%" data-label="Pa"></div><div class="bar" style="--h:72%" data-label="Ju"></div><div class="bar" style="--h:48%" data-label="Sh"></div><div class="bar" style="--h:63%" data-label="Ya"></div>',
            '</div>',
          '</section>',
          '<section class="activityPanel">',
            '<div class="panelTitle"><b>Oxirgi faollik</b><span>Admin hisoblanmaydi</span></div>',
            '<div class="activityList">',
              activity('XA','Xurshid A.','JYAN103 ochildi','1 daqiqa'),
              activity('NK','Nodir K.','Barcha foto yuborildi','4 daqiqa'),
              activity('MA','Mavluda A.','JYFA002 ochildi','7 daqiqa'),
              activity('SB','Sardor B.','Minus ro‘yxati','11 daqiqa'),
              activity('DI','Dilfuza I.','Agent link bosildi','18 daqiqa'),
            '</div>',
          '</section>',
        '</div>',
      '</div>'
    ].join('');
  }

  function activity(initials,name,action,time){
    return '<div class="activityRow"><span class="activityAvatar">'+initials+'</span><div><b>'+esc(name)+'</b><small>'+esc(action)+'</small></div><span>'+esc(time)+'</span></div>';
  }

  function renderCollect(){
    return [
      '<div class="viewBody">',
        '<div class="splitLayout">',
          '<section class="formPanel">',
            '<div class="formTitle"><b>Yig‘ish parametrlari</b><span>Sales hisoboti server kompyuterida yig‘iladi</span></div>',
            '<label class="fieldLabel">Sana<div class="inputMock">09.07.2026</div></label>',
            '<label class="fieldLabel">Brend<div class="inputMock">SOF (JY)</div></label>',
            '<div class="processStatus"><b>Tayyor</b><span>Sanani va brendni tekshirib boshlang.</span></div>',
            '<div class="buttonStack">'+button("Yig'ishni boshlash",'primary')+button("To'xtatish",'danger')+'</div>',
          '</section>',
          '<section class="contentPanel" style="padding:0">',
            '<div class="logPanel">',
              '<div class="logHead"><b>Jarayon holati</b><span class="statusPill">ready</span></div>',
              '<pre>[TAYYOR] 09.07.2026 | SOF\n\nSales sessiyasi tekshirildi.\nBrend va sana tayyorlandi.\nAgentlar: 71 ta\nKutilayotgan foto: 1710 ta\n\nYig‘ishni boshlash mumkin.</pre>',
            '</div>',
          '</section>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderBrand(){
    var brands=['SOF','Lalaku Mama','MONNO','LALAKU','GIGA'];
    var list=brands.map(function(name,i){
      return '<div class="brandRow '+(i===0?'active':'')+'"><b>'+name+'</b><span>Prefix: '+(i===0?'JY':i===1?'LMJ':i===2?'MONNO':i===3?'LLK':'GG')+' · '+(i<3?'Telegram ulangan':'Telegram yo‘q')+'</span></div>';
    }).join('');
    return [
      '<div class="viewBody">',
        '<div class="brandLayout">',
          '<aside class="brandList">'+list+'</aside>',
          '<section class="brandForm">',
            '<div class="brandFormGrid">',
              '<div class="sectionLabel">Asosiy</div>',
              '<label class="fieldLabel">Brend nomi<div class="inputMock">SOF</div></label>',
              '<label class="fieldLabel">Agent prefikslari<div class="inputMock">JY</div></label>',
              '<label class="fieldLabel brandFull">Sales nomlari<div class="inputMock">SOF, Sof</div></label>',
              '<div class="sectionLabel">Telegram</div>',
              '<label class="fieldLabel">Telegram guruhi<div class="inputMock">SOF NAZORAT</div></label>',
              '<label class="fieldLabel">Qo‘lda chat ID<div class="inputMock">-1003916011671</div></label>',
              '<div class="sectionLabel">Holat</div>',
              '<div class="switchRow"><span class="switchMock"></span>Faol brend</div>',
              '<label class="fieldLabel brandFull">Izoh<div class="inputMock area">SOF agentlari odatda JY bilan boshlanadi</div></label>',
            '</div>',
            '<div class="formActions">'+button('Yangi')+button('Saqlash','primary')+button("O'chirish",'danger')+'</div>',
          '</section>',
        '</div>',
      '</div>'
    ].join('');
  }

  function candidate(index,reason,score){
    return [
      '<article class="candidateCard">',
        '<div class="candidateImage"><div class="photoVisual"><div class="photoFallback">SHUBHALI FOTO</div><img data-photo="'+index+'" alt="Shubhali foto"></div></div>',
        '<div class="candidateInfo"><b>JYAN103 #'+(index+1)+'</b><p>'+esc(reason)+' · Ishonchlilik '+score+'%</p><div class="scoreLine"><span style="--score:'+score+'%"></span></div></div>',
      '</article>'
    ].join('');
  }

  function renderAuto(){
    return [
      '<div class="viewBody">',
        '<div class="filterBar"><div class="filterControl">SOF</div><div class="filterControl">09.07.2026</div><span class="toolbarSpacer"></span>'+button('Qayta tekshirish')+button('Tanlanganlarni minusga tayyorlash','primary')+'</div>',
        '<div class="autoLayout">',
          candidate(0,'Kamera yopilgan',96),
          candidate(1,'Ekrandan qayta olingan foto',89),
          candidate(2,'Foto talabga javob bermaydi',82),
        '</div>',
      '</div>'
    ].join('');
  }

  function reportCard(icon,title,text,buttonText){
    return '<article class="reportCard"><span class="reportIcon">'+icon+'</span><b>'+esc(title)+'</b><p>'+esc(text)+'</p>'+button(buttonText,'primary')+'</article>';
  }

  function renderReports(){
    return [
      '<div class="viewBody">',
        filters(''),
        '<div class="panelSurface" style="padding:12px">',
          '<div class="reportGrid">',
            reportCard('EX','Umumiy Excel','Tanlangan brend va sana bo‘yicha barcha agentlar.','Excel yuklash'),
            reportCard('AG','Agent Excel','Agentlar kesimida foto, buyurtma va minuslar.','Agent Excel'),
            reportCard('MN','Minus hisoboti','Sabablar bilan minus qilingan fotolar ro‘yxati.','Hisobot olish'),
          '</div>',
          '<div class="panelTitle" style="margin:18px 0 8px"><b>Oxirgi eksportlar</b><span>Fayllar shu kompyuterga yuklanadi</span></div>',
          '<table class="dataTable"><thead><tr><th>Fayl</th><th>Brend</th><th>Sana</th><th>Holat</th></tr></thead><tbody>',
            '<tr><td><strong>sof_agentlar_2026-07-09.xls</strong></td><td>SOF</td><td>09.07.2026</td><td><span class="statusPill">Tayyor</span></td></tr>',
            '<tr><td><strong>minus_hisoboti_2026-07-08.xls</strong></td><td>Lalaku Mama</td><td>08.07.2026</td><td><span class="statusPill">Tayyor</span></td></tr>',
          '</tbody></table>',
        '</div>',
      '</div>'
    ].join('');
  }

  var renderers={
    photo:renderPhoto,
    review:renderReview,
    minus:renderMinus,
    table:renderTable,
    stats:renderStats,
    collect:renderCollect,
    brand:renderBrand,
    auto:renderAuto,
    reports:renderReports
  };

  function renderView(view){
    currentView=view;
    var meta=views[view]||views.photo;
    document.getElementById('pageEyebrow').textContent=meta.eyebrow;
    document.getElementById('pageTitle').textContent=meta.title;
    document.getElementById('pageSubtitle').textContent=meta.subtitle;
    host.innerHTML=(renderers[view]||renderPhoto)();
    viewSelect.value=view;
    document.querySelectorAll('.navItem').forEach(function(item){
      item.classList.toggle('active',item.dataset.view===view);
    });
    document.querySelectorAll('.dockItem').forEach(function(item){
      item.classList.toggle('active',item.dataset.view===view);
    });
    applyPreviewPhotos();
  }

  function setTheme(theme){
    currentTheme=theme;
    app.dataset.theme=theme;
    var info=themes[theme];
    document.getElementById('variantNumber').textContent=info.number;
    document.getElementById('variantName').textContent=info.name;
    document.getElementById('variantDescription').textContent=info.description;
    document.getElementById('variantTraits').innerHTML=info.traits.map(function(item){return '<span>'+esc(item)+'</span>';}).join('');
    document.getElementById('selectionHint').textContent=info.hint;
    document.querySelectorAll('.variantButton').forEach(function(button){
      button.classList.toggle('active',button.dataset.theme===theme);
    });
  }

  function collectUrls(value,result,depth){
    if(result.length>=8||depth>7||value==null)return;
    if(typeof value==='string'){
      if(/^https?:\/\//i.test(value)&&/\.(jpg|jpeg|png|webp)(\?|$)/i.test(value))result.push(value);
      return;
    }
    if(Array.isArray(value)){
      for(var i=0;i<value.length&&result.length<8;i++)collectUrls(value[i],result,depth+1);
      return;
    }
    if(typeof value==='object'){
      Object.keys(value).some(function(key){
        collectUrls(value[key],result,depth+1);
        return result.length>=8;
      });
    }
  }

  function applyPreviewPhotos(){
    if(!previewPhotos.length)return;
    host.querySelectorAll('img[data-photo]').forEach(function(img){
      var original=previewPhotos[Number(img.dataset.photo)%previewPhotos.length];
      if(!original)return;
      img.dataset.original=original;
      img.dataset.mode='proxy';
      img.onload=function(){img.classList.add('ready');};
      img.onerror=function(){
        if(img.dataset.mode==='proxy'){
          img.dataset.mode='direct';
          img.src=original;
        }else{
          img.classList.remove('ready');
          img.removeAttribute('src');
        }
      };
      img.src='/api/photo?url='+encodeURIComponent(original);
    });
  }

  function loadPreviewPhotos(){
    fetch('../lalaku_mama_browser_collect_2026-07-09_raw.json',{cache:'no-store'})
      .then(function(response){if(!response.ok)throw new Error('dataset');return response.json();})
      .then(function(data){
        var urls=[];
        collectUrls((data.agents||[]).slice(0,12),urls,0);
        previewPhotos=Array.from(new Set(urls)).slice(0,8);
        applyPreviewPhotos();
      })
      .catch(function(){previewPhotos=[];});
  }

  document.querySelectorAll('.variantButton').forEach(function(button){
    button.addEventListener('click',function(){setTheme(button.dataset.theme);});
  });
  document.querySelectorAll('.viewportButton').forEach(function(button){
    button.addEventListener('click',function(){
      device.classList.toggle('narrow',button.dataset.size==='narrow');
      device.classList.toggle('desktop',button.dataset.size==='desktop');
      document.querySelectorAll('.viewportButton').forEach(function(item){item.classList.toggle('active',item===button);});
    });
  });
  document.getElementById('appNavigation').addEventListener('click',function(event){
    var button=event.target.closest('.navItem');
    if(button&&button.dataset.view)renderView(button.dataset.view);
  });
  document.getElementById('floatingDock').addEventListener('click',function(event){
    var button=event.target.closest('.dockItem');
    if(button&&button.dataset.view)renderView(button.dataset.view);
  });
  viewSelect.addEventListener('change',function(){renderView(viewSelect.value);});

  setTheme(currentTheme);
  renderView(currentView);
  loadPreviewPhotos();
})();
