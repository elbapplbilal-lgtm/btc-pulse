/* BTC PULSE — live public Bitcoin addresses, v2 */
(function(){
'use strict';
const API='https://mempool.space/api';
const examples=[
  {address:'34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',label:'عنوان احتياطي مُعلن عنه تاريخياً'},
  {address:'3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6',label:'عنوان احتياطي مُعلن عنه تاريخياً'},
  {address:'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2',label:'عنوان عام كبير · المالك غير مؤكد'}
].map(item=>({...item,balance:null,txCount:null,error:false,updated:0}));
const state={sort:'balance',usd:null};
const el=(tag,cls,txt)=>{const a=document.createElement(tag);if(cls)a.className=cls;if(txt!==undefined)a.textContent=txt;return a};
const num=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
const shorten=s=>s.slice(0,9)+'…'+s.slice(-7);
const search=document.querySelector('.search-section');
if(!search)return;
const section=el('section','featured-section');section.id='featured';section.setAttribute('aria-labelledby','featuredHeading');
section.innerHTML='<div class="section-head"><div><span class="eyebrow">BITCOIN / PUBLIC ADDRESSES</span>'
+'<h2 id="featuredHeading"><span class="orange">♛</span> لوحة عناوين بيتكوين البارزة</h2>'
+'<p>أرصدة حقيقية لثلاثة عناوين عمومية معروفة؛ ليست ترتيباً شاملاً لأغنى ملاك البيتكوين.</p></div>'
+'<button class="btn-subtle" id="featuredAdd" type="button">+ إضافة عنواني</button></div>'
+'<div class="featured-tabs" role="group" aria-label="ترتيب العناوين العامة">'
+'<button class="featured-tab" type="button" data-featured-sort="balance" aria-pressed="true">♛ الأعلى رصيداً</button>'
+'<button class="featured-tab" type="button" data-featured-sort="address" aria-pressed="false">▣ حسب العنوان</button>'
+'<button class="featured-tab" type="button" data-featured-sort="activity" aria-pressed="false">▥ الأكثر معاملات</button></div>'
+'<div class="featured-cards" id="featuredCards" aria-live="polite"></div>'
+'<div class="featured-footer"><span id="featuredStatus">جارٍ جلب الأرصدة من الشبكة…</span>'
+'<a href="https://www.binance.com/en/blog/community/2895840147147652626" target="_blank" rel="noopener noreferrer">مصدر الإفصاح التاريخي ↗</a></div>';
const result=document.getElementById('resultPanel');
(result||search).insertAdjacentElement('afterend',section);
const network=document.getElementById('fees'),wallets=document.getElementById('wallets');
if(network&&wallets)network.insertAdjacentElement('afterend',wallets);
const header=document.querySelector('.site-header'),side=header?.querySelector('.header-side');
const menu=document.getElementById('menuBtn'),refresh=document.getElementById('refreshBtn');
if(header&&side&&menu&&refresh){
 side.append(refresh);header.append(menu);
 menu.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.6 2.1 1.5.9 2.2-.4 2 3.5-1.6 1.7v2l1.6 1.7-2 3.5-2.2-.4-1.5.9L14 20h-4l-.6-2.1-1.5-.9-2.2.4-2-3.5 1.6-1.7v-2L3.7 8.5l2-3.5 2.2.4 1.5-.9Z"/></svg>';
 menu.setAttribute('aria-label','فتح الإعدادات والقائمة');
}
const host=document.getElementById('featuredCards');
function render(){
 const items=[...examples];
 if(state.sort==='balance')items.sort((a,b)=>(b.balance??-1)-(a.balance??-1));
 if(state.sort==='activity')items.sort((a,b)=>(b.txCount??-1)-(a.txCount??-1));
 if(state.sort==='address')items.sort((a,b)=>a.address.localeCompare(b.address));
 host.replaceChildren();
 for(const [i,item] of items.entries()){
  const card=el('article','featured-card');
  const rank=el('span','featured-rank','#'+(i+1));
  const bitcoin=el('span','featured-icon','₿');
  const identity=el('div','featured-identity'),addressLine=el('div','featured-address');
  const address=el('button','featured-address-button',shorten(item.address));
  address.type='button';address.title='فحص العنوان '+item.address;
  address.addEventListener('click',()=>{
   const input=document.getElementById('searchInput'),form=document.getElementById('searchForm');
   if(input&&form){input.value=item.address;form.requestSubmit()}
  });
  const copy=el('button','featured-copy','▣');
  copy.type='button';copy.title='نسخ العنوان';copy.setAttribute('aria-label','نسخ '+item.address);
  copy.addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(item.address);copy.textContent='✓'}
   catch{copy.textContent='!'}
   setTimeout(()=>copy.textContent='▣',1600)
  });
  addressLine.append(address,copy);
  identity.append(addressLine,el('div','featured-label',item.label));
  const amount=el('div','featured-amount');
  amount.append(el('strong','',item.balance===null?'— BTC':num(item.balance)+' BTC'));
  amount.append(el('small','',item.error?'تعذّر التحديث · آخر رصيد متاح':
     item.balance!==null&&state.usd!==null?'≈ '+money(item.balance*state.usd):'قيمة الدولار: —'));
  const share=el('div','featured-share');
  if(item.balance===null)share.append(el('span','',item.error?'تعذّر الجلب':'جارٍ التحديث'));
  else{
   const pc=item.balance/21000000*100;
   share.append(el('span','',pc.toFixed(3)+'%'),el('small','','من الحد الأقصى 21M BTC'));
   const bar=el('div','featured-progress'),fill=el('i');
   fill.style.width=Math.min(100,pc)+'%';bar.append(fill);share.append(bar)
  }
  card.append(rank,bitcoin,identity,amount,share);host.append(card);
 }
}
async function load(force=false){
 if(document.visibilityState==='hidden')return;
 const targets=examples.filter(x=>force||!x.updated||Date.now()-x.updated>300000);
 if(!targets.length)return;
 document.getElementById('featuredStatus').textContent='جارٍ تحديث أرصدة عناوين بيتكوين العامة…';
 await Promise.allSettled(targets.map(async item=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await fetch(API+'/address/'+encodeURIComponent(item.address),{
     credentials:'omit',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});
   if(!response.ok)throw Error('HTTP '+response.status);
   const info=await response.json(),stats=info?.chain_stats;
   const balance=stats?.funded_txo_sum-stats?.spent_txo_sum;
   if(!Number.isSafeInteger(balance)||balance<0||!Number.isSafeInteger(stats.tx_count)||stats.tx_count<0)throw Error('Invalid balance');
   item.balance=balance/1e8;item.txCount=stats.tx_count;item.error=false;item.updated=Date.now();
  }catch{item.error=true;item.updated=Date.now()}finally{clearTimeout(timer)}
 }));
 const count=examples.filter(x=>x.balance!==null&&!x.error).length;
 document.getElementById('featuredStatus').textContent=count+' من 3 عناوين بأرصدة محدثة · ليست قائمة عالمية شاملة';
 render();
}
const priceNode=document.getElementById('btcPrice');
if(priceNode){
 const updatePrice=()=>{
  const usd=Number(priceNode.textContent.replace(/[^\d.]/g,''));
  state.usd=Number.isFinite(usd)&&usd>0?usd:null;
  render()
 };
 new MutationObserver(updatePrice).observe(priceNode,{subtree:true,childList:true,characterData:true});
 updatePrice();
}
document.querySelectorAll('[data-featured-sort]').forEach(btn=>btn.addEventListener('click',()=>{
 state.sort=btn.dataset.featuredSort;
 document.querySelectorAll('[data-featured-sort]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
 render()
}));
document.getElementById('featuredAdd').addEventListener('click',()=>{
 document.getElementById('wallets')?.scrollIntoView({behavior:'smooth'});
 document.getElementById('addWalletBtn')?.click()
});
render();void load();
document.getElementById('refreshBtn')?.addEventListener('click',()=>void load(true));
setInterval(()=>{if(document.visibilityState==='visible')void load()},300000);
})();