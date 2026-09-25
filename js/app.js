// AVAN V24 static hero: no slider or auto-scroll.

/* ===== AVAN V43 — header interactions ===== */
(function(){
  const $ = (s)=>document.querySelector(s);
  const cartBtn=$('#headerCart'), cartPop=$('#cartPopover');
  const accountBtn=$('#headerAccount'), accountPop=$('#accountPopover');
  const searchForm=$('#headerSearch'), searchInput=$('#headerSearchInput'), searchPop=$('#searchPopover');
  const mobileBtn=$('#mobileMenu'), mainMenu=$('#mainMenu');
  const pops=[cartPop,accountPop,searchPop].filter(Boolean);
  function syncCartBadge(){ const b=$('#cartCount'); if(!b)return; const n=parseInt(b.textContent||'0',10)||0; b.style.display=n>0?'block':'none'; }
  syncCartBadge();
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
  document.addEventListener('click',(e)=>{if(!e.target.closest('.v43-utility,.v43-search'))closeAll(null)});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeAll(null);mainMenu?.classList.remove('open');mobileBtn?.classList.remove('is-active');mobileBtn?.setAttribute('aria-expanded','false')}});
})();

(function(){const b=document.getElementById('cartCount'); if(b&&window.MutationObserver){new MutationObserver(function(){const n=parseInt(b.textContent||'0',10)||0;b.style.display=n>0?'block':'none';}).observe(b,{childList:true,characterData:true,subtree:true});}})();

/* ===== AVAN V49 — hamburger drawer + premium cart ===== */
(function(){
  const $=s=>document.querySelector(s);
  const menuBtn=$('#mobileMenu'), drawer=$('#avanSideDrawer'), backdrop=$('#drawerBackdrop'), drawerClose=$('#drawerClose');
  const cartBtn=$('#headerCart'), cartPop=$('#cartPopover');
  let cart=[
    {id:'tissot',name:'Tissot PRX',sub:'ساعت مجی مردانه',price:18500000,img:'assets/watch-1.jpg',qty:1},
    {id:'seiko',name:'Seiko 5 Sports',sub:'ساعت اسپرت',price:24600000,img:'assets/watch-2.jpg',qty:1},
    {id:'avan',name:'ساعت کلاسیک آوان',sub:'مدل منتخب آوان',price:12900000,img:'assets/watch-3.jpg',qty:1}
  ];
  function fmt(n){return new Intl.NumberFormat('fa-IR').format(n)+' تومان'}
  function renderCart(){
    const body=$('#cartPopoverBody'), total=cart.reduce((s,x)=>s+x.price*x.qty,0), count=cart.reduce((s,x)=>s+x.qty,0);
    $('#cartCount').textContent=count; $('#cartCount').style.display=count?'block':'none';
    $('#cartTitleCount').textContent=new Intl.NumberFormat('fa-IR').format(count);
    $('#cartTotal').textContent=fmt(total);
    if(!cart.length){body.innerHTML='<div class="v43-empty"><strong>سبد خرید خالی است</strong><span>هنوز محصولی به سبد اضافه نکرده‌اید.</span></div>';return;}
    body.innerHTML='<div class="v49-cart-list">'+cart.map(x=>`<div class="v49-cart-item"><div class="thumb"><img src="${x.img}" alt="${x.name}"></div><div class="meta"><b>${x.name}</b><small>${x.sub}</small><div class="v49-qty"><button data-dec="${x.id}">−</button><span>${x.qty}</span><button data-inc="${x.id}">+</button></div></div><div><button class="remove" data-remove="${x.id}" aria-label="حذف">×</button><div class="v49-item-price">${fmt(x.price*x.qty)}</div></div></div>`).join('')+'</div>';
  }
  function openDrawer(){drawer?.classList.add('is-open');backdrop?.classList.add('is-open');drawer?.setAttribute('aria-hidden','false');backdrop?.setAttribute('aria-hidden','false');document.body.classList.add('drawer-lock');menuBtn?.setAttribute('aria-expanded','true');menuBtn?.classList.add('is-active');}
  function closeDrawer(){drawer?.classList.remove('is-open');backdrop?.classList.remove('is-open');drawer?.setAttribute('aria-hidden','true');backdrop?.setAttribute('aria-hidden','true');document.body.classList.remove('drawer-lock');menuBtn?.setAttribute('aria-expanded','false');menuBtn?.classList.remove('is-active');}
  menuBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();drawer?.classList.contains('is-open')?closeDrawer():openDrawer();});
  drawerClose?.addEventListener('click',closeDrawer);backdrop?.addEventListener('click',closeDrawer);
  drawer?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeDrawer));
  cartBtn?.addEventListener('click',()=>setTimeout(renderCart,0));
  document.addEventListener('click',e=>{
    const inc=e.target.closest('[data-inc]'),dec=e.target.closest('[data-dec]'),rem=e.target.closest('[data-remove]');
    if(inc){const x=cart.find(x=>x.id===inc.dataset.inc);if(x)x.qty++;renderCart();}
    if(dec){const x=cart.find(x=>x.id===dec.dataset.dec);if(x){x.qty--;if(x.qty<=0)cart=cart.filter(y=>y.id!==x.id)}renderCart();}
    if(rem){cart=cart.filter(x=>x.id!==rem.dataset.remove);renderCart();}
  });
  document.querySelectorAll('.add-cart').forEach((b,i)=>b.addEventListener('click',()=>{const x=cart[i%cart.length]||cart[0]; if(x)x.qty++;renderCart();}));
  $('#addDemoProduct')?.addEventListener('click',()=>{cart.push({id:'demo-'+Date.now(),name:'ساعت لوکس آوان',sub:'مدل نمونه فروشگاه',price:18500000,img:'assets/watch-3.jpg',qty:1});renderCart();});
  $('#checkoutCart')?.addEventListener('click',()=>{if(cart.length)location.hash='checkout';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
  renderCart();
})();

/* ===== AVAN V50 — product catalog ===== */
(function(){
  const grid=document.getElementById('productsGrid');
  const filters=document.getElementById('productFilters');
  const search=document.getElementById('productSearch');
  const sort=document.getElementById('productSort');
  const count=document.getElementById('productCount');
  const empty=document.getElementById('productsEmpty');
  if(!grid)return;
  let active='all';
  const faNum=n=>new Intl.NumberFormat('fa-IR').format(n);
  function apply(){
    const q=(search?.value||'').trim().toLowerCase();
    const cards=[...grid.querySelectorAll('.avan-product-card')];
    let visible=cards.filter(card=>{
      const cats=card.dataset.category||'';
      const hay=((card.dataset.name||'')+' '+(card.dataset.brand||'')).toLowerCase();
      return (active==='all'||cats.split(' ').includes(active)) && (!q||hay.includes(q));
    });
    const mode=sort?.value||'featured';
    visible.sort((a,b)=>{
      if(mode==='low')return +a.dataset.price-+b.dataset.price;
      if(mode==='high')return +b.dataset.price-+a.dataset.price;
      if(mode==='name')return (a.dataset.name||'').localeCompare(b.dataset.name||'','fa');
      return cards.indexOf(a)-cards.indexOf(b);
    });
    cards.forEach(c=>c.hidden=true); visible.forEach(c=>{c.hidden=false;grid.appendChild(c)});
    if(count)count.textContent=faNum(visible.length)+' محصول';
    if(empty)empty.hidden=visible.length!==0;
  }
  filters?.querySelectorAll('button[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    active=btn.dataset.filter;filters.querySelectorAll('button').forEach(x=>x.classList.remove('is-active'));btn.classList.add('is-active');apply();
  }));
  search?.addEventListener('input',apply);sort?.addEventListener('change',apply);apply();
  grid.addEventListener('click',e=>{const w=e.target.closest('.product-wish');if(w){w.classList.toggle('is-liked');w.textContent=w.classList.contains('is-liked')?'♥':'♡';w.style.color=w.classList.contains('is-liked')?'#efc763':'';}});
})();
