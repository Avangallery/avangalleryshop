/* AVAN GALLERY — clean header + cart interactions */
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const cartBtn = $('#headerCart');
  const cartPop = $('#cartPopover');
  const accountBtn = $('#headerAccount');
  const searchForm = $('#headerSearch');
  const searchInput = $('#headerSearchInput');
  const searchPop = $('#searchPopover');
  const cartBackdrop = $('#cartBackdrop');
  const couponInput = $('#couponInput');
  const applyCoupon = $('#applyCoupon');
  const clearCartBtn = $('#clearCart');

  let storedProducts = [];
  try { storedProducts = JSON.parse(localStorage.getItem('avan_admin_products_v62') || '[]'); } catch (_) { storedProducts = []; }
  fetch('/api/products',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{
    if(!d || !Array.isArray(d.products)) return;
    const next = JSON.stringify(d.products);
    const prev = localStorage.getItem('avan_admin_products_v62') || '[]';
    if(next !== prev){ localStorage.setItem('avan_admin_products_v62', next); window.location.reload(); }
  }).catch(()=>{});
  const PRODUCTS = Object.fromEntries(storedProducts.map(p => [String(p.id), {
    id: String(p.id), name: p.name, sub: p.desc || p.brand || 'محصول آوان', price: Number(p.price)||0, img: p.image || 'assets/watch-1.jpg', brand: p.brand || '', category: p.category || 'all'
  }]));

  let cart = [];
  try {
    const saved = JSON.parse(localStorage.getItem('avan_cart_v55') || '[]');
    cart = Array.isArray(saved) ? saved.filter(x => x && PRODUCTS[x.id]).map(x => ({ ...PRODUCTS[x.id], qty: Math.max(1, Number(x.qty) || 1) })) : [];
  } catch (_) { cart = []; }

  function formatPrice(value) {
    return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
  }

  function saveCart() {
    localStorage.setItem('avan_cart_v55', JSON.stringify(cart.map(({ id, qty }) => ({ id, qty }))));
  }

  function closePopover(pop, btn) {
    if (!pop) return;
    pop.classList.remove('is-open');
    pop.setAttribute('aria-hidden', 'true');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (pop === cartPop) {
      cartBackdrop?.classList.remove('is-open');
      cartBackdrop?.setAttribute('aria-hidden','true');
      document.documentElement.classList.remove('cart-open');
      document.body.classList.remove('cart-open');
    }
  }

  function closeAll(except) {
    [[cartPop, cartBtn], [searchPop, null]].forEach(([pop, btn]) => {
      if (pop && pop !== except) closePopover(pop, btn);
    });
  }

  function positionCart() {
    // The cart is a fixed full-height drawer; no viewport positioning is needed.
  }

  function renderCart() {
    const body = $('#cartPopoverBody');
    const countEl = $('#cartCount');
    const titleCount = $('#cartTitleCount');
    const totalEl = $('#cartTotal');
    if (!body) return;

    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (countEl) {
      countEl.textContent = new Intl.NumberFormat('fa-IR').format(count);
      countEl.style.display = count > 0 ? 'block' : 'none';
    }
    if (titleCount) titleCount.textContent = new Intl.NumberFormat('fa-IR').format(count);
    if (totalEl) totalEl.textContent = formatPrice(total);

    if (!cart.length) {
      body.innerHTML = '<div class="v43-empty"><strong>سبد خرید شما خالی است.</strong><span>محصولی به سبد خرید اضافه نشده است.</span></div>';
      if (clearCartBtn) clearCartBtn.disabled = true;
    } else {
      if (clearCartBtn) clearCartBtn.disabled = false;
      body.innerHTML = `<div class="v55-cart-list">${cart.map(item => `
        <article class="v55-cart-item">
          <img src="${item.img}" alt="${item.name}">
          <div class="v55-cart-info">
            <button type="button" class="v55-remove" data-cart-remove="${item.id}" aria-label="حذف">×</button>
            <strong>${item.name}</strong>
            <small>${item.sub}</small>
            <div class="v55-cart-row">
              <div class="v55-qty">
                <button type="button" data-cart-inc="${item.id}" aria-label="افزایش">+</button>
                <span>${new Intl.NumberFormat('fa-IR').format(item.qty)}</span>
                <button type="button" data-cart-dec="${item.id}" aria-label="کاهش">−</button>
              </div>
              <b class="v55-line-price">${formatPrice(item.price * item.qty)}</b>
            </div>
          </div>
        </article>`).join('')}</div>`;
    }
    saveCart();
    if (cartBackdrop) cartBackdrop.classList.toggle('is-open', cartPop?.classList.contains('is-open'));
    positionCart();
  }

  function openCart() {
    closeAll(cartPop);
    cartPop.classList.add('is-open');
    cartPop.setAttribute('aria-hidden', 'false');
    cartBtn.setAttribute('aria-expanded', 'true');
    cartBtn.classList.add('is-active');
    cartBackdrop?.classList.add('is-open');
    cartBackdrop?.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('cart-open');
    document.body.classList.add('cart-open');
    renderCart();
    requestAnimationFrame(positionCart);
  }

  function toggleCart() {
    if (cartPop.classList.contains('is-open')) closePopover(cartPop, cartBtn);
    else openCart();
  }

  cartBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleCart();
  });

  document.addEventListener('click', (event) => {
    const add = event.target.closest('.add-cart');
    const inc = event.target.closest('[data-cart-inc]');
    const dec = event.target.closest('[data-cart-dec]');
    const remove = event.target.closest('[data-cart-remove]');

    if (add) {
      const product = PRODUCTS[add.dataset.productId];
      if (product) {
        const existing = cart.find(x => x.id === product.id);
        if (existing) existing.qty += 1;
        else cart.push({ ...product, qty: 1 });
        renderCart();
        openCart();
      }
      return;
    }
    if (inc || dec || remove) {
      const id = (inc || dec || remove).dataset.cartInc || (inc || dec || remove).dataset.cartDec || (inc || dec || remove).dataset.cartRemove;
      const item = cart.find(x => x.id === id);
      if (remove) cart = cart.filter(x => x.id !== id);
      else if (item && inc) item.qty += 1;
      else if (item && dec) {
        item.qty -= 1;
        if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
      }
      renderCart();
      return;
    }

    if (!event.target.closest('.v43-utility,.v43-search')) closeAll(null);
  });

  applyCoupon?.addEventListener('click', () => {
    const code = (couponInput?.value || '').trim();
    if (!code) {
      couponInput?.focus();
      return;
    }
    applyCoupon.textContent = 'اعمال شد';
    setTimeout(() => { if (applyCoupon) applyCoupon.textContent = 'اعمال'; }, 1200);
  });

  clearCartBtn?.addEventListener('click', () => {
    if (!cart.length) return;
    cart = [];
    renderCart();
  });

  $('#checkoutCart')?.addEventListener('click', () => {
    if (!cart.length) return;
    location.hash = 'checkout';
  });

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim();
    if (!q) { closePopover(searchPop); return; }
    const names = Object.values(PRODUCTS).filter(x => (x.name + ' ' + x.sub).includes(q));
    const list = names.length ? names : Object.values(PRODUCTS).slice(0, 3);
    $('#searchResults').innerHTML = list.map(x => `<a class="v43-result" href="#products"><img src="${x.img}" alt=""><span><b>${x.name}</b><small>${x.sub}</small></span></a>`).join('');
    searchPop.classList.add('is-open');
    searchPop.setAttribute('aria-hidden', 'false');
  });

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    $('#products')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('[data-close-pop]').forEach(button => button.addEventListener('click', () => {
    closePopover($('#' + button.dataset.closePop), button.closest('.v43-popover')?.id === 'cartPopover' ? cartBtn : null);
  }));

  cartBackdrop?.addEventListener('click', () => closePopover(cartPop, cartBtn));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAll(null);
  });

  window.addEventListener('resize', positionCart);
  window.addEventListener('scroll', positionCart, { passive: true });
  renderCart();
  // V62 dynamic catalog: products are supplied by the admin panel.
  const productGrid = $('#productsGrid');
  if (productGrid && Object.keys(PRODUCTS).length) {
    productGrid.innerHTML = Object.values(PRODUCTS).map(p => `
      <article class="avan-product-card" data-name="${p.name}" data-category="${p.category}" data-price="${p.price}">
        <div class="product-media"><img src="${p.img}" alt="${p.name}"><button class="product-heart" type="button">♡</button></div>
        <div class="product-body"><small>${p.brand}</small><h3>${p.name}</h3><p>${p.sub}</p><strong>${formatPrice(p.price)}</strong><button class="add-cart" data-product-id="${p.id}" type="button">افزودن به سبد ←</button></div>
      </article>`).join('');
  }
  if ($('#productsEmpty')) $('#productsEmpty').hidden = Object.keys(PRODUCTS).length > 0;
  // V60 product catalog: local filtering, search, sorting and wishlist.
  let activeProductFilter = 'all';
  const productCards = () => [...document.querySelectorAll('.avan-product-card')];
  function refreshProducts() {
    const q = ($('#productsLocalSearch')?.value || '').trim().toLowerCase();
    const sort = $('#productsSort')?.value || 'featured';
    const grid = $('#productsGrid');
    if (!grid) return;
    const cards = productCards();
    cards.forEach(card => {
      const category = (card.dataset.category || '').toLowerCase();
      const name = (card.dataset.name || '').toLowerCase();
      const matchesFilter = activeProductFilter === 'all' || category.includes(activeProductFilter);
      const matchesSearch = !q || name.includes(q) || category.includes(q);
      card.hidden = !(matchesFilter && matchesSearch);
    });
    const visible = cards.filter(c => !c.hidden);
    visible.sort((a,b) => {
      if (sort === 'low') return Number(a.dataset.price) - Number(b.dataset.price);
      if (sort === 'high') return Number(b.dataset.price) - Number(a.dataset.price);
      if (sort === 'name') return (a.dataset.name||'').localeCompare(b.dataset.name||'', 'fa');
      return 0;
    }).forEach(card => grid.appendChild(card));
    const count = $('#productsCount');
    if (count) count.textContent = `${new Intl.NumberFormat('fa-IR').format(visible.length)} محصول`;
    const empty = $('#productsEmpty');
    if (empty) empty.hidden = visible.length !== 0;
  }
  $$('.product-filter').forEach(btn => btn.addEventListener('click', () => {
    $$('.product-filter').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    activeProductFilter = btn.dataset.filter || 'all';
    refreshProducts();
  }));
  $('#productsLocalSearch')?.addEventListener('input', refreshProducts);
  $('#productsSort')?.addEventListener('change', refreshProducts);
  $$('.product-heart').forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    btn.textContent = btn.classList.contains('active') ? '♥' : '♡';
  }));
  refreshProducts();

})();

// V98 — stable internal navigation + online support
(function(){
  const supportModal = document.getElementById('onlineSupportModal');
  const openSupport = document.getElementById('openOnlineSupport');
  let savedScrollY = 0;
  function openSupportModal(){
    if(!supportModal) return;
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    supportModal.classList.add('is-open');
    supportModal.setAttribute('aria-hidden','false');
    document.body.classList.add('online-support-open');
    document.body.style.position='fixed';
    document.body.style.top=`-${savedScrollY}px`;
    document.body.style.left='0';
    document.body.style.right='0';
    document.body.style.width='100%';
  }
  function closeSupportModal(){
    if(!supportModal) return;
    supportModal.classList.remove('is-open');
    supportModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('online-support-open');
    document.body.style.position='';
    document.body.style.top='';
    document.body.style.left='';
    document.body.style.right='';
    document.body.style.width='';
    window.scrollTo(0, savedScrollY);
  }
  openSupport?.addEventListener('click', openSupportModal);
  supportModal?.querySelectorAll('[data-close-support]').forEach(el=>el.addEventListener('click', closeSupportModal));
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeSupportModal();});

  function headerOffset(){
    const header=document.querySelector('.site-header');
    return Math.max(12, Math.min(header?.getBoundingClientRect().height || 0, 110));
  }
  function navigateToHash(href){
    const target=document.querySelector(href);
    if(!target) return false;
    const rect=target.getBoundingClientRect();
    const vh=window.innerHeight || document.documentElement.clientHeight;
    // If the target is already visible, don't move the page at all.
    if(rect.top >= 0 && rect.bottom <= vh) return true;
    const y=Math.max(0, window.scrollY + rect.top - headerOffset() - 10);
    window.scrollTo({top:y,behavior:'smooth'});
    // replaceState updates the URL without triggering native hash scrolling.
    if(history.replaceState) history.replaceState(null,'',href);
    return true;
  }

  document.addEventListener('click', function(e){
    const a=e.target.closest('a[href^="#"]');
    if(!a) return;
    const href=a.getAttribute('href');
    if(!href || href==='#' || href==='#privacy' || href==='#faq') return;
    if(document.querySelector(href)){
      e.preventDefault();
      navigateToHash(href);
    }
  }, true);
})();


// V101 — FAQ + privacy modals + stable footer links
(function(){
  const faq = document.getElementById('faqModal');
  const privacy = document.getElementById('privacyModal');
  let active = null;
  let savedY = 0;
  function openInfo(modal){
    if(!modal) return;
    savedY = window.scrollY || document.documentElement.scrollTop || 0;
    active = modal;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('avan-info-open');
    document.body.style.position='fixed';
    document.body.style.top=`-${savedY}px`;
    document.body.style.left='0'; document.body.style.right='0'; document.body.style.width='100%';
  }
  function closeInfo(){
    if(!active) return;
    active.classList.remove('is-open');
    active.setAttribute('aria-hidden','true');
    active=null;
    document.body.classList.remove('avan-info-open');
    document.body.style.position=''; document.body.style.top=''; document.body.style.left=''; document.body.style.right=''; document.body.style.width='';
    window.scrollTo(0,savedY);
  }
  document.querySelectorAll('[data-close-info]').forEach(el=>el.addEventListener('click',closeInfo));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeInfo(); });
  document.addEventListener('click',function(e){
    const a=e.target.closest('a[href="#faq"],a[href="#privacy"]');
    if(!a) return;
    e.preventDefault();
    const href=a.getAttribute('href');
    openInfo(href==='#faq' ? faq : privacy);
  },true);
})();

// V102 — premium support tabs, chat and ticket UI
(function(){
  const modal=document.getElementById('onlineSupportModal');
  if(!modal) return;
  const openers=document.querySelectorAll('#openOnlineSupport,[data-open-support]');
  const tabs=modal.querySelectorAll('[data-support-tab]');
  const panels=modal.querySelectorAll('[data-support-panel]');
  const chatForm=document.getElementById('avanChatForm');
  const chatInput=document.getElementById('avanChatInput');
  const messages=document.getElementById('avanChatMessages');
  const ticketForm=document.getElementById('avanTicketForm');
  const ticketSuccess=document.getElementById('ticketSuccess');
  function setTab(name){
    tabs.forEach(t=>{const active=t.dataset.supportTab===name;t.classList.toggle('is-active',active);t.setAttribute('aria-selected',active?'true':'false')});
    panels.forEach(p=>{p.hidden=p.dataset.supportPanel!==name;p.classList.toggle('is-active',!p.hidden)});
  }
  tabs.forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.supportTab)));
  function addMessage(text,type){
    const el=document.createElement('div');el.className='chat-bubble '+type;el.textContent=text;messages?.appendChild(el);if(messages)messages.scrollTop=messages.scrollHeight;
  }
  chatForm?.addEventListener('submit',e=>{
    e.preventDefault();const text=(chatInput?.value||'').trim();if(!text)return;addMessage(text,'user');chatInput.value='';
    setTimeout(()=>addMessage('پیامتون دریافت شد. پشتیبان آوان به‌زودی پاسخ می‌دهد. برای پاسخ فوری می‌توانید با 09965799499 تماس بگیرید.','agent'),450);
  });
  ticketForm?.addEventListener('submit',e=>{
    e.preventDefault();
    const data=new FormData(ticketForm);const id='AV-'+Date.now().toString().slice(-8);
    const ticket={id,name:data.get('name'),phone:data.get('phone'),subject:data.get('subject'),message:data.get('message'),createdAt:new Date().toISOString()};
    try{const old=JSON.parse(localStorage.getItem('avan_support_tickets')||'[]');old.unshift(ticket);localStorage.setItem('avan_support_tickets',JSON.stringify(old.slice(0,30)));}catch{}
    if(ticketSuccess){ticketSuccess.hidden=false;ticketSuccess.textContent=`تیکت شما با موفقیت ثبت شد. شماره پیگیری: ${id} — برای ادامه پیگیری، این شماره را نزد خود نگه دارید.`;}
    ticketForm.reset();
  });
  document.addEventListener('click',e=>{
    const opener=e.target.closest('#openOnlineSupport,[data-open-support]');
    if(!opener)return;
    e.preventDefault();
    // The existing V98 handler opens the modal; this only resets the default tab.
    setTab('chat');
  });
  setTab('chat');
})();
