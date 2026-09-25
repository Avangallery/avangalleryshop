/* AVAN GALLERY — clean header + cart interactions */
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const cartBtn = $('#headerCart');
  const cartPop = $('#cartPopover');
  const accountBtn = $('#headerAccount');
  const accountPop = $('#accountPopover');
  const searchForm = $('#headerSearch');
  const searchInput = $('#headerSearchInput');
  const searchPop = $('#searchPopover');

  const PRODUCTS = {
    'avan-classic': { id: 'avan-classic', name: 'ساعت کلاسیک آوان', sub: 'مدل کلاسیک فروشگاه', price: 12900000, img: 'assets/watch-3.jpg' },
    'avan-luxury': { id: 'avan-luxury', name: 'ساعت لوکس آوان', sub: 'مدل لوکس فروشگاه', price: 18500000, img: 'assets/watch-1.jpg' },
    'tissot-prx': { id: 'tissot-prx', name: 'Tissot PRX', sub: 'ساعت مجی مردانه', price: 18500000, img: 'assets/watch-1.jpg' },
    'seiko-5': { id: 'seiko-5', name: 'Seiko 5 Sports', sub: 'ساعت اسپرت', price: 24600000, img: 'assets/watch-2.jpg' }
  };

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
  }

  function closeAll(except) {
    [[cartPop, cartBtn], [accountPop, accountBtn], [searchPop, null]].forEach(([pop, btn]) => {
      if (pop && pop !== except) closePopover(pop, btn);
    });
  }

  function positionCart() {
    if (!cartPop || !cartBtn || !cartPop.classList.contains('is-open')) return;
    const r = cartBtn.getBoundingClientRect();
    const width = Math.min(460, window.innerWidth - 24);
    const right = Math.max(12, window.innerWidth - r.right);
    cartPop.style.position = 'fixed';
    cartPop.style.top = `${Math.round(r.bottom + 12)}px`;
    cartPop.style.right = `${Math.round(right)}px`;
    cartPop.style.left = 'auto';
    cartPop.style.width = `${width}px`;
    cartPop.style.maxHeight = `${Math.max(260, window.innerHeight - r.bottom - 24)}px`;
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
      body.innerHTML = '<div class="v43-empty"><strong>سبد خرید خالی است</strong><span>هنوز محصولی به سبد اضافه نکرده‌اید.</span></div>';
    } else {
      body.innerHTML = `<div class="v55-cart-list">${cart.map(item => `
        <article class="v55-cart-item">
          <img src="${item.img}" alt="${item.name}">
          <div class="v55-cart-info">
            <strong>${item.name}</strong>
            <small>${item.sub}</small>
            <div class="v55-qty">
              <button type="button" data-cart-inc="${item.id}" aria-label="افزایش">+</button>
              <span>${new Intl.NumberFormat('fa-IR').format(item.qty)}</span>
              <button type="button" data-cart-dec="${item.id}" aria-label="کاهش">−</button>
            </div>
          </div>
          <div class="v55-cart-side">
            <button type="button" class="v55-remove" data-cart-remove="${item.id}" aria-label="حذف">×</button>
            <b>${formatPrice(item.price * item.qty)}</b>
          </div>
        </article>`).join('')}</div>`;
    }
    saveCart();
    positionCart();
  }

  function openCart() {
    closeAll(cartPop);
    cartPop.classList.add('is-open');
    cartPop.setAttribute('aria-hidden', 'false');
    cartBtn.setAttribute('aria-expanded', 'true');
    cartBtn.classList.add('is-active');
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

  $('#checkoutCart')?.addEventListener('click', () => {
    if (!cart.length) return;
    location.hash = 'checkout';
  });

  $('#addDemoProduct')?.addEventListener('click', () => {
    const product = PRODUCTS['avan-luxury'];
    const existing = cart.find(x => x.id === product.id);
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });
    openCart();
  });

  accountBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const open = accountPop.classList.contains('is-open');
    closeAll(open ? null : accountPop);
    if (!open) {
      accountPop.classList.add('is-open');
      accountPop.setAttribute('aria-hidden', 'false');
      accountBtn.setAttribute('aria-expanded', 'true');
      accountBtn.classList.add('is-active');
    }
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

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAll(null);
  });

  window.addEventListener('resize', positionCart);
  window.addEventListener('scroll', positionCart, { passive: true });
  renderCart();
})();
