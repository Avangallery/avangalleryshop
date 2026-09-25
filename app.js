// AVAN V24 static hero: no slider or auto-scroll.

/* ===== AVAN V43 — header interactions ===== */
(function(){
  const $ = (s)=>document.querySelector(s);
  const cartBtn=$('#headerCart'), cartPop=$('#cartPopover');
  const accountBtn=$('#headerAccount'), accountPop=$('#accountPopover');
  const searchForm=$('#headerSearch'), searchInput=$('#headerSearchInput'), searchPop=$('#searchPopover');
  const mobileBtn=$('#mobileMenu'), mainMenu=$('#mainMenu');
  const pops=[cartPop,accountPop,searchPop].filter(Boolean);
  function closeAll(except){pops.forEach(p=>{if(p!==except){p.classList.remove('is-open');p.setAttribute('aria-hidden','true')}});[cartBtn,accountBtn].forEach(x=>x&&x.classList.remove('is-active'));}
  function toggle(pop,btn){if(!pop)return; const open=pop.classList.contains('is-open'); closeAll(open?null:pop); if(!open){pop.classList.add('is-open');pop.setAttribute('aria-hidden','false');if(btn)btn.classList.add('is-active')}}
  cartBtn?.addEventListener('click',(e)=>{e.stopPropagation();toggle(cartPop,cartBtn)});
  accountBtn?.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();toggle(accountPop,accountBtn)});
  searchInput?.addEventListener('focus',()=>{if(searchInput.value.trim())toggle(searchPop,null)});
  searchInput?.addEventListener('input',()=>{
    const q=searchInput.value.trim();
    if(!q){searchPop?.classList.remove('is-open');searchPop?.setAttribute('aria-hidden','true');return;}
    const names=[['Tissot PRX Powermatic 80','TISSOT','assets/watch-1.jpg'],['Seiko 5 Sports','SEIKO','assets/watch-2.jpg'],['Classic Gold Watch','AVAN GALLERY','assets/watch-3.jpg']];
    const filtered=names.filter(x=>(x[0]+' '+x[1]).toLowerCase().includes(q.toLowerCase()));
    const list=filtered.length?filtered:names;
    $('#searchResults').innerHTML=list.map(x=>`<a class="v43-result" href="#products"><img src="${x[2]}" alt=""><span><b>${x[0]}</b><small>${x[1]}</small></span></a>`).join('')+`<a class="v43-see-all" href="#products">نمایش همه نتایج برای «${q.replace(/</g,'&lt;')}» ←</a>`;
    searchPop?.classList.add('is-open');searchPop?.setAttribute('aria-hidden','false');
  });
  searchForm?.addEventListener('submit',(e)=>{e.preventDefault();document.querySelector('#products')?.scrollIntoView({behavior:'smooth'});});
  document.querySelectorAll('[data-close-pop]').forEach(b=>b.addEventListener('click',()=>{const p=$('#'+b.dataset.closePop);p?.classList.remove('is-open');p?.setAttribute('aria-hidden','true');}));
  mobileBtn?.addEventListener('click',(e)=>{e.stopPropagation();const open=mainMenu?.classList.toggle('open');mobileBtn.setAttribute('aria-expanded',open?'true':'false');mobileBtn.classList.toggle('is-active',!!open);});
  document.addEventListener('click',(e)=>{if(!e.target.closest('.v43-utility,.v43-search'))closeAll(null)});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeAll(null);mainMenu?.classList.remove('open');mobileBtn?.classList.remove('is-active');mobileBtn?.setAttribute('aria-expanded','false')}});
})();
