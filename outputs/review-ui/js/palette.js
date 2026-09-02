window.PhotoReviewPalette=(function(){
  'use strict';
  let overlay,input,body,footer,selectedIndex=0,results=[],isOpen=false;
  let getAgents,getMarks,getManifest,onSelectAgent,onSelectDate,onAction;

  function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

  function build(){
    if(overlay)return;
    overlay=document.createElement('div');
    overlay.className='palette-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`<div class="palette-box"><div class="palette-search"><span class="palette-searchIcon" aria-hidden="true"></span><input class="palette-input" type="text" placeholder="Agent, sana yoki amal qidirish..." autocomplete="off" spellcheck="false"><kbd class="palette-esc">Esc</kbd></div><div class="palette-body"></div><div class="palette-footer"><span>↑ ↓ tanlash</span><span>Enter ochish</span><span class="palette-footRight">? — barcha tugmalar</span></div></div>`;
    document.body.appendChild(overlay);
    input=overlay.querySelector('.palette-input');
    body=overlay.querySelector('.palette-body');
    footer=overlay.querySelector('.palette-footer');
    overlay.addEventListener('mousedown',e=>{if(e.target===overlay)close()});
    input.addEventListener('input',()=>{selectedIndex=0;renderResults()});
    input.addEventListener('keydown',onKey);
  }

  function open(opts){
    build();
    if(opts){
      getAgents=opts.getAgents||getAgents;
      getMarks=opts.getMarks||getMarks;
      getManifest=opts.getManifest||getManifest;
      onSelectAgent=opts.onSelectAgent||onSelectAgent;
      onSelectDate=opts.onSelectDate||onSelectDate;
      onAction=opts.onAction||onAction;
    }
    isOpen=true;
    input.value='';
    selectedIndex=0;
    overlay.setAttribute('aria-hidden','false');
    overlay.classList.add('open');
    renderResults();
    requestAnimationFrame(()=>input.focus());
  }

  function close(){
    if(!isOpen)return;
    isOpen=false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
  }

  function toggle(opts){isOpen?close():open(opts)}

  function onKey(e){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}
    if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();selectedIndex=Math.min(selectedIndex+1,results.length-1);highlightSelected();return}
    if(e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();selectedIndex=Math.max(selectedIndex-1,0);highlightSelected();return}
    if(e.key==='Enter'){e.preventDefault();e.stopPropagation();activateSelected();return}
  }

  function getActions(){
    return [
      {id:'nextUnchecked',label:"Keyingi tekshirilmagan fotoga o‘tish",hint:'Enter'},
      {id:'minusList',label:"Minus ro‘yxatini ochish",hint:''},
      {id:'attendance',label:'Tabelni ochish',hint:''},
      {id:'brandSettings',label:'Brend sozlamalari',hint:''},
      {id:'toggleTheme',label:'Tungi rejimga almashtirish',hint:''},
      {id:'export',label:'Excel eksport',hint:''}
    ];
  }

  function search(q){
    const query=q.trim().toLowerCase();
    const agentsList=getAgents?getAgents():[];
    const marksObj=getMarks?getMarks():{};
    const manifestObj=getManifest?getManifest():{datasets:[]};
    const items=[];

    const matchedAgents=[];
    for(let i=0;i<agentsList.length;i++){
      const a=agentsList[i];
      const searchable=`${a.code} ${a.agent||''}`.toLowerCase();
      if(!query||searchable.includes(query)){
        let unchecked=0;
        if(a.photos){
          for(const p of a.photos){
            const k=window._paletteKey?window._paletteKey(a,p):'';
            if(k&&!marksObj[k]?.verdict)unchecked++;
          }
        }
        matchedAgents.push({type:'agent',group:'Agentlar',code:a.code,agent:a.agent||a.code,unchecked,index:i,photos:a.photos?.length||0});
      }
      if(matchedAgents.length>=8)break;
    }
    items.push(...matchedAgents);

    const dates=[];
    const seen=new Set();
    for(const d of manifestObj.datasets||[]){
      const date=d.date||d._date||'';
      if(!date||seen.has(date))continue;
      seen.add(date);
      const label=formatDate(date);
      if(!query||date.includes(query)||label.toLowerCase().includes(query)){
        const photoCount=d.totalPhotos||d.photoCount||0;
        dates.push({type:'date',group:'Sana',date,label,photoCount});
      }
      if(dates.length>=5)break;
    }
    items.push(...dates);

    const actions=getActions();
    for(const act of actions){
      if(!query||act.label.toLowerCase().includes(query)){
        items.push({type:'action',group:'Amallar',...act});
      }
    }

    return items;
  }

  function formatDate(d){
    if(!d)return '';
    const parts=d.split('-');
    if(parts.length!==3)return d;
    const today=new Date();
    const target=new Date(parts[0],parts[1]-1,parts[2]);
    const diff=Math.round((today-target)/(1000*60*60*24));
    const formatted=`${parts[2]}.${parts[1]}.${parts[0]}`;
    if(diff===0)return `Bugun — ${formatted}`;
    if(diff===1)return `Kecha — ${formatted}`;
    if(diff===-1)return `Ertaga — ${formatted}`;
    return formatted;
  }

  function renderResults(){
    results=search(input.value);
    if(!results.length){
      body.innerHTML='<div class="palette-empty">Natija topilmadi</div>';
      return;
    }
    let html='',lastGroup='';
    results.forEach((r,i)=>{
      if(r.group!==lastGroup){
        lastGroup=r.group;
        html+=`<div class="palette-group">${escapeHtml(r.group)}</div>`;
      }
      const cls=i===selectedIndex?' selected':'';
      if(r.type==='agent'){
        html+=`<div class="palette-row${cls}" data-idx="${i}"><span class="palette-rowMain">${escapeHtml(r.code)} · ${escapeHtml(r.agent)}</span><span class="palette-rowHint">${r.unchecked?r.unchecked+' ta tekshirilmagan':r.photos+' foto'}</span></div>`;
      }else if(r.type==='date'){
        html+=`<div class="palette-row${cls}" data-idx="${i}"><span class="palette-rowMain">${escapeHtml(r.label)}</span><span class="palette-rowHint">${r.photoCount?r.photoCount+' foto':''}</span></div>`;
      }else if(r.type==='action'){
        html+=`<div class="palette-row${cls}" data-idx="${i}"><span class="palette-rowMain">${escapeHtml(r.label)}</span><span class="palette-rowHint">${r.hint||''}</span></div>`;
      }
    });
    body.innerHTML=html;
    body.querySelectorAll('.palette-row').forEach(row=>{
      row.addEventListener('mouseenter',()=>{selectedIndex=Number(row.dataset.idx);highlightSelected()});
      row.addEventListener('click',()=>{selectedIndex=Number(row.dataset.idx);activateSelected()});
    });
  }

  function highlightSelected(){
    body.querySelectorAll('.palette-row').forEach(el=>{
      el.classList.toggle('selected',Number(el.dataset.idx)===selectedIndex);
    });
    const sel=body.querySelector('.palette-row.selected');
    if(sel)sel.scrollIntoView({block:'nearest'});
  }

  function activateSelected(){
    const item=results[selectedIndex];
    if(!item)return;
    close();
    if(item.type==='agent'&&onSelectAgent)onSelectAgent(item.index);
    else if(item.type==='date'&&onSelectDate)onSelectDate(item.date);
    else if(item.type==='action'&&onAction)onAction(item.id);
  }

  return {open,close,toggle,isOpen:()=>isOpen};
})();
