/* BTC PULSE: deterministic deployment smoke checks. No network or private keys. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length>=3,'HTML scripts were lost');
for(const [i,entry] of scripts.entries()){
  const attrs=entry[1];
  const source=attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  if(source){
    const file=source[1].split('?')[0].replace(/^\.\//,'');
    assert.ok(!file.includes('..'),'script traversal');
    new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
  }else if(entry[2].trim())new vm.Script(entry[2],{filename:'index.html:script-'+i});
}
assert.match(html,/btcpulse-resilience\.js/);
assert.match(html,/Data from|مصادر|المصادر/i);
const local=new Map();
let primaryUp=false,backupUp=true;
const address='34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo';
const payload={chain_stats:{funded_txo_sum:100000000,spent_txo_sum:25000000,tx_count:10},mempool_stats:{funded_txo_sum:0,spent_txo_sum:0}};
const env={
  localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},
  fetch:async url=>{
    const primary=url.startsWith('https://mempool.space/api');
    if(primary&&!primaryUp||!primary&&!backupUp)throw Error('Provider unavailable');
    const data=url.includes('fee-estimates')?{'1':11,'3':7,'6':4}:
      url.includes('/address/')?payload:url.endsWith('/mempool')?{count:8500,vsize:2300000}:
      {fastestFee:11,halfHourFee:7,economyFee:4};
    return {ok:true,json:async()=>data};
  },
  AbortController,setTimeout,clearTimeout,console,Intl
};
env.window=env;
vm.runInNewContext(fs.readFileSync(path.join(root,'btcpulse-resilience.js'),'utf8'),env);
const data=env.BtcPulseResilience;
(async()=>{
  assert.equal(data.convertFees({'1':11,'3':7,'6':4}).halfHourFee,7);
  const first=await data.request('/address/'+address);
  assert.equal(first.source,'Blockstream');
  assert.equal(first.stale,false);
  const mem=await data.request('/mempool');assert.equal(mem.data.count,8500);
  const fees=await data.request('/v1/fees/recommended');assert.equal(fees.data.fastestFee,11);
  backupUp=false;
  const cached=await data.request('/address/'+address);
  assert.equal(cached.stale,true);
  assert.equal(cached.data.chain_stats.tx_count,10);
  assert.ok(cached.savedAt>0);
  await assert.rejects(data.request('/address/not-a-bitcoin-address'),/Unsupported/);
  console.log('PASS: JS syntax, linked files, Blockstream fallback, fee conversion, last-valid cache');
})().catch(e=>{console.error(e);process.exitCode=1});
