const LS_MARKS='lmjDateReviewMarksV2',LS_REASONS='lmjCustomReasonsV2',LS_REASON_OVERRIDES='lmjReasonOverridesV1',LS_DELETED_REASONS='lmjDeletedReasonsV1',LS_DATE='lmjSelectedDateV2',LS_BRAND='lmjSelectedBrandV1',LS_THEME='lmjUiThemeV1',LS_METRICS='lmjPhotoMetricCacheV1',LS_PHOTO_PAGE_SIZE='lmjPhotoPageSizeV1',LS_CLIENT_ID='lmjReviewClientIdV1';
    const stateTools=window.PhotoReviewState,dataTools=window.PhotoReviewDataLoader,filterTools=window.PhotoReviewFilters,markTools=window.PhotoReviewMarks,brandTools=window.PhotoReviewBrands,attendanceTools=window.PhotoReviewAttendance,uiState=window.PhotoReviewUiState,telegramTools=window.PhotoReviewTelegram,exportTools=window.PhotoReviewExport;
    if(!stateTools||!dataTools||!filterTools||!markTools||!brandTools||!attendanceTools||!uiState||!telegramTools||!exportTools)throw new Error('Review modullari toliq yuklanmadi');
    const defaultReasons=['Ish vaqtidan tashqari olingan foto','Kamera yopilgan yoki to\'sib olingan foto','Bitta do\'kondan takroriy foto','Ekrandan qayta olingan foto','Katalogdan olingan rasm','Faqat mahsulot rasmi','Foto talabga javob bermaydi'];
    const legacyReasons={
      'Ish vaqtidan keyin olingan foto':'Ish vaqtidan tashqari olingan foto',
      'Kamerani yopib tushirilgan foto':'Kamera yopilgan yoki to\'sib olingan foto',
      '1 ta dukondan 1tadan ortiq foto qilingan (dublikat)':'Bitta do\'kondan takroriy foto',
      'Ekrandan olingan foto':'Ekrandan qayta olingan foto',
      'Katologdan tushirilgan rasm':'Katalogdan olingan rasm',
      'Katalogdan tushirilgan rasm':'Katalogdan olingan rasm',
      'Mahsulot rasmi (Talabga javob bermaydigan foto)':'Faqat mahsulot rasmi',
      'Foto talabga javob bermaydi':'Foto talabga javob bermaydi'
    };
    let manifest={datasets:[]},dataset=null,agents=[],allAgents=[],brandSel,dateSel,agentSel,agentIndex=0,start=0,photoPageSize=Math.max(1,Number.parseInt(localStorage.getItem(LS_PHOTO_PAGE_SIZE)||'4',10)||4),photoPageAll=localStorage.getItem(LS_PHOTO_PAGE_SIZE)==='all',paused=true,timer=null,delay=3500,current=null,zoom=1,autoReviewResults=[],autoReviewPreviewOpen=false,autoReviewStats=null,brandConfig={brands:[],warnings:[]},activeBrandId='',attendanceData=null,attendanceConfig={employees:[],routes:[],assignments:[],settings:{}},adminStatsData=null,currentView='photo',attendanceConfigLoadedAt=0,attendanceRenderTimer=null,brandsLoadedAt=0,adminStatsLoadedAt=0,lastMarksLoadAt=0;
    const ATTENDANCE_CACHE_MS=15000,attendanceMonthCache=new Map();
    let marks=stateTools.parseJson(localStorage.getItem(LS_MARKS)||'{}',{}),customReasons=stateTools.parseJson(localStorage.getItem(LS_REASONS)||'[]',[]),reasonOverrides=stateTools.parseJson(localStorage.getItem(LS_REASON_OVERRIDES)||'{}',{}),deletedReasons=stateTools.parseJson(localStorage.getItem(LS_DELETED_REASONS)||'[]',[]),editingReason='';
    const reviewClientId=stateTools.clientId(localStorage,LS_CLIENT_ID);
    let sharedSyncTimer=null,sharedSyncBusy=false,sharedSyncDirty=false,reasonSyncTimer=null;
    let sharedRevisions={marks:'0',reasons:'0',brands:'0'};
    let systemHealth={sync:'loading',syncMessage:'Ulanmoqda...',lastSync:'',telegram:'loading',collect:'idle'};
    let marksVersion=0,agentsVersion=0,renderStatsCache=null,undoStack=[];
    function invalidateRenderStats(){renderStatsCache=null}
    function invalidateMarksCache(){marksVersion++;invalidateRenderStats()}
    function invalidateAgentsCache(){agentsVersion++;invalidateRenderStats()}
    const metricCache=new Map();
    const metricStoreLimit=3500;
    let metricStoreLoaded=false,metricStore={},metricStoreDirty=false,metricFlushTimer=null,sharedMetricStoreLoaded=false,sharedMetricPending={};
    const $=id=>document.getElementById(id);
    let toastTimer=null;
    function notify(message,type='ok'){
      const el=$('toast');if(!el)return;
      el.textContent=message;
      el.className=`toast show ${type==='bad'?'badToast':'okToast'}`;
      clearTimeout(toastTimer);
      toastTimer=setTimeout(()=>{el.className='toast'},2600);
    }
    function systemStatusTone(value){
      if(value==='ok'||value==='done')return 'ok';
      if(value==='error'||value==='failed'||value==='offline')return 'error';
      return 'loading';
    }
    function renderSystemStatus(){
      const online=navigator.onLine;
      const tone=!online?'error':systemStatusTone(systemHealth.sync);
      const dot=$('systemStatusDot'),label=$('systemStatusLabel');
      if(dot)dot.className=`systemStatusDot ${tone}`;
      if(label)label.textContent=!online?'Internet yo‘q':systemHealth.syncMessage;
      const rows=$('systemStatusRows');
      if(rows){
        const publicLink=isPublicView();
        const items=[
          ['Internet',online?'Ulangan':'Ulanmagan',online?'ok':'error'],
          ['Server va sync',systemHealth.syncMessage,systemStatusTone(systemHealth.sync)],
          ['Telegram',systemHealth.telegram==='ok'?'Tayyor':(systemHealth.telegram==='warning'?'Sozlanmagan':(systemHealth.telegram==='error'?'Xato':'Tekshirilmoqda')),systemStatusTone(systemHealth.telegram)],
          ['Ma’lumot yig‘ish',systemHealth.collect==='running'?'Jarayonda':(systemHealth.collect==='error'?'Xato':(systemHealth.collect==='done'?'Tugadi':'Tayyor')),systemHealth.collect==='error'?'error':(systemHealth.collect==='running'?'loading':'ok')],
          ['Ulanish',publicLink?'Cloudflare / public':'Lokal kompyuter','ok']
        ];
        rows.innerHTML=items.map(([name,value,state])=>`<div class="systemStatusRow"><span class="systemStatusDot ${state}"></span><div><b>${escapeHtml(name)}</b><span>${escapeHtml(value)}</span></div></div>`).join('');
      }
      if($('systemStatusUpdated'))$('systemStatusUpdated').textContent=systemHealth.lastSync?`Oxirgi sync: ${new Date(systemHealth.lastSync).toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`:'Hali sinxronlanmagan';
    }
    function setSystemSyncState(state,message){
      systemHealth.sync=state;
      systemHealth.syncMessage=message;
      if(state==='ok')systemHealth.lastSync=new Date().toISOString();
      renderSystemStatus();
    }
    function toggleSystemStatus(open=!$('systemStatusPanel')?.classList.contains('open')){
      $('systemStatusPanel')?.classList.toggle('open',open);
      $('systemStatusBackdrop')?.classList.toggle('open',open);
      $('systemStatusPanel')?.setAttribute('aria-hidden',open?'false':'true');
      $('systemStatusBtn')?.setAttribute('aria-expanded',open?'true':'false');
      if(open)refreshSystemStatusCenter();
    }
    async function refreshSystemStatusCenter(){
      renderSystemStatus();
      await Promise.allSettled([loadTelegramStatus(),refreshCollectStatus(),syncSharedState(false)]);
      renderSystemStatus();
    }
    function currentTheme(){
      const saved=localStorage.getItem(LS_THEME);
      return saved==='night'?'night':'day';
    }
    function applyTheme(theme=currentTheme()){
      const next=theme==='night'?'night':'day';
      document.documentElement.dataset.theme=next;
      document.documentElement.style.colorScheme=next==='night'?'dark':'light';
      const btn=$('themeToggleBtn');
      if(btn){
        btn.textContent=next==='night'?'Kunduzgi rejim':'Tungi rejim';
        btn.title=next==='night'?"Kunduzgi rejimga o'tish":"Tungi rejimga o'tish";
        btn.setAttribute('aria-pressed',next==='night'?'true':'false');
      }
      return next;
    }
    function toggleTheme(){
      const next=(document.documentElement.dataset.theme||currentTheme())==='night'?'day':'night';
      localStorage.setItem(LS_THEME,next);
      applyTheme(next);
      notify(next==='night'?'Tungi rejim yoqildi':'Kunduzgi rejim yoqildi');
    }
    applyTheme();
    const photoLoader=window.PhotoReviewPhotoLoader;
    if(!photoLoader)throw new Error('Photo loader yuklanmadi');
    const photoProxyUrl=(url,variant='full')=>photoLoader.proxyUrl(url,variant);
    const isPublicView=()=>photoLoader.isPublicView();
    const photoInitialMode=(variant='full')=>photoLoader.initialMode(variant);
    const photoDisplayUrl=(url,mode=photoInitialMode(),variant='full')=>photoLoader.displayUrl(url,mode,variant);
    const PHOTO_PRELOAD_TIMEOUT_MS=9000,PHOTO_PRELOAD_MAX=4;
    const preloadSeen=new Set();
    let preloadQueue=[],preloadActive=0;
    function attendanceCacheKey(month,brandId){return `${month||attendanceFilters().month}|${brandId??attendanceFilters().brandId}`}
    function invalidateAttendanceCache(month='',brandId=''){
      attendanceConfigLoadedAt=0;
      if(month||brandId)attendanceMonthCache.delete(attendanceCacheKey(month||attendanceFilters().month,brandId??attendanceFilters().brandId));
      else attendanceMonthCache.clear();
    }
    function scheduleAttendanceRender(){clearTimeout(attendanceRenderTimer);attendanceRenderTimer=setTimeout(renderAttendance,80)}
    function safeAttr(value){
  return String(value??'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}
    function loadPhoto(img,url,mode='proxy',variant='full'){return photoLoader.load(img,url,mode,variant)}
    function retryPhoto(target){return photoLoader.retry(target)}
    function imageError(img){return photoLoader.imageError(img)}
    function imageLoaded(img){return photoLoader.imageLoaded(img)}
    function canonicalReason(reason){
      const text=String(reason||'').trim();
      return legacyReasons[text]||text;
    }
    function displayReason(reason){
      const base=canonicalReason(reason);
      return reasonOverrides[base]||base;
    }
    function displayReasons(reasons){
      return [...new Set((Array.isArray(reasons)?reasons:String(reasons||'').split(';')).map(displayReason).filter(Boolean))];
    }
    function reasonKey(reason){return canonicalReason(String(reason||'').trim()).toLowerCase()}
    function isReasonDeleted(reason){return new Set((deletedReasons||[]).map(reasonKey)).has(reasonKey(reason))||new Set((deletedReasons||[]).map(reasonKey)).has(reasonKey(displayReason(reason)))}
    function allReasons(){return [...new Set([...defaultReasons,...customReasons].map(displayReason).filter(Boolean))].filter(r=>reasonIsDefault(r)||!isReasonDeleted(r))}
    function selectedReasonValues(){return [...document.querySelectorAll('#reasonChecks input[type=checkbox]:checked')].map(x=>x.value)}
    function persistReasonState(){
      localStorage.setItem(LS_REASONS,JSON.stringify(customReasons));
      localStorage.setItem(LS_REASON_OVERRIDES,JSON.stringify(reasonOverrides));
      localStorage.setItem(LS_DELETED_REASONS,JSON.stringify(deletedReasons));
    }
    function mergeReasonState(data){
      if(!data||typeof data!=='object')return false;
      const before=JSON.stringify({customReasons,reasonOverrides,deletedReasons});
      const incomingReasons=Array.isArray(data.customReasons)?data.customReasons:[];
      const incomingDeleted=Array.isArray(data.deletedReasons)?data.deletedReasons:[];
      deletedReasons=[...new Set([...(deletedReasons||[]),...incomingDeleted].map(x=>String(x||'').trim()).filter(Boolean))];
      const deletedSet=new Set((deletedReasons||[]).map(reasonKey));
      customReasons=[...new Set([...(customReasons||[]),...incomingReasons].map(x=>String(x||'').trim()).filter(Boolean))]
        .filter(r=>!deletedSet.has(reasonKey(r))&&!deletedSet.has(reasonKey(displayReason(r))));
      if(data.reasonOverrides&&typeof data.reasonOverrides==='object'&&!Array.isArray(data.reasonOverrides)){
        reasonOverrides={...reasonOverrides,...data.reasonOverrides};
      }
      Object.keys(reasonOverrides||{}).forEach(base=>{
        if(deletedSet.has(reasonKey(base))||deletedSet.has(reasonKey(reasonOverrides[base])))delete reasonOverrides[base];
      });
      persistReasonState();
      return before!==JSON.stringify({customReasons,reasonOverrides,deletedReasons});
    }
    function refreshReasonUi(){
      renderReasonLegend();
      if($('modal')?.classList.contains('open'))renderChecks(selectedReasonValues());
    }
    function queueReasonSync(){
      sharedSyncDirty=true;
      clearTimeout(reasonSyncTimer);
      reasonSyncTimer=setTimeout(()=>syncSharedState(true).catch(()=>{}),250);
    }
    function saveReasonState(){
      persistReasonState();
      queueReasonSync();
    }
    function reasonIsDefault(reason){
      const base=canonicalReason(reason);
      return defaultReasons.some(r=>canonicalReason(r)===base);
    }
    function localMarks(){
      const local={};
      try{
        for(let i=0;i<localStorage.length;i++){
          const storageKey=localStorage.key(i);
          if(!storageKey||!storageKey.startsWith('lmjDateReviewMarks'))continue;
          Object.assign(local,JSON.parse(localStorage.getItem(storageKey)||'{}')||{});
        }
      }catch{
        Object.assign(local,JSON.parse(localStorage.getItem(LS_MARKS)||'{}')||{});
      }
      return local;
    }
    const clientMarkTime=stateTools.recordTime;
    const mergeMarkValue=stateTools.mergeRecord;
    const mergeMarks=stateTools.mergeRecords;
    const markChanged=stateTools.changed;
    function mergeIncomingMarks(source){
      let changed=false;
      for(const [k,v] of Object.entries(source||{})){
        const prev=marks[k];
        const next=mergeMarkValue(prev,v);
        if(markChanged(prev,next))changed=true;
        marks[k]=next;
      }
      if(changed)invalidateMarksCache();
      localStorage.setItem(LS_MARKS,JSON.stringify(marks));
      return changed;
    }
    async function loadMarks(force=false,filters=null){
      if(!force&&lastMarksLoadAt&&Date.now()-lastMarksLoadAt<3000)return marks;
      const next={};
      mergeMarks(next,localMarks());
      try{
        const params=new URLSearchParams({_:Date.now()});
        if(filters?.brand)params.set('brand',filters.brand);
        if(filters?.date)params.set('date',filters.date);
        if(filters?.verdict)params.set('verdict',filters.verdict);
        const res=await fetch('/api/marks?'+params.toString());
        const data=await res.json();
        if(res.ok&&data.marks)mergeMarks(next,data.marks);
        if(res.ok&&data.revision)sharedRevisions.marks=String(data.revision);
        mergeMarks(next,localMarks());
      }catch{}
      marks=next;
      try{
      localStorage.setItem(LS_MARKS,JSON.stringify(marks));
    }catch(e){
      console.error('LocalStorage saqlashda xato:',e);
      notify('LocalStorage to\'ldirildi. Ba\'zi ma\'lumotlar vaqtincha saqlanmaydi.','bad');
      }
      lastMarksLoadAt=Date.now();
      invalidateMarksCache();
      return marks;
    }
    async function loadReasons(){
      try{
        mergeReasonState({
          customReasons:JSON.parse(localStorage.getItem(LS_REASONS)||'[]'),
          reasonOverrides:JSON.parse(localStorage.getItem(LS_REASON_OVERRIDES)||'{}'),
          deletedReasons:JSON.parse(localStorage.getItem(LS_DELETED_REASONS)||'[]')
        });
      }catch{}
      try{
        const data=await dataTools.getJson('/api/reasons?'+Date.now(),{timeout:10000});
        mergeReasonState(data);
        if(data.revision)sharedRevisions.reasons=String(data.revision);
      }catch{}
    }
    function applySharedBrands(data){
      if(!data||!Array.isArray(data.brands))return false;
      const before=JSON.stringify(brandConfig);
      brandConfig={brands:data.brands,warnings:data.warnings||[]};
      brandsLoadedAt=Date.now();
      const changed=before!==JSON.stringify(brandConfig);
      if(changed)invalidateRenderStats();
      return changed;
    }
    function refreshSharedUi(marksChanged=false,reasonsChanged=false,brandsChanged=false){
      if(reasonsChanged)refreshReasonUi();
      if(brandsChanged){
        renderCollectBrands();
        if(currentView==='attendance')renderAttendanceBrands();
      }
      if(marksChanged&&dataset&&agents.length){
        rebuildAgents();
        if(currentView==='photo')render();
      }
    }
    async function syncSharedState(push=false){
      if(sharedSyncBusy)return;
      sharedSyncBusy=true;
      setSystemSyncState('syncing','Sinxronlanmoqda...');
      try{
        const payload={};
        const method=push||sharedSyncDirty?'POST':'GET';
        if(method==='POST'){
          payload.reasons={customReasons,reasonOverrides,deletedReasons};
          payload.baseRevisions={...sharedRevisions};
          payload.clientId=reviewClientId;
        }
        const url='/api/sync?light=1&_='+Date.now();
        const data=method==='POST'
          ?await dataTools.postJson(url,payload,{timeout:15000})
          :await dataTools.getJson(url,{timeout:15000});
        const incomingRevisions=data.revisions||{};
        const marksRevisionChanged=Boolean(incomingRevisions.marks&&incomingRevisions.marks!==sharedRevisions.marks);
        let marksChanged=data.marks?mergeIncomingMarks(data.marks):false;
        if(marksRevisionChanged&&(method==='GET'||data.conflicts?.marks)){
          const before=marksVersion;
          await loadMarks(true);
          marksChanged=marksChanged||marksVersion!==before;
        }
        const reasonsChanged=data.reasons?mergeReasonState(data.reasons):false;
        const brandsChanged=data.brands?applySharedBrands(data.brands):false;
        sharedRevisions={...sharedRevisions,...Object.fromEntries(Object.entries(incomingRevisions).map(([key,value])=>[key,String(value||'0')]))};
        sharedSyncDirty=false;
        refreshSharedUi(marksChanged,reasonsChanged,brandsChanged);
        setSystemSyncState('ok',data.conflicts?.reasons?'O‘zgarishlar birlashtirildi':'Sinxron');
      }catch(e){
        if(push)console.warn('Shared sync xato:',e);
        setSystemSyncState('error','Server bilan aloqa yo‘q');
      }finally{
        sharedSyncBusy=false;
      }
    }
    function startSharedSync(){
      if(sharedSyncTimer)return;
      syncSharedState(false).catch(()=>{});
      sharedSyncTimer=setInterval(()=>syncSharedState(false).catch(()=>{}),7000);
    }
    async function loadBrands(force=false){
      if(!force&&brandsLoadedAt&&Date.now()-brandsLoadedAt<10000){
        renderCollectBrands();
        renderAttendanceBrands();
        return brandConfig;
      }
      try{
        const data=await dataTools.getJson('/api/brands',{timeout:10000});
        brandConfig={brands:data.brands||[],warnings:data.warnings||[]};
        if(data.revision)sharedRevisions.brands=String(data.revision);
        brandsLoadedAt=Date.now();
        invalidateRenderStats();
      }catch(e){brandConfig={brands:[],warnings:[e.message]};}
      renderCollectBrands();
      renderAttendanceBrands();
      return brandConfig;
    }
    function brandById(id){return brandTools.byId(brandConfig,id)}
    function brandByCode(code){return brandTools.byCode(brandConfig,code)}
    function brandDisplayName(brand){return brandTools.displayName(brand)}
    function slugBrandId(name,prefixes=[]){return brandTools.slug(name,prefixes)}
    function renderBrandTelegramChats(selectedId=''){
      const sel=$('brandTelegramChat');if(!sel)return;
      const chats=window.telegramChats||[];
      sel.innerHTML='<option value="">Umumiy tanlov / ulanmagan</option>'+chats.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.maskedId||c.id)})</option>`).join('');
      if(chats.some(c=>String(c.id)===String(selectedId)))sel.value=selectedId;
    }
    function renderCollectBrands(){
      const sel=$('collectBrand');if(!sel)return;
      const enabled=(brandConfig.brands||[]).filter(b=>b.enabled!==false);
      sel.innerHTML=enabled.map(b=>`<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)} (${escapeHtml((b.agentPrefixes||[]).join(', ')||'prefix yoq')})</option>`).join('');
      const current=dataset?.brand?.id||currentBrand();
      if(enabled.some(b=>b.id===current))sel.value=current;
    }
    function renderAttendanceBrands(){
      const sel=$('attendanceBrand');if(!sel)return;
      const enabled=(brandConfig.brands||[]).filter(b=>b.enabled!==false);
      sel.innerHTML='<option value="">Barcha brendlar</option>'+enabled.map(b=>`<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)} (${escapeHtml((b.agentPrefixes||[]).join(', ')||'prefix yoq')})</option>`).join('');
      const current=dataset?.brand?.id||currentBrand();
      if(enabled.some(b=>b.id===current))sel.value=current;
    }
    function selectedBrandFromForm(){
      const prefixes=$('brandPrefixes').value.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
      const selectedChat=(window.telegramChats||[]).find(c=>String(c.id)===String($('brandTelegramChat')?.value||''));
      const manualChatId=String($('brandTelegramChatId')?.value||'').trim();
      const telegramChatId=manualChatId||String($('brandTelegramChat')?.value||'').trim();
      const current=brandById(activeBrandId)||{};
      return {
        id:($('brandId').value.trim()||slugBrandId($('brandNameInput').value,prefixes)).toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,''),
        name:$('brandNameInput').value.trim(),
        salesBrandNames:$('brandSalesNames').value.split(',').map(x=>x.trim()).filter(Boolean),
        agentPrefixes:prefixes,
        telegramChatId,
        telegramChatName:manualChatId?(current.telegramChatName||''):(selectedChat?.name||''),
        enabled:$('brandEnabled').checked,
        notes:$('brandNotes').value.trim()
      };
    }
    function fillBrandForm(brand=null){
      const b=brand||{id:'',name:'',salesBrandNames:[],agentPrefixes:[],telegramChatId:'',telegramChatName:'',enabled:true,notes:''};
      activeBrandId=b.id||'';
      $('brandId').value=b.id||'';
      $('brandNameInput').value=b.name||'';
      $('brandSalesNames').value=(b.salesBrandNames||[]).join(', ');
      $('brandPrefixes').value=(b.agentPrefixes||[]).join(', ');
      renderBrandTelegramChats(b.telegramChatId||'');
      if($('brandTelegramChatId'))$('brandTelegramChatId').value=b.telegramChatId||'';
      $('brandEnabled').checked=b.enabled!==false;
      $('brandNotes').value=b.notes||'';
      renderBrandList();
    }
    function renderBrandList(){
      const list=$('brandList');if(!list)return;
      list.innerHTML=(brandConfig.brands||[]).map(b=>{
        const telegram=b.telegramChatName||b.telegramChatId||'ulanmagan';
        const telegramOk=Boolean(b.telegramChatName||b.telegramChatId);
        const prefixes=(b.agentPrefixes||[]).join(', ')||'-';
        return `<button class="brandItem ${b.id===activeBrandId?'active':''}" data-brand-id="${escapeHtml(b.id)}">
          <span class="brandItemTop"><b>${escapeHtml(b.name)}</b><span class="brandStatus ${b.enabled!==false?'ok':'off'}">${b.enabled!==false?'Faol':'Ochiq emas'}</span></span>
          <span class="brandMetaLine"><span>Prefix: ${escapeHtml(prefixes)}</span><span class="brandStatus ${telegramOk?'ok':'off'}">${telegramOk?'Telegram ulangan':'Telegram yoq'}</span></span>
          <span class="brandMetaLine mutedLine">${escapeHtml(telegram)}</span>
        </button>`;
      }).join('')||viewStateMarkup('Brend topilmadi','Yangi brend yaratish uchun formani to\'ldiring.',{compact:true});
      document.querySelectorAll('.brandItem').forEach(btn=>btn.onclick=()=>fillBrandForm(brandById(btn.dataset.brandId)));
      const warnings=(brandConfig.warnings||[]).length?`\nWarnings:\n${brandConfig.warnings.map(x=>'- '+x).join('\n')}`:'';
      if($('brandValidation'))$('brandValidation').textContent=`Brands: ${(brandConfig.brands||[]).length}${warnings}`;
    }
    function openBrandSettings(){
      switchView('brand');
      if(!(brandConfig.brands||[]).length)uiState.render($('brandList'),'Brendlar yuklanmoqda','Serverdagi sozlamalar olinmoqda.',{type:'loading',compact:true});
      if($('brandValidation'))$('brandValidation').textContent='Brend sozlamalari yuklanmoqda...';
      fillBrandForm(brandById(activeBrandId)||brandConfig.brands[0]||null);
      loadTelegramStatus().catch(()=>{});
      loadBrands().then(()=>{
        const active=document.activeElement;
        const editing=active&&$('brandPanel')?.contains(active)&&/INPUT|TEXTAREA|SELECT/.test(active.tagName||'');
        if($('brandPanel')?.classList.contains('open')&&!editing)fillBrandForm(brandById(activeBrandId)||brandConfig.brands[0]||null);
      }).catch(e=>notify(e.message,'bad'));
    }
    function closeBrandSettings(){
      $('brandPanel')?.classList.remove('open');
      if(currentView==='brand')switchView('photo');
    }
    async function saveBrandSettings(){
      const next=selectedBrandFromForm();
      const brands=[...(brandConfig.brands||[])];
      const index=brands.findIndex(b=>b.id===activeBrandId||b.id===next.id);
      if(index>=0)brands[index]=next;else brands.push(next);
      const res=await fetch('/api/brands',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brands})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok===false)throw new Error((data.errors||[]).join('; ')||data.error||`HTTP ${res.status}`);
      brandConfig={brands:data.brands||brands,warnings:data.warnings||[]};
      if(data.revision)sharedRevisions.brands=String(data.revision);
      brandsLoadedAt=Date.now();
      invalidateRenderStats();
      const saved=brandById(next.id)||next;
      await loadTelegramStatus().catch(()=>{});
      fillBrandForm(saved);renderCollectBrands();notify('Brend config saqlandi');
    }
    async function deleteBrandSetting(){
      if(!activeBrandId){fillBrandForm();return}
      if(!confirm(`${activeBrandId} brendi o'chirilsinmi? Config backup qilinadi.`))return;
      const res=await fetch('/api/brands/'+encodeURIComponent(activeBrandId),{method:'DELETE'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
      brandConfig={brands:data.brands||[],warnings:data.warnings||[]};
      if(data.revision)sharedRevisions.brands=String(data.revision);
      brandsLoadedAt=Date.now();
      invalidateRenderStats();
      fillBrandForm(brandConfig.brands[0]||null);renderCollectBrands();notify("Brend o'chirildi");
    }
    async function validateBrandSettings(){
      const brands=[...(brandConfig.brands||[])];
      const next=selectedBrandFromForm();
      const index=brands.findIndex(b=>b.id===activeBrandId||b.id===next.id);
      if(next.id||next.name){if(index>=0)brands[index]=next;else brands.push(next);}
      const res=await fetch('/api/brands/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brands})});
      const data=await res.json().catch(()=>({}));
      if($('brandValidation'))$('brandValidation').textContent=[data.ok?'Config OK':'Config xato',(data.errors||[]).map(x=>'- '+x).join('\n'),(data.warnings||[]).length?'Warnings:\\n'+data.warnings.map(x=>'- '+x).join('\n'):''].filter(Boolean).join('\n');
    }
    function exportBrandSettings(){
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([JSON.stringify({brands:brandConfig.brands||[]},null,2)],{type:'application/json'}));
      a.download='brands.json';a.click();
    }
    async function importBrandSettings(file){
      if(!file)return;
      const text=await file.text();
      const json=JSON.parse(text);
      const res=await fetch('/api/brands',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(json)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok===false)throw new Error((data.errors||[]).join('; ')||data.error||`HTTP ${res.status}`);
      brandConfig={brands:data.brands||[],warnings:data.warnings||[]};
      if(data.revision)sharedRevisions.brands=String(data.revision);
      brandsLoadedAt=Date.now();
      invalidateRenderStats();
      fillBrandForm(brandConfig.brands[0]||null);renderCollectBrands();notify('Brend config import qilindi');
    }
    function key(a,p){return `${dataset.date}#${a.code}#${p.id}`}
    function cloneReviewValue(value){return stateTools.clone(value)}
    function markIsReviewed(mark){return markTools.isReviewed(mark)}
    function reviewProgress(){
      let reviewed=0,total=0;
      for(const agent of agents){
        for(const photo of agent.photos||[]){
          total+=1;
          if(markIsReviewed(marks[key(agent,photo)]))reviewed+=1;
        }
      }
      return {reviewed,total,pending:Math.max(0,total-reviewed)};
    }
    function updateReviewAssist(){
      const progress=reviewProgress();
      if($('reviewProgressText'))$('reviewProgressText').textContent=`${progress.reviewed} / ${progress.total}`;
      if($('nextUncheckedBtn')){
        $('nextUncheckedBtn').disabled=!progress.pending;
        $('nextUncheckedBtn').title=progress.pending?`${progress.pending} ta tekshirilmagan foto qoldi`:'Barcha foto tekshirilgan';
      }
      if($('undoReviewBtn'))$('undoReviewBtn').disabled=!undoStack.length;
      return progress;
    }
    function pushReviewUndo(changes,label='Belgilash'){
      const clean=(changes||[]).filter(item=>item?.key);
      if(!clean.length)return;
      undoStack.push({label,changes:clean});
      if(undoStack.length>30)undoStack.shift();
      updateReviewAssist();
    }
    function undoLastReview(){
      const action=undoStack.pop();
      if(!action){notify('Bekor qilinadigan amal yo‘q','bad');return}
      const now=new Date().toISOString(),changed=[];
      for(const item of action.changes){
        marks[item.key]=item.previous
          ? {...item.previous,updatedAt:now,updatedBy:reviewClientId}
          : {_deleted:true,date:item.date||dataset?.date||'',code:item.code||'',url:item.url||'',updatedAt:now,updatedBy:reviewClientId};
        changed.push(item.key);
      }
      saveMarks(changed);rebuildAgents();render();refreshAutoReviewAfterMark();
      notify(`${action.label} bekor qilindi`);
    }
    function openNextUnchecked(){
      if(!agents.length)return;
      for(let agentOffset=0;agentOffset<agents.length;agentOffset++){
        const ai=(agentIndex+agentOffset)%agents.length;
        const agent=agents[ai];
        const firstPhoto=agentOffset===0?Math.min(agent.photos.length,start):0;
        for(let photoOffset=0;photoOffset<agent.photos.length;photoOffset++){
          const pi=(firstPhoto+photoOffset)%agent.photos.length;
          const photo=agent.photos[pi];
          if(markIsReviewed(marks[key(agent,photo)]))continue;
          agentIndex=ai;
          const size=photoPageSizeFor(agent);
          start=Math.floor(pi/size)*size;
          render();
          setTimeout(()=>openModal(pi),0);
          return;
        }
      }
      notify('Barcha foto tekshirilgan');
      updateReviewAssist();
    }
    function saveMarks(changedKeys=null){
      invalidateMarksCache();
      localStorage.setItem(LS_MARKS,JSON.stringify(marks));
      const keys=Array.isArray(changedKeys)?[...new Set(changedKeys.filter(key=>marks[key]))]:Object.keys(marks);
      const outgoing=Object.fromEntries(keys.map(key=>[key,{...marks[key],updatedBy:marks[key]?.updatedBy||reviewClientId}]));
      if(!keys.length)return Promise.resolve();
      setSystemSyncState('syncing','Saqlanmoqda...');
      return fetch('/api/marks?compact=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({marks:outgoing,baseRevision:sharedRevisions.marks,clientId:reviewClientId})})
        .then(res=>res.json().catch(()=>({})))
        .then(async data=>{
          if(data?.marks)mergeIncomingMarks(data.marks);
          if(data?.revision)sharedRevisions.marks=String(data.revision);
          if(data?.conflict)await loadMarks(true);
          setSystemSyncState('ok',data?.conflict?'O‘zgarishlar birlashtirildi':'Saqlandi');
        })
        .catch(()=>{setSystemSyncState('error','Lokal saqlandi');notify('Serverga saqlashda xato. Lokal saqlandi.','bad')});
    }
    function photoDate(p){return (p.photoTime||dataset?.date||'').slice(0,10)}
    function brandFromCode(code){const found=brandByCode(code);if(found)return found.id;const c=String(code||'').toUpperCase();return c.match(/^[A-Z]+/)?.[0]||'lalaku_mama'}
    function brandName(code){return brandDisplayName(brandById(code))||code}
    function brandPayloadForCode(code){
      const brand=brandByCode(code)||brandById(brandFromCode(code))||brandById(currentBrand());
      const id=brand?.id||currentBrand()||brandFromCode(code);
      return {brandId:id,brandCode:brand?.code||(brand?.agentPrefixes||[])[0]||id,brandName:brandDisplayName(brand)||brandName(id)||id};
    }
    function cleanDate(value){return filterTools.cleanDate(value)}
    function agentDisplayName(a){
      const raw=String(a?.agent||a?.code||'').trim();
      const bracket=raw.match(/\[([^\]]+)\]/);
      if(bracket?.[1])return bracket[1].trim();
      return raw
        .replace(String(a?.code||''),'')
        .replace(/\b[A-Z]{2,}[A-Z0-9-]*\b/g,'')
        .replace(/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/g,'')
        .replace(/\s+/g,' ')
        .replace(/^[|:;,\-\s]+|[|:;,\-\s]+$/g,'')
        .trim()||String(a?.code||'Agent');
    }
    function currentBrand(){return dataset?.brand?.id||brandFromCode(dataset?.brand?.code||agents[0]?.code||'LMJ')}
    function markMatchesBrand(m,brand=currentBrand()){const b=brandById(brand);const code=String(m?.code||'').toUpperCase();if(b?.agentPrefixes?.length)return b.agentPrefixes.some(p=>code.startsWith(String(p).toUpperCase()));return brandFromCode(code)===brand}
    function normalizeBrandFilter(value){
      const raw=String(value||'').trim();
      if(!raw)return '';
      const lower=raw.toLowerCase();
      const brands=brandConfig.brands||[];
      const byId=brands.find(b=>String(b.id||'').toLowerCase()===lower);
      if(byId)return byId.id;
      const byName=brands.find(b=>[b.name,b.code,...(b.salesBrandNames||[])].some(x=>String(x||'').toLowerCase()===lower));
      if(byName)return byName.id;
      return raw;
    }
    function markMatchesCurrentBrand(m){return markMatchesBrand(m,currentBrand())}
    function renderStats(){
      const key=[dataset?.date||'',currentBrand(),marksVersion,agentsVersion,agents.length].join('|');
      if(renderStatsCache?.key===key)return renderStatsCache.value;
      const minusByCode=new Map(),currentMinus=[];
      for(const m of Object.values(marks)){
        if(m?.date!==dataset?.date||m?.verdict!=='MINUS'||!markMatchesCurrentBrand(m))continue;
        currentMinus.push(m);
        minusByCode.set(m.code,(minusByCode.get(m.code)||0)+1);
      }
      const partialCount=agents.filter(x=>x.collectStatus==='partial').length;
      const extraCount=agents.filter(x=>x.collectStatus==='extra').length;
      const emptyCount=agents.filter(x=>x.collectStatus==='empty').length;
      const totalPhotos=agents.reduce((s,x)=>s+x.photos.length,0);
      const rows=[],byAgentMap=new Map();
      let duplicateCount=0;
      for(const a of agents){
        const seen=new Set();
        for(const [i,p] of a.photos.entries()){
          if(seen.has(p.url))duplicateCount++;
          else seen.add(p.url);
          const t=photoClock(p);
          if(t&&(t<'08:00'||t>'17:45')){
            const row={a,p,i,time:t,type:t<'08:00'?'08:00 dan oldin':'17:45 dan keyin'};
            rows.push(row);
            const x=byAgentMap.get(a.code)||{a,count:0,before:0,after:0,times:[]};
            x.count++;
            if(t<'08:00')x.before++;else x.after++;
            x.times.push(t);
            byAgentMap.set(a.code,x);
          }
        }
      }
      const value={currentMinus,minusByCode,partialCount,extraCount,emptyCount,totalPhotos,duplicateCount,afterHours:{rows,byAgent:[...byAgentMap.values()].sort((x,y)=>y.count-x.count||x.a.code.localeCompare(y.a.code))}};
      renderStatsCache={key,value};
      return value;
    }
    function currentMinusMarks(){return renderStats().currentMinus}
    function isAgentPrefixMatched(agent){
      const b=brandById(dataset?.brand?.id)||brandByCode(dataset?.brand?.code||agent?.code);
      const prefixes=b?.agentPrefixes||dataset?.brand?.agentPrefixes||[];
      if(!prefixes.length)return false;
      const code=String(agent?.code||'').toUpperCase();
      return prefixes.some(p=>code.startsWith(String(p).toUpperCase()));
    }
    function applyAgentFilter(){
      const mode=$('agentFilter')?.value||'matching';
      agents=allAgents.filter(a=>mode==='all'||(mode==='matching'?a.prefixMatched:!a.prefixMatched));
      if(!agents.length&&mode==='matching'&&allAgents.some(a=>!a.prefixMatched)){
        $('agentFilter').value='all';
        agents=allAgents.slice();
      }
      agentIndex=0;start=0;
      invalidateAgentsCache();
      rebuildAgents();render();
    }
    function money(value){return exportTools.money(value)}
    function photoClock(p){
      const raw=String(p.photoTime||'').trim();
      if(!raw)return '';
      if(/\d{4}-\d{2}-\d{2}T/.test(raw)){
        const d=new Date(raw);
        if(!Number.isNaN(d.getTime()))return d.toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit',hour12:false});
      }
      const m=raw.match(/(\d{2}):(\d{2})/);return m?`${m[1]}:${m[2]}`:''
    }
    function photoMinuteValue(p){
      const t=photoClock(p);
      const m=t.match(/^(\d{2}):(\d{2})$/);
      return m?Number(m[1])*60+Number(m[2]):null;
    }
    function isAfterHours(p){const t=photoClock(p);return !!t&&(t<'08:00'||t>'17:45')}
    function duplicate(a,p){
      // Faqat aynan bir xil URL takrorlansa dublikat.
      // Oldingi variant bir klientda 2+ foto bo'lsa hammasini dublikat deb chiqarishi mumkin edi.
      return Boolean(p?.url)&&(a.urlCounts?.get(p.url)||0)>1
    }
    const sameMinuteCache=new WeakMap();
    function sameMinuteExtraSet(a){
      if(!a||!Array.isArray(a.photos))return new Set();
      const cached=sameMinuteCache.get(a);
      if(cached&&cached.photos===a.photos)return cached.set;
      const set=new Set();
      const items=[];
      a.photos.forEach((p,index)=>{
        const minute=photoMinuteValue(p);
        if(minute===null)return;
        items.push({index,minute});
      });
      items.sort((x,y)=>x.minute-y.minute||x.index-y.index);
      let clusterStart=null;
      let clusterPrev=null;
      const flush=()=>{
        if(clusterStart&&clusterStart.length>1){
          clusterStart.slice(1).forEach(item=>set.add(item.index));
        }
      };
      items.forEach(item=>{
        if(!clusterStart||!clusterPrev||item.minute-clusterPrev.minute>1){
          flush();
          clusterStart=[item];
        }else{
          clusterStart.push(item);
        }
        clusterPrev=item;
      });
      flush();
      sameMinuteCache.set(a,{photos:a.photos,set});
      return set;
    }
    function sameMinuteExtra(a,p,index=a?.photos?.indexOf?.(p)??-1){
      if(!a||index<0)return false;
      return sameMinuteExtraSet(a).has(index);
    }
    function sameMinuteReason(){
      const needle=["1 ta dukondan bir vaqtning ozida","1 ta do'kondan bir vaqtning ozida","bir vaqtning ozida 1 tadan oshiq","bir vaqtda 1 tadan ortiq"];
      const found=allReasons().find(reason=>{
        const text=canonicalReason(reason).toLowerCase();
        return needle.some(x=>text.includes(x));
      });
      return found||"1 ta do'kondan bir vaqtning ozida 1 tadan oshiq foto qilingan";
    }
    function shortReason(r){return displayReason(r).replace('Ish vaqtidan tashqari olingan foto','Ish vaqtidan tashqari').replace('Kamera yopilgan yoki to\'sib olingan foto','Kamera yopilgan').replace('Bitta do\'kondan takroriy foto','Takroriy foto').replace('Ekrandan qayta olingan foto','Ekran rasmi').replace('Katalogdan olingan rasm','Katalog rasmi').replace('Faqat mahsulot rasmi','Mahsulot rasmi').replace('Foto talabga javob bermaydi','Talabga javob bermaydi')}
    function orderInfo(p){
      const sum=Number(p?.clientOrderSum||0)||0;
      const count=Number(p?.clientOrderCount||0)||0;
      if(sum>0||count>0){
        const source=p?.clientOrderSource==='zayavki'?' (Zayavki)':'';
        return {known:true,has:true,text:`Buyurtma bor${sum?`: ${money(sum)}`:count?` (${count} ta)`:''}${source}`};
      }
      if(p?.clientOrderKnown===true&&p?.clientHasOrder===false)return {known:true,has:false,text:'Buyurtma yo\'q'};
      return {known:false,has:false,text:''};
    }
    function hammingBits(a,b){
      if(!a||!b||a.length!==b.length)return 99;
      let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;
      return n;
    }
    function hashSegmentValue(hash,chunk,size=16){
      const part=String(hash||'').slice(chunk*size,chunk*size+size);
      return part.length===size?parseInt(part,2):null;
    }
    function buildNearHashIndex(items,size=16){
      const index=new Map();
      let chunks=0;
      for(const item of items||[]){
        const hash=item?.metrics?.hash;
        if(!hash)continue;
        chunks=Math.max(chunks,Math.floor(hash.length/size));
        for(let chunk=0;chunk<Math.floor(hash.length/size);chunk++){
          const value=hashSegmentValue(hash,chunk,size);
          if(value===null)continue;
          const key=`${chunk}:${value}`;
          if(!index.has(key))index.set(key,[]);
          index.get(key).push(item);
        }
      }
      return {index,size,chunks};
    }
    function segmentValueVariants(value,size=16,maxBits=2){
      const values=[value];
      if(maxBits>=1){
        for(let a=0;a<size;a++)values.push(value^(1<<a));
      }
      if(maxBits>=2){
        for(let a=0;a<size;a++){
          for(let b=a+1;b<size;b++)values.push(value^(1<<a)^(1<<b));
        }
      }
      return values;
    }
    function nearHashCandidates(hashIndex,hash){
      if(!hashIndex?.index||!hash)return [];
      const {index,size=16,chunks=0}=hashIndex;
      const found=new Set();
      const maxChunks=Math.min(chunks,Math.floor(String(hash).length/size));
      for(let chunk=0;chunk<maxChunks;chunk++){
        const value=hashSegmentValue(hash,chunk,size);
        if(value===null)continue;
        for(const nextValue of segmentValueVariants(value,size,2)){
          const bucket=index.get(`${chunk}:${nextValue}`);
          if(bucket)bucket.forEach(item=>found.add(item));
        }
      }
      return [...found];
    }
    function loadImageForRules(url,timeout=12000){
      return new Promise((resolve,reject)=>{
        const img=new Image();
        const timer=setTimeout(()=>{img.src='';reject(new Error('Rasm yuklanmadi'))},timeout);
        img.onload=()=>{clearTimeout(timer);resolve(img)};
        img.onerror=()=>{clearTimeout(timer);reject(new Error('Rasm yuklanmadi'))};
        img.referrerPolicy='no-referrer';
        img.src=photoProxyUrl(url);
      });
    }
    function normalizeMetricCacheEntry(entry){
      if(!entry||typeof entry!=='object')return null;
      const metrics=entry.metrics&&typeof entry.metrics==='object'?entry.metrics:entry;
      if(!metrics||typeof metrics.hash!=='string'||!metrics.hash)return null;
      return {metrics,ts:Number(entry.ts||Date.now())||Date.now()};
    }
    function trimMetricStore(){
      const entries=Object.entries(metricStore)
        .map(([url,entry])=>[url,normalizeMetricCacheEntry(entry)])
        .filter(([,entry])=>entry)
        .sort((a,b)=>(b[1].ts||0)-(a[1].ts||0))
        .slice(0,metricStoreLimit);
      metricStore=Object.fromEntries(entries);
    }
    function loadMetricStore(){
      if(metricStoreLoaded)return;
      metricStoreLoaded=true;
      try{
        const saved=JSON.parse(localStorage.getItem(LS_METRICS)||'{}');
        metricStore=saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};
        trimMetricStore();
        for(const [url,entry] of Object.entries(metricStore)){
          const normalized=normalizeMetricCacheEntry(entry);
          if(normalized)metricCache.set(url,normalized.metrics);
        }
      }catch{
        metricStore={};
      }
    }
    function saveMetricStoreSoon(){
      metricStoreDirty=true;
      clearTimeout(metricFlushTimer);
      metricFlushTimer=setTimeout(()=>saveMetricStore(),900);
    }
    function saveMetricStore(){
      if(!metricStoreDirty)return;
      metricStoreDirty=false;
      try{
        trimMetricStore();
        localStorage.setItem(LS_METRICS,JSON.stringify(metricStore));
      }catch{}
    }
    async function loadSharedMetricStore(){
      loadMetricStore();
      if(sharedMetricStoreLoaded)return;
      sharedMetricStoreLoaded=true;
      try{
        const res=await fetch('/api/photo-metrics?_='+Date.now());
        const data=await res.json();
        if(!res.ok||!data?.items)return;
        let changed=false;
        for(const [url,entry] of Object.entries(data.items||{})){
          const normalized=normalizeMetricCacheEntry(entry);
          if(!url||!normalized)continue;
          const current=normalizeMetricCacheEntry(metricStore[url]);
          if(!current||normalized.ts>current.ts){
            metricStore[url]=normalized;
            metricCache.set(url,normalized.metrics);
            changed=true;
          }
        }
        if(changed)saveMetricStoreSoon();
      }catch{}
    }
    function rememberMetric(url,metrics){
      const key=String(url||'').trim();
      if(!key||!metrics?.hash)return;
      const entry={metrics,ts:Date.now()};
      metricStore[key]=entry;
      sharedMetricPending[key]=entry;
      metricCache.set(key,metrics);
      saveMetricStoreSoon();
    }
    async function flushSharedMetricStore(){
      saveMetricStore();
      const items=sharedMetricPending;
      sharedMetricPending={};
      if(!Object.keys(items).length)return;
      try{
        await fetch('/api/photo-metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});
      }catch{
        sharedMetricPending={...items,...sharedMetricPending};
      }
    }
    async function imageRuleMetrics(url){
      const img=await loadImageForRules(url);
      const size=96;
      const canvas=document.createElement('canvas');
      canvas.width=size;canvas.height=size;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,0,0,size,size);
      const data=ctx.getImageData(0,0,size,size).data;
      const gray=[];
      let sum=0,dark=0,bright=0,saturationSum=0,redDominant=0;
      for(let i=0;i<data.length;i+=4){
        const r=data[i],gch=data[i+1],b=data[i+2];
        const g=Math.round(data[i]*.299+data[i+1]*.587+data[i+2]*.114);
        const max=Math.max(r,gch,b),min=Math.min(r,gch,b);
        const sat=max?((max-min)/max):0;
        gray.push(g);sum+=g;saturationSum+=sat;if(g<25)dark++;if(g>235)bright++;
        if(r>gch*1.18&&r>b*1.18&&r>55)redDominant++;
      }
      const mean=sum/gray.length;
      const variance=gray.reduce((s,g)=>s+(g-mean)*(g-mean),0)/gray.length;
      const std=Math.sqrt(variance);
      let edge=0,edgeCount=0;
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        const i=y*size+x;
        if(x<size-1){edge+=Math.abs(gray[i]-gray[i+1]);edgeCount++}
        if(y<size-1){edge+=Math.abs(gray[i]-gray[i+size]);edgeCount++}
      }
      const histogram=new Array(256).fill(0);
      for(const v of gray)histogram[v]++;
      const total=gray.length;
      let entropy=0;
      for(let i=0;i<256;i++){if(histogram[i]>0){const p=histogram[i]/total;entropy-=p*Math.log2(p)}}
      let edgeVarSum=0,edgeVarCount=0;
      for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++){
        const i=y*size+x;
        const gx=Math.abs(gray[i]-gray[i-1])+Math.abs(gray[i]-gray[i+1]);
        const gy=Math.abs(gray[i]-gray[i-size])+Math.abs(gray[i]-gray[i+size]);
        edgeVarSum+=gx*gx+gy*gy;edgeVarCount++;
      }
      const edgeVariance=edgeVarCount?edgeVarSum/edgeVarCount:0;
      const regionStats=(x0,y0,w,h)=>{
        const values=[];
        for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)values.push(gray[y*size+x]);
        const rmean=values.reduce((s,v)=>s+v,0)/values.length;
        const rstd=Math.sqrt(values.reduce((s,v)=>s+(v-rmean)*(v-rmean),0)/values.length);
        return {mean:rmean,std:rstd,darkRatio:values.filter(v=>v<35).length/values.length,brightRatio:values.filter(v=>v>220).length/values.length};
      };
      const center=regionStats(24,24,48,48);
      const cornerSize=size/3;
      const corners=[regionStats(0,0,cornerSize,cornerSize),regionStats(size-cornerSize,0,cornerSize,cornerSize),regionStats(0,size-cornerSize,cornerSize,cornerSize),regionStats(size-cornerSize,size-cornerSize,cornerSize,cornerSize)];
      let uniformBlocks=0,totalBlocks=0;
      const blockGrid=12;
      for(let by=0;by<blockGrid;by++)for(let bx=0;bx<blockGrid;bx++){
        totalBlocks++;
        if(regionStats(bx*size/blockGrid,by*size/blockGrid,size/blockGrid,size/blockGrid).std<8)uniformBlocks++;
      }
      const borderDark=(corners.reduce((s,c)=>s+c.darkRatio,0)/corners.length);
      const borderBright=(corners.reduce((s,c)=>s+c.brightRatio,0)/corners.length);
      const dcanvas=document.createElement('canvas');
      dcanvas.width=9;dcanvas.height=8;
      const dctx=dcanvas.getContext('2d',{willReadFrequently:true});
      dctx.drawImage(img,0,0,9,8);
      const ddata=dctx.getImageData(0,0,9,8).data;
      const dgray=[];
      for(let i=0;i<ddata.length;i+=4)dgray.push(Math.round(ddata[i]*.299+ddata[i+1]*.587+ddata[i+2]*.114));
      let hash='';
      for(let y=0;y<8;y++)for(let x=0;x<8;x++)hash+=dgray[y*9+x+1]>dgray[y*9+x]?'1':'0';
      return {
        hash,
        mean:Math.round(mean*10)/10,
        std:Math.round(std*10)/10,
        darkRatio:dark/gray.length,
        brightRatio:bright/gray.length,
        edgeMean:Math.round((edge/Math.max(1,edgeCount))*10)/10,
        edgeVariance:Math.round(edgeVariance),
        entropy:Math.round(entropy*100)/100,
        saturationMean:Math.round((saturationSum/gray.length)*100)/100,
        redDominantRatio:redDominant/gray.length,
        centerMean:Math.round(center.mean*10)/10,
        centerStd:Math.round(center.std*10)/10,
        centerDarkRatio:center.darkRatio,
        centerBrightRatio:center.brightRatio,
        borderDarkRatio:borderDark,
        borderBrightRatio:borderBright,
        uniformBlockRatio:uniformBlocks/Math.max(1,totalBlocks),
        width:img.naturalWidth,
        height:img.naturalHeight
      };
    }
    async function cachedImageRuleMetrics(url){
      const key=String(url||'');
      if(!key)throw new Error('Rasm URL yoq');
      loadMetricStore();
      if(metricCache.has(key))return metricCache.get(key);
      const saved=normalizeMetricCacheEntry(metricStore[key]);
      if(saved){
        metricCache.set(key,saved.metrics);
        return saved.metrics;
      }
      const promise=imageRuleMetrics(key).then(metrics=>{
        rememberMetric(key,metrics);
        return metrics;
      }).catch(err=>{metricCache.delete(key);throw err});
      metricCache.set(key,promise);
      return promise;
    }
    function isVisuallyClose(a,b,reason='',hashDist=99){
      const dist=metricDistance(a,b,reason);
      const threshold=reasonModelThreshold(reason);
      if(hashDist<=1)return dist<Math.max(.34,threshold*.82);
      if(hashDist<=3)return dist<Math.max(.42,threshold*1.02);
      if(hashDist<=5)return dist<Math.max(.36,threshold*.85);
      return dist<threshold;
    }
    function metricDistance(a,b,reason=''){
      if(!a||!b)return 99;
      const base=
        Math.abs(a.mean-b.mean)/145+
        Math.abs(a.std-b.std)/60+
        Math.abs((a.edgeMean||0)-(b.edgeMean||0))/24+
        Math.abs((a.darkRatio||0)-(b.darkRatio||0))*1.35+
        Math.abs((a.brightRatio||0)-(b.brightRatio||0))*1.15+
        Math.abs((a.saturationMean||0)-(b.saturationMean||0))*1.1+
        Math.abs((a.uniformBlockRatio||0)-(b.uniformBlockRatio||0))*1.15;
      if(reason===defaultReasons[1]){
        return base+
          Math.abs((a.centerDarkRatio||0)-(b.centerDarkRatio||0))*1.15+
          Math.abs((a.borderDarkRatio||0)-(b.borderDarkRatio||0))*1.05+
          Math.abs((a.redDominantRatio||0)-(b.redDominantRatio||0))*.9;
      }
      if(reason===defaultReasons[3]){
        return base+
          Math.abs((a.centerStd||0)-(b.centerStd||0))/50+
          Math.abs((a.borderBrightRatio||0)-(b.borderBrightRatio||0))*.75;
      }
      if(reason===defaultReasons[4]||reason===defaultReasons[5]){
        return base+
          Math.abs((a.centerBrightRatio||0)-(b.centerBrightRatio||0))*.95+
          Math.abs((a.borderBrightRatio||0)-(b.borderBrightRatio||0))*1.25;
      }
      return base;
    }
    function reasonModelThreshold(reason){
      if(reason===defaultReasons[1])return .46;
      if(reason===defaultReasons[3])return .48;
      if(reason===defaultReasons[4])return .46;
      if(reason===defaultReasons[5])return .45;
      return .44;
    }
    function reasonModelScore(reason,dist,hashDist=99){
      if(hashDist<=1)return .94;
      if(hashDist<=3)return .88;
      const threshold=reasonModelThreshold(reason);
      const margin=Math.max(0,threshold-dist);
      return Math.min(.84,.76+margin*.28);
    }
    async function mapLimit(items,limit,fn,onProgress=()=>{}){
      const out=new Array(items.length);let next=0,done=0;
      async function worker(){
        while(next<items.length){
          const i=next++;
          try{out[i]=await fn(items[i],i)}catch(e){out[i]={error:e.message||String(e)}}
          done++;onProgress(done,items.length);
        }
      }
      await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));
      return out;
    }
    function currentPhotoRows(){
      return agents.flatMap(a=>a.photos.map((p,index)=>({a,p,index,key:key(a,p)})));
    }
    function confidenceLabel(score){return score>=.85?'aniq':score>=.75?'ehtimoliy':'tekshirish kerak'}
    function confidenceClass(score){return score>=.85?'':'warn'}
    async function runAutoReview(){
      if(autoReviewResults.length){
        showAutoReviewResults();
        return;
      }
      if(!dataset||!agents.length){notify('Avto tekshiruv uchun sana ma\'lumoti yo\'q','bad');return}
      const sourceBtn=$('sideAutoReviewBtn')||$('autoReviewBtn');
      const oldText=sourceBtn?.textContent;
      if(sourceBtn){sourceBtn.disabled=true;sourceBtn.textContent='Tekshirilmoqda...'}
      try{
        await loadMarks();
        await loadSharedMetricStore();
        const allRows=currentPhotoRows().filter(row=>row.p?.url);
        const rows=allRows.filter(row=>marks[row.key]?.verdict!=='MINUS');
        const alreadyMinus=allRows.length-rows.length;
        let knownMinus=[];
        try{
          const suspiciousRes=await fetch('/api/suspicious-photos?_='+Date.now());
          const suspiciousData=await suspiciousRes.json();
          if(suspiciousRes.ok&&Array.isArray(suspiciousData.items)){
            knownMinus=suspiciousData.items.filter(m=>m&&m.url&&m.verdict==='MINUS').map(m=>['',m]);
          }
        }catch{}
        const localKnownMinus=Object.entries(marks).filter(([,m])=>m.verdict==='MINUS'&&m.url);
        if(!knownMinus.length){
          knownMinus=localKnownMinus;
        }
        const knownByUrl=new Map();
        const addKnownMark=(m)=>{
          if(!m?.url)return;
          const prev=knownByUrl.get(m.url);
          if(!prev){
            knownByUrl.set(m.url,m);
            return;
          }
          knownByUrl.set(m.url,{
            ...prev,
            ...m,
            reasons:[...new Set([...displayReasons(prev.reasons),...displayReasons(m.reasons)])],
          });
        };
        for(const [,m] of knownMinus)addKnownMark(m);
        for(const [,m] of localKnownMinus)addKnownMark(m);
        autoReviewStats={total:allRows.length,scanned:rows.length,alreadyMinus,knownMinus:knownByUrl.size,knownSample:0,metricErrors:0,protected:0};
        const knownSample=[...knownByUrl.values()];
        autoReviewStats.knownSample=knownSample.length;
        const knownMetrics=await mapLimit(knownSample,5,async m=>({m,metrics:await cachedImageRuleMetrics(m.url)}),(d,t)=>{
          if(sourceBtn)sourceBtn.textContent=`Baza ${d}/${t}`;
        });
        const hashBase=knownMetrics.filter(x=>x?.metrics?.hash);
        const hashIndex=buildNearHashIndex(hashBase);
        const visualReasonBase=new Map();
        for(const item of hashBase){
          for(const reason of displayReasons(item.m.reasons)){
            if(reason===defaultReasons[0]||reason===defaultReasons[2])continue;
            if(!visualReasonBase.has(reason))visualReasonBase.set(reason,[]);
            visualReasonBase.get(reason).push(item);
          }
        }
        const visualReasonIndex=new Map();
        for(const [reason,items] of visualReasonBase){
          visualReasonIndex.set(reason,buildNearHashIndex(items));
        }
        const analyzed=await mapLimit(rows,5,async row=>{
          const reasons=new Set();
          const reasonScore=new Map();
          const signals=[];
          let score=0;
          const addReason=(reason,signal,nextScore)=>{
            reasons.add(reason);
            reasonScore.set(reason,Math.max(reasonScore.get(reason)||0,nextScore||0));
            if(signal)signals.push(signal);
            score=Math.max(score,nextScore||0);
          };
          const addKnownReasons=(mark,nextScore,signal)=>{
            displayReasons(mark.reasons).forEach(r=>{
              reasons.add(r);
              reasonScore.set(r,Math.max(reasonScore.get(r)||0,nextScore||0));
            });
            if(signal)signals.push(signal);
            score=Math.max(score,nextScore||0);
          };
          if(isAfterHours(row.p))addReason(defaultReasons[0],'Ish vaqtidan tashqari',.88);
          if(duplicate(row.a,row.p))addReason(defaultReasons[2],'Joriy agent ichida takroriy URL',.9);
          const sameUrl=knownByUrl.get(row.p.url);
          if(sameUrl){
            addKnownReasons(sameUrl,.96,'Oldingi minus bazasida aynan shu rasm bor');
          }
          let metrics=null;
          try{metrics=await cachedImageRuleMetrics(row.p.url)}catch(e){signals.push('Rasm metrikasi olinmadi')}
          if(metrics){
            if(metrics.darkRatio>.86||(metrics.mean<26&&metrics.darkRatio>.55)){
              addReason(defaultReasons[1],`Juda qorong'i rasm (dark ${(metrics.darkRatio*100).toFixed(0)}%)`,.9);
            }
            if(metrics.std<8&&metrics.darkRatio>.48){
              addReason(defaultReasons[1],'Past kontrastli yopiq rasmga o\'xshaydi',.8);
            }
            if(metrics.edgeMean<5&&metrics.std<22&&metrics.uniformBlockRatio>.66&&(metrics.mean<98||metrics.darkRatio>.28||metrics.centerStd<10)){
              addReason(defaultReasons[1],`Detal kam: edge ${metrics.edgeMean}, bir xil blok ${(metrics.uniformBlockRatio*100).toFixed(0)}%`,.82);
            }
            if(metrics.centerStd<9&&metrics.edgeMean<6&&(metrics.centerDarkRatio>.32||metrics.borderDarkRatio>.38||metrics.mean<82)){
              addReason(defaultReasons[1],`Markaz yopiq/xira: center std ${metrics.centerStd}, dark ${(metrics.centerDarkRatio*100).toFixed(0)}%`,.84);
            }
            if(metrics.redDominantRatio>.58&&metrics.edgeMean<7&&metrics.std<26){
              addReason(defaultReasons[1],`Kamera to'silgandagi qizg'ish/xira rasmga o'xshaydi (${(metrics.redDominantRatio*100).toFixed(0)}%)`,.8);
            }
            if(metrics.darkRatio>.58&&metrics.edgeMean<7&&metrics.centerStd<14){
              addReason(defaultReasons[1],'Qorong\'i va detal kam, kamera yopilgan bo\'lishi mumkin',.86);
            }
            if(metrics.brightRatio>.88&&metrics.std<18){
              addReason(defaultReasons[6],'Juda oq/yuvilgan rasm',.76);
            }
            if(metrics.brightRatio>.62&&metrics.borderBrightRatio>.55&&metrics.edgeMean<11&&metrics.saturationMean<.24){
              addReason(defaultReasons[4],`Oq fonli katalog rasmiga o'xshaydi (bright ${(metrics.brightRatio*100).toFixed(0)}%)`,.8);
            }
            if(metrics.brightRatio>.5&&metrics.borderBrightRatio>.42&&metrics.centerStd>24&&metrics.uniformBlockRatio>.44&&metrics.saturationMean<.32){
              addReason(defaultReasons[5],`Faqat mahsulot rasmi bo'lishi mumkin: fon oq ${(metrics.borderBrightRatio*100).toFixed(0)}%`,.78);
            }
            if(metrics.edgeMean>34&&metrics.std>58&&metrics.brightRatio>.24&&metrics.uniformBlockRatio<.3){
              addReason(defaultReasons[3],`Ekran rasmi belgisi: keskin kontur ${metrics.edgeMean}`,.78);
            }
            let best=null;
            for(const item of nearHashCandidates(hashIndex,metrics.hash)){
              const dist=hammingBits(metrics.hash,item.metrics.hash);
              if(!best||dist<best.dist)best={dist,m:item.m,metrics:item.metrics};
              if(dist===0)break;
            }
            if(best&&best.dist<=5){
              const bestReasons=displayReasons(best.m.reasons).filter(r=>r!==defaultReasons[0]&&r!==defaultReasons[2]);
              const visualReason=bestReasons[0]||defaultReasons[6];
              const closeByMetric=best.metrics&&isVisuallyClose(metrics,best.metrics,visualReason,best.dist);
              if(closeByMetric&&best.dist<=2){
                addKnownReasons(best.m,best.dist===0 ? .92 : .87,`Oldingi minus rasmga o'xshash: ${best.dist} farq, metrika mos`);
              }else if(closeByMetric&&best.dist<=5){
                addReason(defaultReasons[6],`Oldingi minus rasmga qisman o'xshash, qo'lda tekshiring: ${best.dist} farq`,.78);
              }
            }
            const visualReasonsToCheck=[...new Set([...defaultReasons.slice(1),...visualReasonBase.keys()])].filter(reason=>reason&&reason!==defaultReasons[2]);
            for(const reason of visualReasonsToCheck){
              if(reason===defaultReasons[2])continue;
              const base=nearHashCandidates(visualReasonIndex.get(reason),metrics.hash);
              let close=null;
              for(const item of base){
                const hashDist=hammingBits(metrics.hash,item.metrics.hash);
                if(hashDist>3)continue; // metrika o'xshashligi yolg'iz o'zi yetarli emas
                const dist=metricDistance(metrics,item.metrics,reason);
                if(!close||dist<close.dist)close={dist,hashDist,m:item.m,metrics:item.metrics};
              }
              const closeEnough=close&&isVisuallyClose(metrics,close.metrics,reason,close.hashDist);
              if(closeEnough){
                const label=shortReason(reason);
                const scoreForReason=reasonModelScore(reason,close.dist,close.hashDist);
                const signal=`${label} bazasidagi rasmga hash+metrika bo'yicha o'xshash: ${close.hashDist} farq`;
                addReason(reason,signal,scoreForReason);
              }
            }
          }
          if(reasonScore.get(defaultReasons[1])>=.76&&reasonScore.get(defaultReasons[6])<.78){
            reasons.delete(defaultReasons[6]);
          }
          if(reasonScore.get(defaultReasons[4])>=.74&&reasonScore.get(defaultReasons[5])<.78){
            reasons.delete(defaultReasons[5]);
          }
          if(reasonScore.get(defaultReasons[5])>=.74&&reasonScore.get(defaultReasons[6])<.78){
            reasons.delete(defaultReasons[6]);
          }
          const hardRule=reasons.has(defaultReasons[0])||reasons.has(defaultReasons[2])||signals.some(s=>s.includes('aynan shu rasm'));
          const minScore=hardRule?.72:.78;
          const finalReasons=[...reasons].filter(r=>(reasonScore.get(r)||score)>=minScore);
          if(!finalReasons.length||score<minScore)return null;
          const order=orderInfo(row.p);
          const orderProtected=Boolean(order.has);
          if(orderProtected){
            signals.unshift(order.text);
            score=Math.max(score,.72);
            if(autoReviewStats)autoReviewStats.protected++;
          }
          return {...row,reasons:finalReasons,reasonScores:Object.fromEntries(reasonScore),signals,score,metrics,orderProtected};
        },(d,t)=>{
          if(sourceBtn)sourceBtn.textContent=`Tekshiruv ${d}/${t}`;
        });
        autoReviewResults=analyzed.filter(x=>x&&!x.error).sort((a,b)=>b.score-a.score||a.a.code.localeCompare(b.a.code)||a.index-b.index);
        if(autoReviewStats)autoReviewStats.metricErrors=analyzed.filter(x=>x?.error).length;
        flushSharedMetricStore().catch(()=>{});
        showAutoReviewResults();
        notify(`Avto tekshiruv: ${autoReviewStats?.scanned||rows.length} ta foto ko'rildi, ${autoReviewResults.length} ta shubhali nomzod ajratildi`);
      }catch(e){
        notify('Avto tekshiruvda xato: '+e.message,'bad');
      }finally{
        if(sourceBtn){sourceBtn.disabled=false;sourceBtn.textContent=oldText}
      }
    }
    function showAutoReviewResults(){
      const rows=autoReviewResults;
      const stats=autoReviewStats||{};
      const body=$('autoReviewBody');
      const minusRows=rows.filter(x=>!x.orderProtected);
      const protectedRows=rows.filter(x=>x.orderProtected);
      const counters=window.PhotoReviewCounters?.autoReviewCounters(rows,stats)||{};
      const strong=counters.strong??minusRows.filter(x=>x.score>=.85).length;
      if($('autoReviewSubtitle'))$('autoReviewSubtitle').textContent=`${dataset?.date||''} | jami ${counters.total??'?'} foto | tekshirildi ${counters.scanned??'?'} | ${counters.candidate??rows.length} shubhali nomzod | ${protectedRows.length} buyurtmali`;
      body.innerHTML=`<div class="listToolbar">
        <span class="autoProgress">Tekshirildi: ${counters.scanned??rows.length} ta / Shubhali nomzodlar: ${counters.candidate??rows.length} ta</span>
        <span class="grow"></span>
        <button id="autoSelectStrong" ${strong?'':'disabled'}>Aniqlarni tanlash (${strong})</button>
        <button id="autoRescan">Qayta tekshirish</button>
        <button id="autoApplySelected" class="primary" ${minusRows.length?'':'disabled'}>Tanlanganlarni Minus qilish</button>
      </div>
      <div class="listStats autoCounterStats">
        ${window.PhotoReviewCounters?.renderAutoReviewCounterCards(counters)||''}
        <div class="listStat"><span>Eski baza signali</span><b>${rows.filter(x=>x.signals.some(s=>s.includes('Oldingi'))).length}</b></div>
        <div class="listStat"><span>Qoida</span><b>${rows.filter(x=>x.signals.some(s=>s.includes('takroriy')||s.includes('tashqari'))).length}</b></div>
      </div>
      <div class="listHint">Bu ro'yxat faqat shubhali nomzodlar. Jami foto alohida, tekshirilgan foto alohida ko'rsatiladi. Eski minus bazaga o'xshashlik endi faqat hash + metrika birga mos kelsa ishlaydi.</div>
      ${rows.length?`<table class="listTable autoTable"><colgroup><col style="width:42px"><col style="width:31%"><col style="width:12%"><col style="width:16%"><col style="width:17%"><col></colgroup><thead><tr><th><input id="autoSelectAll" type="checkbox"></th><th>Foto / klient</th><th>Ishonch</th><th>Sabab</th><th>Signal</th><th>Metrika</th></tr></thead><tbody>${rows.map((r,i)=>`<tr data-auto-index="${i}" title="Rasmni katta oynada ko'rish">
        <td><input class="autoPick" type="checkbox" value="${i}" ${r.orderProtected?'disabled':''}></td>
        <td><div class="listPhotoCell"><img class="listThumb" src="${escapeHtml(photoDisplayUrl(r.p.url))}" loading="lazy" referrerpolicy="no-referrer" alt=""><span><span class="photoPill">${escapeHtml(r.a.code)} #${r.index+1}</span><span class="photoClient">${escapeHtml(r.p.client||'')}</span><span class="photoMeta">${escapeHtml(photoClock(r.p)||'vaqt yoq')}</span></span></div></td>
        <td><span class="autoScore ${r.orderProtected?'medium':confidenceClass(r.score)}">${r.orderProtected?'Buyurtma bor':`${Math.round(r.score*100)}% ${confidenceLabel(r.score)}`}</span></td>
        <td><div class="reasonText">${escapeHtml(r.reasons.map(shortReason).join('; '))}</div></td>
        <td><div class="reasonText">${escapeHtml(r.signals.join('; '))}</div></td>
        <td><span class="photoMeta">${r.metrics?`mean ${r.metrics.mean}, std ${r.metrics.std}, edge ${r.metrics.edgeMean||0}, dark ${(r.metrics.darkRatio*100).toFixed(0)}%, bir xil ${((r.metrics.uniformBlockRatio||0)*100).toFixed(0)}%`:'metrika yoq'}</span></td>
      </tr>`).join('')}</tbody></table>`:viewStateMarkup("Shubhali foto topilmadi","Joriy sana qoidalar bo'yicha tekshirildi.",{compact:true})}`;
      switchView('auto');
      if($('autoSelectAll'))$('autoSelectAll').onchange=e=>document.querySelectorAll('.autoPick:not(:disabled)').forEach(x=>x.checked=e.target.checked);
      if($('autoSelectStrong'))$('autoSelectStrong').onclick=()=>document.querySelectorAll('.autoPick:not(:disabled)').forEach(x=>x.checked=rows[Number(x.value)]?.score>=.85&&!rows[Number(x.value)]?.orderProtected);
      if($('autoRescan'))$('autoRescan').onclick=()=>{autoReviewResults=[];runAutoReview()};
      if($('autoApplySelected'))$('autoApplySelected').onclick=applyAutoSelected;
      document.querySelectorAll('.autoTable tbody tr').forEach(row=>row.onclick=e=>{
        if(e.target.closest('input,button,select,a,textarea'))return;
        openAutoCandidate(Number(row.dataset.autoIndex));
      });
    }
    function openAutoCandidate(index){
      const item=autoReviewResults[index];
      if(!item)return;
      const ai=agents.findIndex(a=>a.code===item.a.code);
      if(ai<0)return;
      agentIndex=ai;
      const photoIndex=agents[agentIndex].photos.findIndex(p=>p.id===item.p.id&&p.url===item.p.url);
      if(photoIndex<0)return;
      const pageSize=photoPageSizeFor(agents[agentIndex]);
      start=Math.max(0,Math.floor(photoIndex/pageSize)*pageSize);
      render();
      autoReviewPreviewOpen=true;
      $('autoReviewList')?.classList.remove('open');
      openModal(photoIndex);
    }
    function closeAutoReview(){
      autoReviewPreviewOpen=false;
      $('autoReviewList').classList.remove('open');
      if(currentView==='auto')switchView('photo');
    }
    function refreshAutoReviewAfterMark(){
      if(!autoReviewResults.length)return;
      autoReviewResults=autoReviewResults.filter(r=>!marks[r.key]?.verdict);
      if(autoReviewPreviewOpen){
        autoReviewPreviewOpen=false;
        showAutoReviewResults();
      }else if($('autoReviewList')?.classList.contains('open')){
        showAutoReviewResults();
      }
    }
    function applyAutoSelected(){
      const selected=[...document.querySelectorAll('.autoPick:checked')].map(x=>autoReviewResults[Number(x.value)]).filter(x=>x&&!x.orderProtected);
      if(!selected.length){notify('Minus qilish uchun foto tanlanmagan','bad');return}
      pushReviewUndo(selected.map(r=>({key:r.key,previous:marks[r.key]?cloneReviewValue(marks[r.key]):null,date:dataset.date,code:r.a.code,url:r.p.url})),'Avto belgilash');
      for(const r of selected){
        const prev=marks[r.key]||{};
        const now=new Date().toISOString();
        marks[r.key]={...prev,...brandPayloadForCode(r.a.code),date:dataset.date,code:r.a.code,agent:r.a.agent,photo:r.index+1,client:r.p.client||'',clientOrderSum:r.p.clientOrderSum||0,clientOrderCount:r.p.clientOrderCount||0,clientHasOrder:r.p.clientHasOrder,clientOrderKnown:r.p.clientOrderKnown,clientOrderSource:r.p.clientOrderSource||'',clientId:r.p.clientId||'',photoTime:r.p.photoTime||'',url:r.p.url,verdict:'MINUS',reasons:r.reasons,note:prev.note||`Avto tekshiruv: ${r.signals.join('; ')}`,source:'rules',ruleScore:r.score,savedAt:now,updatedAt:now,updatedBy:reviewClientId};
      }
      saveMarks(selected.map(r=>r.key));rebuildAgents();render();
      autoReviewResults=autoReviewResults.filter(r=>!selected.includes(r));
      showAutoReviewResults();
      notify(`${selected.length} ta foto minus ro'yxatiga qo'shildi`);
    }
    function lookupKey(value){return String(value||'').toLowerCase().replace(/\s+/g,' ').trim()}
    function compactKey(value){return lookupKey(value).replace(/[^\p{L}\p{N}]+/gu,'')}
    function buildClientOrderMap(items){
      const map=new Map();
      (items||[]).forEach(c=>{
        const sum=Number(c.clientOrderSum??c.orderSum??c.sum??c.totalOrderAmount?.amount??c.total_order_amount?.amount??0)||0;
        [c.apiId,c.id,c.clientId,c.visualId,c.visual_id,c.code,c.name,c.client].forEach(key=>{
          const a=lookupKey(key),b=compactKey(key);
          if(a&&!map.has(a))map.set(a,sum);
          if(b&&!map.has(b))map.set(b,sum);
        });
      });
      return map;
    }
    function clientOrderFrom(map,item,row){
      const direct=Number(item.clientOrderSum??item.orderSum??row.clientOrderSum??row.orderSum??0)||0;
      if(direct)return direct;
      for(const key of [item.clientId,row.clientId,item.visualId,row.visualId,item.visual_id,row.visual_id,item.client,row.client]){
        const a=lookupKey(key),b=compactKey(key);
        if(a&&map.has(a))return Number(map.get(a))||0;
        if(b&&map.has(b))return Number(map.get(b))||0;
      }
      return 0;
    }
    function normalize(raw){
      const source=raw.agents||raw.rows||[];
      return source.map((a,agentIndex)=>{
        const code=a.code||`AGENT${agentIndex+1}`;
        const parsedSum=String(a.rowText||a.text||'').match(/[A-Z]+\S+\s+([0-9\s.,]+)/)?.[1]?.replace(/[^\d.]/g,'')||0;
        const orderSum=Number(a.orderSum??a.sum??parsedSum);
        const photos=[];
        const clientOrders=buildClientOrderMap(a.clients||a.clientRows||[]);
        if(Array.isArray(a.photos)){
          a.photos.forEach((row,rowIndex)=>{
            const items=Array.isArray(row.photoItems)||Array.isArray(row.items)?(row.photoItems||row.items):null;
            if(items){
              items.forEach((item,uIndex)=>photos.push({id:`r${rowIndex+1}_${uIndex+1}`,url:item.url||item.src||'',client:item.client||row.client||'',clientOrderSum:clientOrderFrom(clientOrders,item,row),clientOrderCount:Number(item.clientOrderCount??row.clientOrderCount??0)||0,clientHasOrder:item.clientHasOrder??row.clientHasOrder,clientOrderKnown:item.clientOrderKnown??row.clientOrderKnown,clientOrderSource:item.clientOrderSource||row.clientOrderSource||'',clientOrderStatuses:item.clientOrderStatuses||row.clientOrderStatuses||[],clientId:item.clientId||row.clientId||'',category:item.photoCategory||item.category||row.photoCategory||row.category||'',territory:item.territory||row.territory||'',photoTime:item.photoTime||item.upload_time||row.photoTime||'',row:row.row||rowIndex+1}));
            }else{
              (row.urls||[]).forEach((url,uIndex)=>photos.push({id:`r${rowIndex+1}_${uIndex+1}`,url,client:row.client||'',clientOrderSum:clientOrderFrom(clientOrders,row,row),clientOrderCount:Number(row.clientOrderCount??0)||0,clientHasOrder:row.clientHasOrder,clientOrderKnown:row.clientOrderKnown,clientOrderSource:row.clientOrderSource||'',clientOrderStatuses:row.clientOrderStatuses||[],clientId:row.clientId||'',category:row.photoCategory||row.category||'',territory:row.territory||'',photoTime:(row.photoTimes&&row.photoTimes[uIndex])||row.photoTime||'',row:row.row||rowIndex+1}));
            }
          });
        }else{
          (a.urls||[]).forEach((url,i)=>photos.push({id:`p${i+1}`,url,client:'',clientOrderSum:0,clientId:'',category:'',territory:'',photoTime:'',row:i+1}));
        }
        const m=code.match(/^([A-Z]+)(\d+)/i);
        const urlCounts=new Map();
        const clientCounts=new Map();
        photos.forEach(p=>{
          urlCounts.set(p.url,(urlCounts.get(p.url)||0)+1);
          const ck=compactKey(p.clientId||p.client);
          if(ck)clientCounts.set(ck,(clientCounts.get(ck)||0)+1);
        });
        const expectedPhotos=Number(a.expectedPhotos??photos.length);
        const actualUrls=Number(a.actualUrls??photos.length);
        const collectStatus=a.status||window.PhotoReviewUtils?.collectStatusFromCounts(actualUrls,expectedPhotos)||'ok';
        const normalized={code,agent:a.agent||a.modalTitle||code,orderSum,group:m?m[1]:code,tail:m?Number(m[2]):999,photos,urlCounts,clientCounts,expectedPhotos,actualUrls,collectStatus,duplicateOf:a.duplicateOf||''};
        normalized.prefixMatched=isAgentPrefixMatched(normalized);
        return normalized;
      })
      .filter(a=>a.collectStatus!=='duplicate'&&a.collectStatus!=='error')
      .filter(a=>a.photos.length>0)
      .sort((a,b)=>a.group.localeCompare(b.group)||a.orderSum-b.orderSum||a.tail-b.tail||a.code.localeCompare(b.code));
    }
    function allAgentsForReport(raw){
      const source=raw?.agents||raw?.rows||[];
      return source.map((a,agentIndex)=>{
        const code=a.code||`AGENT${agentIndex+1}`;
        const parsedSum=String(a.rowText||a.text||'').match(/LMJ\S+\s+([0-9\s.,]+)/)?.[1]?.replace(/[^\d.]/g,'')||0;
        const orderSum=Number(a.orderSum??a.sum??parsedSum);
        const photos=[];
        if(Array.isArray(a.photos)){
          a.photos.forEach((row,rowIndex)=>{
            const items=Array.isArray(row.photoItems)||Array.isArray(row.items)?(row.photoItems||row.items):null;
            if(items)items.forEach((item,uIndex)=>photos.push({id:`r${rowIndex+1}_${uIndex+1}`,url:item.url||item.src||''}));
            else (row.urls||[]).forEach((url,uIndex)=>photos.push({id:`r${rowIndex+1}_${uIndex+1}`,url}));
          });
        }else{
          (a.urls||[]).forEach((url,i)=>photos.push({id:`p${i+1}`,url}));
        }
        const expected=Number(a.expectedPhotos??photos.length);
        const total=photos.length||expected||0;
        const m=String(code).match(/^([A-Z]+)(\d+)/i);
        const collectStatus=a.status||window.PhotoReviewUtils?.collectStatusFromCounts(Number(a.actualUrls??photos.length),expected)||'ok';
        return {code,orderSum,total,group:m?m[1]:code,tail:m?Number(m[2]):999,collectStatus};
      })
      .filter(a=>a.collectStatus!=='duplicate'&&a.collectStatus!=='error')
      .sort((a,b)=>String(a.group).localeCompare(String(b.group))||a.orderSum-b.orderSum||a.tail-b.tail||String(a.code).localeCompare(String(b.code)));
    }
    function viewStateMarkup(title,message='',options={}){return uiState.markup(title,message,options)}
    function emptyActionButton(message,buttonText='Ma\'lumot yig\'ish'){
      return viewStateMarkup(message,"Kerakli sana va brend bo'yicha ma'lumot yig'ilmagan.",{actionId:'emptyCollectBtn',actionText:buttonText,actionClass:'primary'});
    }
    function showEmpty(message='Sana topilmadi',action=false){
      dataset=null;agents=[];allAgents=[];agentIndex=0;start=0;
      if(agentSel){agentSel.innerHTML='';agentSel.disabled=true;agentSel.add(new Option('Agent yoq',''))}
      $('grid').innerHTML=action?emptyActionButton(message):'';
      const btn=$('emptyCollectBtn');
      if(btn)btn.onclick=()=>openCollect({date:cleanDate(dateSel?.value)||yesterday(),brand:brandSel?.value||''});
      if($('deleteDateBtn'))$('deleteDateBtn').disabled=true;
      $('title').textContent='Foto nazorati';$('meta').textContent=message;
      if($('dateStats'))$('dateStats').textContent='';
      if($('agentStats'))$('agentStats').textContent='';
      if($('afterHoursStats'))$('afterHoursStats').textContent='';
    }
    function cleanDatasetDate(value){return filterTools.cleanDatasetDate(value)}
    function resolveBrandId(value){
      const raw=String(value||'').trim();
      if(!raw)return '';
      const lower=raw.toLowerCase();
      const upper=raw.toUpperCase();
      const brands=brandConfig.brands||[];
      const byId=brands.find(b=>String(b.id||'').toLowerCase()===lower);
      if(byId)return byId.id;
      const byCode=brands.find(b=>String(b.code||'').toUpperCase()===upper);
      if(byCode)return byCode.id;
      const byName=brands.find(b=>[b.name,...(b.salesBrandNames||[])].some(x=>String(x||'').toLowerCase()===lower));
      if(byName)return byName.id;
      const byPrefix=brands.find(b=>(b.agentPrefixes||[]).some(p=>String(p||'').toUpperCase()===upper));
      if(byPrefix)return byPrefix.id;
      return '';
    }
    function datasetBrandId(item){
      const raw=item?.brand||{};
      const byId=raw.id&&brandById(raw.id);
      if(byId)return byId.id;
      const byCode=raw.code&&brandByCode(raw.code);
      if(byCode)return byCode.id;
      const byName=resolveBrandId(raw.name||raw.code||'');
      if(byName)return byName;
      const file=String(item?.file||'').toLowerCase();
      if(file.startsWith('jy_'))return resolveBrandId('SOF')||'sof';
      if(file.startsWith('lmj_')||file.startsWith('lalaku_mama_'))return resolveBrandId('Lalaku Mama')||'lalaku_mama';
      return String(raw.id||raw.code||raw.name||'').toLowerCase().replace(/[^a-z0-9_]+/g,'_')||'unknown';
    }
    function datasetDate(item){return filterTools.datasetDate(item)}
    function datasetOptionKey(item){return filterTools.optionKey(item,datasetBrandId(item))}
    function datasetBrandName(id){
      const b=brandById(id);
      if(b)return brandDisplayName(b);
      const item=(manifest.datasets||[]).find(d=>datasetBrandId(d)===id);
      return item?.brand?.name||id;
    }
    function groupedDatasets(){
      const map=new Map();
      for(const item of manifest.datasets||[]){
        const brand=datasetBrandId(item);
        const date=datasetDate(item);
        if(!brand||!date||!item.file)continue;
        const key=`${brand}||${date}`;
        const prev=map.get(key);
        if(!prev||String(item.updatedAt||'')>String(prev.updatedAt||''))map.set(key,{...item,_brandId:brand,_date:date,_key:datasetOptionKey(item)});
      }
      return [...map.values()].sort((a,b)=>a._date.localeCompare(b._date)||datasetBrandName(a._brandId).localeCompare(datasetBrandName(b._brandId)));
    }
    function selectedDatasetItem(){
      const brand=brandSel?.value||'';
      const date=dateSel?.value||'';
      if(!brand||!date)return null;
      return groupedDatasets().find(d=>d._brandId===brand&&d._date===date)||null;
    }
    function renderBrandFilter(preferred=''){
      if(!brandSel)return;
      const datasets=groupedDatasets();
      const ids=[...new Set(datasets.map(d=>d._brandId))];
      brandSel.innerHTML='';
      brandSel.add(new Option('Brend tanlang',''));
      ids.forEach(id=>brandSel.add(new Option(datasetBrandName(id),id)));
      const saved=localStorage.getItem(LS_BRAND)||'';
      const next=ids.includes(preferred)?preferred:(ids.includes(saved)?saved:(ids.at(-1)||''));
      brandSel.value=next;
    }
    function renderDateFilter(preferred=''){
      const brand=brandSel?.value||'';
      if(!brand){
        dateSel.value='';
        dateSel.removeAttribute('min');
        dateSel.removeAttribute('max');
        dateSel.title='Avval brend tanlang';
        dateSel.disabled=true;
        return;
      }
      const dates=[...new Set(groupedDatasets().filter(d=>d._brandId===brand).map(d=>d._date))].sort();
      dateSel.disabled=false;
      if(!dates.length){
        dateSel.value='';
        dateSel.removeAttribute('min');
        dateSel.removeAttribute('max');
        dateSel.title=`${datasetBrandName(brand)} uchun yig'ilgan sana topilmadi`;
        return;
      }
      dateSel.removeAttribute('min');
      dateSel.removeAttribute('max');
      dateSel.dataset.availableDates=dates.join(',');
      dateSel.title=`Mavjud sanalar: ${dates.join(', ')}`;
      const saved=cleanDatasetDate(localStorage.getItem(LS_DATE)||'');
      const next=dates.includes(preferred)?preferred:(dates.includes(saved)?saved:(dates.at(-1)||''));
      dateSel.value=next;
    }
    async function applyManifest(nextDate='',nextBrand=''){
      if(!manifest.datasets.length){localStorage.removeItem(LS_DATE);showEmpty("Yig'ilgan sana yo'q.",true);return}
      const cleanNextDate=cleanDatasetDate(nextDate);
      let cleanNextBrand=nextBrand||'';
      if(!cleanNextBrand&&nextDate){
        const found=(manifest.datasets||[]).find(d=>d.date===nextDate||datasetDate(d)===cleanNextDate);
        if(found)cleanNextBrand=datasetBrandId(found);
      }
      renderBrandFilter(cleanNextBrand);
      renderDateFilter(cleanNextDate);
      if(!brandSel.value){showEmpty('Avval brendni tanlang');return}
      if(!dateSel.value){showEmpty(`${datasetBrandName(brandSel.value)} uchun ma'lumot topilmadi`,true);return}
      await loadSelectedDataset();
    }
    async function loadManifest(){
      const res=await fetch('lmj_review_datasets.json');
      manifest=await res.json();
      await loadBrands();
      await loadReasons();
      await loadMarks();
      await applyManifest();
    }
    async function loadSelectedDataset(){
      if(!(brandConfig.brands||[]).length)await loadBrands();
      const item=selectedDatasetItem();
      const brand=brandSel?.value||'';
      const date=dateSel?.value||'';
      if(!brand){showEmpty('Avval brendni tanlang');notify('Avval brendni tanlang','bad');return}
      localStorage.setItem(LS_BRAND,brand);
      localStorage.setItem(LS_DATE,date);
      if(!item){showEmpty(`${datasetBrandName(brand)} | ${date}: ma'lumot topilmadi`,true);return}
      autoReviewResults=[];autoReviewPreviewOpen=false;autoReviewStats=null;
      dataset=await (await fetch(item.file)).json();
      dataset.date=datasetDate(item)||cleanDate(dataset.date)||date;
      dataset.brand={...(dataset.brand||{}),...(item.brand||{}),id:brand,name:datasetBrandName(brand)};
      if($('deleteDateBtn'))$('deleteDateBtn').disabled=false;
      const all=dataset.agents||dataset.rows||[];
      const bad=all.filter(a=>['duplicate','error','partial','extra','empty','mismatch','unknown'].includes(a.status)||(!a.status&&a.expectedPhotos&&a.actualUrls&&a.actualUrls!==a.expectedPhotos));
      allAgents=normalize(dataset);
      agents=allAgents.slice();
      if(agentSel)agentSel.disabled=false;
      agentIndex=0;start=0;
      invalidateAgentsCache();
      if(dataset._meta?.reCollectRequired||bad.length){
        const msg=dataset._meta?.message||`${bad.length} ta agent noto'g'ri yig'ilgan`;
        $('meta').innerHTML=`<span style="color:#ffd479">${dataset.date}: FAQAT ${agents.length} agent ishonchli. ${msg}. Qayta yig'ing.</span>`;
      }
      applyAgentFilter();
    }
    async function loadDate(date){
      if(dateSel)dateSel.value=cleanDatasetDate(date);
      await loadSelectedDataset();
    }
    function agentRegion(code){
      const value=String(code||'').toUpperCase();
      const regions={
        LMJDILLER01:'Diller OPT',
        LMJAN03:'Andijon',LMJAN02:'Andijon',LMJAN10:'Andijon',LMJAN04:'Andijon',LMJAN01:'Andijon',LMJAN06:'Andijon',LMJAN07:'Andijon',LMJAN08:'Andijon',LMJAN09:'Andijon',LMJAN05:'Andijon',
        LMJBX03:'Buxoro',LMJBX04:'Buxoro',LMJBX02:'Buxoro',LMJBX01:'Buxoro',
        LMJFA02:"Farg'ona",LMJFA10:"Farg'ona",LMJFA08:"Farg'ona",LMJFA03:"Farg'ona",LMJFA09:"Farg'ona",LMJFA01:"Farg'ona",LMJFA05:"Farg'ona",LMJFA07:"Farg'ona",LMJFA06:"Farg'ona",LMJFA04:"Farg'ona",
        LMJT011:'Guliston',LMJGL02:'Guliston',LMJT010:'Guliston',LMJGL01:'Guliston',
        LMJISH01:'Shahrisabz',LMJSH02:'Shahrisabz',LMJISH03:'Shahrisabz',
        LMJISM01:'Samarqand',LMJISM02:'Samarqand',LMJISM04:'Samarqand',LMJISM03:'Samarqand',LMJISM05:'Samarqand',LMJISM08:'Samarqand',LMJISM07:'Samarqand',
        LMJISM06:"Kattaqo'rg'on",
        LMJJZ02:'Jizzah',LMJJZ03:'Jizzah',LMJJZ01:'Jizzah',
        LMJNK01:'Nukus',LMJNK02:'Nukus',LMJNK03:'Nukus',LMJNK04:'Nukus',
        LMJNM01:'Namangan',LMJNM02:'Namangan',LMJNM03:'Namangan',LMJNM04:'Namangan',LMJNM05:'Namangan',LMJNM06:'Namangan',LMJNM08:'Namangan',LMJNM07:'Namangan',
        LMJNV01:'Navoi',LMJNV02:'Navoi',LMJNV03:'Navoi',LMJNV05:'Navoi',
        LMJNV04:'Zarafshon',
        LMJOPT003:'JENSKIY OPT',LMJOPT002:'JENSKIY OPT',
        LMJQQ05:"Qo'qon",LMJQQ03:"Qo'qon",LMJQQ02:"Qo'qon",LMJQQ07:"Qo'qon",LMJQQ01:"Qo'qon",LMJQQ06:"Qo'qon",LMJQQ04:"Qo'qon",
        LMJQR02:'Qarshi',LMJQR03:'Qarshi',LMJQR04:'Qarshi',LMJQR01:'Qarshi',
        LMJTOP001:'TOP',
        LMJTSH05:'Yunusobod',LMJT007:'Yunusobod',LMJTSH06:'Yunusobod',LMJT012:'Yunusobod',LMJT004:'Yunusobod',LMJT006:'Yunusobod',LMJTSH01:'Yunusobod',LMJTSH02:'Yunusobod',LMJTSH11:'Yunusobod',LMJTSH03:'Yunusobod',LMJTSH04:'Yunusobod',
        LMJT002:'Olmaliq',LMJT003:'Olmaliq',LMJT005:'Olmaliq',LMJT001:'Olmaliq',
        LMJTSH07:'Sergeli',LMJTSH08:'Sergeli',LMJTSH10:'Sergeli',LMJT009:'Sergeli',LMJTSH09:'Sergeli',LMJT008:'Sergeli',
        LMJTZ01:'Termiz',LMJTZ02:'Termiz',LMJTZ03:'Termiz',
        LMJTZ04:'Denov',LMJTZ05:'Denov',
        LMJXR01:'Xorazm',LMJXR02:'Xorazm',LMJXR04:'Xorazm',LMJXR03:'Xorazm',LMJXR05:'Xorazm',LMJXR06:'Xorazm'
      };
      if(regions[value])return regions[value];
      if(value.startsWith('LMJAN'))return 'Andijon';
      if(value.startsWith('LMJFA'))return "Farg'ona";
      if(value.startsWith('LMJQQ'))return "Qo'qon";
      return '';
    }
    function rebuildAgents(){
      agentSel.innerHTML='';
      const stats=renderStats();
      agents.forEach((a,i)=>{
        const minus=stats.minusByCode.get(a.code)||0;
        const statusTag=['partial','extra','empty','mismatch','unknown'].includes(a.collectStatus)?` | ${a.collectStatus} ${a.photos.length}/${a.expectedPhotos||'?'}`:''; 
        const region=agentRegion(a.code);
        agentSel.add(new Option(`${a.code}${region?` | ${region}`:''} | ${a.orderSum.toLocaleString('ru-RU')} | ${a.photos.length} foto${statusTag}${minus?` | -${minus}`:''}`,i));
      });
    }
    function afterHoursSummary(){
      return renderStats().afterHours;
    }
    function photoPageSizeFor(a=agents[agentIndex]){
      const total=Array.isArray(a?.photos)?a.photos.length:0;
      return total?(photoPageAll?total:Math.max(1,Math.min(photoPageSize,total))):1;
    }
    function lastPhotoPageStart(a=agents[agentIndex],size=photoPageSizeFor(a)){
      const total=Array.isArray(a?.photos)?a.photos.length:0;
      return total?Math.floor((total-1)/size)*size:0;
    }
    function updatePhotoPageControls(a,size){
      const total=a?.photos?.length||0;
      const input=$('photoPageSize');
      if(input){
        input.max=String(Math.max(1,total));
        input.value=String(total?size:1);
        input.disabled=!total;
      }
      if($('showAllPhotos'))$('showAllPhotos').disabled=!total||photoPageAll;
      if($('quickPrev')){
        const atFirst=start<=0;
        $('quickPrev').disabled=atFirst&&agentIndex<=0;
        $('quickPrev').title=atFirst&&agentIndex>0?'Oldingi agent':`Oldingi ${size} foto`;
      }
      if($('quickNext')){
        const atLast=!total||start+size>=total;
        $('quickNext').disabled=atLast&&agentIndex>=agents.length-1;
        $('quickNext').title=atLast&&agentIndex<agents.length-1?'Keyingi agent':`Keyingi ${size} foto`;
      }
    }
    function setPhotoPageSize(value){
      const a=agents[agentIndex];
      const total=a?.photos?.length||1;
      if(value==='all'){
        photoPageAll=true;
        localStorage.setItem(LS_PHOTO_PAGE_SIZE,'all');
        start=0;
        render();
        return;
      }
      const next=Math.max(1,Math.min(Number.parseInt(value,10)||1,total));
      photoPageAll=false;
      photoPageSize=next;
      localStorage.setItem(LS_PHOTO_PAGE_SIZE,String(photoPageSize));
      start=0;
      render();
    }
    function render(){
      const a=agents[agentIndex]; if(!a){$('grid').innerHTML='';return}
      agentSel.value=String(agentIndex);
      const pageSize=photoPageSizeFor(a);
      start=Math.max(0,Math.min(start,lastPhotoPageStart(a,pageSize)));
      const slice=a.photos.slice(start,start+pageSize);
      updatePhotoPageControls(a,pageSize);
      const region=agentRegion(a.code);
      const b=brandById(dataset?.brand?.id)||brandByCode(dataset?.brand?.code||a.code)||dataset?.brand||{};
      const unmatchedCount=allAgents.filter(x=>!x.prefixMatched).length;
      const mismatchText=unmatchedCount?` | Prefixga mos kelmagan: ${unmatchedCount} ta`:'';
      if(currentView==='photo'){
        $('title').textContent=agentDisplayName(a);
        $('meta').textContent=`${dataset.date} | ${brandDisplayName(b)||dataset?.brand?.name||currentBrand()}${mismatchText}`;
      }
      const stats=renderStats();
      const {totalPhotos,duplicateCount}=stats;
      const minusCount=stats.currentMinus.length;
      const ah=stats.afterHours;
      $('dateStats').innerHTML=`<div class="metrics">
        <div class="metric"><span>Agent</span><b>${agents.length}</b></div>
        <div class="metric"><span>Foto</span><b>${totalPhotos}</b></div>
        <div class="metric badMetric"><span>Minus</span><b>${minusCount}</b></div>
      </div>`;
      updateReviewAssist();
      const collectText=['partial','extra','empty','mismatch','unknown'].includes(a.collectStatus)?` | Yig'ilgan: ${a.photos.length}/${a.expectedPhotos||'?'} ${a.collectStatus}`:'';
      if($('agentStats'))$('agentStats').textContent=`${a.code}${region?` | Hudud: ${region}`:''} | Buyurtma: ${a.orderSum.toLocaleString('ru-RU')} | Foto: ${start+1}-${Math.min(start+pageSize,a.photos.length)}/${a.photos.length}${collectText} | minus: ${stats.minusByCode.get(a.code)||0}`;
      if($('afterHoursStats'))$('afterHoursStats').innerHTML=ah.rows.length
        ? `<div class="metrics"><div class="metric badMetric"><span>Jami</span><b>${ah.rows.length}</b></div><div class="metric"><span>Dublikat</span><b>${duplicateCount}</b></div></div><div class="miniList">Agent: ${ah.byAgent.length}<br>${ah.byAgent.slice(0,6).map(x=>`${x.a.code}: ${x.count} ta (${x.times.slice(0,4).join(', ')}${x.times.length>4?', ...':''})`).join('<br>')}</div>`
        : '<span class="muted">Ma\'lumot topilmadi</span>';
      renderReasonLegend();
      const grid=$('grid');
      // Keep the chosen slot width on the last page as well. Otherwise a
      // remainder of one photo can grow to the full workspace width.
      const columnTarget=photoPageAll?Math.min(5,pageSize):Math.min(5,photoPageSize);
      const columnCount=Math.max(1,columnTarget);
      grid.style.setProperty('--photo-columns',String(columnCount));
      grid.dataset.columns=String(columnCount);
      grid.classList.toggle('dense',slice.length>4);
      grid.classList.toggle('veryDense',slice.length>10);
      grid.innerHTML=slice.map((p,offset)=>{
        const k=key(a,p),m=marks[k],warns=[];
        const photoIndex=start+offset;
        const afterHours=isAfterHours(p);
        const sameMinute=sameMinuteExtra(a,p,photoIndex);
        if(afterHours)warns.push('ish vaqtidan tashqari');
        if(sameMinute)warns.push('1 minut ichida takror');
        if(duplicate(a,p))warns.push('dublikat');
        const time=photoClock(p)||'<span class="muted">vaqt yoq</span>';
        const badges=[
          m?.verdict==='MINUS'?'<span class="badge minus">MINUS</span>':'',
          afterHours?'<span class="badge warn">Ish vaqtidan tashqari</span>':'',
          sameMinute?'<span class="badge warn">1 minut ichida takror</span>':'',
          duplicate(a,p)?'<span class="badge time">Dublikat</span>':''
        ].filter(Boolean).join('');
        const src=safeAttr(p.url);
        const order=orderInfo(p);
        return `<div class="card ${m?.verdict==='MINUS'?'marked':''} ${afterHours||sameMinute?'afterHours':''}" data-i="${photoIndex}">
          <div class="photoFrame loading" data-status="Rasm yuklanmoqda..."><img data-direct="${src}" data-mode="proxy" data-variant="thumb" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="imageLoaded(this)" onerror="imageError(this)"><button class="photoRetry" type="button" onclick="event.stopPropagation();retryPhoto(this)">Qayta yuklash</button></div>
          <div class="cap"><b>${escapeHtml(a.code)} #${photoIndex+1}</b><br>${escapeHtml(p.client||'')}${order.text?`<br>${escapeHtml(order.text)}`:''}<br>Vaqt: ${escapeHtml(time)}${warns.length?`<div class="badgeRow">${badges}</div>`:''}${!warns.length&&badges?`<div class="badgeRow">${badges}</div>`:''}</div>
        </div>`;
      }).join('');
      document.querySelectorAll('.photoFrame img').forEach(img=>loadPhoto(img,img.dataset.direct,photoInitialMode('thumb'),'thumb'));
      document.querySelectorAll('.card').forEach(card=>card.onclick=()=>openModal(Number(card.dataset.i)));
      preload();
    }
    function queuePreload(url){
      const clean=String(url||'').trim();
      if(!clean||preloadSeen.has(clean))return;
      preloadSeen.add(clean);
      preloadQueue.push(clean);
      runPreloadQueue();
    }
    function runPreloadQueue(){
      while(preloadActive<PHOTO_PRELOAD_MAX&&preloadQueue.length){
        const url=preloadQueue.shift();
        preloadActive++;
        const img=new Image();
        let done=false;
        const finish=()=>{
          if(done)return;
          done=true;
          clearTimeout(timer);
          preloadActive=Math.max(0,preloadActive-1);
          runPreloadQueue();
        };
        const timer=setTimeout(()=>{img.src='';finish()},PHOTO_PRELOAD_TIMEOUT_MS);
        img.onload=finish;
        img.onerror=finish;
        img.referrerPolicy='no-referrer';
        img.src=photoDisplayUrl(url,photoInitialMode('thumb'),'thumb');
      }
    }
    function preload(){
      const a=agents[agentIndex];if(!a)return;
      const urls=[];
      const size=photoPageSizeFor(a);
      for(let i=start;i<Math.min(start+(size*2),a.photos.length);i++)urls.push(a.photos[i].url);
      [...new Set(urls.filter(Boolean))].forEach(queuePreload);
    }
    function autoReasons(a,p,index=current?.index){
      const r=[];
      if(isAfterHours(p))r.push(defaultReasons[0]);
      if(sameMinuteExtra(a,p,Number.isInteger(index)?index:a?.photos?.indexOf?.(p)))r.push(sameMinuteReason());
      if(duplicate(a,p))r.push(defaultReasons[2]);
      return r;
    }
    function renderReasonLegend(){
      const el=$('reasonLegend');if(!el)return;
      el.innerHTML=`<div class="reasonList">${allReasons().map((r,i)=>`<div class="reasonItem"><span class="reasonNum">${i+1}</span><span>${escapeHtml(r)}</span></div>`).join('')}</div>`;
    }
    function renderChecks(selected=[]){
      const selectedLabels=new Set((Array.isArray(selected)?selected:[]).map(displayReason));
      $('reasonChecks').innerHTML=allReasons().map(r=>{
        const label=displayReason(r);
        if(editingReason===label){
          return `<div class="reason editing" data-reason="${safeAttr(label)}"><input type="checkbox" value="${safeAttr(label)}" ${selectedLabels.has(label)?'checked':''}><input class="reasonEditInput" value="${safeAttr(label)}" aria-label="Sabab matni" autofocus><button class="reasonSaveBtn" type="button" title="Saqlash" aria-label="Saqlash">✓</button><button class="reasonCancelBtn" type="button" title="Bekor qilish" aria-label="Bekor qilish">×</button></div>`;
        }
        return `<div class="reason" data-reason="${safeAttr(label)}"><label class="reasonPick"><input type="checkbox" value="${safeAttr(label)}" ${selectedLabels.has(label)?'checked':''}> <span title="${safeAttr(label)}">${escapeHtml(label)}</span></label><button class="reasonEditBtn" type="button" title="Sababni o'zgartirish" aria-label="Sababni o'zgartirish"><svg class="reasonEditIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4.4L19.7 8.7a2 2 0 0 0 0-2.8l-1.6-1.6a2 2 0 0 0-2.8 0L4 15.6V20z"></path><path d="M13.8 5.8l4.4 4.4"></path></svg></button><button class="reasonDeleteBtn" type="button" title="Sababni o'chirish" aria-label="Sababni o'chirish"><svg class="reasonDeleteIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg></button></div>`;
      }).join('');
      document.querySelectorAll('.reasonEditBtn').forEach(btn=>btn.onclick=()=>{editingReason=btn.closest('.reason')?.dataset.reason||'';renderChecks(selectedReasonValues());setTimeout(()=>{const input=document.querySelector('#reasonChecks .reasonEditInput');input?.focus();input?.select()},0)});
      document.querySelectorAll('.reasonDeleteBtn').forEach(btn=>btn.onclick=()=>deleteReason(btn.closest('.reason')?.dataset.reason||''));
      document.querySelectorAll('.reasonCancelBtn').forEach(btn=>btn.onclick=()=>{editingReason='';renderChecks(selectedReasonValues())});
      document.querySelectorAll('.reasonSaveBtn').forEach(btn=>btn.onclick=()=>saveReasonEdit(btn.closest('.reason')?.dataset.reason||'',btn.closest('.reason')?.querySelector('.reasonEditInput')?.value||''));
      document.querySelectorAll('.reasonEditInput').forEach(input=>{input.onclick=e=>e.stopPropagation();input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();saveReasonEdit(input.closest('.reason')?.dataset.reason||'',input.value)}if(e.key==='Escape'){editingReason='';renderChecks(selectedReasonValues())}}});
    }
    function reasonIsSystemReason(reason){
      const text=displayReason(reason);
      const base=canonicalReason(reason);
      return defaultReasons.some(r=>displayReason(r)===text||canonicalReason(r)===base);
    }
    function deleteReason(label){
      const text=displayReason(label);
      if(!text)return;
      if(reasonIsSystemReason(text)){
        notify("Standart sababni o'chirib bo'lmaydi",'bad');
        return;
      }
      if(!confirm(`"${text}" sababini o'chirasizmi?`))return;
      const selected=selectedReasonValues().filter(r=>displayReason(r)!==text);
      const targetBase=canonicalReason(text);
      deletedReasons=[...new Set([...(deletedReasons||[]),text,targetBase].map(x=>String(x||'').trim()).filter(Boolean))];
      customReasons=customReasons.filter(r=>displayReason(r)!==text&&canonicalReason(r)!==targetBase);
      Object.keys(reasonOverrides||{}).forEach(base=>{
        if(canonicalReason(base)===targetBase||canonicalReason(reasonOverrides[base])===targetBase||displayReason(base)===text)delete reasonOverrides[base];
      });
      editingReason='';
      saveReasonState();
      renderChecks(selected);
      notify("Sabab o'chirildi");
    }
    function saveReasonEdit(oldLabel,nextLabel){
      const oldText=displayReason(oldLabel);
      const nextText=String(nextLabel||'').trim();
      if(!oldText||!nextText){notify("Sabab bo'sh bo'lmasin",'bad');return}
      if(oldText===nextText){editingReason='';renderChecks(selectedReasonValues());return}
      if(allReasons().some(r=>r!==oldText&&displayReason(r).toLowerCase()===nextText.toLowerCase())){notify('Bunday sabab allaqachon bor','bad');return}
      const selected=selectedReasonValues().map(r=>displayReason(r)===oldText?nextText:r);
      if(reasonIsDefault(oldText)){
        const base=defaultReasons.find(r=>displayReason(r)===oldText)||canonicalReason(oldText);
        reasonOverrides[canonicalReason(base)]=nextText;
      }else{
        const index=customReasons.findIndex(r=>displayReason(r)===oldText||canonicalReason(r)===canonicalReason(oldText));
        if(index>=0)customReasons[index]=nextText;
        else reasonOverrides[canonicalReason(oldText)]=nextText;
      }
      editingReason='';
      saveReasonState();
      renderChecks(selected);
      notify("Sabab o'zgartirildi");
    }
    function openModal(index){
      const a=agents[agentIndex],p=a.photos[index],m=marks[key(a,p)]||{};current={a,p,index};zoom=1;
      const order=orderInfo(p);
      $('modalTitle').textContent=`${a.code} #${index+1}`;
      $('modalMeta').textContent=`${p.client||'Klient nomi yoq'}${order.text?` | ${order.text}`:''} | ${photoClock(p)||'vaqt yoq'}`;
      $('modalImg').style.transform='scale(1)';
      loadPhoto($('modalImg'),p.url,photoInitialMode('full'),'full');
      $('note').value=m.note||'';renderChecks(m.reasons||autoReasons(a,p));$('modal').classList.add('open');paused=true;updatePauseButtons();
    }
    function closeModal(){
      $('modal').classList.remove('open');
      if(autoReviewPreviewOpen){
        autoReviewPreviewOpen=false;
        showAutoReviewResults();
      }
    }
    function setMark(verdict){
      if(!current)return;const {a,p,index}=current;
      const k=key(a,p),prev=marks[k]||{};
      const now=new Date().toISOString();
      pushReviewUndo([{key:k,previous:marks[k]?cloneReviewValue(marks[k]):null,date:dataset.date,code:a.code,url:p.url}],verdict==='MINUS'?'Minus belgilash':'OK belgilash');
      marks[k]={...prev,...brandPayloadForCode(a.code),date:dataset.date,code:a.code,agent:a.agent,photo:index+1,client:p.client||'',clientOrderSum:p.clientOrderSum||0,clientOrderCount:p.clientOrderCount||0,clientHasOrder:p.clientHasOrder,clientOrderKnown:p.clientOrderKnown,clientOrderSource:p.clientOrderSource||'',clientId:p.clientId||'',photoTime:p.photoTime||'',url:p.url,verdict,reasons:[...document.querySelectorAll('#reasonChecks input:checked')].map(x=>x.value),note:$('note').value.trim(),approvedAt:prev.source?now:prev.approvedAt,savedAt:now,updatedAt:now,updatedBy:reviewClientId};
      saveMarks([k]);rebuildAgents();render();closeModal();refreshAutoReviewAfterMark();
      notify(verdict==='MINUS'?'Foto minus ro\'yxatiga qo\'shildi':'Foto OK sifatida saqlandi');
    }
    function move(direction,wrap=false){
      const a=agents[agentIndex];if(!a?.photos?.length)return;
      const size=photoPageSizeFor(a),last=lastPhotoPageStart(a,size);
      const next=start+(direction<0?-size:size);
      if(next<0){
        if(agentIndex>0){
          agentIndex--;
          const previous=agents[agentIndex];
          start=lastPhotoPageStart(previous,photoPageSizeFor(previous));
        }else if(wrap&&agents.length>1){
          agentIndex=agents.length-1;
          const previous=agents[agentIndex];
          start=lastPhotoPageStart(previous,photoPageSizeFor(previous));
        }else start=0;
      }else if(next>last){
        if(agentIndex<agents.length-1){agentIndex++;start=0}
        else if(wrap&&agents.length>1){agentIndex=0;start=0}
        else start=last;
      }else start=next;
      render();
    }
    function reviewNavigationReady(ignoreFocus=false){
      const modalOpen=$('modal')?.classList.contains('open');
      const listOpen=$('minusList')?.classList.contains('open');
      const confirmOpen=$('deleteConfirm')?.classList.contains('open');
      const collectOpen=$('collectPanel')?.classList.contains('open');
      const autoOpen=$('autoReviewList')?.classList.contains('open');
      const replaceOpen=$('attendanceReplaceModal')?.classList.contains('open');
      const brandOpen=$('brandPanel')?.classList.contains('open');
      const typing=!ignoreFocus&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');
      return currentView==='photo'&&!modalOpen&&!listOpen&&!autoOpen&&!confirmOpen&&!collectOpen&&!replaceOpen&&!brandOpen&&!typing;
    }
    function updatePauseButtons(){
      const text=paused?'Resume':'Pause';
      $('quickPause').textContent=text;
    }
    function togglePause(){
      paused=!paused;
      updatePauseButtons();
    }
    function isEditableTarget(target){
      const tag=target?.tagName||'';
      return /INPUT|TEXTAREA/.test(tag)||target?.isContentEditable;
    }
    function canUseSpaceForPause(){
      const btn=$('quickPause');
      if(!btn||btn.offsetParent===null||btn.disabled)return false;
      return reviewNavigationReady(true);
    }
    function renderSpeed(){
      $('speedText').textContent=(delay/1000).toFixed(delay%1000?1:0)+'s';
    }
    function restartTimer(){
      if(timer)clearInterval(timer);
      timer=setInterval(()=>{if(!paused)move(1,true)},delay);
    }
    function adjustSpeed(delta){
      delay=Math.max(1000,Math.min(10000,delay+delta));
      renderSpeed();
      restartTimer();
    }
    function exportRows(){return currentMinusMarks()}
    function closeMinusList(){
      $('minusList')?.classList.remove('open');
      if(currentView==='minus')switchView('photo');
    }
    async function clearMarksForDate(date){
      for(const key of Object.keys(marks)){
        if(marks[key]?.date===date)delete marks[key];
      }
      invalidateMarksCache();
      localStorage.setItem(LS_MARKS,JSON.stringify(marks));
      const res=await fetch('/api/marks?date='+encodeURIComponent(date),{method:'DELETE'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
      if(data.revision)sharedRevisions.marks=String(data.revision);
    }
    async function deleteCurrentDate(){
      if(!dataset?.date){alert("O'chirish uchun sana tanlanmagan.");return}
      const minus=currentMinusMarks().length;
      const photos=agents.reduce((s,x)=>s+x.photos.length,0);
      $('deleteDateText').textContent=dataset.date;
      $('deletePhotoText').textContent=photos.toLocaleString('ru-RU');
      $('deleteMinusText').textContent=minus.toLocaleString('ru-RU');
      $('deleteMessage').textContent=`${dataset.date} sanasidagi yig'ilgan ma'lumotlarni o'chirishni tasdiqlang.`;
      $('deleteConfirm').classList.add('open');
    }
    function closeDeleteConfirm(){
      $('deleteConfirm').classList.remove('open');
    }
    async function performDeleteCurrentDate(){
      if(!dataset?.date){closeDeleteConfirm();return}
      const date=dataset.date;
      const btn=$('deleteConfirmBtn'),mainBtn=$('deleteDateBtn'),old=btn.textContent;
      btn.disabled=true;mainBtn.disabled=true;btn.textContent="O'chirilmoqda...";
      try{
        const res=await fetch('/api/datasets/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
        await clearMarksForDate(date);
        manifest.datasets=data.datasets||manifest.datasets.filter(d=>d.date!==date);
        const next=manifest.datasets.at(-1)?.date||'';
        if(localStorage.getItem(LS_DATE)===date)localStorage.removeItem(LS_DATE);
        await applyManifest(next);
        closeDeleteConfirm();
      }catch(e){
        alert("Sanani o'chirishda xato: "+e.message);
      }finally{
        btn.disabled=false;mainBtn.disabled=false;btn.textContent=old;
      }
    }
    async function loadTelegramStatus(){
      try{
        const status=await (await fetch('/api/telegram/status?'+Date.now())).json();
        window.telegramChats=status.chats||[];
        systemHealth.telegram=status.configured?'ok':'warning';
        $('telegramBtn').title=status.configured?`Telegram sozlangan: ${status.chatId}`:'Telegram token/chat ID sozlanmagan';
        renderBrandTelegramChats($('brandTelegramChat')?.value||brandById(activeBrandId)?.telegramChatId||'');
      }catch{
        systemHealth.telegram='error';
        $('telegramBtn').title="Telegram server statusini tekshirib bo'lmadi";
      }
      renderSystemStatus();
    }
    function mainTelegramChatOption(){
      const main=(window.telegramChats||[])[0];
      return main?.id?{...main,name:main.name||'Asosiy gruppa'}:null;
    }
    function brandForRows(rows=[]){
      const ids=[...new Set((rows||[]).map(row=>row.brandId||brandPayloadForCode(row.code).brandId).filter(Boolean))];
      if(ids.length===1&&brandById(ids[0]))return brandById(ids[0]);
      const byCode=[...new Set((rows||[]).map(row=>brandByCode(row.code)?.id).filter(Boolean))];
      if(byCode.length===1&&brandById(byCode[0]))return brandById(byCode[0]);
      return brandById(currentBrand())||brandByCode(dataset?.brand?.code||agents[agentIndex]?.code)||null;
    }
    function telegramChatOptions(rows=[]){
      const options=[];
      const main=mainTelegramChatOption();
      if(main)options.push(main);
      const brand=brandForRows(rows);
      const brandChatId=String(brand?.telegramChatId||'').trim();
      if(brandChatId)options.push({
        id:brandChatId,
        name:brand?.telegramChatName||`${brandDisplayName(brand)||brandChatId} gruppasi`
      });
      return telegramTools.uniqueChats(options);
    }
    function pickTelegramChat(rows=[]){
      const chats=telegramChatOptions(rows);
      if(chats.length<=1)return chats[0]?.id||'';
      const text=chats.map((c,i)=>`${i+1}. ${c.name} (${c.maskedId||c.id})`).join('\n');
      const brand=brandForRows(rows);
      const title=brandDisplayName(brand)||'Tanlangan brend';
      const answer=prompt(`${title} uchun qaysi Telegram gruppaga yuborilsin?\n\n${text}\n\nRaqam kiriting:`, '1');
      if(answer===null)return null;
      const index=Number(answer)-1;
      if(!Number.isInteger(index)||!chats[index]){alert("Telegram gruppa tanlovi noto'g'ri.");return null}
      return chats[index].id;
    }
    function currentBrandTelegramChatId(){
      const brand=brandById(currentBrand())||brandByCode(dataset?.brand?.code||agents[agentIndex]?.code);
      return telegramTools.chatId(brand?.telegramChatId);
    }
    function telegramChatName(chatId,rows=[]){
      const fromList=telegramChatOptions(rows).find(c=>String(c.id)===String(chatId));
      if(fromList?.name)return fromList.name;
      const brand=brandForRows(rows);
      if(String(brand?.telegramChatId||'')===String(chatId))return brand.telegramChatName||brandDisplayName(brand)||chatId;
      return chatId||'Telegram gruppa';
    }
    async function sendTelegram(entriesOverride=null,sourceBtn=null){
      if(!Array.isArray(entriesOverride))entriesOverride=null;
      await syncSharedState(false).catch(()=>{});
      const entries=entriesOverride||Object.entries(marks).filter(([,m])=>m.date===dataset.date&&m.verdict==='MINUS'&&markMatchesCurrentBrand(m)&&!m.telegramSentAt);
      const rows=entries.map(([,m])=>({...m,...brandPayloadForCode(m.code)}));
      if(!rows.length){alert("Yuborilmagan shubhali foto yo'q.");return}
      const chatId=pickTelegramChat(rows);
      if(chatId===null)return;
      const chatName=telegramChatName(chatId,rows);
      const agentCount=new Set(rows.map(m=>`${m.date}#${m.code}`)).size;
      if(!confirm(`${rows.length} ta shubhali foto ${agentCount} ta agent bo'yicha "${chatName}" gruppaga ro'yxat/link qilib yuborilsinmi?`))return;
      const btn=sourceBtn||$('telegramBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='Yuborilmoqda...';
      try{
        const res=await fetch('/api/telegram/send-suspicious',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:rows,chatId,mode:'summary'})});
        const text=await res.text();
        let data={};
        try{data=JSON.parse(text)}catch{throw new Error(text||`HTTP ${res.status}`)}
        if(!res.ok&&data.error)throw new Error(data.error);
        const sentAt=new Date().toISOString();
        const sentKeys=new Set((data.sent||[]).map(x=>`${x.code}#${x.photo}`));
        const failedKeys=new Set((data.failed||[]).map(x=>`${x.code}#${x.photo}`));
        const changedMarkKeys=[];
        for(const [k,m] of entries){
          const sentKey=`${m.code}#${m.photo}`;
          if(sentKeys.size ? sentKeys.has(sentKey) : !failedKeys.has(sentKey)){
            marks[k]={...m,telegramSentAt:sentAt,updatedAt:sentAt,updatedBy:reviewClientId};
            changedMarkKeys.push(k);
          }
        }
        saveMarks(changedMarkKeys);render();
        const failedRows=data.failed||[];
        const failed=failedRows.length;
        const batchInfo=data.batches&&data.batches>1?` (${data.batches} ta xabarda)`:'';
        const sampleErrors=[...new Set(failedRows.map(x=>x.error).filter(Boolean))].slice(0,3);
        alert(`Telegram: ${data.groups||agentCount} ta agent ro'yxati yuborildi${batchInfo}. Linkdagi foto soni: ${(data.sent||[]).length}${failed?`, ${failed} ta xato`:''}.${sampleErrors.length?`\n\nXato sababi:\n- ${sampleErrors.join('\n- ')}`:''}`);
        notify(`Telegramga ${data.groups||agentCount} ta agent ro'yxati yuborildi${failed?`, ${failed} xato`:''}`,failed?'bad':'ok');
      }catch(e){
        alert('Telegramga yuborishda xato: '+e.message);
      }finally{
        btn.disabled=false;btn.textContent=old;
      }
    }
    function csv(){
      const rows=exportRows();
      if(!rows.length){alert("Excelga chiqarish uchun minus qilingan foto yo'q.");return}
      const h=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
      const reasonText=r=>displayReasons(r.reasons).join('; ');
      const html=`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body{font-family:Arial,sans-serif;color:#17202a}
    h1{margin:0;color:#0f766e;font-size:22px}
    .meta{margin:6px 0 14px;color:#5b6776}
    .summary{border-collapse:collapse;margin-bottom:14px}
    .summary td{border:1px solid #cbd5e1;padding:8px 12px}
    .summary .label{background:#e6f4f1;font-weight:bold;color:#0f766e}
    table{border-collapse:collapse;width:100%}
    th{background:#0f766e;color:#fff;font-weight:bold;border:1px solid #0b5f58;padding:9px;text-align:left}
    td{border:1px solid #cbd5e1;padding:8px;vertical-align:top}
    tr:nth-child(even) td{background:#f8fafc}
    .bad{color:#b91c1c;font-weight:bold}
    .note{background:#fff7ed}
    a{color:#2563eb;text-decoration:underline}
  </style>
</head>
<body>
  <h1>${h(currentBrand())} shubhali fotolar hisoboti</h1>
  <div class="meta">Sana: ${h(dataset.date)} | Yaratildi: ${h(new Date().toLocaleString('uz-UZ'))}</div>
  <table class="summary">
    <tr><td class="label">Shubhali foto</td><td>${rows.length}</td></tr>
    <tr><td class="label">Agentlar soni</td><td>${new Set(rows.map(r=>r.code)).size}</td></tr>
    <tr><td class="label">Telegramga yuborilgan</td><td>${rows.filter(r=>r.telegramSentAt).length}</td></tr>
  </table>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Sana</th><th>Agent kodi</th><th>Agent</th><th>Foto</th><th>Klient</th><th>Klient buyurtmasi</th><th>Klient ID</th><th>Foto vaqti</th><th>Sabab</th><th>Izoh</th><th>Telegram</th><th>Foto link</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r,i)=>`<tr>
        <td>${i+1}</td>
        <td>${h(r.date)}</td>
        <td><b>${h(r.code)}</b></td>
        <td>${h(r.agent)}</td>
        <td class="bad">${h(r.photo)}</td>
        <td>${h(r.client)}</td>
        <td>${h(money(r.clientOrderSum))}</td>
        <td>${h(r.clientId)}</td>
        <td>${h(r.photoTime)}</td>
        <td>${h(reasonText(r))}</td>
        <td class="note">${h(r.note)}</td>
        <td>${r.telegramSentAt?'Yuborilgan':'Yuborilmagan'}</td>
        <td><a href="${h(r.url)}">Foto ochish</a></td>
      </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel'}));
      a.download=`${currentBrand().toLowerCase()}_shubhali_fotolar_${dataset.date}.xls`;
      a.click();
      notify('Excel fayl tayyorlandi');
    }
    function agentExcel(){
      if(!dataset?.date){alert("Excelga chiqarish uchun agent ma'lumoti yo'q.");return}
      const h=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
      const moneyCell=value=>{
        const n=Number(value||0);
        return n?String(Math.round(n)):'-';
      };
      const reportAgents=allAgentsForReport(dataset);
      if(!reportAgents.length){alert("Excelga chiqarish uchun agent ma'lumoti yo'q.");return}
      const stats=renderStats();
      const rows=reportAgents.map(a=>{
        const total=a.total;
        const minus=stats.minusByCode.get(a.code)||0;
        return {code:a.code,orderSum:a.orderSum,total,minus,final:Math.max(0,total-minus)};
      });
      const createdAt=new Date().toLocaleString('uz-UZ',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).replace(',', '');
      const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Foto nazorati">
<!--[if gte mso 9]><xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>${h(currentBrand().toLowerCase())}_agentlar_hisoboti</x:Name>
    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml><![endif]-->
<style>
td{padding-bottom:7px;padding-top:7px;}
table{mso-displayed-decimal-separator:"\\,";mso-displayed-thousand-separator:" ";}
tr{mso-height-source:auto;}
col{mso-width-source:auto;}
br{mso-data-placement:same-cell;}
.style0{mso-number-format:General;text-align:general;vertical-align:bottom;white-space:nowrap;color:black;font-size:11.0pt;font-weight:400;font-style:normal;text-decoration:none;font-family:"Aptos Narrow",Arial,sans-serif;border:none;mso-protection:locked visible;}
.style16{mso-number-format:0;}
td{mso-style-parent:style0;padding-top:1px;padding-right:1px;padding-left:1px;mso-ignore:padding;color:black;font-size:11.0pt;font-weight:400;font-style:normal;text-decoration:none;font-family:"Aptos Narrow",Arial,sans-serif;mso-number-format:General;text-align:general;vertical-align:bottom;border:none;white-space:nowrap;}
.xl65{mso-style-parent:style0;mso-number-format:0;}
.xl66{mso-style-parent:style16;mso-number-format:0;}
</style>
</head>
<body link="#467886" vlink="#96607D" class=xl65>
<table border=0 cellpadding=0 cellspacing=0 width=480 style='border-collapse:collapse;table-layout:fixed;width:359pt'>
 <col class=xl65 width=111 style='width:83pt'>
 <col class=xl66 width=108 style='mso-width-source:userset;mso-width-alt:3949;width:81pt'>
 <col class=xl65 width=87 span=3 style='mso-width-source:userset;mso-width-alt:3181;width:65pt'>
 <tr height=0 style='display:none'>
  <td class=xl65 colspan=3 width=306 style='mso-ignore:colspan;width:229pt'>${h(currentBrand().toLowerCase())} agentlar bo'yicha foto hisoboti</td>
  <td class=xl65 width=87 style='width:65pt'></td>
  <td class=xl65 width=87 style='width:65pt'></td>
 </tr>
 <tr height=0 style='display:none'>
  <td class=xl65 colspan=4 style='mso-ignore:colspan'>Sana: ${h(dataset.date)} | Agent: ${h(rows.length)} | Yaratildi: ${h(createdAt)}</td>
  <td class=xl65></td>
 </tr>
 <tr height=20 style='height:15.0pt'>
  <td height=20 class=xl65 style='height:15.0pt'>Agent kodi</td>
  <td class=xl66><span style='mso-spacerun:yes'> </span>Buyurtma summasi<span style='mso-spacerun:yes'> </span></td>
  <td class=xl65>Foto hisoboti</td>
  <td class=xl65>Minus</td>
  <td class=xl65>Yakuniy</td>
 </tr>
 ${rows.map(r=>`<tr height=20 style='height:15.0pt'>
  <td height=20 class=xl65 style='height:15.0pt'>${h(r.code)}</td>
  <td class=xl66>${h(moneyCell(r.orderSum))}</td>
  <td class=xl65 align=right>${h(r.total)}</td>
  <td class=xl65 align=right>${h(r.minus)}</td>
  <td class=xl65 align=right>${h(r.final)}</td>
 </tr>`).join('')}
</table>
</body>
</html>`;
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel'}));
      a.download=`${currentBrand().toLowerCase()}_agentlar_hisoboti_${dataset.date}.xls`;
      a.click();
      notify('Agent Excel tayyorlandi');
    }
    function escapeHtml(v){
  return String(v??'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}
    async function showList(selectedDate=dataset?.date,selectedBrand=currentBrand(),skipRefresh=false){
      switchView('minus');
      uiState.render($('listBody'),"Minus ro'yxati yuklanmoqda",'Saqlangan belgilashlar tayyorlanmoqda.',{type:'loading'});
      await new Promise(resolve=>requestAnimationFrame(resolve));
      if(typeof selectedDate!=='string')selectedDate=dataset?.date||'';
      const wantsAllDates=selectedDate==='__all__';
      selectedDate=wantsAllDates?'__all__':cleanDate(selectedDate);
      selectedBrand=normalizeBrandFilter(selectedBrand||currentBrand());
      const allMinus=Object.entries(marks).filter(([,m])=>m.verdict==='MINUS');
      const brandCounts=new Map();
      for(const [,m] of allMinus){
        const brand=normalizeBrandFilter(brandFromCode(m.code));
        if(brand)brandCounts.set(brand,(brandCounts.get(brand)||0)+1);
      }
      const brandOptions=[...brandCounts.keys()].sort((a,b)=>brandName(a).localeCompare(brandName(b)));
      const currentBrandId=normalizeBrandFilter(currentBrand());
      if(!brandOptions.includes(selectedBrand))selectedBrand=brandOptions.includes(currentBrandId)?currentBrandId:(brandOptions[0]||'LMJ');
      const all=allMinus.filter(([,m])=>markMatchesBrand(m,selectedBrand));
      const markedDates=all.map(([,m])=>cleanDate(m.date)).filter(Boolean);
      const dates=[...new Set(markedDates)].sort();
      const dateCounts=new Map();
      markedDates.forEach(d=>dateCounts.set(d,(dateCounts.get(d)||0)+1));
      const activeDate=selectedDate==='__all__'?'__all__':(dates.includes(selectedDate)?selectedDate:(dates.includes(cleanDate(dataset?.date))?cleanDate(dataset?.date):(dates.at(-1)||'')));
      const entries=all.filter(([,m])=>activeDate==='__all__'||cleanDate(m.date)===cleanDate(activeDate)).sort((a,b)=>String(a[1].date).localeCompare(String(b[1].date))||String(a[1].code).localeCompare(String(b[1].code))||Number(a[1].photo||0)-Number(b[1].photo||0));
      const unsent=entries.filter(([,m])=>!m.telegramSentAt);
      const foundDates=[...new Set(markedDates)].sort();
      const groups=new Map();
      for(const entry of entries){
        const [,m]=entry;
        const groupKey=`${m.date}#${m.code}`;
        if(!groups.has(groupKey))groups.set(groupKey,{id:`g${groups.size}`,date:m.date,code:m.code,agent:m.agent,items:[]});
        groups.get(groupKey).items.push(entry);
      }
      const sentTotal=entries.filter(([,m])=>m.telegramSentAt).length;
      if($('listSubtitle'))$('listSubtitle').textContent=`${brandName(selectedBrand)} | ${activeDate==='__all__'?'hamma sanalar':activeDate} | ${entries.length} ta minus`;
      const groupRows=[...groups.values()].map(g=>{
        const sent=g.items.filter(([,m])=>m.telegramSentAt).length;
        const fresh=g.items.length-sent;
        const reasons=[...new Set(g.items.flatMap(([,m])=>displayReasons(m.reasons)).filter(Boolean))];
        return `<tr class="groupRow" data-group="${g.id}">
          <td><input class="groupPick" type="checkbox" data-group="${g.id}" title="Agentdagi hamma fotoni tanlash"></td>
          <td><div class="groupMain"><span class="groupToggle">&rsaquo;</span><span>${escapeHtml(g.code)}</span></div><div class="groupSub">${escapeHtml(g.agent||'')}</div></td>
          <td>${escapeHtml(agentRegion(g.code)||'')}</td>
          <td>${escapeHtml(g.date)}</td>
          <td><span class="countBadge">Jami ${g.items.length}</span><span class="countBadge sent">Yuborilgan ${sent}</span><span class="countBadge fresh">Yangi ${fresh}</span></td>
          <td><div class="reasonText">${escapeHtml(reasons.join('; '))}</div></td>
        </tr>`;
      }).join('');
      $('listBody').innerHTML=`<div class="listToolbar">
        <select id="listBrandSel">${brandOptions.map(b=>`<option value="${escapeHtml(b)}" ${b===selectedBrand?'selected':''}>${escapeHtml(brandName(b))} (${brandCounts.get(b)||0})</option>`).join('')}</select>
        <select id="listDateSel"><option value="__all__" ${activeDate==='__all__'?'selected':''}>Hammasi (${all.length})</option>${dates.map(d=>`<option value="${escapeHtml(d)}" ${d===activeDate?'selected':''}>${escapeHtml(d)} (${dateCounts.get(d)||0})</option>`).join('')}</select>
        <span></span>
        <button id="listSendSelected" ${entries.length?'':'disabled'}>Tanlanganlarni yuborish</button>
        <button id="listSendNew" class="primary" ${unsent.length?'':'disabled'}>Yangi hammasi (${unsent.length})</button>
        <span class="grow"></span>
      </div>
      <div class="listStats">
        <div class="listStat"><span>Agent</span><b>${groups.size}</b></div>
        <div class="listStat"><span>Jami minus</span><b>${entries.length}</b></div>
        <div class="listStat"><span>Yuborilgan</span><b>${sentTotal}</b></div>
        <div class="listStat"><span>Yangi</span><b>${unsent.length}</b></div>
      </div>
      <div class="listHint">Brend: ${escapeHtml(brandName(selectedBrand))}. Saqlangan minus: ${all.length}. Minus bor sanalar: ${foundDates.length?foundDates.map(escapeHtml).join(', '):'ma\'lumot topilmadi'}. Agent qatorini bossangiz ichidagi fotolar ochiladi.</div>
      ${entries.length?`<table class="listTable"><colgroup><col style="width:42px"><col style="width:31%"><col style="width:11%"><col style="width:12%"><col style="width:17%"><col></colgroup><thead><tr><th><input id="listSelectAll" type="checkbox" title="Hammasini tanlash"></th><th>Agent / foto</th><th>Filial / holat</th><th>Sana / klient ID</th><th>Holat / buyurtma</th><th>Sabab</th></tr></thead><tbody>${groupRows}</tbody></table>`:viewStateMarkup("Minus topilmadi","Tanlangan brend va sana bo'yicha saqlangan minus foto yo'q.",{compact:true})}`;
      switchView('minus');
      const groupMap=new Map([...groups.values()].map(g=>[g.id,g]));
      const keyToGroup=new Map();
      for(const g of groups.values())for(const [k] of g.items)keyToGroup.set(k,g.id);
      const renderDetails=group=>{
        if(document.querySelector(`.detailRow[data-group="${group}"]`))return;
        const g=groupMap.get(group);if(!g)return;
        const html=g.items.map(([k,r])=>{const order=orderInfo(r);return `<tr class="detailRow" data-group="${g.id}">
          <td><label class="detailPick"><input class="listPick" type="checkbox" value="${escapeHtml(k)}" data-group="${g.id}"></label></td>
          <td><div class="listPhotoCell"><img class="listThumb" src="${escapeHtml(photoDisplayUrl(r.url))}" loading="lazy" referrerpolicy="no-referrer" alt=""><span><span class="photoPill">Foto #${escapeHtml(r.photo)}</span><span class="photoClient">${escapeHtml(r.client)}</span><span class="photoMeta">${escapeHtml(r.photoTime||'')}</span></span></div></td>
          <td>${r.telegramSentAt?`<span class="status sent">Yuborilgan</span><div class="meta">${escapeHtml(new Date(r.telegramSentAt).toLocaleString('uz-UZ'))}</div>`:'<span class="status new">Yangi</span>'}</td>
          <td>${escapeHtml(r.clientId||agentRegion(r.code)||'')}</td>
          <td><div class="orderCell">${order.text?escapeHtml(order.text):"<span class='muted'>Buyurtma noma'lum</span>"}</div></td>
          <td><div class="reasonText">${escapeHtml(displayReasons(r.reasons).join('; '))}${r.note?`<div class="meta">${escapeHtml(r.note)}</div>`:''}</div></td>
        </tr>`}).join('');
        document.querySelector(`.groupRow[data-group="${group}"]`)?.insertAdjacentHTML('afterend',html);
        const groupPick=document.querySelector(`.groupPick[data-group="${group}"]`);
        document.querySelectorAll(`.listPick[data-group="${group}"]`).forEach(pick=>{
          pick.checked=Boolean(groupPick?.checked);
          pick.onchange=syncAll;
        });
      };
      const syncGroup=group=>{
        const picks=[...document.querySelectorAll(`.listPick[data-group="${group}"]`)];
        const groupPick=document.querySelector(`.groupPick[data-group="${group}"]`);
        if(!groupPick||!picks.length)return;
        const checked=picks.filter(x=>x.checked).length;
        groupPick.checked=checked===picks.length;
        groupPick.indeterminate=checked>0&&checked<picks.length;
      };
      const syncAll=()=>{
        document.querySelectorAll('.groupPick').forEach(x=>syncGroup(x.dataset.group));
        const picks=[...document.querySelectorAll('.listPick')];
        const allPick=$('listSelectAll');
        if(!allPick||!picks.length)return;
        const checked=picks.filter(x=>x.checked).length;
        allPick.checked=checked===picks.length;
        allPick.indeterminate=checked>0&&checked<picks.length;
      };
      if($('listBrandSel'))$('listBrandSel').onchange=()=>showList('__all__',$('listBrandSel').value);
      if($('listDateSel'))$('listDateSel').onchange=()=>showList($('listDateSel').value,selectedBrand);
      if($('listSelectAll'))$('listSelectAll').onchange=e=>{
        document.querySelectorAll('.listPick,.groupPick').forEach(x=>{x.checked=e.target.checked;x.indeterminate=false});
      };
      document.querySelectorAll('.groupPick').forEach(pick=>pick.onchange=e=>{
        renderDetails(pick.dataset.group);
        document.querySelectorAll(`.listPick[data-group="${pick.dataset.group}"]`).forEach(x=>x.checked=e.target.checked);
        syncAll();
      });
      document.querySelectorAll('.listPick').forEach(pick=>pick.onchange=syncAll);
      document.querySelectorAll('.groupRow').forEach(row=>row.onclick=e=>{
        if(e.target.closest('input,button,select,a,textarea'))return;
        const group=row.dataset.group;
        renderDetails(group);
        const open=!document.querySelector(`.detailRow[data-group="${group}"]`)?.classList.contains('open');
        document.querySelectorAll(`.detailRow[data-group="${group}"]`).forEach(x=>x.classList.toggle('open',open));
        const toggle=row.querySelector('.groupToggle');
        if(toggle)toggle.textContent=open?'v':'>';
      });
      if($('listSendNew'))$('listSendNew').onclick=async()=>{await sendTelegram(unsent,$('listSendNew'));showList(activeDate,selectedBrand)};
      if($('listSendSelected'))$('listSendSelected').onclick=async()=>{
        const selected=new Set([...document.querySelectorAll('.listPick:checked')].map(x=>x.value));
        const selectedGroups=new Set([...document.querySelectorAll('.groupPick:checked')].map(x=>x.dataset.group));
        const picked=entries.filter(([k])=>selected.has(k)||selectedGroups.has(keyToGroup.get(k)));
        if(!picked.length){notify('Tanlangan foto yoq','bad');return}
        await sendTelegram(picked,$('listSendSelected'));showList(activeDate,selectedBrand);
      };
      syncAll();
      if(!skipRefresh){
        const refreshKey=`${selectedBrand}|${activeDate}`;
        showList.refreshKey=refreshKey;
        loadMarks(true,{brand:selectedBrand,date:activeDate==='__all__'?'':activeDate,verdict:'MINUS'}).then(()=>{
          if($('minusList')?.classList.contains('open')&&showList.refreshKey===refreshKey)showList(activeDate,selectedBrand,true);
        }).catch(()=>{});
      }
    }
    function addReason(){
      const v=$('newReason').value.trim();
      if(!v)return;
      deletedReasons=(deletedReasons||[]).filter(r=>reasonKey(r)!==reasonKey(v)&&reasonKey(r)!==reasonKey(displayReason(v)));
      if(!allReasons().includes(v))customReasons.push(v);
      editingReason='';
      saveReasonState();
      renderChecks(selectedReasonValues().concat(v));
      $('newReason').value='';
    }
    function adminUserLabel(user){
      const name=[user?.name,user?.username?`@${user.username}`:''].filter(Boolean).join(' ');
      return name||user?.id||'-';
    }
    function adminEventLabel(event){
      const map={start:'Start bosildi',detail_sent:'Foto yuborildi',detail_failed:'Yuborish xato',start_missing_session:'Eski link',summary_sent:'Guruhga ro\'yxat',warm_cache_queued:'File ID cache'};
      return map[event?.action]||event?.action||'event';
    }
    function renderAdminStats(data){
      const body=$('adminStatsBody');if(!body)return;
      const totals=data?.totals||{};
      const cards=[
        ['Foydalanuvchi',totals.uniqueUsers||0],
        ['Start bosildi',totals.startClicks||0],
        ['Hamma foto',totals.allClicks||0],
        ['Agent link',totals.agentClicks||0],
        ['Yuborilgan foto',totals.photoSent||0],
        ['Xato foto',totals.photoFailed||0],
        ['Cache navbat',totals.warmQueued||0],
        ['Admin',Array.isArray(data?.admins)?data.admins.join(', '):'-'],
      ];
      const users=(data?.users||[]).slice(0,30).map(u=>`<tr><td><b>${escapeHtml(adminUserLabel(u))}</b><div class="adminSub">${escapeHtml(u.id)}${u.isAdmin?' · admin':''}</div></td><td>${u.starts||0}</td><td>${u.allClicks||0}</td><td>${u.agentClicks||0}</td><td>${u.photosSent||0}</td><td>${u.photosFailed||0}</td><td>${escapeHtml((u.lastAt||'').replace('T',' ').slice(0,19))}</td></tr>`).join('');
      const agents=(data?.agents||[]).slice(0,30).map(a=>`<tr><td><b>${escapeHtml(a.code||'-')}</b><div class="adminSub">${escapeHtml(a.agent||'')}</div></td><td>${escapeHtml(a.date||'')}</td><td>${a.opens||0}</td><td>${a.photosSent||0}</td><td>${a.photosFailed||0}</td><td>${escapeHtml((a.lastAt||'').replace('T',' ').slice(0,19))}</td></tr>`).join('');
      const recent=(data?.recent||[]).slice(0,60).map(e=>`<div class="adminEvent"><span>${escapeHtml((e.at||'').replace('T',' ').slice(0,19))}</span><b>${escapeHtml(adminEventLabel(e))}</b><em>${escapeHtml([adminUserLabel(e.user||{id:e.userId}),e.code,e.sessionType==='all'?'hammasi':''].filter(Boolean).join(' · '))}</em></div>`).join('');
      const emptyUsers="<tr><td colspan=\"7\">Hali ma'lumot yo'q</td></tr>";
      const emptyAgents="<tr><td colspan=\"6\">Hali ma'lumot yo'q</td></tr>";
      const emptyEvents=viewStateMarkup("Harakatlar yo'q","Bot yoki web yuborish hodisasi hali qayd etilmagan.",{compact:true});
      body.innerHTML=`<div class="adminCards">${cards.map(([label,value])=>`<div class="adminCard"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('')}</div>
        <div class="adminGrid">
          <section class="adminBlock"><div class="adminBlockHead"><b>Kimlar foydalandi</b><span>Oxirgi aktiv userlar</span></div><div class="adminTableWrap"><table class="adminTable"><thead><tr><th>User</th><th>Start</th><th>Hamma</th><th>Agent</th><th>Foto</th><th>Xato</th><th>Oxirgi</th></tr></thead><tbody>${users||emptyUsers}</tbody></table></div></section>
          <section class="adminBlock"><div class="adminBlockHead"><b>Qaysi agentlar ochildi</b><span>Eng ko'p bosilgan agent/all sessiyalar</span></div><div class="adminTableWrap"><table class="adminTable"><thead><tr><th>Agent</th><th>Sana</th><th>Bosildi</th><th>Foto</th><th>Xato</th><th>Oxirgi</th></tr></thead><tbody>${agents||emptyAgents}</tbody></table></div></section>
        </div>
        <section class="adminBlock"><div class="adminBlockHead"><b>Oxirgi harakatlar</b><span>Bot va web yuborish activity</span></div><div class="adminTimeline">${recent||emptyEvents}</div></section>`;
    }
    async function loadAdminStats(force=false){
      if(!force&&adminStatsData&&adminStatsLoadedAt&&Date.now()-adminStatsLoadedAt<10000){
        renderAdminStats(adminStatsData);
        return adminStatsData;
      }
      const body=$('adminStatsBody');
      if(body)body.innerHTML=viewStateMarkup('Statistika yuklanmoqda','Serverdan so\'nggi ma\'lumotlar olinmoqda.',{type:'loading'});
      try{
        const data=await dataTools.getJson('/api/admin/telegram-stats?'+Date.now(),{timeout:15000});
        adminStatsData=data;
        adminStatsLoadedAt=Date.now();
        renderAdminStats(data);
        return data;
      }catch(error){
        if(body)body.innerHTML=viewStateMarkup('Statistika ochilmadi',error.message||'Server bilan aloqa xatosi.',{type:'error'});
        throw error;
      }
    }
    function defaultAttendanceMonth(){const date=cleanDate(dataset?.date)||new Date().toISOString().slice(0,10);return date.slice(0,7)}
    function nextIsoDate(date){return attendanceTools.nextIsoDate(date)}
    function validIsoDate(date){return attendanceTools.validIsoDate(date)}
    function invalidAttendanceValue(value){return /[kb\u043a]/i.test(String(value||''))}
    function attendanceValueLooksValid(value){return attendanceTools.valueLooksValid(value)}
    async function loadAttendanceConfig(force=false){
      if(!force&&attendanceConfigLoadedAt&&Date.now()-attendanceConfigLoadedAt<ATTENDANCE_CACHE_MS)return attendanceConfig;
      const data=await dataTools.getJson('/api/attendance/config',{timeout:15000});
      attendanceConfig={employees:data.employees||[],routes:data.routes||[],assignments:data.assignments||[],settings:data.settings||{},validation:data.validation||{}};
      attendanceConfigLoadedAt=Date.now();
      renderReplaceEmployeeSelect();
      return attendanceConfig;
    }
    function setPhotoFiltersOpen(open){
      const shouldOpen=Boolean(open)&&currentView==='photo';
      document.body.classList.toggle('filtersOpen',shouldOpen);
      const toggle=$('filterToggleBtn');
      if(toggle)toggle.setAttribute('aria-expanded',shouldOpen?'true':'false');
      const panel=$('reviewFilters');
      if(panel)panel.setAttribute('aria-hidden',currentView==='photo'?(shouldOpen?'false':'true'):'false');
      const backdrop=$('filterBackdrop');
      if(backdrop)backdrop.setAttribute('aria-hidden',shouldOpen?'false':'true');
    }
    function togglePhotoFilters(){
      setPhotoFiltersOpen(!document.body.classList.contains('filtersOpen'));
    }
    function switchView(view){
      const previousView=currentView;
      currentView=view;
      const isAttendance=view==='attendance';
      const isAdmin=view==='admin';
      const isCollect=view==='collect';
      const isMinus=view==='minus';
      const isBrand=view==='brand';
      const isAuto=view==='auto';
      const isTool=isMinus||isBrand||isAuto;
      const isPhoto=view==='photo';
      if(previousView==='collect'&&view!=='collect'){
        clearInterval(collectTimer);
        collectTimer=null;
      }
      document.body.classList.toggle('collectView',isCollect);
      document.body.classList.toggle('photoView',isPhoto);
      document.body.classList.toggle('toolView',isTool);
      document.body.classList.toggle('minusView',isMinus);
      document.body.classList.toggle('brandView',isBrand);
      document.body.classList.toggle('autoView',isAuto);
      if(!isPhoto)setPhotoFiltersOpen(false);
      document.querySelector('.wrap').style.display=isPhoto?'grid':'none';
      const controls=document.querySelector('.controls');
      if(controls)controls.style.display=(isPhoto||isCollect||isTool)?'':'none';
      if($('deleteDateBtn')){
        if(isCollect||isTool){
          $('deleteDateBtn').classList.remove('dangerBtn');
          $('deleteDateBtn').innerHTML='Yopish';
          $('deleteDateBtn').onclick=isCollect?closeCollect:isMinus?closeMinusList:isBrand?closeBrandSettings:closeAutoReview;
        }else{
          $('deleteDateBtn').classList.add('dangerBtn');
          $('deleteDateBtn').innerHTML=`<span class="dangerDot">!</span>Sanani o'chirish`;
          $('deleteDateBtn').onclick=deleteCurrentDate;
        }
      }
      $('attendancePanel')?.classList.toggle('open',isAttendance);
      $('adminStatsPanel')?.classList.toggle('open',isAdmin);
      $('collectPanel')?.classList.toggle('open',isCollect);
      $('minusList')?.classList.toggle('open',isMinus);
      $('brandPanel')?.classList.toggle('open',isBrand);
      $('autoReviewList')?.classList.toggle('open',isAuto);
      $('quickNav')?.style.setProperty('display',isPhoto?'grid':'none');
      $('sidePhotoBtn')?.classList.toggle('active',isPhoto);
      $('sideAttendanceBtn')?.classList.toggle('active',isAttendance);
      $('sideAdminStatsBtn')?.classList.toggle('active',isAdmin);
      $('sideCollectBtn')?.classList.toggle('active',isCollect);
      $('sideMinusListBtn')?.classList.toggle('active',isMinus);
      $('sideBrandSettingsBtn')?.classList.toggle('active',isBrand);
      $('sideAutoReviewBtn')?.classList.toggle('active',isAuto);
      if(isPhoto){
        if(dataset&&agents[agentIndex])render();
        else {$('title').textContent='Foto nazorati';$('meta').textContent='Ma\'lumotlar yuklanmoqda...'}
      }
      if(isAttendance){
        $('title').textContent='Tabel';
        $('meta').textContent='Ish kuni, foto soni va xodimlar nazorati';
      }
      if(isAdmin){
        $('title').textContent='Admin statistika';
        $('meta').textContent='Telegram botdan foydalanish, agent ochilishlari va yuborilgan fotolar nazorati';
      }
      if(isCollect){
        $('title').textContent="Ma'lumot yig'ish";
        $('meta').textContent='Sales sahifasidan foto hisobot ma\'lumotlarini xavfsiz yig\'ish';
      }
      if(isMinus){
        $('title').textContent="Minus ro'yxati";
        $('meta').textContent='Saqlangan minus fotolar va Telegram yuborish nazorati';
      }
      if(isBrand){
        $('title').textContent='Brend sozlamalari';
        $('meta').textContent='Brend, agent prefixlari va Telegram guruhlarini boshqarish';
      }
      if(isAuto){
        $('title').textContent='Avto tekshiruv';
        $('meta').textContent='Qoidaviy tekshiruv natijalari va shubhali fotolar';
      }
      if(isAttendance&&!attendanceData)loadAttendanceMonth().catch(e=>notify(e.message,'bad'));
      if(isAdmin)loadAdminStats().catch(e=>notify(e.message,'bad'));
    }
    function attendanceFilters(){return{month:$('attendanceMonth')?.value||defaultAttendanceMonth(),brandId:$('attendanceBrand')?.value||'',prefix:String($('attendancePrefix')?.value||'').trim().toUpperCase(),role:String($('attendanceRole')?.value||'').trim().toLowerCase(),employee:String($('attendanceEmployee')?.value||'').trim().toLowerCase(),status:$('attendanceStatus')?.value||'',svrOnly:Boolean($('attendanceSvrOnly')?.checked)}}
    function attClass(day,row){const state=day?.state||'empty';const classes=['attCell',`att-${state==='workday'?'workday':state}`];if(String(row.role||'').toLowerCase()==='svr')classes.push('att-supervisor');return classes.join(' ')}
    function filteredAttendanceRows(){
      if(!attendanceData)return[];
      const f=attendanceFilters();
      return (attendanceData.rows||[]).filter(row=>{
        if(f.prefix&&!String(row.agentCode||'').toUpperCase().startsWith(f.prefix))return false;
        if(f.role&&!String(row.role||'').toLowerCase().includes(f.role))return false;
        if(f.employee&&!String(row.employeeName||'').toLowerCase().includes(f.employee))return false;
        if(f.status&&row.routeStatus!==f.status)return false;
        if(f.svrOnly&&String(row.role||'').toLowerCase()!=='svr')return false;
        return true;
      });
    }
    function activeAssignmentForCode(agentCode){
      const code=String(agentCode||'').toUpperCase();
      return (attendanceConfig.assignments||[]).find(a=>String(a.agentCode||'').toUpperCase()===code&&!a.endDate)||null;
    }
    function employeeById(id){return (attendanceConfig.employees||[]).find(e=>e.id===id)||null}
    function renderReplaceEmployeeSelect(){
      const sel=$('replaceEmployeeSelect');if(!sel)return;
      const currentCode=String($('replaceAgentCode')?.value||'').toUpperCase();
      const busy=new Map();
      (attendanceConfig.assignments||[]).forEach(a=>{if(!a.endDate&&String(a.agentCode||'').toUpperCase()!==currentCode)busy.set(a.employeeId,a.agentCode)});
      const active=(attendanceConfig.employees||[]).filter(e=>e.active!==false);
      sel.innerHTML='<option value="">Xodim tanlang</option>'+active.map(e=>`<option value="${escapeHtml(e.id)}" ${busy.has(e.id)?'disabled':''}>${escapeHtml(e.name||e.id)} (${escapeHtml(e.role||'agent')})${busy.has(e.id)?` - band: ${escapeHtml(busy.get(e.id))}`:''}</option>`).join('');
    }
    function toggleReplaceNewFields(){
      const create=Boolean($('replaceCreateNew')?.checked);
      document.querySelectorAll('.replaceNewOnly').forEach(el=>el.classList.toggle('hidden',!create));
      if($('replaceEmployeeSelect'))$('replaceEmployeeSelect').disabled=create;
    }
    function setReplaceMessage(text,type=''){
      const el=$('replaceMessage');if(!el)return;
      el.textContent=text;
      el.className=`attendanceReplaceMessage ${type}`;
    }
    async function openReplaceEmployeeModal(row=null){
      try{await loadAttendanceConfig()}catch(e){notify(e.message,'bad')}
      const modal=$('attendanceReplaceModal');if(!modal)return;
      const month=attendanceFilters().month;
      const code=row?.agentCode||$('attendancePrefix')?.value||'';
      const active=activeAssignmentForCode(code);
      const activeEmployee=employeeById(active?.employeeId);
      $('replaceAgentCode').value=code;
      renderReplaceEmployeeSelect();
      $('replaceCurrentEmployee').value=activeEmployee?.name||row?.employeeName||'Active assignment topilmadi';
      $('replaceOldEndDate').value=active?.endDate||cleanDate(dataset?.date)||`${month}-01`;
      if(!$('replaceOldEndDate').value||$('replaceOldEndDate').value.endsWith('-01'))$('replaceOldEndDate').value=cleanDate(dataset?.date)||`${month}-01`;
      $('replaceNewStartDate').value=nextIsoDate($('replaceOldEndDate').value);
      $('replaceEmployeeSelect').value='';
      $('replaceCreateNew').checked=true;
      $('replaceNewName').value='';
      $('replaceNewPhone').value='';
      $('replaceNewRole').value='agent';
      $('replaceNewNotes').value='';
      $('replaceReason').value='Yangi xodim olindi';
      setReplaceMessage(active?`Active assignment yopiladi: ${active.employeeId}`:'Active assignment topilmadi. Yangi assignment ochiladi.','');
      toggleReplaceNewFields();
      modal.classList.add('open');
      $('replaceAgentCode').focus();
    }
    function closeReplaceEmployeeModal(){$('attendanceReplaceModal')?.classList.remove('open')}
    function replacementPayload(){
      const createNew=Boolean($('replaceCreateNew')?.checked);
      const payload={agentCode:$('replaceAgentCode').value.trim(),oldEmployeeEndDate:$('replaceOldEndDate').value,newStartDate:$('replaceNewStartDate').value,reason:$('replaceReason').value.trim(),brandId:$('attendanceBrand')?.value||''};
      if(createNew){
        payload.newEmployee={name:$('replaceNewName').value.trim(),phone:$('replaceNewPhone').value.trim(),role:$('replaceNewRole').value,notes:$('replaceNewNotes').value.trim()};
      }else{
        payload.newEmployeeId=$('replaceEmployeeSelect').value;
      }
      return payload;
    }
    function validateReplacementPayload(payload){
      document.querySelectorAll('.attendanceReplaceGrid .invalidField').forEach(el=>el.classList.remove('invalidField'));
      const mark=id=>$(id)?.classList.add('invalidField');
      if(!payload.agentCode)return'Agent kodi kiritilmagan';
      if(!validIsoDate(payload.oldEmployeeEndDate)){mark('replaceOldEndDate');return"Eski xodim oxirgi ish kuni noto'g'ri"}
      if(!validIsoDate(payload.newStartDate)){mark('replaceNewStartDate');return"Yangi xodim boshlanish sanasi noto'g'ri"}
      if(new Date(payload.newStartDate)<=new Date(payload.oldEmployeeEndDate)){mark('replaceNewStartDate');return"Yangi boshlanish sanasi eski oxirgi kundan keyin bo'lishi kerak"}
      if(payload.newEmployee){
        if(!payload.newEmployee.name){mark('replaceNewName');return'Yangi xodim ismini kiriting'}
      }else if(!payload.newEmployeeId){mark('replaceEmployeeSelect');return'Mavjud xodimni tanlang yoki yangi xodim yarating'}
      return'';
    }
    function attendanceMetaHtml(rows){
      const totals=attendanceData.summaryTotals||{};
      const filtered=rows.reduce((sum,row)=>{
        sum.workDays+=Number(row.summary?.workDays||0);
        sum.lowPhotoDays+=Number(row.summary?.lowPhotoDays||0);
        sum.specialDays+=Number(row.summary?.specialDays||0);
        sum.penaltyCount+=Number(row.summary?.penaltyCount||0);
        if(row.routeStatus==='assigned')sum.assignedRows+=1;
        else if(row.routeStatus==='vacant')sum.vacantRows+=1;
        else if(row.routeStatus==='unknown_route')sum.unknownRows+=1;
        return sum;
      },{workDays:0,lowPhotoDays:0,specialDays:0,penaltyCount:0,assignedRows:0,vacantRows:0,unknownRows:0});
      const validation=attendanceData.validation||attendanceConfig.validation||{};
      const quality=attendanceData.dataQuality||{};
      const warnings=[...(validation.warnings||[])];
      if(quality.missingRoutes?.length)warnings.push(`Yo'nalishsiz qatorlar: ${quality.missingRoutes.length}`);
      const cards=[
        ['Oy',attendanceData.month],
        ['Brend',attendanceData.brand?.name||attendanceData.brandId||'Barcha brendlar'],
        ['Qatorlar',`${rows.length}/${attendanceData.rows.length}`],
        ['Biriktirilgan',`${filtered.assignedRows}/${totals.assignedRows??0}`],
        ["Bo'sh",filtered.vacantRows],
        ["Yo'nalishsiz",filtered.unknownRows],
        ['Ish kuni',filtered.workDays],
        ['Kam foto',filtered.lowPhotoDays],
        ['Sababli',filtered.specialDays],
        ['Shtraf',filtered.penaltyCount],
      ];
      return `<div class="attendanceMetaGrid">${cards.map(([label,value])=>`<div class="attendanceMetric"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('')}</div><div class="attendanceMetaFoot"><span>Yaratilgan: ${escapeHtml(attendanceData.generatedAt||'-')}</span>${warnings.length?`<span class="attendanceWarning">${escapeHtml(warnings.join('; '))}</span>`:''}</div>`;
    }
    function renderAttendance(){
      const table=$('attendanceTable');if(!table||!attendanceData)return;
      const rows=filteredAttendanceRows();
      const dayCount=new Date(Number(attendanceData.month.slice(0,4)),Number(attendanceData.month.slice(5,7)),0).getDate();
      $('attendanceMeta').innerHTML=attendanceMetaHtml(rows);
      const head=['Kod','Xodim','Lavozim','Brend','Amal',...Array.from({length:dayCount},(_,i)=>String(i+1)),'Foto kamligi','Sababli','Shtraf','Ish kuni'];
      const thead=`<thead><tr>${head.map((h,i)=>`<th class="${i===0?'stickyCol':i===1?'stickyCol2':''}">${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
      const body=rows.map(row=>{
        const days=Array.from({length:dayCount},(_,i)=>{
          const day=row.days.find(d=>d.day===i+1)||{date:`${attendanceData.month}-${String(i+1).padStart(2,'0')}`,finalValue:'',state:row.isVacant?'vacant':'empty'};
          const value=day.finalValue??'';
          const title=[`Auto: ${day.autoValue??''}`,day.manualValue!=null?`Manual: ${day.manualValue}`:'',day.reason?`Izoh: ${day.reason}`:'',`Foto: ${day.photoCount??''}`,`Savdo: ${day.salesAmount??''}`].filter(Boolean).join(' | ');
          return `<td><div class="${attClass(day,row)}" contenteditable="${row.isVacant?'false':'true'}" data-date="${escapeHtml(day.date)}" data-agent="${escapeHtml(row.agentCode)}" data-employee="${escapeHtml(row.employeeId||'')}" data-brand="${escapeHtml(attendanceData.brandId||'')}" data-original="${escapeHtml(value)}" title="${escapeHtml(title)}">${escapeHtml(value)}</div></td>`;
        }).join('');
        return `<tr><td class="stickyCol"><b>${escapeHtml(row.agentCode)}</b><div class="routeStatus ${escapeHtml(row.routeStatus)}">${escapeHtml(row.routeStatus)}</div></td><td class="stickyCol2">${escapeHtml(row.employeeName)}</td><td>${escapeHtml(row.role)}</td><td>${escapeHtml(row.brandId)}</td><td><button class="attActionBtn" data-replace-row="${escapeHtml(row.agentCode)}">Almashtirish</button></td>${days}<td class="attendanceSummary">${row.summary.lowPhotoDays}</td><td class="attendanceSummary">${row.summary.specialDays}</td><td class="attendanceSummary">${row.summary.penaltyCount}</td><td class="attendanceSummary">${row.summary.workDays}</td></tr>`;
      }).join('');
      table.innerHTML=thead+`<tbody>${body||'<tr><td colspan="40">Tabel qatori topilmadi</td></tr>'}</tbody>`;
      table.querySelectorAll('[data-replace-row]').forEach(btn=>{
        const row=rows.find(r=>r.agentCode===btn.dataset.replaceRow);
        btn.onclick=()=>openReplaceEmployeeModal(row);
      });
      table.querySelectorAll('.attCell[contenteditable="true"]').forEach(cell=>{
        cell.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();cell.blur()}};
        cell.oninput=()=>cell.classList.toggle('invalid',!attendanceValueLooksValid(cell.textContent));
        cell.onblur=()=>saveAttendanceCell(cell);
      });
    }
    async function loadAttendanceMonth(generate=false){
      uiState.render($('attendanceMeta'),generate?'Tabel yaratilmoqda':'Tabel yuklanmoqda','Oy va brend bo‘yicha ma’lumotlar tayyorlanmoqda.',{type:'loading',compact:true});
      if($('attendanceTable'))$('attendanceTable').innerHTML='';
      try{
        if(!(brandConfig.brands||[]).length)await loadBrands();
        await loadAttendanceConfig(generate);
        const f=attendanceFilters();
        const cacheKey=attendanceCacheKey(f.month,f.brandId);
        const cached=attendanceMonthCache.get(cacheKey);
        if(!generate&&cached&&Date.now()-cached.at<ATTENDANCE_CACHE_MS){
          attendanceData=cached.data;
          renderAttendance();
          return attendanceData;
        }
        const data=generate
          ?await dataTools.postJson('/api/attendance/generate',{month:f.month,brandId:f.brandId},{timeout:60000})
          :await dataTools.getJson(`/api/attendance/month?month=${encodeURIComponent(f.month)}&brandId=${encodeURIComponent(f.brandId)}`,{timeout:30000});
        if(generate)await loadAttendanceConfig(true);
        attendanceData=data;
        attendanceMonthCache.set(cacheKey,{data,at:Date.now()});
        renderAttendance();
        return data;
      }catch(error){
        uiState.render($('attendanceMeta'),'Tabel ochilmadi',error.message||'Server bilan aloqa xatosi.',{type:'error',compact:true});
        throw error;
      }
    }
    async function saveAttendanceCell(cell){
      const value=cell.textContent.trim();
      if(value===(cell.dataset.original||''))return;
      if(!attendanceValueLooksValid(value)){
        cell.classList.add('invalid');
        cell.textContent=cell.dataset.original||'';
        notify('Qiymat faqat son, bo‘sh yoki 19s ko‘rinishida bo‘lishi mumkin','bad');
        setTimeout(()=>cell.classList.remove('invalid'),1200);
        return;
      }
      try{
        cell.classList.add('saving');
        cell.setAttribute('contenteditable','false');
        const res=await fetch('/api/attendance/override',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:cell.dataset.date,agentCode:cell.dataset.agent,employeeId:cell.dataset.employee||null,brandId:cell.dataset.brand||$('attendanceBrand')?.value||'',manualValue:value,reason:value?'Manual tabel tahriri':'Manual qiymat tozalandi',updatedBy:'local-user'})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
        invalidateAttendanceCache(attendanceFilters().month,attendanceFilters().brandId);
        attendanceData=data.month;
        renderAttendance();
        notify('Tabel qiymati saqlandi');
      }catch(e){cell.textContent=cell.dataset.original||'';cell.classList.remove('saving');cell.setAttribute('contenteditable','true');notify(e.message,'bad')}
    }
    async function replaceAttendanceEmployee(){
      const payload=replacementPayload();
      const validation=validateReplacementPayload(payload);
      if(validation){setReplaceMessage(validation,'bad');return}
      const btn=$('attendanceReplaceSave');
      btn.disabled=true;btn.classList.add('loading');btn.textContent='Saqlanmoqda...';
      try{
        const res=await fetch('/api/attendance/assignments/replace-employee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const data=await res.json().catch(()=>({}));
        if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
        invalidateAttendanceCache(attendanceFilters().month,attendanceFilters().brandId);
        setReplaceMessage('Xodim assignment orqali almashtirildi','ok');
        notify('Xodim assignment orqali almashtirildi');
        await loadAttendanceConfig(true);
        await loadAttendanceMonth(true);
        closeReplaceEmployeeModal();
      }finally{
        btn.disabled=false;btn.classList.remove('loading');btn.textContent='Saqlash';
      }
    }
    function exportAttendance(){const f=attendanceFilters();location.href=`/api/attendance/export?month=${encodeURIComponent(f.month)}&brandId=${encodeURIComponent(f.brandId)}`}
    let collectTimer=null,collectLastDone='';
    function yesterday(){
      const d=new Date();
      d.setDate(d.getDate()-1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    function collectLabel(status){
      return {
        idle:'Tayyor',
        starting:'Login qilinmoqda',
        waiting_login:'Login kutilmoqda',
        waiting_dashboard:'Sales tayyorligini kutyapti',
        preparing:'Tayyorlanmoqda',
        collecting:"Yig'ilyapti",
        waiting_close:'Yakunlanmoqda',
        stopping:"To'xtatilmoqda",
        done:'Tugadi',
        failed:'Xatolik bilan yakunlandi',
        error:'Xato'
      }[status]||status||'Tayyor';
    }
    function renderCollect(state){
      const s=state||{};
      const running=!!s.running;
      const status=s.status||'idle';
      systemHealth.collect=running?'running':(['failed','error'].includes(status)?'error':(status==='done'?'done':'idle'));
      renderSystemStatus();
      const waiting=!!s.awaiting;
      $('collectStatusTitle').textContent=collectLabel(status);
      let collectText=running
        ? `${s.date||''} | ${s.brand||''}${s.pid?` | PID ${s.pid}`:''}`
        : (s.finishedAt?`Oxirgi holat: ${collectLabel(status)}${s.outputFile?` | ${s.outputFile.split(/[\\/]/).pop()}`:''}`:"Sanani va brendni tanlab boshlang.");
      if(status==='waiting_login'){
        collectText="Sales login ma'lumotlari to'g'ri emas yoki muddati o'tgan. .env.local dagi SALES_USERNAME/SALES_PASSWORD ni tekshirib qayta urinib ko'ring.";
      }
      $('collectStatusText').textContent=collectText;
      $('collectStart').disabled=running;
      $('collectStop').disabled=!running;
      $('collectBadge').textContent=status;
      $('collectBadge').className=`collectBadge ${running?'busy':(status==='done'?'done':(['failed','error'].includes(status)?'badState':''))}`;
      const logLines=s.logs||[];
      const logs=logLines.join('\n');
      // Rangli log qatorlari
      $('collectLog').innerHTML=logLines.length?logLines.map(raw=>{
        const t=escapeHtml(raw);
        let cls='clLine';
        if(/^\s*===|TUGADI/.test(raw))cls+=' clHead';
        else if(/\[perf\]/.test(raw))cls+=' clDim';
        else if(/xato|failed|error|Xatolik|noto'g'ri/i.test(raw))cls+=' clBad';
        else if(/muvaffaqiyat|Manifest|token olindi|\(ok,/i.test(raw))cls+=' clOk';
        else if(/Login|rejim:|boshlandi/i.test(raw))cls+=' clInfo';
        return `<span class="${cls}">${t}</span>`;
      }).join('\n'):"Log hali yo'q.";
      $('collectLog').scrollTop=$('collectLog').scrollHeight;
      // Progress bar (yig'ilyapti)
      const prog=$('collectProgress');
      if(prog){
        let dn=0,tot=0;
        for(const ln of logLines){const m=/(\d+)\s*\/\s*(\d+)\s+agent/.exec(ln);if(m){dn=+m[1];tot=+m[2];}}
        if(running&&tot>0){
          const pct=Math.min(100,Math.round(dn/tot*100));
          prog.hidden=false;
          $('collectProgressFill').style.width=pct+'%';
          $('collectProgressText').textContent=`${dn} / ${tot} agent`;
          $('collectProgressPct').textContent=pct+'%';
        }else prog.hidden=true;
      }
      // Yakuniy statistika plitalari (tugadi)
      const summary=$('collectSummary');
      if(summary){
        const g=re=>{const m=re.exec(logs);return m?m[1]:null;};
        const agentlar=g(/Agentlar:\s*(\d+)/), fotoli=g(/Fotoli:\s*(\d+)/), url=g(/Jami URL:\s*(\d+)/);
        if(status==='done'&&(agentlar||url)){
          const ok=g(/\bok:\s*(\d+)/), partial=g(/partial:\s*(\d+)/), err=g(/\berror:\s*(\d+)/), secs=g(/TUGADI\s*\(([\d.]+)s\)/);
          const tile=(label,val,cls='')=>`<div class="ctile ${cls}"><b>${escapeHtml(val??'—')}</b><span>${escapeHtml(label)}</span></div>`;
          summary.innerHTML=
            tile('Agentlar',agentlar)+
            tile('Fotoli',fotoli)+
            tile('Jami foto',url,'ctileAccent')+
            tile('OK',ok,'ctileOk')+
            tile('Qisman',partial,(partial&&+partial>0)?'ctileWarn':'')+
            tile('Xato',err,(err&&+err>0)?'ctileBad':'')+
            (secs?`<div class="ctile ctileTime"><b>${escapeHtml(secs)}s</b><span>Vaqt</span></div>`:'');
          summary.hidden=false;
        }else summary.hidden=true;
      }
      if(status==='done'&&s.finishedAt&&collectLastDone!==s.finishedAt){
        collectLastDone=s.finishedAt;
        notify("Ma'lumot yig'ish tugadi, ro'yxat yangilanmoqda");
        loadManifest().catch(()=>{});
      }
    }
    async function refreshCollectStatus(){
      try{
        const data=await dataTools.getJson('/api/collect/status?'+Date.now(),{timeout:10000});
        renderCollect(data.collect);
      }catch(e){
        $('collectStatusTitle').textContent='Server bilan aloqa yoq';
        $('collectStatusText').textContent=e.message;
      }
    }
    function openCollect(opts={}){
      const requestedDate=cleanDate(opts.date)||cleanDate(dateSel?.value)||cleanDate(dataset?.date)||yesterday();
      const requestedBrand=opts.brand||brandSel?.value||dataset?.brand?.id||currentBrand();
      $('collectDate').value=requestedDate;
      if(!(brandConfig.brands||[]).length)loadBrands().then(()=>{renderCollectBrands();if($('collectBrand')&&requestedBrand)$('collectBrand').value=requestedBrand}).catch(()=>{});
      else renderCollectBrands();
      if($('collectBrand')&&requestedBrand)$('collectBrand').value=requestedBrand;
      switchView('collect');
      refreshCollectStatus();
      clearInterval(collectTimer);
      collectTimer=setInterval(refreshCollectStatus,1200);
    }
    function closeCollect(){
      $('collectPanel').classList.remove('open');
      clearInterval(collectTimer);
      collectTimer=null;
      if(currentView==='collect')switchView('photo');
    }
    async function collectAction(path,body=null){
      const data=await dataTools.postJson(path,body||{},{timeout:15000});
      renderCollect(data.collect);
      return data.collect;
    }
    async function startCollect(){
      const date=$('collectDate').value;
      const brand=$('collectBrand').value;
      if(!date){notify('Sana tanlanmagan','bad');return}
      if(!brand){notify('Brend tanlanmagan','bad');return}
      const brandText=$('collectBrand').selectedOptions[0]?.textContent||brandDisplayName(brandById(brand))||brand;
      if(!confirm(`${date} sanasi uchun ${brandText} ma'lumot yig'ilsinmi?\n\nBrauzersiz — to'g'ridan-to'g'ri Sales API orqali. Login/parol hech qayerga saqlanmaydi.`))return;
      try{
        await collectAction('/api/collect/start',{date,brand,browserHint:isPublicView()?'':(navigator.userAgent||'')});
        notify("Yig'ish boshlandi (brauzersiz).");
      }catch(e){notify(e.message,'bad')}
    }
    async function stopCollect(){
      if(!confirm("Ma'lumot yig'ishni to'xtatamizmi? Saqlanmagan qism yo'qolishi mumkin."))return;
      try{
        await collectAction('/api/collect/stop');
        notify("To'xtatish so'rovi yuborildi");
      }catch(e){notify(e.message,'bad')}
    }
    document.addEventListener('click',e=>{
      if(!document.body.classList.contains('filtersOpen'))return;
      if(e.target?.closest?.('#reviewFilters,#filterToggleBtn'))return;
      setPhotoFiltersOpen(false);
    });
    window.addEventListener('keydown',e=>{
      if(e.key==='Escape'){setPhotoFiltersOpen(false);closeModal();closeMinusList();closeAutoReview();closeDeleteConfirm();closeCollect();closeBrandSettings();closeReplaceEmployeeModal();return}
      if(e.code==='Space'||e.key===' '){
        if(isEditableTarget(e.target))return;
        e.preventDefault();
        e.stopPropagation();
        if(!canUseSpaceForPause())return;
        togglePause();
        return;
      }
      if(!reviewNavigationReady())return;
      if(e.key==='ArrowRight')move(1);
      if(e.key==='ArrowLeft')move(-1);
    });
    let wheelNavAt=0;
    window.addEventListener('wheel',e=>{
      if(!e.target?.closest?.('#grid'))return;
      if(!reviewNavigationReady(true))return;
      if(Math.abs(e.deltaY)<8)return;
      e.preventDefault();
      const now=Date.now();
      if(now-wheelNavAt<160)return;
      move(e.deltaY>0?1:-1);
      wheelNavAt=now;
    },{passive:false});
    window.addEventListener('load',()=>{
      $('systemStatusBtn')?.addEventListener('click',()=>toggleSystemStatus());
      $('systemStatusClose')?.addEventListener('click',()=>toggleSystemStatus(false));
      $('systemStatusBackdrop')?.addEventListener('click',()=>toggleSystemStatus(false));
      $('systemStatusRefresh')?.addEventListener('click',refreshSystemStatusCenter);
      window.addEventListener('online',()=>{setSystemSyncState('syncing','Qayta ulanmoqda...');syncSharedState(false)});
      window.addEventListener('offline',renderSystemStatus);
      $('nextUncheckedBtn')?.addEventListener('click',openNextUnchecked);
      $('undoReviewBtn')?.addEventListener('click',undoLastReview);
      renderSystemStatus();
      const filterToggle=$('filterToggleBtn');
      if(filterToggle)filterToggle.onclick=togglePhotoFilters;
      const filterClose=$('filterCloseBtn');
      if(filterClose)filterClose.onclick=()=>setPhotoFiltersOpen(false);
      const filterBackdrop=$('filterBackdrop');
      if(filterBackdrop)filterBackdrop.onclick=()=>setPhotoFiltersOpen(false);
    });
    window.addEventListener('load',()=>{applyTheme();brandSel=$('brandSel');dateSel=$('dateSel');agentSel=$('agentSel');if(brandSel)brandSel.onchange=()=>{localStorage.setItem(LS_BRAND,brandSel.value||'');renderDateFilter();loadSelectedDataset().catch(e=>notify(e.message,'bad'))};dateSel.onchange=()=>loadSelectedDataset().catch(e=>notify(e.message,'bad'));agentSel.onchange=()=>{agentIndex=Number(agentSel.value);start=0;render()};$('quickNext').onclick=()=>move(1);$('quickPrev').onclick=()=>move(-1);$('quickPause').onclick=togglePause;$('photoPageSize').onchange=e=>setPhotoPageSize(e.target.value);$('photoPageSize').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();setPhotoPageSize(e.target.value);e.target.blur()}};$('showAllPhotos').onclick=()=>setPhotoPageSize('all');$('speedSlower').onclick=()=>adjustSpeed(-500);$('speedFaster').onclick=()=>adjustSpeed(500);$('minusListBtn').onclick=()=>showList();$('telegramBtn').onclick=sendTelegram;$('csvBtn').onclick=csv;$('agentExcelBtn').onclick=agentExcel;$('autoReviewBtn').onclick=runAutoReview;if($('themeToggleBtn'))$('themeToggleBtn').onclick=toggleTheme;if($('sidePhotoBtn'))$('sidePhotoBtn').onclick=()=>switchView('photo');if($('sideAttendanceBtn'))$('sideAttendanceBtn').onclick=()=>switchView('attendance');$('sideMinusListBtn').onclick=()=>showList();$('sideCsvBtn').onclick=csv;$('sideAgentExcelBtn').onclick=agentExcel;$('sideCollectBtn').onclick=()=>openCollect();$('sideBrandSettingsBtn').onclick=openBrandSettings;if($('sideAdminStatsBtn'))$('sideAdminStatsBtn').onclick=()=>switchView('admin');$('sideAutoReviewBtn').onclick=runAutoReview;$('autoReviewClose').onclick=closeAutoReview;$('collectClose').onclick=closeCollect;if($('sectionCloseBtn'))$('sectionCloseBtn').onclick=closeCollect;$('collectStart').onclick=startCollect;$('collectStop').onclick=stopCollect;$('brandClose').onclick=closeBrandSettings;$('brandNew').onclick=()=>fillBrandForm();$('brandSave').onclick=async()=>{try{await saveBrandSettings()}catch(e){notify(e.message,'bad')}};$('brandDelete').onclick=async()=>{try{await deleteBrandSetting()}catch(e){notify(e.message,'bad')}};if($('brandValidate'))$('brandValidate').onclick=validateBrandSettings;if($('brandExport'))$('brandExport').onclick=exportBrandSettings;if($('brandImport'))$('brandImport').onchange=e=>importBrandSettings(e.target.files?.[0]).catch(err=>notify(err.message,'bad'));if($('brandTelegramChat'))$('brandTelegramChat').onchange=()=>{if($('brandTelegramChat')?.value&&$('brandTelegramChatId'))$('brandTelegramChatId').value=''};if($('brandTelegramChatId'))$('brandTelegramChatId').oninput=()=>{if($('brandTelegramChatId')?.value.trim()&&$('brandTelegramChat'))$('brandTelegramChat').value=''};$('agentFilter').onchange=applyAgentFilter;$('deleteDateBtn').onclick=deleteCurrentDate;$('deleteCancel').onclick=closeDeleteConfirm;$('deleteConfirmBtn').onclick=performDeleteCurrentDate;$('deleteConfirm').onclick=e=>{if(e.target.id==='deleteConfirm')closeDeleteConfirm()};$('modalClose').onclick=closeModal;$('modalMinus').onclick=()=>setMark('MINUS');$('modalOk').onclick=()=>setMark('OK');$('sideMinus').onclick=()=>setMark('MINUS');$('sideOk').onclick=()=>setMark('OK');$('addReason').onclick=addReason;$('newReason').onkeydown=e=>{if(e.key==='Enter')addReason()};$('zoomIn').onclick=()=>{$('modalImg').style.transform=`scale(${zoom=Math.min(3,zoom+.15)})`};$('zoomOut').onclick=()=>{$('modalImg').style.transform=`scale(${zoom=Math.max(.35,zoom-.15)})`};$('zoomFit').onclick=()=>{$('modalImg').style.transform=`scale(${zoom=1})`};$('listClose').onclick=closeMinusList;updatePauseButtons();renderSpeed();restartTimer();loadTelegramStatus();refreshCollectStatus();loadManifest().then(()=>{startSharedSync();if(location.hash==='#minus')showList()}).catch(e=>{$('meta').textContent='Xato: '+e.message})});
    window.addEventListener('load',()=>{
      if($('attendanceMonth'))$('attendanceMonth').value=defaultAttendanceMonth();
      if($('adminStatsRefresh'))$('adminStatsRefresh').onclick=()=>loadAdminStats(true).catch(e=>notify(e.message,'bad'));
      if($('attendanceLoad'))$('attendanceLoad').onclick=()=>loadAttendanceMonth().catch(e=>notify(e.message,'bad'));
      if($('attendanceGenerate'))$('attendanceGenerate').onclick=()=>loadAttendanceMonth(true).catch(e=>notify(e.message,'bad'));
      if($('attendanceExport'))$('attendanceExport').onclick=exportAttendance;
      if($('attendanceReplace'))$('attendanceReplace').onclick=()=>openReplaceEmployeeModal();
      if($('attendanceReplaceClose'))$('attendanceReplaceClose').onclick=closeReplaceEmployeeModal;
      if($('attendanceReplaceCancel'))$('attendanceReplaceCancel').onclick=closeReplaceEmployeeModal;
      if($('attendanceReplaceModal'))$('attendanceReplaceModal').onclick=e=>{if(e.target.id==='attendanceReplaceModal')closeReplaceEmployeeModal()};
      if($('attendanceReplaceSave'))$('attendanceReplaceSave').onclick=()=>replaceAttendanceEmployee().catch(e=>{setReplaceMessage(e.message,'bad');notify(e.message,'bad')});
      if($('replaceOldEndDate'))$('replaceOldEndDate').onchange=()=>{$('replaceNewStartDate').value=nextIsoDate($('replaceOldEndDate').value)};
      if($('replaceAgentCode'))$('replaceAgentCode').oninput=renderReplaceEmployeeSelect;
      if($('replaceCreateNew'))$('replaceCreateNew').onchange=toggleReplaceNewFields;
      if($('replaceEmployeeSelect'))$('replaceEmployeeSelect').onchange=()=>{if($('replaceEmployeeSelect').value){$('replaceCreateNew').checked=false;toggleReplaceNewFields()}};
      ['attendancePrefix','attendanceRole','attendanceEmployee','attendanceStatus','attendanceSvrOnly'].forEach(id=>{if($(id))$(id).oninput=scheduleAttendanceRender});
      if($('attendanceBrand'))$('attendanceBrand').onchange=()=>loadAttendanceMonth(true).catch(e=>notify(e.message,'bad'));
      if($('attendanceMonth'))$('attendanceMonth').onchange=()=>loadAttendanceMonth().catch(e=>notify(e.message,'bad'));
    });
