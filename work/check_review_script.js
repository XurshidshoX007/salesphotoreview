
    const LS_MARKS='lmjDateReviewMarksV2',LS_REASONS='lmjCustomReasonsV2',LS_DATE='lmjSelectedDateV2';
    const defaultReasons=['Ish vaqtidan tashqari olingan foto','Kamera yopilgan yoki to\'sib olingan foto','Bitta do\'kondan takroriy foto','Ekrandan qayta olingan foto','Faqat mahsulot rasmi','Foto talabga javob bermaydi'];
    let manifest={datasets:[]},dataset=null,agents=[],dateSel,agentSel,ai=0,start=0,paused=true,timer=null,delay=3500,current=null,zoom=1;
    let marks=JSON.parse(localStorage.getItem(LS_MARKS)||'{}'),customReasons=JSON.parse(localStorage.getItem(LS_REASONS)||'[]');
    const $=id=>document.getElementById(id);
    function key(a,p){return `${dataset.date}#${a.code}#${p.id}`}
    function saveMarks(){localStorage.setItem(LS_MARKS,JSON.stringify(marks))}
    function photoDate(p){return (p.photoTime||dataset?.date||'').slice(0,10)}
    function photoClock(p){const m=(p.photoTime||'').match(/(\d{2}):(\d{2})/);return m?`${m[1]}:${m[2]}`:''}
    function isAfterHours(p){const t=photoClock(p);return !!t&&(t<'08:00'||t>'17:30')}
    function duplicate(a,p){return a.photos.filter(x=>x.url===p.url).length>1}
    function shortReason(r){return r.replace('Ish vaqtidan tashqari olingan foto','Ish vaqtidan tashqari').replace('Kamera yopilgan yoki to\'sib olingan foto','Kamera yopilgan')}
    function normalize(raw){
      const source=raw.agents||raw.rows||[];
      return source.map((a,agentIndex)=>{
        const code=a.code||`AGENT${agentIndex+1}`;
        const parsedSum=String(a.rowText||a.text||'').match(/LMJ\S+\s+([0-9\s.,]+)/)?.[1]?.replace(/[^\d.]/g,'')||0;
        const orderSum=Number(a.orderSum??a.sum??parsedSum);
        const photos=[];
        if(Array.isArray(a.photos)){
          a.photos.forEach((row,rowIndex)=>(row.urls||[]).forEach((url,uIndex)=>photos.push({id:`r${rowIndex+1}_${uIndex+1}`,url,client:row.client||'',clientId:row.clientId||'',category:row.photoCategory||row.category||'',territory:row.territory||'',photoTime:row.photoTime||'',row:row.row||rowIndex+1})));
        }else{
          (a.urls||[]).forEach((url,i)=>photos.push({id:`p${i+1}`,url,client:'',clientId:'',category:'',territory:'',photoTime:'',row:i+1}));
        }
        const m=code.match(/^([A-Z]+)(\d+)/i);
        return {code,agent:a.agent||a.modalTitle||code,orderSum,group:m?m[1]:code,tail:m?Number(m[2]):999,photos,expectedPhotos:a.expectedPhotos||photos.length,collectStatus:a.status||'ok',duplicateOf:a.duplicateOf||''};
      })
      .filter(a=>a.collectStatus!=='duplicate'&&a.collectStatus!=='error')
      .filter(a=>a.photos.length>0)
      .filter(a=>!a.expectedPhotos||a.photos.length===a.expectedPhotos)
      .sort((a,b)=>a.group.localeCompare(b.group)||a.orderSum-b.orderSum||a.tail-b.tail||a.code.localeCompare(b.code));
    }
    async function loadManifest(){
      const res=await fetch('lmj_review_datasets.json?'+Date.now());
      manifest=await res.json();
      dateSel.innerHTML='';
      manifest.datasets.forEach(d=>dateSel.add(new Option(d.date,d.date)));
      const saved=localStorage.getItem(LS_DATE);
      dateSel.value=manifest.datasets.some(d=>d.date===saved)?saved:(manifest.datasets.at(-1)?.date||dateSel.value);
      await loadDate(dateSel.value);
    }
    async function loadDate(date){
      localStorage.setItem(LS_DATE,date);
      const item=manifest.datasets.find(d=>d.date===date);
      if(!item) return;
      dataset=await (await fetch(item.file+'?'+Date.now())).json();
      const all=dataset.agents||dataset.rows||[];
      const bad=all.filter(a=>a.status==='duplicate'||a.status==='error'||(a.expectedPhotos&&a.actualUrls&&a.actualUrls!==a.expectedPhotos));
      agents=normalize(dataset);
      ai=0;start=0;
      if(bad.length){
        $('meta').textContent=`${date}: ${agents.length} agent ko'rinmoqda, ${bad.length} ta yig'ilish xatosi yashirildi (Sales'dan qayta yig'ing).`;
      }
      rebuildAgents();render();
    }
    function rebuildAgents(){
      agentSel.innerHTML='';
      agents.forEach((a,i)=>{
        const minus=Object.values(marks).filter(m=>m.date===dataset.date&&m.code===a.code&&m.verdict==='MINUS').length;
        agentSel.add(new Option(`${a.code} | ${a.orderSum.toLocaleString('ru-RU')} | ${a.photos.length} foto${minus?` | -${minus}`:''}`,i));
      });
    }
    function render(){
      const a=agents[ai]; if(!a){$('grid').innerHTML='';return}
      agentSel.value=String(ai);
      const slice=a.photos.slice(start,start+4);
      $('title').textContent=`${a.code} | ${a.agent}`;
      $('meta').textContent=`${dataset.date} | ${start+1}-${Math.min(start+4,a.photos.length)} / ${a.photos.length} foto`;
      $('dateStats').textContent=`Agent: ${agents.length}, foto: ${agents.reduce((s,x)=>s+x.photos.length,0)}, minus: ${Object.values(marks).filter(m=>m.date===dataset.date&&m.verdict==='MINUS').length}`;
      $('agentStats').textContent=`Buyurtma summasi: ${a.orderSum.toLocaleString('ru-RU')} | minus: ${Object.values(marks).filter(m=>m.date===dataset.date&&m.code===a.code&&m.verdict==='MINUS').length}`;
      $('reasonLegend').innerHTML=[...defaultReasons,...customReasons].map((r,i)=>`${i+1}. ${r}`).join('<br>');
      $('grid').innerHTML=slice.map((p,offset)=>{
        const k=key(a,p),m=marks[k],warns=[];
        if(isAfterHours(p))warns.push('ish vaqtidan tashqari');
        if(duplicate(a,p))warns.push('dublikat');
        const time=photoClock(p)||'<span class="muted">vaqt yoq</span>';
        return `<div class="card ${m?.verdict==='MINUS'?'marked':''}" data-i="${start+offset}">
          <img src="${p.url}" loading="eager">
          <div class="cap"><b>${a.code} #${start+offset+1}</b><br>${p.client||''}<br>Vaqt: ${time}<br>${warns.length?`<span class="warn">${warns.join(', ')}</span>`:''}${m?.verdict==='MINUS'?'<br><span class="warn">MINUS</span>':''}</div>
        </div>`;
      }).join('');
      document.querySelectorAll('.card').forEach(card=>card.onclick=()=>openModal(Number(card.dataset.i)));
      preload();
    }
    function preload(){const a=agents[ai];if(!a)return;for(let i=start;i<Math.min(start+12,a.photos.length);i++){const img=new Image();img.src=a.photos[i].url}}
    function autoReasons(a,p){const r=[];if(isAfterHours(p))r.push(defaultReasons[0]);if(duplicate(a,p))r.push(defaultReasons[2]);return r}
    function renderChecks(selected=[]){
      $('reasonChecks').innerHTML=[...defaultReasons,...customReasons].map(r=>`<label class="reason"><input type="checkbox" value="${r.replaceAll('"','&quot;')}" ${selected.includes(r)?'checked':''}> <span>${shortReason(r)}</span></label>`).join('');
    }
    function openModal(index){
      const a=agents[ai],p=a.photos[index],m=marks[key(a,p)]||{};current={a,p,index};zoom=1;
      $('modalTitle').textContent=`${a.code} #${index+1} | ${p.client||''} | ${photoClock(p)||'vaqt yoq'}`;
      $('modalImg').src=p.url;$('modalImg').style.transform='scale(1)';
      $('note').value=m.note||'';renderChecks(m.reasons||autoReasons(a,p));$('modal').classList.add('open');paused=true;$('pauseBtn').textContent='Resume';
    }
    function closeModal(){$('modal').classList.remove('open')}
    function setMark(verdict){
      if(!current)return;const {a,p,index}=current;
      marks[key(a,p)]={date:dataset.date,code:a.code,agent:a.agent,photo:index+1,client:p.client||'',clientId:p.clientId||'',photoTime:p.photoTime||'',url:p.url,verdict,reasons:[...document.querySelectorAll('#reasonChecks input:checked')].map(x=>x.value),note:$('note').value.trim(),savedAt:new Date().toISOString()};
      saveMarks();rebuildAgents();render();closeModal();
    }
    function move(delta){const a=agents[ai];if(!a)return;start+=delta;if(start<0){if(ai>0){ai--;start=Math.max(0,agents[ai].photos.length-4)}else start=0}else if(start>=a.photos.length){if(ai<agents.length-1){ai++;start=0}else start=Math.max(0,a.photos.length-4)}render()}
    function exportRows(){return Object.values(marks).filter(m=>m.date===dataset.date&&m.verdict==='MINUS')}
    function csv(){
      const rows=exportRows(),head=['date','code','agent','photo','client','photoTime','reasons','note','url'];
      const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;
      const text=[head.join(','),...rows.map(r=>head.map(h=>esc(Array.isArray(r[h])?r[h].join('; '):r[h])).join(','))].join('\n');
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/csv'}));a.download=`lmj_minus_photos_${dataset.date}.csv`;a.click();
    }
    function showList(){const rows=exportRows();$('listBody').innerHTML=`<table><thead><tr><th>Agent</th><th>Foto</th><th>Klient</th><th>Sabab</th><th>Izoh</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.code}</td><td>${r.photo}</td><td>${r.client}</td><td>${(r.reasons||[]).join('; ')}</td><td>${r.note||''}</td></tr>`).join('')}</tbody></table>`;$('minusList').classList.add('open')}
    function addReason(){const v=$('newReason').value.trim();if(v&&!defaultReasons.includes(v)&&!customReasons.includes(v)){customReasons.push(v);localStorage.setItem(LS_REASONS,JSON.stringify(customReasons));renderChecks([...document.querySelectorAll('#reasonChecks input:checked')].map(x=>x.value).concat(v));$('newReason').value=''}}
    window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.key==='ArrowRight')move(4);if(e.key==='ArrowLeft')move(-4)});
    window.addEventListener('load',()=>{dateSel=$('dateSel');agentSel=$('agentSel');dateSel.onchange=()=>loadDate(dateSel.value);agentSel.onchange=()=>{ai=Number(agentSel.value);start=0;render()};$('nextBtn').onclick=()=>move(4);$('prevBtn').onclick=()=>move(-4);$('pauseBtn').onclick=()=>{paused=!paused;$('pauseBtn').textContent=paused?'Resume':'Pause'};$('minusListBtn').onclick=showList;$('csvBtn').onclick=csv;$('modalClose').onclick=closeModal;$('modalMinus').onclick=()=>setMark('MINUS');$('modalOk').onclick=()=>setMark('OK');$('sideMinus').onclick=()=>setMark('MINUS');$('sideOk').onclick=()=>setMark('OK');$('addReason').onclick=addReason;$('newReason').onkeydown=e=>{if(e.key==='Enter')addReason()};$('zoomIn').onclick=()=>{$('modalImg').style.transform=`scale(${zoom=Math.min(3,zoom+.15)})`};$('zoomOut').onclick=()=>{$('modalImg').style.transform=`scale(${zoom=Math.max(.35,zoom-.15)})`};$('zoomFit').onclick=()=>{$('modalImg').style.transform=`scale(${zoom=1})`};$('listClose').onclick=()=>$('minusList').classList.remove('open');timer=setInterval(()=>{if(!paused)move(4)},delay);loadManifest().catch(e=>{$('meta').textContent='Xato: '+e.message})});
  
