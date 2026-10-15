/* BTC PULSE v4: responsive reference polish and real 24-hour chart fallback. */
(function(){
'use strict';
function el(tag,klass,label){const node=document.createElement(tag);if(klass)node.className=klass;if(label!==undefined)node.textContent=label;return node}
function svgIcon(name){if(name==='bell')return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9"/><path d="M10 21h4"/><circle class="pulse-notification" cx="19" cy="5" r="3" stroke="none"/></svg>';return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.7 2 1.4.9 2.3-.4 2 3.5-1.6 1.7v2.1l1.6 1.7-2 3.5-2.3-.4-1.4.9L14 20h-4l-.7-2-1.4-.9-2.3.4-2-3.5 1.6-1.7v-2.1L3.6 8.5l2-3.5 2.3.4L9.3 4Z"/></svg>'}
const header=document.querySelector('.site-header');
if(header){
 const settings=document.getElementById('menuBtn');
 if(settings){settings.innerHTML=svgIcon('gear');settings.setAttribute('aria-label','الإعدادات والقائمة');header.append(settings)}
 const search=document.getElementById('topSearchBtn');
 if(search){const side=header.querySelector('.header-side');if(side)side.insertBefore(search,side.firstChild)}
 const bell=el('button','icon-button');bell.id='pulseBellBtn';bell.type='button';bell.innerHTML=svgIcon('bell');bell.setAttribute('aria-label','آخر معاملات شبكة البيتكوين');bell.title='آخر معاملات شبكة البيتكوين';bell.addEventListener('click',()=>document.getElementById('transactions')?.scrollIntoView({behavior:'smooth'}));
 const side=header.querySelector('.header-side');side?.append(bell);
 
}
const chartLabel=document.getElementById('chartLabel');if(chartLabel)chartLabel.textContent='⌄ 24 ساعة';
const feature=document.getElementById('featured');
if(feature){
 const title=feature.querySelector('h2');if(title){title.innerHTML='<span class="orange" aria-hidden="true">♛</span> لوحة المتصدرين للبيتكوين'}
 const p=feature.querySelector('.section-head p');if(p)p.textContent='أكبر العناوين العامة المختارة حسب الرصيد الحقيقي على الشبكة';
 const headAction=feature.querySelector('.section-head button');if(headAction)headAction.textContent='‹ إضافة عنوان';
 const tabs=feature.querySelectorAll('[data-featured-sort]');for(const t of tabs){if(t.dataset.featuredSort==='balance')t.textContent='♛ أكبر العناوين';else if(t.dataset.featuredSort==='address')t.textContent='▣ عناوين المحافظ';else if(t.dataset.featuredSort==='activity')t.textContent='▥ حجم المعاملات'}
}
// Keep icon variations decorative only: do not attribute wallet owners from icons.
const featuredHost=document.getElementById('featuredCards');
if(featuredHost){
 function decorate(){
  const icons=featuredHost.querySelectorAll('.featured-card .featured-icon');
  if(icons[1])icons[1].textContent='▦';
  if(icons[2])icons[2].textContent='▣';
 }
 new MutationObserver(decorate).observe(featuredHost,{childList:true});decorate();
}
const fees=document.getElementById('fees');if(fees){const note=fees.querySelector('.section-head p');if(note)note.textContent='أحدث رسوم التحويل ونشاط الشبكة من بيانات عامة حقيقية';}
const search=document.querySelector('.search-section input');if(search)search.placeholder='ابحث عن معاملة، محفظة، أو عنوان بيتكوين...';
// 24-hour chart: ask public sources in order. Never draw fabricated fallback points.
const placeholder=document.getElementById('chartPlaceholder'),line=document.getElementById('sparkLine'),area=document.getElementById('sparkArea');
function realPrices(points){
 if(!Array.isArray(points))return false;
 const prices=points.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[1]>0).sort((a,b)=>a[0]-b[0]);
 if(prices.length<8||prices.at(-1)[0]-prices[0][0]<12*3600000)return false;
 const xs=prices.map(p=>p[0]),ys=prices.map(p=>p[1]);const low=Math.min(...ys),high=Math.max(...ys),span=high-low||1,start=xs[0],width=xs.at(-1)-start;
 const coords=prices.map(p=>[15+410*(p[0]-start)/width,147-118*(p[1]-low)/span]);
 const d=coords.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 if(!line||!area)return false;
 line.setAttribute('d',d);area.setAttribute('d',d+' L'+coords.at(-1)[0].toFixed(1)+' 166 L'+coords[0][0].toFixed(1)+' 166 Z');
 if(placeholder)placeholder.hidden=true;
 if(chartLabel)chartLabel.title='بيانات الرسم البياني من سوق حقيقي خلال 24 ساعة';
 const pill=document.querySelector('#priceChange .neutral-pill');
 if(pill&&ys[0]>0){
   const pct=(ys.at(-1)-ys[0])/ys[0]*100,delta=ys.at(-1)-ys[0];
   if(Number.isFinite(pct)&&Math.abs(pct)<100){
     const p=el('span','change-pill'+(pct<0?' negative':''),(pct>=0?'+':'')+pct.toFixed(2)+'% '+(pct>=0?'▲':'▼'));
     p.title='تغير تقريبي مستخرج من الأسعار الحقيقية لمصدر الرسم البياني';
     pill.replaceWith(p);
     const v=el('span','daily-amount'+(delta<0?' negative':''),(delta>=0?'+':'−')+'$'+Math.abs(delta).toLocaleString('en-US',{maximumFractionDigits:2}));
     v.title=p.title;
     document.getElementById('priceChange')?.append(v);
   }
 }

 return true;
}
async function json(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),8500);try{const r=await fetch(url,{signal:c.signal,mode:'cors',credentials:'omit',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
let chartBusy=false;
async function fallbackChart(){
 if(chartBusy||!placeholder||placeholder.hidden)return;
 chartBusy=true;
 try{
  const kraken=await json('https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60');
  const result=kraken?.result||{};const key=Object.keys(result).find(k=>k!=='last');
  const rows=key?result[key]:[];const now=Date.now();
  if(Array.isArray(rows)&&realPrices(rows.map(row=>[Number(row[0])*1000,Number(row[4])]).filter(p=>p[0]>=now-25*3600000)))return;
 }catch{}
 try{
  const crypto=await json('https://min-api.cryptocompare.com/data/v2/histohour?fsym=BTC&tsym=USD&limit=24');
  const rows=crypto?.Data?.Data||[];
  if(realPrices(rows.map(row=>[Number(row.time)*1000,Number(row.close)])))return;
 }catch{}
 // Nothing synthetic: keep the explicit unavailable message.
 if(placeholder&&!placeholder.hidden)placeholder.textContent='الرسم البياني غير متاح حالياً';
 finallyDone();
}
function finallyDone(){chartBusy=false}
window.addEventListener('load',()=>setTimeout(()=>{if(placeholder&&!placeholder.hidden)void fallbackChart()},3000));

// Optional second free market-data provider when CoinGecko rate-limits browser traffic.
const marketSource=document.querySelector('.hero-source');
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const num=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
const dollars=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
function needsData(node){return node&&(!node.textContent.trim()||node.textContent.trim().startsWith('—'))}
function showSource(){if(marketSource&&!marketSource.textContent.includes('CoinPaprika')){
 const a=el('a','', 'CoinPaprika');a.href='https://coinpaprika.com/coin/btc-bitcoin/';a.target='_blank';a.rel='noopener noreferrer';marketSource.append(' · ',a);
}}
async function loadCoinPaprika(){
 if(document.visibilityState==='hidden')return;
 let used=false;
 try{
  const t=await json('https://api.coinpaprika.com/v1/tickers/btc-bitcoin?quotes=USD');
  if(!t||t.id!=='btc-bitcoin')throw Error('Not Bitcoin');
  const q=t.quotes?.USD;
  const cap=document.getElementById('marketCap'),vol=document.getElementById('volume24h'),supply=document.getElementById('circulatingSupply'),price=document.getElementById('btcPrice');
  const compact=n=>'$'+new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n);
  if(needsData(cap)&&valid(q?.market_cap)&&q.market_cap>0){cap.textContent=compact(q.market_cap);used=true}
  if(needsData(vol)&&valid(q?.volume_24h)){vol.textContent=compact(q.volume_24h);used=true}
  if(needsData(supply)&&valid(t.circulating_supply)&&t.circulating_supply>0){supply.textContent=num.format(t.circulating_supply/1e6)+' مليون BTC';used=true}
  if(needsData(price)&&valid(q?.price)&&q.price>0){price.textContent=dollars(q.price);used=true}
  const change=document.querySelector('#priceChange .neutral-pill');
  const pct=q?.percent_change_24h;
  if(change&&Number.isFinite(pct)&&Math.abs(pct)<=100){
    const p=el('span','change-pill'+(pct<0?' negative':''),(pct>=0?'+':'')+pct.toFixed(2)+'% '+(pct>=0?'▲':'▼'));
    p.title='تغير السعر خلال 24 ساعة من CoinPaprika';change.replaceWith(p);
    if(valid(q.price)&&q.price>0){const old=q.price/(1+pct/100);const diff=q.price-old;
      if(Number.isFinite(diff)){const d=el('span','daily-amount'+(diff<0?' negative':''),(diff>=0?'+':'−')+'$'+Math.abs(diff).toLocaleString('en-US',{maximumFractionDigits:2}));d.title=p.title;document.getElementById('priceChange')?.append(d)}
    }
    used=true;
  }
 }catch{}
 try{
  const dominance=document.getElementById('btcDominance');
  if(needsData(dominance)){
   const g=await json('https://api.coinpaprika.com/v1/global');const pct=g?.bitcoin_dominance_percentage;
   if(valid(pct)&&pct<=100){dominance.textContent=num.format(pct)+'%';used=true}
  }
 }catch{}
 if(used)showSource();
}
window.addEventListener('load',()=>setTimeout(()=>void loadCoinPaprika(),2300));
setInterval(()=>{if(document.visibilityState==='visible')void loadCoinPaprika()},15*60*1000);

const refresh=document.getElementById('refreshBtn');refresh?.addEventListener('click',()=>setTimeout(()=>{if(placeholder&&!placeholder.hidden)void fallbackChart()},2800));
})();