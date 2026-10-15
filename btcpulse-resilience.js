/* BTC PULSE: fault-tolerant Bitcoin public-data adapter, no keys or paid services. */
(function(root){
  'use strict';
  const PRIMARY='https://mempool.space/api';
  const BACKUP='https://blockstream.info/api';
  const STORE_KEY='btcpulse.public.esplora-cache.v1';
  const pending=new Map(),cooldowns=new Map();
  const maxActive=2;let active=0;const waiting=[];
  const now=()=>Date.now();
  const safe=n=>Number.isSafeInteger(n)&&n>=0;
  function allowed(path){return path==='/mempool'||path==='/mempool/recent'||path==='/v1/fees/recommended'||path==='/v1/difficulty-adjustment'||/^\/address\/(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i.test(path)}
  function readStore(){try{const v=JSON.parse(root.localStorage?.getItem(STORE_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
  function writeStore(path,value,source){
    try{
      const store=readStore();store[path]={data:value,savedAt:now(),source};
      const keys=Object.keys(store).sort((a,b)=>(store[b]?.savedAt||0)-(store[a]?.savedAt||0));
      for(const key of keys.slice(45))delete store[key];
      root.localStorage?.setItem(STORE_KEY,JSON.stringify(store));
    }catch{/* local storage can be unavailable in private browsing */}
  }
  function cached(path){
    const item=readStore()[path];if(!item||!Number.isFinite(item.savedAt)||item.savedAt>now()+60000)return null;
    const limit=path.startsWith('/address/')?7*86400000:path==='/v1/difficulty-adjustment'?3*86400000:12*3600000;
    if(now()-item.savedAt>limit)return null;
    if(!isValid(path,item.data))return null;
    return {data:item.data,savedAt:item.savedAt,source:item.source||'محفوظ',stale:true};
  }
  function isValid(path,d){
    if(path.startsWith('/address/')){
      const c=d?.chain_stats,m=d?.mempool_stats||{};
      return !!c&&safe(c.funded_txo_sum)&&safe(c.spent_txo_sum)&&c.funded_txo_sum>=c.spent_txo_sum&&safe(c.tx_count)&&(!m.funded_txo_sum||safe(m.funded_txo_sum))&&(!m.spent_txo_sum||safe(m.spent_txo_sum));
    }
    if(path==='/mempool')return safe(d?.count)&&Number.isFinite(d?.vsize)&&d.vsize>=0;
    if(path==='/v1/fees/recommended')return [d?.fastestFee,d?.halfHourFee,d?.economyFee].every(n=>Number.isFinite(n)&&n>=0&&n<1e6);
    if(path==='/v1/difficulty-adjustment')return Number.isFinite(d?.difficultyChange)&&Math.abs(d.difficultyChange)<=1000;
    if(path==='/mempool/recent')return Array.isArray(d)&&d.length>0&&d.some(t=>/^[a-f0-9]{64}$/i.test(t?.txid||''));
    return false;
  }
  function convertFees(raw){
    const fee=n=>Number(raw?.[String(n)]);
    const fast=fee(1),half=fee(3)||fee(2),economy=fee(6)||fee(12);
    if(![fast,half,economy].every(n=>Number.isFinite(n)&&n>0&&n<1000000))throw Error('Incomplete fee estimates');
    return {fastestFee:fast,halfHourFee:half,economyFee:economy};
  }
  async function limited(fn){
    if(active>=maxActive)await new Promise(resolve=>waiting.push(resolve));
    active++;
    try{return await fn()}finally{active--;const next=waiting.shift();if(next)next()}
  }
  async function get(url,timeout){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const res=await root.fetch(url,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
      if(!res.ok)throw Error('HTTP '+res.status);
      return await res.json();
    }finally{clearTimeout(timer)}
  }
  async function fromProviders(path){
    const providers=[{base:PRIMARY,name:'mempool.space',timeout:4800}];
    if(path!=='/v1/difficulty-adjustment')providers.push({base:BACKUP,name:'Blockstream',timeout:6200});
    for(const provider of providers){
      const suffix=provider.base===BACKUP&&path==='/v1/fees/recommended'?'/fee-estimates':path;
      try{
        let data=await get(provider.base+suffix,provider.timeout);
        if(provider.base===BACKUP&&path==='/v1/fees/recommended')data=convertFees(data);
        if(!isValid(path,data))throw Error('Invalid response from '+provider.name);
        writeStore(path,data,provider.name);
        cooldowns.delete(path);
        return {data,source:provider.name,stale:false,savedAt:now()};
      }catch{/* fail over to the other independent provider */}
    }
    cooldowns.set(path,now()+45000);
    const old=cached(path);if(old)return old;
    throw Error('تعذّر الحصول على بيانات حقيقية من المصدرين');
  }
  function request(path,{force=false}={}){
    if(!allowed(path))return Promise.reject(Error('Unsupported public Bitcoin path'));
    if(pending.has(path))return pending.get(path);
    if(!force&&cooldowns.get(path)>now()){
      const old=cached(path);
      if(old)return Promise.resolve(old);
    }
    const action=limited(()=>fromProviders(path));
    pending.set(path,action);
    action.finally(()=>{if(pending.get(path)===action)pending.delete(path)}).catch(()=>{});
    return action;
  }
  function asArabicDate(timestamp){
    if(!Number.isFinite(timestamp))return 'وقت غير معروف';
    return new Date(timestamp).toLocaleString('ar-MA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  const exported={request,cached,asArabicDate,isValid,convertFees};
  root.BtcPulseResilience=exported;
  if(typeof module!=='undefined'&&module.exports)module.exports=exported;
})(typeof window==='undefined'?globalThis:window);