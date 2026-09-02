window.PhotoReviewCompare=(function(){
  'use strict';
  let overlay,isOpen=false,pairs=[],pairIndex=0,overlayMode=false;
  let onMarkDuplicate,onDismiss,getKey,getMarks;

  function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

  function build(){
    if(overlay)return;
    overlay=document.createElement('div');
    overlay.className='compare-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`
      <div class="compare-head">
        <div class="compare-headLeft">
          <b class="compare-title">Takroriy shubhasi</b>
          <span class="compare-badge"></span>
          <span class="compare-counter"></span>
        </div>
        <div class="compare-headRight">
          <button class="compare-prevBtn" type="button">Oldingi juftlik</button>
          <button class="compare-nextBtn" type="button">Keyingi juftlik</button>
        </div>
      </div>
      <div class="compare-grid">
        <div class="compare-side compare-sideA">
          <div class="compare-label"></div>
          <div class="compare-imgWrap"><img class="compare-img" draggable="false"></div>
        </div>
        <div class="compare-side compare-sideB compare-suspect">
          <div class="compare-label"></div>
          <div class="compare-imgWrap"><img class="compare-img" draggable="false"></div>
        </div>
      </div>
      <div class="compare-foot">
        <div class="compare-footLeft">
          <span><kbd>C</kbd> taqqoslashni yopish</span>
          <span><kbd>Tab</kbd> ustma-ust qo'yish</span>
        </div>
        <div class="compare-footRight">
          <button class="compare-okBtn" type="button">Ikkalasi ham to'g'ri</button>
          <button class="compare-markBtn" type="button">⊖ Takroriy deb belgilash</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.compare-prevBtn').addEventListener('click',()=>navigate(-1));
    overlay.querySelector('.compare-nextBtn').addEventListener('click',()=>navigate(1));
    overlay.querySelector('.compare-okBtn').addEventListener('click',dismissPair);
    overlay.querySelector('.compare-markBtn').addEventListener('click',markCurrentDuplicate);
  }

  function findDuplicatePairs(agents,marksObj,keyFn){
    const urlMap=new Map();
    for(const a of agents){
      for(let i=0;i<a.photos.length;i++){
        const p=a.photos[i];
        if(!p.url)continue;
        const k=keyFn?keyFn(a,p):'';
        if(k&&marksObj[k]?.verdict==='MINUS')continue;
        if(!urlMap.has(p.url))urlMap.set(p.url,[]);
        urlMap.get(p.url).push({a,p,index:i});
      }
    }
    const result=[];
    for(const [url,items] of urlMap){
      if(items.length<2)continue;
      for(let i=1;i<items.length;i++){
        const photoA=items[0];
        const photoB=items[i];
        const timeDiff=calcTimeDiff(photoA.p,photoB.p);
        result.push({photoA,photoB,url,timeDiff,client:photoA.p.client||photoB.p.client||''});
      }
    }
    return result;
  }

  function calcTimeDiff(pA,pB){
    const tA=pA.photoTime||'';
    const tB=pB.photoTime||'';
    if(!tA||!tB)return null;
    const dA=new Date(tA),dB=new Date(tB);
    if(isNaN(dA)||isNaN(dB))return null;
    return Math.abs(dA-dB);
  }

  function formatTimeDiff(ms){
    if(ms==null)return '';
    const sec=Math.round(ms/1000);
    if(sec<60)return sec+' soniya farq';
    const min=Math.round(sec/60);
    if(min<60)return min+' daqiqa farq';
    return Math.round(min/60)+' soat farq';
  }

  function formatTime(p){
    const t=p.photoTime||'';
    if(!t)return '';
    const d=new Date(t);
    if(isNaN(d))return t.slice(11,16)||'';
    return d.toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'});
  }

  function open(opts){
    build();
    if(opts){
      onMarkDuplicate=opts.onMarkDuplicate||onMarkDuplicate;
      onDismiss=opts.onDismiss||onDismiss;
      getKey=opts.getKey||getKey;
      getMarks=opts.getMarks||getMarks;
    }
    const agents=opts?.agents||[];
    const marksObj=getMarks?getMarks():{};
    pairs=findDuplicatePairs(agents,marksObj,getKey);
    if(!pairs.length){
      if(opts?.notify)opts.notify('Takroriy juftlik topilmadi');
      return;
    }
    pairIndex=0;
    overlayMode=false;
    isOpen=true;
    overlay.setAttribute('aria-hidden','false');
    overlay.classList.add('open');
    renderPair();
  }

  function close(){
    if(!isOpen)return;
    isOpen=false;
    overlayMode=false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
  }

  function navigate(dir){
    pairIndex=Math.max(0,Math.min(pairs.length-1,pairIndex+dir));
    overlayMode=false;
    renderPair();
  }

  function renderPair(){
    const pair=pairs[pairIndex];
    if(!pair)return;
    const badge=overlay.querySelector('.compare-badge');
    const counter=overlay.querySelector('.compare-counter');
    const labelA=overlay.querySelector('.compare-sideA .compare-label');
    const labelB=overlay.querySelector('.compare-sideB .compare-label');
    const imgA=overlay.querySelector('.compare-sideA .compare-img');
    const imgB=overlay.querySelector('.compare-sideB .compare-img');
    const markBtn=overlay.querySelector('.compare-markBtn');
    const prevBtn=overlay.querySelector('.compare-prevBtn');
    const nextBtn=overlay.querySelector('.compare-nextBtn');

    badge.textContent=`${escapeHtml(pair.client)}${pair.timeDiff!=null?' · '+formatTimeDiff(pair.timeDiff):''}`;
    counter.textContent=pairs.length>1?`${pairIndex+1} / ${pairs.length} juftlik`:'';

    labelA.innerHTML=`<b>Foto ${pair.photoA.index+1}</b><span>${escapeHtml(pair.photoA.a.code)} · ${formatTime(pair.photoA.p)}</span>`;
    labelB.innerHTML=`<b>Foto ${pair.photoB.index+1}</b><span>${escapeHtml(pair.photoB.a.code)} · ${formatTime(pair.photoB.p)}</span>`;

    imgA.src=pair.photoA.p.url;
    imgB.src=pair.photoB.p.url;

    markBtn.textContent=`⊖ Foto ${pair.photoB.index+1} ni takroriy deb belgilash`;

    prevBtn.disabled=pairIndex<=0;
    nextBtn.disabled=pairIndex>=pairs.length-1;

    overlay.classList.toggle('compare-overlayMode',overlayMode);
  }

  function toggleOverlay(){
    overlayMode=!overlayMode;
    overlay.classList.toggle('compare-overlayMode',overlayMode);
  }

  function dismissPair(){
    if(!pairs.length)return;
    if(onDismiss)onDismiss(pairs[pairIndex]);
    pairs.splice(pairIndex,1);
    if(!pairs.length){close();return}
    pairIndex=Math.min(pairIndex,pairs.length-1);
    renderPair();
  }

  function markCurrentDuplicate(){
    const pair=pairs[pairIndex];
    if(!pair)return;
    if(onMarkDuplicate)onMarkDuplicate(pair.photoB.a,pair.photoB.p,pair.photoB.index);
    pairs.splice(pairIndex,1);
    if(!pairs.length){close();return}
    pairIndex=Math.min(pairIndex,pairs.length-1);
    renderPair();
  }

  function handleKey(e){
    if(!isOpen)return false;
    if(e.key==='c'||e.key==='C'||e.key==='с'||e.key==='С'){close();return true}
    if(e.key==='Tab'){e.preventDefault();toggleOverlay();return true}
    if(e.key==='ArrowLeft'){navigate(-1);return true}
    if(e.key==='ArrowRight'){navigate(1);return true}
    return false;
  }

  return {open,close,isOpen:()=>isOpen,handleKey};
})();
