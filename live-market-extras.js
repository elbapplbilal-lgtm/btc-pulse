/* Optional real market metrics. Never substitute sample values. */
(function(){
  'use strict';
  const supply=document.getElementById('circulatingSupply');
  const dominance=document.getElementById('btcDominance');
  if(!supply||!dominance)return;
  const api='https://api.coingecko.com/api/v3';
  const fmt=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
  async function get(url){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),11000);
    try {
      const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:ctrl.signal,headers:{Accept:'application/json'}});
      if(!response.ok)throw Error(String(response.status));
      return await response.json();
    }finally{clearTimeout(timer)}
  }
  async function update(){
    if(document.visibilityState==='hidden')return;
    const results=await Promise.allSettled([
      get(api+'/coins/markets?vs_currency=usd&ids=bitcoin&per_page=1&page=1&sparkline=false'),
      get(api+'/global')
    ]);
    if(results[0].status==='fulfilled'){
      const coin=results[0].value?.[0];
      const value=coin?.circulating_supply;
      if(Number.isFinite(value)&&value>0)supply.textContent=fmt.format(value/1e6)+' مليون BTC';
    }
    if(results[1].status==='fulfilled'){
      const value=results[1].value?.data?.market_cap_percentage?.btc;
      if(Number.isFinite(value)&&value>=0&&value<=100)dominance.textContent=fmt.format(value)+'%';
    }
  }
  update();
  setInterval(update,15*60*1000);
})();
