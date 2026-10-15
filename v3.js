/* BTC PULSE v3: visual refinements only; preserve all existing real data logic. */
(()=>{
 'use strict';
 const bell=document.getElementById('refreshBtn');
 if(bell){
  bell.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg><i class="notice-dot" aria-hidden="true"></i>';
  bell.setAttribute('aria-label','تحديث معلومات البيتكوين');
 }
 const buttons=document.querySelectorAll('[data-featured-sort]');
 const titles={balance:'♛ أعلى الأرصدة',address:'▣ عناوين المحافظ',activity:'▥ الأكثر معاملات'};
 for(const btn of buttons){let label=titles[btn.dataset.featuredSort];if(label)btn.textContent=label}
 const source=document.querySelector('.featured-section .eyebrow');
 if(source)source.textContent='BITCOIN / PUBLIC WALLET ADDRESSES';
 // Preserve truthful distinction: public addresses are not a global ranking of owners.
 const subtitle=document.querySelector('.featured-section .section-head p');
 if(subtitle)subtitle.textContent='عناوين عمومية مع أرصدة حقيقية؛ ليست قائمة شاملة بأغنى الملاك';
 const menu=document.getElementById('menuPanel');
 if(menu&&!menu.querySelector('.btc-live-disclaimer')){
  const div=document.createElement('p');div.className='btc-live-disclaimer';
  div.textContent='البيانات تُجلب مباشرة من مصادر عامة وقد تتأخر حسب الاتصال وحدود الخدمة.';
  menu.append(div);
 }
})();