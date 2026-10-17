const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], fa=n=>new Intl.NumberFormat('fa-IR').format(Number(n)||0);
const KEYS={products:'avan_admin_products_v62',categories:'avan_admin_categories_v62',brands:'avan_admin_brands_v62',coupons:'avan_admin_coupons_v62'};
let products=[];
let serverReady=false;
let categories=JSON.parse(localStorage.getItem(KEYS.categories)||'null')||[{id:'classic',name:'ساعت کلاسیک'},{id:'luxury',name:'ساعت لوکس'},{id:'sport',name:'ساعت اسپرت'},{id:'men',name:'ساعت مردانه'},{id:'women',name:'ساعت زنانه'}];
let brands=JSON.parse(localStorage.getItem(KEYS.brands)||'null')||['TISSOT','CITIZEN','CASIO','SEIKO','ROLEX','OMEGA','CARTIER','LONGINES','TAG HEUER','RADO','HAMILTON','CERTINA','MIDO','ORIENT','SWATCH','FOSSIL','TIMEX','BULOVA','G-SHOCK'];
let coupons=JSON.parse(localStorage.getItem(KEYS.coupons)||'[]'); let current='dashboard';
const save=()=>{localStorage.setItem(KEYS.products,JSON.stringify(products));localStorage.setItem(KEYS.categories,JSON.stringify(categories));localStorage.setItem(KEYS.brands,JSON.stringify(brands));localStorage.setItem(KEYS.coupons,JSON.stringify(coupons));$('#productsBadge').textContent=fa(products.length)};
async function loadProducts(){try{const r=await fetch('/api/products',{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();products=Array.isArray(d.products)?d.products:[];serverReady=true;save();render();}catch(_){serverReady=false;save();}}
async function apiProduct(method,id,data){const r=await fetch('/api/products'+(id?'/'+encodeURIComponent(id):''),{method,headers:{'content-type':'application/json'},body:data?JSON.stringify(data):undefined});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطا در ارتباط با D1');return d;}
const head=(t,s,a='')=>`<div class="head"><div><h2>${t}</h2><p>${s}</p></div>${a}</div>`;
function dashboard(){
  const totalValue=products.reduce((sum,p)=>sum+(Number(p.price)||0)*(Number(p.stock)||0),0);
  const inStock=products.filter(p=>Number(p.stock)>3).length;
  const lowStock=products.filter(p=>Number(p.stock)>0&&Number(p.stock)<=3).length;
  const outStock=products.filter(p=>Number(p.stock)<=0).length;
  const recent=[...products].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,5);
  const maxStock=Math.max(1,...[7,12,9,15,10,13,8]);
  const chart=[7,12,9,15,10,13,8];
  return `
  <section class="dashboard-hero">
    <div class="dashboard-hero-copy">
      <span class="eyebrow">AVAN GALLERY • مدیریت فروشگاه</span>
      <h2>سلام، مدیر عزیز <span>✦</span></h2>
      <p>به پنل مدیریت آوان گالری خوش آمدید. اینجا همه‌چیز برای مدیریت حرفه‌ای فروشگاه ساعت شما آماده است.</p>
      <div class="hero-actions">
        <button class="#ffffff" data-add-product>＋ افزودن محصول</button>
        <button class="ghost" data-page-go="tickets">پشتیبانی مشتریان</button>
      </div>
    </div>
    <div class="dashboard-hero-watch">
      <img src="/assets/watch-background-clean.jpg" alt="AVAN GALLERY">
      <div class="hero-watch-overlay"></div>
      <div class="hero-brand-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" stroke-opacity=".55"/><path d="M24 13v11l8 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><b>AVAN</b><small>GALLERY</small></div>
    </div>
  </section>

  <div class="dashboard-section-head">
    <div><h3>نمای کلی فروشگاه</h3><p>وضعیت فعلی آوان گالری</p></div>
    <span class="live-chip"><i></i> سیستم آنلاین</span>
  </div>

  <div class="dashboard-kpis">
    <article class="dashboard-kpi">
      <div class="kpi-icon #ffffff-icon">⌚</div><div><small>کل محصولات</small><strong>${fa(products.length)}</strong><em>محصول ثبت شده</em></div>
    </article>
    <article class="dashboard-kpi">
      <div class="kpi-icon blue-icon">▣</div><div><small>موجود در انبار</small><strong>${fa(inStock)}</strong><em>وضعیت مناسب</em></div>
    </article>
    <article class="dashboard-kpi">
      <div class="kpi-icon amber-icon">!</div><div><small>موجودی کم</small><strong>${fa(lowStock)}</strong><em>نیازمند بررسی</em></div>
    </article>
    <article class="dashboard-kpi">
      <div class="kpi-icon #ffffff-icon">×</div><div><small>ناموجود</small><strong>${fa(outStock)}</strong><em>نیازمند تأمین</em></div>
    </article>
    <article class="dashboard-kpi wide-value">
      <div class="kpi-icon #ffffff-icon">₮</div><div><small>ارزش موجودی</small><strong>${fa(totalValue)}</strong><em>تومان</em></div>
    </article>
  </div>

  <div class="dashboard-grid">
    <section class="panel dashboard-chart-panel">
      <div class="panel-heading">
        <div><h3>فروش ۷ روز اخیر</h3><p>نمایش آماری فروشگاه</p></div>
        <button class="period-chip">۷ روز اخیر⌄</button>
      </div>
      <div class="sales-chart">
        ${chart.map((h,i)=>`<div class="chart-col"><span>${fa(h*10)}</span><i style="height:${Math.round(h/maxStock*100)}%"></i><small>${['۵ مهر','۶ مهر','۷ مهر','۸ مهر','۹ مهر','۱۰ مهر','۱۱ مهر'][i]}</small></div>`).join('')}
      </div>
    </section>

    <section class="panel dashboard-status-panel">
      <div class="panel-heading">
        <div><h3>وضعیت فروشگاه</h3><p>موارد مهمی که باید بررسی شوند</p></div>
      </div>
      <div class="status-list">
        <div class="status-row"><span class="status-dot #ffffff"></span><div><b>اتصال فروشگاه</b><small>D1 و Worker فعال هستند</small></div><strong>فعال</strong></div>
        <div class="status-row"><span class="status-dot #ffffff"></span><div><b>محصولات</b><small>${products.length ? 'اطلاعات محصولات در دسترس است' : 'هنوز محصولی ثبت نشده است'}</small></div><strong>${fa(products.length)}</strong></div>
        <div class="status-row"><span class="status-dot ${lowStock?'#ffffff':'#ffffff'}"></span><div><b>موجودی کم</b><small>${lowStock ? 'چند محصول نیازمند بررسی است' : 'موردی برای بررسی نیست'}</small></div><strong>${fa(lowStock)}</strong></div>
      </div>
      <button class="dashboard-link" data-page-go="products">مشاهده مدیریت محصولات ←</button>
    </section>
  </div>

  <section class="panel dashboard-products-panel">
    <div class="panel-heading">
      <div><h3>آخرین محصولات</h3><p>آخرین کالاهای ثبت‌شده در فروشگاه</p></div>
      <button class="ghost" data-page-go="products">مشاهده همه</button>
    </div>
    ${recent.length ? `<div class="recent-products">${recent.map(p=>{
      const meta=stockMeta(p.stock);
      return `<div class="recent-product"><img src="${productImage(p.image)}" alt=""><div><b>${esc(p.name||'بدون نام')}</b><small>${esc(p.brand||'بدون برند')} • SKU: ${esc(p.sku||'—')}</small></div><strong>${fa(p.price)} <small>تومان</small></strong><span class="status-chip ${meta.cls}"><i></i>${meta.label}</span></div>`;
    }).join('')}</div>` : `<div class="dashboard-empty"><div>⌚</div><b>هنوز محصولی ثبت نشده است</b><span>از بخش مدیریت محصولات اولین ساعت آوان گالری را اضافه کنید.</span><button class="#ffffff" data-page-go="products">افزودن اولین محصول</button></div>`}
  </section>`;
}

function productImage(src){
  const value=String(src||'assets/watch-1.jpg').trim();
  if(/^https?:\/\//i.test(value)||value.startsWith('data:')||value.startsWith('/')) return value;
  return '/'+value.replace(/^\.\//,'').replace(/^\/+/, '');
}
const brandLogoMap={
  'TISSOT':'tissot.svg','CITIZEN':'citizen.svg','CASIO':'casio.svg','SEIKO':'seiko.svg','ROLEX':'rolex.svg','OMEGA':'omega.svg','CARTIER':'cartier.svg','LONGINES':'longines.svg','TAG HEUER':'tag-heuer.svg','RADO':'rado.svg','HAMILTON':'hamilton.svg','CERTINA':'certina.svg','MIDO':'mido.svg','ORIENT':'orient.svg','SWATCH':'swatch.svg','FOSSIL':'fossil.svg','TIMEX':'timex.svg','BULOVA':'bulova.svg','G-SHOCK':'g-shock.svg','MICHAEL KORS':'michael-kors.svg','EMPORIO ARMANI':'emporio-armani.svg','TOMMY HILFIGER':'tommy-hilfiger.svg','DANIEL WELLINGTON':'daniel-wellington.svg','MOVADO':'movado.svg','FREDERIQUE CONSTANT':'frederique-constant.svg','INVICTA':'invicta.svg','DIESEL':'diesel.svg','GUESS':'guess.svg'
};
function brandKey(value){return String(value||'').trim().toUpperCase().replace(/\s+/g,' ')}
function brandLogo(value){const file=brandLogoMap[brandKey(value)];return file?`/assets/brands/${file}`:''}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}
function stockMeta(stock){
  const n=Number(stock)||0;
  if(n<=0) return {label:'ناموجود',cls:'out'};
  if(n<=3) return {label:'موجودی کم',cls:'low'};
  return {label:'موجود',cls:'ok'};
}
function productsPage(){
  const totalValue=products.reduce((sum,p)=>sum+(Number(p.price)||0)*(Number(p.stock)||0),0);
  const inStock=products.filter(p=>Number(p.stock)>3).length;
  const lowStock=products.filter(p=>Number(p.stock)>0&&Number(p.stock)<=3).length;
  const outStock=products.filter(p=>Number(p.stock)<=0).length;
  const brandOptions=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
  return `
  <div class="product-page-intro">
    <div>
      <span class="eyebrow">AVAN GALLERY • CATALOG</span>
      <h2>مدیریت محصولات</h2>
      <p>افزودن، ویرایش، دسته‌بندی، قیمت‌گذاری و مدیریت موجودی محصولات فروشگاه.</p>
    </div>
    <div class="product-intro-actions">
      <span class="live-chip"><i></i> اتصال D1 فعال</span>
      <button class="#ffffff" id="newProduct">＋ افزودن محصول جدید</button>
    </div>
  </div>

  <div class="product-summary">
    <div class="product-stat"><span class="stat-icon #ffffff-icon">▣</span><div><small>ارزش کل موجودی</small><b>${fa(totalValue)} <em>تومان</em></b></div></div>
    <div class="product-stat"><span class="stat-icon blue-icon">⌚</span><div><small>کل محصولات</small><b>${fa(products.length)} <em>محصول</em></b></div></div>
    <div class="product-stat"><span class="stat-icon #ffffff-icon">✓</span><div><small>موجود در انبار</small><b>${fa(inStock)} <em>محصول</em></b></div></div>
    <div class="product-stat"><span class="stat-icon amber-icon">!</span><div><small>موجودی کم</small><b>${fa(lowStock)} <em>محصول</em></b></div></div>
    <div class="product-stat"><span class="stat-icon #ffffff-icon">×</span><div><small>ناموجود</small><b>${fa(outStock)} <em>محصول</em></b></div></div>
  </div>

  <div class="product-workspace">
    <aside class="product-filters panel">
      <div class="filter-title"><div><h3>فیلتر پیشرفته</h3><small>محصولات را سریع‌تر پیدا کنید</small></div><button class="filter-reset" id="resetFilters">پاک کردن</button></div>
      <label class="filter-label">بازه قیمت (تومان)</label>
      <div class="price-inputs"><input id="minPrice" type="number" min="0" placeholder="از"><input id="maxPrice" type="number" min="0" placeholder="تا"></div>
      <div class="filter-block"><strong>وضعیت موجودی</strong>
        <label class="checkline"><input type="checkbox" value="all" class="stockFilter" checked><span>همه</span><b>${fa(products.length)}</b></label>
        <label class="checkline"><input type="checkbox" value="ok" class="stockFilter"><span>موجود</span><b>${fa(inStock)}</b></label>
        <label class="checkline"><input type="checkbox" value="low" class="stockFilter"><span>موجودی کم</span><b>${fa(lowStock)}</b></label>
        <label class="checkline"><input type="checkbox" value="out" class="stockFilter"><span>ناموجود</span><b>${fa(outStock)}</b></label>
      </div>
      <div class="filter-block"><strong>دسته‌بندی‌ها</strong>
        <label class="checkline"><input type="checkbox" value="all" class="catFilter" checked><span>همه</span><b>${fa(products.length)}</b></label>
        ${categories.map(c=>`<label class="checkline"><input type="checkbox" value="${esc(c.id)}" class="catFilter"><span>${esc(c.name)}</span><b>${fa(products.filter(p=>p.category===c.id).length)}</b></label>`).join('')}
      </div>
      <div class="filter-block"><strong>برندها</strong>
        <label class="checkline"><input type="checkbox" value="all" class="brandFilter" checked><span>همه</span><b>${fa(products.length)}</b></label>
        ${brandOptions.slice(0,18).map(b=>`<label class="checkline"><input type="checkbox" value="${esc(b)}" class="brandFilter"><span>${esc(b)}</span><b>${fa(products.filter(p=>p.brand===b).length)}</b></label>`).join('')}
      </div>
    </aside>

    <section class="product-main">
      <div class="product-tools panel">
        <div class="search-box"><span>⌕</span><input id="pSearch" placeholder="جستجوی نام محصول، برند یا SKU ..."></div>
        <select id="pSort"><option value="new">جدیدترین</option><option value="priceAsc">قیمت: کم به زیاد</option><option value="priceDesc">قیمت: زیاد به کم</option><option value="stockAsc">موجودی: کم به زیاد</option><option value="stockDesc">موجودی: زیاد به کم</option><option value="name">نام محصول</option></select>
        <button class="ghost" id="exportProducts">خروجی JSON</button>
      </div>

      <section class="panel products-panel">
        <div class="products-table-head">
          <div><h3>فهرست محصولات</h3><small id="productsCount">${fa(products.length)} محصول</small></div>
          <div class="products-head-actions"><span class="server-chip">● اتصال D1 فعال</span><span class="catalog-tip">مدیریت کامل کاتالوگ</span></div>
        </div>
        <div class="table-wrap"><div id="productList" class="products-table"></div></div>
      </section>
    </section>
  </div>`;
}

function selectedValues(selector){return $$(selector).filter(x=>x.checked).map(x=>x.value)}
function renderProducts(){
  const box=$('#productList'); if(!box)return;
  const q=($('#pSearch')?.value||'').trim().toLowerCase();
  const min=Number($('#minPrice')?.value)||0, max=Number($('#maxPrice')?.value)||Infinity;
  const sort=$('#pSort')?.value||'new';
  const stockVals=selectedValues('.stockFilter');
  const catVals=selectedValues('.catFilter');
  const brandVals=selectedValues('.brandFilter');
  const stockAll=stockVals.includes('all')||!stockVals.length, catAll=catVals.includes('all')||!catVals.length, brandAll=brandVals.includes('all')||!brandVals.length;
  let arr=products.filter(p=>{
    const n=Number(p.stock)||0, meta=stockMeta(n);
    const hay=`${p.name||''} ${p.brand||''} ${p.sku||''}`.toLowerCase();
    return (!q||hay.includes(q)) && (!catAll&&catVals.length?catVals.includes(p.category):true) && (!brandAll&&brandVals.length?brandVals.includes(p.brand):true) && (!stockAll&&stockVals.length?stockVals.includes(meta.cls):true) && (Number(p.price)||0)>=min && (Number(p.price)||0)<=max;
  });
  arr.sort((a,b)=>{
    if(sort==='priceAsc')return Number(a.price)-Number(b.price);
    if(sort==='priceDesc')return Number(b.price)-Number(a.price);
    if(sort==='stockAsc')return Number(a.stock)-Number(b.stock);
    if(sort==='stockDesc')return Number(b.stock)-Number(a.stock);
    if(sort==='name')return String(a.name||'').localeCompare(String(b.name||''),'fa');
    return String(b.created_at||'').localeCompare(String(a.created_at||''));
  });
  if($('#productsCount')) $('#productsCount').textContent=`${fa(arr.length)} محصول از ${fa(products.length)}`;
  box.innerHTML=arr.length?`<div class="products-header"><span>محصول</span><span>دسته‌بندی</span><span>برند</span><span>قیمت</span><span>موجودی</span><span>وضعیت</span><span>تاریخ ثبت</span><span>عملیات</span></div>`+arr.map(p=>{
    const meta=stockMeta(p.stock); const date=p.created_at?new Date(String(p.created_at).replace(' ','T')+'Z'):null; const dateText=date&&!Number.isNaN(date.getTime())?new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(date):'—';
    return `<article class="product-item">
      <div class="product-name-cell"><img src="${productImage(p.image)}" alt=""><div><strong>${p.name||'بدون نام'}</strong><small>SKU: ${p.sku||'—'}</small></div></div>
      <div class="cell-muted">${categories.find(c=>c.id===p.category)?.name||p.category||'—'}</div>
      <div class="cell-brand brand-cell">${brandLogo(p.brand)?`<span class="brand-logo-wrap"><img src="${brandLogo(p.brand)}" alt="${esc(p.brand)}" loading="lazy"></span>`:''}<span>${esc(p.brand||'—')}</span></div>
      <div class="price-cell">${fa(p.price)}<small>تومان</small></div>
      <div><span class="stock-number ${meta.cls}">${fa(p.stock)}</span></div>
      <div><span class="status-chip ${meta.cls}"><i></i>${meta.label}</span></div>
      <div class="cell-muted">${dateText}</div>
      <div class="row-actions"><button class="icon-action view" title="معرفی و مشاهده" data-view="${p.id}">◉</button><button class="icon-action edit" title="ویرایش" data-edit="${p.id}">✎</button><button class="icon-action delete" title="حذف" data-del="${p.id}">⌫</button></div>
    </article>`;
  }).join(''):`<div class="empty-products"><div class="empty-icon">⌚</div><h3>محصولی پیدا نشد</h3><p>فیلترها یا عبارت جستجو را تغییر دهید.</p></div>`;
}
function simple(title,sub,items){return head(title,sub)+`<div class="cards3">${items.map(x=>`<div class="info"><h4>${x[0]}</h4><p>${x[1]}</p></div>`).join('')}</div>`}
let customers=[];
let customerStats={total:0,recent:0,providers:[]};
async function loadCustomers(q=''){
  const r=await fetch('/api/admin/customers'+(q?`?q=${encodeURIComponent(q)}`:''),{cache:'no-store'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||'خطا در دریافت مشتریان');
  customers=Array.isArray(d.customers)?d.customers:[];
  customerStats=d.stats||{total:customers.length,recent:0,providers:[]};
}
function customerDate(v){
  if(!v)return '—';
  const raw=String(v);
  const d=new Date(raw.includes('T')?raw:(raw.includes(' ')?raw.replace(' ','T')+'Z':raw));
  return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'long',day:'numeric'}).format(d);
}
function customerProvider(c){const p=String(c?.provider||'unknown').toLowerCase(); return p==='google'?'Google':(p==='guest'?'مهمان':p==='unknown'?'نامشخص':p);}
function customerInitial(c){return esc(String(c?.name||c?.email||'م').trim().charAt(0).toUpperCase()||'م')}
function customerAvatar(c){return c?.avatar?`<img src="${esc(c.avatar)}" alt="" loading="lazy">`:`<span>${customerInitial(c)}</span>`}
function customersPage(){
  const googleCount=Number((customerStats.providers||[]).find(x=>x.provider==='google')?.n||0);
  return `
  <section class="customers-hero">
    <div class="customers-hero-copy">
      <span class="eyebrow">AVAN GALLERY • CRM</span>
      <h2>مدیریت مشتریان</h2>
      <p>حساب‌های ثبت‌شده، ورودهای گوگل و اطلاعات مشتریان آوان گالری را یکجا مدیریت کنید.</p>
      <div class="customer-hero-chips"><span><i></i> D1 متصل</span><span>حساب‌های ثبت‌شده</span></div>
    </div>
    <div class="customers-hero-art"><div class="customer-orbit one"></div><div class="customer-orbit two"></div><div class="customer-gem">AVAN<small>GALLERY</small></div></div>
  </section>
  <div class="customer-stats-grid">
    <article class="customer-stat"><span class="customer-stat-icon">♙</span><div><small>کل مشتریان</small><strong>${fa(customerStats.total)}</strong><em>حساب ثبت‌شده</em></div></article>
    <article class="customer-stat"><span class="customer-stat-icon #ffffff">✦</span><div><small>مشتریان جدید</small><strong>${fa(customerStats.recent)}</strong><em>در ۳۰ روز اخیر</em></div></article>
    <article class="customer-stat"><span class="customer-stat-icon #ffffff">G</span><div><small>ورود با Google</small><strong>${fa(googleCount)}</strong><em>حساب Google</em></div></article>
    <article class="customer-stat"><span class="customer-stat-icon blue">●</span><div><small>وضعیت اتصال</small><strong>فعال</strong><em>D1 / Worker</em></div></article>
  </div>
  <section class="panel customers-panel">
    <div class="customers-toolbar">
      <div><h3>فهرست مشتریان</h3><p id="customersCount">${fa(customers.length)} حساب نمایش داده می‌شود</p></div>
      <div class="customers-actions"><label class="customer-search"><span>⌕</span><input id="customerSearch" placeholder="جستجو بر اساس نام یا ایمیل..." autocomplete="off"></label><button class="ghost" id="refreshCustomers">↻ بروزرسانی</button></div>
    </div>
    <div id="customersList" class="customers-list"></div>
  </section>`;
}
function renderCustomers(){
  const box=$('#customersList'); if(!box)return;
  const q=($('#customerSearch')?.value||'').trim().toLowerCase();
  const arr=customers.filter(c=>`${c.name||''} ${c.email||''}`.toLowerCase().includes(q));
  $('#customersCount').textContent=`${fa(arr.length)} حساب از ${fa(customerStats.total)} مشتری`;
  if(!arr.length){box.innerHTML=`<div class="customers-empty"><div class="customers-empty-icon">♙</div><h3>${q?'مشتری پیدا نشد':'هنوز مشتری‌ای ثبت نشده است'}</h3><p>${q?'عبارت جستجو را تغییر دهید.':'با ثبت حساب یا اولین سفارش، مشتری در این بخش نمایش داده می‌شود.'}</p></div>`;return}
  box.innerHTML=`<div class="customers-table-head"><span>مشتری</span><span>روش ورود</span><span>تاریخ عضویت</span><span>آخرین بروزرسانی</span><span>عملیات</span></div>`+arr.map(c=>`<article class="customer-row" data-customer-id="${esc(c.id)}">
    <div class="customer-main"><div class="customer-avatar">${customerAvatar(c)}</div><div><strong>${esc(c.name||'کاربر آوان')}</strong><small dir="ltr">${esc(c.email||'—')}</small></div></div>
    <div><span class="customer-provider"><b>${String(c?.provider||'U').slice(0,1).toUpperCase()}</b> ${esc(customerProvider(c))}</span></div>
    <div class="customer-muted">${customerDate(c.created_at)}</div>
    <div class="customer-muted">${customerDate(c.updated_at)}</div>
    <div class="customer-actions"><button class="icon-action view" title="مشاهده" data-customer-view="${esc(c.id)}">◉</button></div>
  </article>`).join('');
  $$('[data-customer-view]').forEach(b=>b.onclick=()=>openCustomer(b.dataset.customerView));
}
function openCustomer(id){
  const c=customers.find(x=>String(x.id)===String(id)); if(!c)return;
  openModal(`<button class="close">×</button><div class="customer-detail"><div class="customer-detail-top"><div class="customer-detail-avatar">${customerAvatar(c)}</div><div><span class="eyebrow">AVAN GALLERY • CUSTOMER</span><h2>${esc(c.name||'کاربر آوان')}</h2><p dir="ltr">${esc(c.email||'—')}</p></div></div><div class="customer-detail-grid"><div><small>روش ورود</small><b>${esc(customerProvider(c))}</b></div><div><small>عضویت</small><b>${customerDate(c.created_at)}</b></div><div><small>آخرین بروزرسانی</small><b>${customerDate(c.updated_at)}</b></div><div><small>شناسه کاربر</small><b class="mono">${esc(c.id)}</b></div></div><div class="customer-detail-note"><span>✦</span><div><b>پروفایل مشتری</b><p>این حساب از طریق Google ایجاد شده است. سوابق سفارش و وفاداری پس از اتصال ماژول سفارش‌ها در همین پروفایل قابل نمایش خواهد بود.</p></div></div><div class="modal-actions"><button class="ghost close2">بستن</button></div></div>`);
  $('#modalCard .close2').onclick=closeModal;
}
async function renderCustomersPage(){
  try{ $('#content').innerHTML='<div class="support-loading">در حال دریافت مشتریان…</div>'; $('#title').textContent='مشتریان'; await loadCustomers(); $('#content').innerHTML=customersPage(); renderCustomers(); $('#customerSearch').oninput=async()=>{const q=$('#customerSearch').value.trim(); if(q.length>=2||q.length===0){try{await loadCustomers(q);renderCustomers()}catch(e){}} else renderCustomers()}; $('#refreshCustomers').onclick=async()=>{await loadCustomers($('#customerSearch').value.trim());renderCustomers()}; }
  catch(e){$('#content').innerHTML=`<div class="notice">${esc(e.message)}</div>`}
}
function orders(){return head('سفارش‌ها','مشاهده رسید، تأیید یا رد پرداخت و ثبت کد رهگیری مرسوله')+`<section class="panel order-admin-panel"><div class="order-admin-toolbar"><div><b>مدیریت سفارش‌های آوان</b><small>رسیدها را بررسی کنید و وضعیت پرداخت و ارسال را ذخیره کنید.</small></div><button class="ghost" id="refreshOrders">↻ بروزرسانی</button></div><div id="ordersLoading" class="notice">در حال دریافت سفارش‌ها...</div><div class="table-wrap"><table class="table" id="ordersTable"><thead><tr><th>سفارش</th><th>مشتری و محصولات</th><th>مبلغ</th><th>رسید پرداخت</th><th>وضعیت پرداخت</th><th>وضعیت سفارش</th><th>کد رهگیری شرکت ارسال</th><th>ذخیره</th></tr></thead><tbody></tbody></table></div></section>`}
function paymentPage(){return head('پرداخت و کارت','مدیریت اطلاعات کارت، پرداخت دستی و تنظیمات درگاه')+`<div class="payment-admin-grid">
<section class="panel payment-card-panel"><div class="panel-head"><div><h3>اطلاعات کارت فروشگاه</h3><p>این اطلاعات در مرحله پرداخت کارت‌به‌کارت مشتری نمایش داده می‌شود.</p></div><span class="live-pill" id="paymentLive">● فعال</span></div>
<div class="payment-form-grid"><label>شماره کارت<input id="payCardNumber" dir="ltr" inputmode="numeric" placeholder="6037 0000 0000 0000"></label><label>نام صاحب کارت<input id="payCardName" placeholder="نام صاحب حساب / فروشگاه"></label><label>بانک<input id="payBankName" placeholder="نام بانک"></label></div>
<label class="full-field">توضیحات پرداخت<textarea id="payNote" rows="4" placeholder="بعد از کارت‌به‌کارت، شماره پیگیری و تصویر رسید را ارسال کنید."></textarea></label>
<div class="payment-actions"><button class="#ffffff" id="savePaymentCard">ذخیره اطلاعات پرداخت</button><span id="paySaveMsg"></span></div></section>
<section class="panel gateway-panel"><div class="panel-head"><div><h3>درگاه پرداخت آنلاین</h3><p>درگاه را بعداً می‌توان فعال کرد؛ اطلاعات حساس در GitHub ذخیره نمی‌شود.</p></div><span class="status-badge off" id="gatewayBadge">غیرفعال</span></div>
<div class="payment-form-grid"><label>درگاه<select id="gatewayName"><option value="">انتخاب درگاه</option><option value="zarinpal">زرین‌پال</option><option value="idpay">آیدی‌پی</option><option value="nextpay">نکست‌پی</option><option value="custom">سایر</option></select></label><label>Merchant ID<input id="gatewayMerchant" dir="ltr" placeholder="بعد از فعال‌سازی درگاه وارد کنید"></label></div>
<label class="toggle-row"><input type="checkbox" id="gatewayEnabled"><span>فعال‌سازی پرداخت آنلاین</span></label>
<div class="secure-note">🔐 کلید API و Secret داخل کد یا GitHub ذخیره نمی‌شود و برای اتصال نهایی در Secretهای Cloudflare قرار می‌گیرد.</div>
<button class="#ffffff" id="saveGateway">ذخیره تنظیمات درگاه</button></section></div>
<section class="payment-preview"><div><span class="eyebrow">PREVIEW</span><h3>نمایش در صفحه پرداخت مشتری</h3><p>پیش‌نمایش زنده اطلاعات کارت‌به‌کارت آوان گالری</p></div><div class="payment-card-preview"><small>شماره کارت فروشگاه</small><strong id="previewCard">—</strong><span id="previewBank">بانک —</span><b id="previewName">—</b></div></section>`}
async function loadPaymentSettings(){try{const r=await fetch('/api/admin/payment-settings',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'خطا');const x=d.payment||{};$('#payCardNumber').value=x.cardNumber||'';$('#payCardName').value=x.cardName||'';$('#payBankName').value=x.bankName||'';$('#payNote').value=x.note||'';$('#gatewayName').value=x.gatewayName||'';$('#gatewayMerchant').value=x.merchantId||'';$('#gatewayEnabled').checked=!!x.gatewayEnabled;updatePaymentPreview();updateGatewayBadge();}catch(e){const el=$('#paySaveMsg');if(el)el.textContent=e.message;}}
function updatePaymentPreview(){const card=String($('#payCardNumber')?.value||'').replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim();$('#previewCard').textContent=card||'—';$('#previewBank').textContent='بانک '+($('#payBankName')?.value||'—');$('#previewName').textContent=$('#payCardName')?.value||'—';}
function updateGatewayBadge(){const on=!!$('#gatewayEnabled')?.checked;const b=$('#gatewayBadge');if(b){b.textContent=on?'فعال':'غیرفعال';b.classList.toggle('off',!on);b.classList.toggle('on',on);}}
async function savePaymentSettings(kind){const payload={cardNumber:$('#payCardNumber').value,cardName:$('#payCardName').value,bankName:$('#payBankName').value,note:$('#payNote').value,gatewayName:$('#gatewayName').value,merchantId:$('#gatewayMerchant').value,gatewayEnabled:$('#gatewayEnabled').checked};const msg=$('#paySaveMsg');try{const r=await fetch('/api/admin/payment-settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error||'ذخیره نشد');msg.textContent=kind==='card'?'اطلاعات کارت ذخیره شد ✓':'تنظیمات درگاه ذخیره شد ✓';updatePaymentPreview();updateGatewayBadge();setTimeout(()=>msg.textContent='',2500);}catch(e){msg.textContent=e.message;}}

function categoriesPage(){return head('دسته‌بندی‌ها','ساختار دسته‌بندی محصولات',`<button class="#ffffff" id="addCategory">＋ دسته جدید</button>`)+`<div class="cards3" id="categoryList">${categories.map(c=>`<div class="info"><h4>${c.name}</h4><p>شناسه: ${c.id}<br>محصولات: ${fa(products.filter(p=>p.category===c.id).length)}<br><button class="mini" data-cat-del="${c.id}">حذف</button></p></div>`).join('')}</div>`}
function brandsPage(){return head('برندها','کاتالوگ برندهای قابل انتخاب در محصول',`<button class="#ffffff" id="addBrand">＋ برند جدید</button>`)+`<div class="cards3" id="brandList">${brands.map(b=>`<div class="info"><h4>${b}</h4><p>محصولات: ${fa(products.filter(p=>p.brand===b).length)}<br><button class="mini" data-brand-del="${b}">حذف از کاتالوگ</button></p></div>`).join('')}</div>`}
function couponsPage(){return head('کدهای تخفیف','ساخت و مدیریت کمپین‌های تخفیف',`<button class="#ffffff" id="addCoupon">＋ کد تخفیف</button>`)+`<div class="cards3" id="couponList">${coupons.length?coupons.map(c=>`<div class="info"><h4>${c.code}</h4><p>${fa(c.percent)}٪ تخفیف • حداقل خرید ${fa(c.min)} تومان<br><button class="mini" data-coupon-del="${c.id}">حذف</button></p></div>`).join(''):'<div class="notice">هنوز کد تخفیفی ایجاد نشده است.</div>'}</div>`}

async function supportApi(path, options={}){const r=await fetch(path,{cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطا در ارتباط با پشتیبانی');return d}
function supportStatusLabel(v){return v==='closed'?'بسته':v==='pending'?'در حال بررسی':'باز'}
async function ticketsPage(){
  const [td,cd]=await Promise.all([supportApi('/api/admin/support/tickets'),supportApi('/api/admin/support/chats')]);
  const tickets=td.tickets||[], chats=cd.chats||[];
  return head('پشتیبانی آوان','تیکت‌ها و چت‌های مشتریان؛ پاسخ شما مستقیم برای مشتری ارسال می‌شود.',`<div class="support-admin-tools"><button class="#ffffff" id="refreshSupport">↻ بروزرسانی</button></div>`)+
  `<div class="support-admin-stats"><div><b>${fa(tickets.filter(x=>x.status==='open').length)}</b><small>تیکت باز</small></div><div><b>${fa(tickets.filter(x=>x.status==='pending').length)}</b><small>در حال بررسی</small></div><div><b>${fa(chats.filter(x=>x.status==='open').length)}</b><small>گفت‌وگوی فعال</small></div><div><b>${fa(tickets.length)}</b><small>کل تیکت‌ها</small></div></div>`+
  `<div class="support-admin-grid"><section class="panel support-admin-list"><div class="support-admin-head"><h3>تیکت‌های مشتریان</h3><span>${fa(tickets.length)} مورد</span></div>${tickets.length?tickets.map(t=>`<button class="support-admin-item" data-ticket-open="${esc(t.id)}"><div><b>${esc(t.subject)}</b><small>${esc(t.name)} • ${esc(t.phone)}</small></div><span class="support-status ${esc(t.status)}">${supportStatusLabel(t.status)}</span><time>${new Date(t.created_at).toLocaleString('fa-IR')}</time></button>`).join(''):`<div class="support-empty">هنوز تیکتی ثبت نشده است.</div>`}</section>`+
  `<section class="panel support-admin-list"><div class="support-admin-head"><h3>چت‌های آنلاین</h3><span>${fa(chats.length)} گفتگو</span></div>${chats.length?chats.map(c=>`<button class="support-admin-item" data-chat-open="${esc(c.id)}"><div><b>${esc(c.name||'مهمان سایت')}</b><small>${esc(c.phone||'بدون شماره')} • ${fa(c.message_count)} پیام</small></div><span class="support-status ${esc(c.status)}">${c.status==='open'?'فعال':'بسته'}</span><time>${new Date(c.updated_at).toLocaleString('fa-IR')}</time></button>`).join(''):`<div class="support-empty">هنوز گفت‌وگویی ثبت نشده است.</div>`}</section></div>`;
}
function openTicketSupport(t){
  openModal(`<button class="close">×</button><div class="support-reply-head"><div><h2>${esc(t.subject)}</h2><p>${esc(t.name)} • <span dir="ltr">${esc(t.phone)}</span> • ${esc(t.id)}</p></div><span class="support-status ${esc(t.status)}">${supportStatusLabel(t.status)}</span></div><div class="support-original"><small>درخواست مشتری</small><p>${esc(t.message)}</p></div><label class="support-label">پاسخ مدیر<textarea id="ticketReplyText" rows="6" placeholder="پاسخ مشتری را بنویسید...">${esc(t.admin_reply||'')}</textarea></label><label class="support-label">وضعیت<select id="ticketStatus"><option value="open" ${t.status==='open'?'selected':''}>باز</option><option value="pending" ${t.status==='pending'?'selected':''}>در حال بررسی</option><option value="closed" ${t.status==='closed'?'selected':''}>بسته</option></select></label><div class="modal-actions"><button class="ghost close2">انصراف</button><button class="#ffffff" id="saveTicketReply">ذخیره و ارسال پاسخ</button></div>`);
  $('#modalCard .close2').onclick=closeModal;$('#modalCard #saveTicketReply').onclick=async()=>{const b=$('#modalCard #saveTicketReply');b.disabled=true;try{await supportApi('/api/admin/support/tickets/'+encodeURIComponent(t.id),{method:'PUT',body:JSON.stringify({reply:$('#ticketReplyText').value,status:$('#ticketStatus').value})});closeModal();renderTickets();}catch(e){alert(e.message)}finally{b.disabled=false}};
}
async function openChatSupport(id){
  const d=await supportApi('/api/admin/support/chats/'+encodeURIComponent(id));
  const chat=(d.messages||[]);openModal(`<button class="close">×</button><div class="support-reply-head"><div><h2>چت آنلاین مشتری</h2><p>گفت‌وگوی مستقیم با مشتری</p></div><span class="support-live-dot">● آنلاین</span></div><div class="admin-chat-messages" id="adminChatMessages">${chat.map(m=>`<div class="admin-chat-row ${m.sender_type==='admin'?'admin':'customer'}"><div>${esc(m.message)}<small>${m.sender_type==='admin'?'پشتیبانی آوان':'مشتری'} • ${new Date(m.created_at).toLocaleString('fa-IR')}</small></div></div>`).join('')}</div><form id="adminChatForm" class="admin-chat-form"><input id="adminChatInput" required placeholder="پاسخ خود را بنویسید..."><button class="#ffffff">ارسال پاسخ</button></form>`);
  const box=$('#adminChatMessages');if(box)box.scrollTop=box.scrollHeight;
  $('#adminChatForm').onsubmit=async e=>{e.preventDefault();const input=$('#adminChatInput');const btn=e.target.querySelector('button');btn.disabled=true;try{await supportApi('/api/admin/support/chats/'+encodeURIComponent(id),{method:'POST',body:JSON.stringify({message:input.value})});input.value='';const fresh=await supportApi('/api/admin/support/chats/'+encodeURIComponent(id));if(box){box.innerHTML=(fresh.messages||[]).map(m=>`<div class="admin-chat-row ${m.sender_type==='admin'?'admin':'customer'}"><div>${esc(m.message)}<small>${m.sender_type==='admin'?'پشتیبانی آوان':'مشتری'} • ${new Date(m.created_at).toLocaleString('fa-IR')}</small></div></div>`).join('');box.scrollTop=box.scrollHeight;}}catch(err){alert(err.message)}finally{btn.disabled=false}};
  window.__avanChatAdminTimer=setInterval(async()=>{if(!document.body.contains(box)){clearInterval(window.__avanChatAdminTimer);window.__avanChatAdminTimer=null;return}try{const fresh=await supportApi('/api/admin/support/chats/'+encodeURIComponent(id));if(box){const wasBottom=box.scrollHeight-box.scrollTop-box.clientHeight<30;box.innerHTML=(fresh.messages||[]).map(m=>`<div class="admin-chat-row ${m.sender_type==='admin'?'admin':'customer'}"><div>${esc(m.message)}<small>${m.sender_type==='admin'?'پشتیبانی آوان':'مشتری'} • ${new Date(m.created_at).toLocaleString('fa-IR')}</small></div></div>`).join('');if(wasBottom)box.scrollTop=box.scrollHeight;}}catch(_){}},4000);
}
async function renderTickets(){try{$('#content').innerHTML='<div class="support-loading">در حال دریافت پیام‌های مشتریان…</div>';$('#title').textContent='تیکت پشتیبانی';const html=await ticketsPage();$('#content').innerHTML=html;$('#refreshSupport').onclick=renderTickets;$$('[data-ticket-open]').forEach(b=>b.onclick=async()=>{try{const d=await supportApi('/api/admin/support/tickets');const t=(d.tickets||[]).find(x=>x.id===b.dataset.ticketOpen);if(t)openTicketSupport(t)}catch(e){alert(e.message)}});$$('[data-chat-open]').forEach(b=>b.onclick=()=>openChatSupport(b.dataset.chatOpen));}catch(e){$('#content').innerHTML=`<div class="notice">${esc(e.message)}</div>`}}

async function loadOrders(){
  try{
    const r=await fetch('/api/admin/orders',{cache:'no-store'}),d=await r.json();
    const tbody=document.querySelector('#ordersTable tbody'),loading=document.getElementById('ordersLoading');
    if(!r.ok)throw new Error(d.error||'خطا در دریافت سفارش‌ها');
    if(loading)loading.remove();if(!tbody)return;
    const payOptions=[['pending','در انتظار پرداخت'],['submitted','رسید ثبت شده'],['paid','پرداخت تأیید شد'],['failed','رد پرداخت'],['refunded','بازپرداخت']];
    const orderOptions=[['pending_payment','در انتظار پرداخت'],['awaiting_verification','در انتظار بررسی'],['processing','در حال آماده‌سازی'],['shipped','ارسال شده'],['delivered','تحویل شده'],['cancelled','لغو شده']];
    const optionHtml=(options,current)=>options.map(([value,label])=>`<option value="${value}" ${String(current)===value?'selected':''}>${label}</option>`).join('');
    tbody.innerHTML=(d.orders||[]).map(o=>{
      const items=(o.items||[]).map(i=>`${esc(i.name)} × ${fa(i.quantity||1)}`).join('<br>');
      return `<tr>
      <td><b dir="ltr">${esc(String(o.id))}</b><small class="order-admin-date">${esc(o.created_at||'')}</small></td>
      <td>${esc(o.customer_name||'—')}<br><small>${esc(o.phone||'')}</small><div class="order-items-summary">${items||'جزئیات محصول ثبت نشده'}</div></td>
      <td><b>${fa(o.total||0)} تومان</b></td>
      <td>${o.receipt_image?`<button type="button" class="receipt-view-btn" data-receipt="${esc(String(o.id))}">مشاهده رسید ↗</button>`:`<span class="muted">رسیدی ندارد</span>`}${o.payment_reference?`<small class="order-admin-date">کد تراکنش: <b dir="ltr">${esc(o.payment_reference)}</b></small>`:''}</td>
      <td><select data-pay-status="${esc(String(o.id))}">${optionHtml(payOptions,o.payment_status)}</select><div class="quick-pay-actions"><button type="button" data-pay-approve="${esc(String(o.id))}">تأیید</button><button type="button" data-pay-reject="${esc(String(o.id))}">رد</button></div></td>
      <td><select data-order-status="${esc(String(o.id))}">${optionHtml(orderOptions,o.order_status)}</select></td>
      <td><input data-order-tracking="${esc(String(o.id))}" value="${esc(o.tracking_code||'')}" placeholder="کد شرکت ارسال" dir="ltr" style="min-width:135px"><small class="muted">پس از ارسال ذخیره کنید</small></td>
      <td><button type="button" class="#ffffff" data-order-save="${esc(String(o.id))}">ذخیره تغییرات</button></td>
    </tr>`}).join('')||'<tr><td colspan="8"><div class="notice">هنوز سفارشی ثبت نشده است.</div></td></tr>';
    const saveOrder=async(id,extra={})=>{
      const paymentStatus=extra.paymentStatus||$(`[data-pay-status="${CSS.escape(id)}"]`)?.value||'';
      const orderStatus=Object.prototype.hasOwnProperty.call(extra,'paymentStatus')&&!Object.prototype.hasOwnProperty.call(extra,'orderStatus')?'':($(`[data-order-status="${CSS.escape(id)}"]`)?.value||'');
      const trackingCode=$(`[data-order-tracking="${CSS.escape(id)}"]`)?.value||'';
      const result=await adminApi('/api/admin/orders/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({paymentStatus,orderStatus,trackingCode})});
      const target=$(`[data-pay-status="${CSS.escape(id)}"]`);if(target&&paymentStatus)target.value=paymentStatus;
      return result;
    };
    if($('#refreshOrders'))$('#refreshOrders').onclick=loadOrders;
    $$('[data-order-save]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.orderSave;btn.disabled=true;try{await saveOrder(id);btn.textContent='ذخیره شد ✓';await loadOrders();}catch(e){alert(e.message);btn.disabled=false;}});
    $$('[data-pay-approve]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.payApprove;if(!confirm('پرداخت این سفارش تأیید شود؟ فقط پس از بررسی رسید تأیید کنید.'))return;try{await saveOrder(id,{paymentStatus:'paid'});await loadOrders();}catch(e){alert(e.message)}});
    $$('[data-pay-reject]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.payReject;if(!confirm('پرداخت این سفارش رد شود؟'))return;try{await saveOrder(id,{paymentStatus:'failed'});await loadOrders();}catch(e){alert(e.message)}});
    $$('[data-receipt]').forEach(btn=>btn.onclick=()=>{const o=(d.orders||[]).find(x=>String(x.id)===btn.dataset.receipt);if(!o?.receipt_image)return;openModal(`<button class="close">×</button><div class="receipt-modal"><span class="eyebrow">AVAN GALLERY • PAYMENT RECEIPT</span><h2>رسید سفارش ${esc(String(o.id))}</h2><p>${esc(o.customer_name||'')} • ${fa(o.total||0)} تومان</p><a href="${esc(o.receipt_image)}" target="_blank" rel="noopener"><img src="${esc(o.receipt_image)}" alt="رسید پرداخت سفارش" style="display:block;max-width:100%;max-height:70vh;object-fit:contain;margin:18px auto;border-radius:14px;border:1px solid rgba(255,255,255,.35)"></a><div class="modal-actions"><button class="ghost close2">بستن</button></div></div>`);$('#modalCard .close2').onclick=closeModal;});
  }catch(e){const l=document.getElementById('ordersLoading');if(l)l.textContent=e.message;}
}


async function adminApi(path,options={}){
 const r=await fetch(path,{cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'عملیات ناموفق بود.');return d;
}

function walletPage(){return head('کیف پول و وفاداری','مدیریت اعتبار مشتریان، امتیاز خرید و سطح باشگاه آوان')+`<section class="wallet-summary" id="walletSummary"><article><small>مشتریان نمایش‌داده‌شده</small><b>—</b></article><article><small>مجموع اعتبار کیف پول</small><b>—</b><em>تومان</em></article><article><small>مجموع امتیاز مشتریان</small><b>—</b><em>امتیاز</em></article></section><section class="panel"><div class="wallet-toolbar"><div><h3>باشگاه مشتریان آوان</h3><p>امتیاز پایه: به ازای هر ۱۰٬۰۰۰ تومان سفارش تأییدشده، یک امتیاز محاسبه می‌شود.</p></div><div class="wallet-search"><input id="walletSearch" placeholder="جستجوی نام یا ایمیل مشتری" dir="auto"><button class="ghost" id="walletRefresh">↻ بروزرسانی</button></div></div><div id="walletList" class="table-wrap"><div class="notice">در حال دریافت اطلاعات کیف پول…</div></div></section><section class="panel wallet-ledger-panel"><div class="panel-title-row"><h3>آخرین تراکنش‌های کیف پول</h3><button class="ghost" id="walletLedgerRefresh">↻ بروزرسانی</button></div><div id="walletLedger" class="table-wrap"><div class="notice">در حال دریافت تراکنش‌ها…</div></div></section>`}
let walletCustomers=[];
async function loadWallet(q=''){
 const list=$('#walletList');if(!list)return;list.innerHTML='<div class="notice">در حال دریافت اطلاعات…</div>';
 try{
  const d=await adminApi('/api/admin/wallet'+(q?'?q='+encodeURIComponent(q):''));walletCustomers=d.customers||[];
  const sm=$('#walletSummary');if(sm)sm.innerHTML=`<article><small>مشتریان نمایش‌داده‌شده</small><b>${fa(walletCustomers.length)}</b></article><article><small>مجموع اعتبار کیف پول</small><b>${fa(d.summary?.balance||0)}</b><em>تومان</em></article><article><small>مجموع امتیاز مشتریان</small><b>${fa(d.summary?.points||0)}</b><em>امتیاز</em></article>`;
  list.innerHTML=walletCustomers.length?`<table class="table wallet-table"><thead><tr><th>مشتری</th><th>تعداد سفارش پرداخت‌شده</th><th>خرید پرداخت‌شده</th><th>اعتبار کیف پول</th><th>امتیاز</th><th>سطح</th><th>عملیات</th></tr></thead><tbody>${walletCustomers.map(c=>`<tr><td><b>${esc(c.name||'مشتری')}</b><small class="wallet-email" dir="ltr">${esc(c.email||'—')}</small></td><td>${fa(c.orders||0)}</td><td>${fa(c.paid_total||0)} تومان</td><td><strong class="wallet-balance">${fa(c.balance||0)} تومان</strong></td><td>${fa(c.points||0)}</td><td><span class="loyalty-tier tier-${c.tier==='طلایی'?'#ffffff':c.tier==='نقره‌ای'?'silver':'bronze'}">${esc(c.tier||'برنزی')}</span></td><td><div class="wallet-actions"><button data-wallet-action="credit" data-wallet-id="${esc(c.id)}">＋ شارژ</button><button data-wallet-action="debit" data-wallet-id="${esc(c.id)}">− برداشت</button><button data-wallet-action="points" data-wallet-id="${esc(c.id)}">★ امتیاز</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="notice">مشتری‌ای پیدا نشد.</div>';
  $$('[data-wallet-action]').forEach(b=>b.onclick=()=>openWalletEntry(b.dataset.walletId,b.dataset.walletAction));
  await loadWalletLedger();
 }catch(e){list.innerHTML=`<div class="notice">${esc(e.message)}</div>`}
}
function openWalletEntry(id,type){
 const c=walletCustomers.find(x=>String(x.id)===String(id));if(!c)return;
 const title=type==='credit'?'شارژ کیف پول':type==='debit'?'برداشت از کیف پول':'ثبت امتیاز وفاداری';
 const unit=type==='points'?'امتیاز':'تومان';
 openModal(`<button class="close">×</button><div class="wallet-entry-modal"><span class="eyebrow">AVAN GALLERY • WALLET</span><h2>${title}</h2><p>${esc(c.name||'مشتری')} · <span dir="ltr">${esc(c.email||'')}</span></p><form id="walletEntryForm"><input type="hidden" name="customerId" value="${esc(c.id)}"><input type="hidden" name="email" value="${esc(c.email||'')}"><input type="hidden" name="type" value="${type}"><label>مبلغ (${unit})<input name="amount" type="number" min="1" step="1" required autofocus></label><label>توضیحات<input name="note" maxlength="500" placeholder="دلیل تغییر اعتبار یا امتیاز"></label><div class="wallet-entry-actions"><button class="#ffffff" type="submit">ثبت تراکنش</button><button class="ghost close2" type="button">انصراف</button></div><p id="walletEntryMessage" class="inline-message"></p></form></div>`);
 $('#modalCard .close2').onclick=closeModal;
 $('#walletEntryForm').onsubmit=async e=>{e.preventDefault();const form=e.target,btn=form.querySelector('[type=submit]'),msg=$('#walletEntryMessage');btn.disabled=true;try{const payload=Object.fromEntries(new FormData(form));await adminApi('/api/admin/wallet/ledger',{method:'POST',body:JSON.stringify(payload)});closeModal();await loadWallet($('#walletSearch')?.value||'');}catch(err){msg.textContent=err.message;btn.disabled=false;}};
}
async function loadWalletLedger(){
 const box=$('#walletLedger');if(!box)return;
 try{const d=await adminApi('/api/admin/wallet/ledger');const rows=d.entries||[];box.innerHTML=rows.length?`<table class="table"><thead><tr><th>مشتری</th><th>نوع</th><th>مبلغ/امتیاز</th><th>توضیحات</th><th>ثبت‌کننده</th><th>تاریخ</th></tr></thead><tbody>${rows.map(x=>`<tr><td dir="ltr">${esc(x.email||x.customer_id)}</td><td><span class="loyalty-tier ${x.entry_type==='credit'?'tier-gold':x.entry_type==='debit'?'tier-gold':'tier-silver'}">${x.entry_type==='credit'?'شارژ':x.entry_type==='debit'?'برداشت':'امتیاز'}</span></td><td>${fa(x.amount)} ${x.entry_type==='points'?'امتیاز':'تومان'}</td><td>${esc(x.note||'—')}</td><td>${esc(x.created_by||'—')}</td><td>${esc(x.created_at||'')}</td></tr>`).join('')}</tbody></table>`:'<div class="notice">هنوز تراکنش دستی کیف پول ثبت نشده است.</div>'}catch(e){box.innerHTML=`<div class="notice">${esc(e.message)}</div>`}
}
function reportsPage(){return head('گزارش‌ها','تحلیل فروش، سفارش‌ها، محصولات پرفروش و موجودی انبار')+`<section class="panel reports-filter"><form id="reportsFilter"><label>از تاریخ<input type="date" name="from"></label><label>تا تاریخ<input type="date" name="to"></label><button class="#ffffff" type="submit">نمایش گزارش</button><button class="ghost" type="button" id="reportsReset">همه تاریخ‌ها</button></form><span id="reportsMessage" class="inline-message"></span></section><section id="reportsSummary" class="reports-summary"><div class="notice">در حال محاسبه گزارش‌ها…</div></section><section class="reports-grid"><article class="panel"><div class="panel-title-row"><h3>فروش روزانه</h3><button class="ghost" id="exportDailyReport">خروجی CSV</button></div><div id="dailySalesReport" class="table-wrap"><div class="notice">در حال دریافت اطلاعات…</div></div></article><article class="panel"><div class="panel-title-row"><h3>محصولات پرفروش</h3></div><div id="topProductsReport" class="table-wrap"><div class="notice">در حال دریافت اطلاعات…</div></div></article></section><section class="panel"><div class="panel-title-row"><h3>گزارش موجودی انبار</h3><small>کمترین موجودی در ابتدای فهرست</small></div><div id="inventoryReport" class="table-wrap"><div class="notice">در حال دریافت اطلاعات…</div></div></section>`}
let currentReportData=null;
async function loadReports(){
 const form=$('#reportsFilter');if(!form)return;
 const data=Object.fromEntries(new FormData(form));const params=new URLSearchParams();if(data.from)params.set('from',data.from);if(data.to)params.set('to',data.to);
 const msg=$('#reportsMessage');if(msg)msg.textContent='در حال دریافت گزارش…';
 try{
  const d=await adminApi('/api/admin/reports'+(params.size?'?'+params.toString():''));currentReportData=d;
  const s=d.summary||{};$('#reportsSummary').innerHTML=`<article><small>مجموع فروش پرداخت‌شده</small><b>${fa(s.sales_total||0)}</b><em>تومان</em></article><article><small>کل سفارش‌ها</small><b>${fa(s.orders_count||0)}</b><em>سفارش</em></article><article><small>پرداخت‌شده</small><b>${fa(s.paid_count||0)}</b><em>سفارش</em></article><article><small>پرداخت‌نشده</small><b>${fa(s.unpaid_count||0)}</b><em>سفارش</em></article>`;
  const daily=d.daily||[];$('#dailySalesReport').innerHTML=daily.length?`<table class="table"><thead><tr><th>تاریخ</th><th>سفارش‌ها</th><th>فروش پرداخت‌شده</th></tr></thead><tbody>${daily.map(x=>`<tr><td>${esc(x.day||'—')}</td><td>${fa(x.orders_count||0)}</td><td><b>${fa(x.sales_total||0)} تومان</b></td></tr>`).join('')}</tbody></table>`:'<div class="notice">در این بازه سفارشی ثبت نشده است.</div>';
  const top=d.topProducts||[];$('#topProductsReport').innerHTML=top.length?`<table class="table"><thead><tr><th>محصول</th><th>تعداد فروخته‌شده</th><th>مبلغ اقلام</th></tr></thead><tbody>${top.map(x=>`<tr><td>${esc(x.name||'محصول')}</td><td>${fa(x.quantity||0)}</td><td>${fa(x.gross||0)} تومان</td></tr>`).join('')}</tbody></table>`:'<div class="notice">فروش پرداخت‌شده‌ای برای محاسبه محصولات پرفروش وجود ندارد.</div>';
  const inv=d.inventory||[];$('#inventoryReport').innerHTML=inv.length?`<table class="table"><thead><tr><th>محصول</th><th>SKU</th><th>موجودی</th><th>قیمت</th><th>وضعیت</th></tr></thead><tbody>${inv.map(x=>`<tr><td>${esc(x.name||'—')}</td><td dir="ltr">${esc(x.sku||'—')}</td><td><b class="${Number(x.stock)<=5?'stock-low':''}">${fa(x.stock||0)}</b></td><td>${fa(x.price||0)} تومان</td><td><span class="loyalty-tier ${Number(x.stock)<=0?'tier-gold':Number(x.stock)<=5?'tier-silver':'tier-gold'}">${Number(x.stock)<=0?'ناموجود':Number(x.stock)<=5?'موجودی کم':'موجود'}</span></td></tr>`).join('')}</tbody></table>`:'<div class="notice">اطلاعات موجودی در دسترس نیست.</div>';
  if(msg)msg.textContent=`گزارش به‌روز شد · ${fa(daily.length)} روز دارای سفارش`;
 }catch(e){if(msg)msg.textContent=e.message;$('#reportsSummary').innerHTML=`<div class="notice">${esc(e.message)}</div>`}
}


function contentPage(){return head('محتوا و بنرها','مدیریت واقعی Hero، بنرها، مجله آوان و صفحات ثابت')+`<div class="cms-toolbar"><div class="cms-tabs" id="contentTabs"><button class="active" data-content-type="hero">Hero اصلی</button><button data-content-type="banner">بنرها</button><button data-content-type="article">مجله آوان</button><button data-content-type="page">صفحات ثابت</button></div><button class="#ffffff" id="addContent">＋ افزودن محتوا</button></div><section class="cms-panel"><div id="contentList" class="table-wrap"><div class="notice">در حال دریافت محتوا…</div></div></section>`}
let activeContentType='hero',contentItems=[];
async function loadContent(){const box=$('#contentList');if(!box)return;box.innerHTML='<div class="notice">در حال دریافت اطلاعات…</div>';try{const d=await adminApi('/api/admin/content?type='+encodeURIComponent(activeContentType));contentItems=d.items||[];box.innerHTML=contentItems.length?`<table class="table"><thead><tr><th>عنوان</th><th>شناسه / مسیر</th><th>تصویر</th><th>انتشار</th><th>ترتیب</th><th>عملیات</th></tr></thead><tbody>${contentItems.map(x=>`<tr><td><b>${esc(x.title)}</b><small class="cms-sub">${esc(x.body||'')}</small></td><td dir="auto">${esc(x.slug||'—')}</td><td>${x.image_url?`<a href="${esc(x.image_url)}" target="_blank" rel="noopener">مشاهده تصویر ↗</a>`:'—'}</td><td><span class="loyalty-tier ${x.is_published?'tier-gold':'tier-silver'}">${x.is_published?'منتشر شده':'پیش‌نویس'}</span></td><td>${fa(x.sort_order||0)}</td><td><div class="cms-actions"><button data-edit-content="${esc(x.id)}">ویرایش</button><button data-delete-content="${esc(x.id)}" class="danger">حذف</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="notice">برای این بخش محتوایی ثبت نشده است؛ از «افزودن محتوا» شروع کن.</div>';
$$('[data-edit-content]').forEach(b=>b.onclick=()=>editContent(contentItems.find(x=>x.id===b.dataset.editContent)));
$$('[data-delete-content]').forEach(b=>b.onclick=async()=>{if(!confirm('این محتوا حذف شود؟'))return;try{await adminApi('/api/admin/content?id='+encodeURIComponent(b.dataset.deleteContent),{method:'DELETE'});await loadContent()}catch(e){alert(e.message)}})
}catch(e){box.innerHTML=`<div class="notice">${esc(e.message)}</div>`}}
function editContent(item={content_type:activeContentType,title:'',slug:'',body:'',image_url:'',button_text:'',button_url:'',is_published:0,sort_order:0}){openModal(`<button class="close">×</button><div class="cms-modal"><span class="eyebrow">AVAN GALLERY • CONTENT</span><h2>${item.id?'ویرایش محتوا':'افزودن محتوا'}</h2><form id="contentForm"><input type="hidden" name="id" value="${esc(item.id||'')}"><label>نوع محتوا<select name="content_type">${[['hero','Hero اصلی'],['banner','بنر'],['article','مقاله مجله'],['page','صفحه ثابت']].map(([v,l])=>`<option value="${v}" ${item.content_type===v?'selected':''}>${l}</option>`).join('')}</select></label><label>عنوان *<input name="title" required maxlength="180" value="${esc(item.title||'')}"></label><label>شناسه یا مسیر صفحه<input name="slug" maxlength="180" value="${esc(item.slug||'')}" placeholder="مثلاً about-us"></label><label>متن / توضیحات<textarea name="body" rows="5" maxlength="20000">${esc(item.body||'')}</textarea></label><label>آدرس تصویر (URL)<input name="image_url" type="url" value="${esc(item.image_url||'')}" placeholder="https://..."></label><div class="cms-two"><label>متن دکمه<input name="button_text" value="${esc(item.button_text||'')}"></label><label>لینک دکمه<input name="button_url" value="${esc(item.button_url||'')}"></label></div><div class="cms-two"><label>ترتیب نمایش<input name="sort_order" type="number" min="0" value="${Number(item.sort_order)||0}"></label><label class="cms-check"><input name="is_published" type="checkbox" ${item.is_published?'checked':''}> منتشر شود</label></div><div class="cms-actions"><button class="#ffffff" type="submit">ذخیره محتوا</button><button type="button" class="ghost close2">انصراف</button></div><p id="contentFormMessage" class="inline-message"></p></form></div>`);
$('#modalCard .close2').onclick=closeModal;$('#contentForm').onsubmit=async e=>{e.preventDefault();const f=e.target,p=Object.fromEntries(new FormData(f));p.is_published=f.elements.is_published.checked;try{await adminApi('/api/admin/content',{method:item.id?'PUT':'POST',body:JSON.stringify(p)});closeModal();activeContentType=p.content_type;await loadContent();$$('[data-content-type]').forEach(b=>b.classList.toggle('active',b.dataset.contentType===activeContentType));}catch(err){$('#contentFormMessage').textContent=err.message}}}
function announcementsPage(){return head('اعلان‌ها','ساخت و مدیریت اعلان‌های مشتریان و مدیران')+`<div class="cms-toolbar"><p class="cms-help">اعلان‌ها در دیتابیس ذخیره می‌شوند؛ ارسال پیامک یا ایمیل فقط در صورت اتصال سرویس مربوطه انجام می‌شود.</p><button class="#ffffff" id="addAnnouncement">＋ اعلان جدید</button></div><section class="cms-panel"><div id="announcementList" class="table-wrap"><div class="notice">در حال دریافت اعلان‌ها…</div></div></section>`}
let announcementItems=[];
async function loadAnnouncements(){const box=$('#announcementList');if(!box)return;try{const d=await adminApi('/api/admin/notifications');announcementItems=d.items||[];box.innerHTML=announcementItems.length?`<table class="table"><thead><tr><th>عنوان</th><th>متن اعلان</th><th>مخاطب</th><th>وضعیت</th><th>زمان‌بندی</th><th>عملیات</th></tr></thead><tbody>${announcementItems.map(x=>`<tr><td><b>${esc(x.title)}</b></td><td>${esc(x.message)}</td><td>${x.audience==='admins'?'مدیران':x.audience==='all'?'همه':'مشتریان'}</td><td><span class="loyalty-tier ${x.is_active?'tier-gold':'tier-silver'}">${x.is_active?'فعال':'غیرفعال'}</span></td><td>${esc(x.starts_at||'اکنون')}<br>${x.ends_at?'تا '+esc(x.ends_at):'بدون پایان'}</td><td><div class="cms-actions"><button data-edit-announcement="${esc(x.id)}">ویرایش</button><button class="danger" data-delete-announcement="${esc(x.id)}">حذف</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="notice">هنوز اعلانی ثبت نشده است.</div>';
$$('[data-edit-announcement]').forEach(b=>b.onclick=()=>editAnnouncement(announcementItems.find(x=>x.id===b.dataset.editAnnouncement)));
$$('[data-delete-announcement]').forEach(b=>b.onclick=async()=>{if(!confirm('این اعلان حذف شود؟'))return;try{await adminApi('/api/admin/notifications?id='+encodeURIComponent(b.dataset.deleteAnnouncement),{method:'DELETE'});loadAnnouncements()}catch(e){alert(e.message)}})
}catch(e){box.innerHTML=`<div class="notice">${esc(e.message)}</div>`}}
function editAnnouncement(item={title:'',message:'',audience:'customers',is_active:1,starts_at:'',ends_at:''}){openModal(`<button class="close">×</button><div class="cms-modal"><span class="eyebrow">AVAN GALLERY • ANNOUNCEMENTS</span><h2>${item.id?'ویرایش اعلان':'اعلان جدید'}</h2><form id="announcementForm"><input type="hidden" name="id" value="${esc(item.id||'')}"><label>عنوان *<input name="title" required maxlength="180" value="${esc(item.title||'')}"></label><label>متن اعلان *<textarea name="message" rows="5" required maxlength="3000">${esc(item.message||'')}</textarea></label><label>مخاطب<select name="audience"><option value="customers" ${item.audience==='customers'?'selected':''}>مشتریان</option><option value="admins" ${item.audience==='admins'?'selected':''}>مدیران</option><option value="all" ${item.audience==='all'?'selected':''}>همه</option></select></label><div class="cms-two"><label>شروع (اختیاری)<input name="starts_at" type="datetime-local" value="${esc((item.starts_at||'').replace(' ','T').slice(0,16))}"></label><label>پایان (اختیاری)<input name="ends_at" type="datetime-local" value="${esc((item.ends_at||'').replace(' ','T').slice(0,16))}"></label></div><label class="cms-check"><input name="is_active" type="checkbox" ${item.is_active!==0?'checked':''}> اعلان فعال باشد</label><div class="cms-actions"><button class="#ffffff" type="submit">ذخیره اعلان</button><button type="button" class="ghost close2">انصراف</button></div><p id="announcementFormMessage" class="inline-message"></p></form></div>`);
$('#modalCard .close2').onclick=closeModal;$('#announcementForm').onsubmit=async e=>{e.preventDefault();const f=e.target,p=Object.fromEntries(new FormData(f));p.is_active=f.elements.is_active.checked;p.starts_at=p.starts_at||'';p.ends_at=p.ends_at||'';try{await adminApi('/api/admin/notifications',{method:item.id?'PUT':'POST',body:JSON.stringify(p)});closeModal();loadAnnouncements()}catch(err){$('#announcementFormMessage').textContent=err.message}}}
function reviewsPage(){return head('نظرات مشتریان','بررسی، انتشار، رد و پاسخ به دیدگاه‌ها')+`<section class="wallet-summary" id="reviewSummary"><article><small>کل نظرات</small><b>—</b></article><article><small>در انتظار بررسی</small><b>—</b></article><article><small>میانگین امتیاز</small><b>—</b></article></section><div class="cms-toolbar"><div class="cms-tabs" id="reviewTabs"><button class="active" data-review-status="">همه</button><button data-review-status="pending">در انتظار بررسی</button><button data-review-status="approved">تأییدشده</button><button data-review-status="rejected">ردشده</button><button data-review-status="spam">اسپم</button></div><button class="#ffffff" id="addReview">＋ ثبت نظر</button></div><section class="cms-panel"><div id="reviewList" class="table-wrap"><div class="notice">در حال دریافت نظرات…</div></div></section>`}
let reviewItems=[],activeReviewStatus='';
async function loadReviews(){const box=$('#reviewList');if(!box)return;try{const d=await adminApi('/api/admin/reviews?status='+encodeURIComponent(activeReviewStatus));reviewItems=d.items||[];const st=d.stats||{};$('#reviewSummary').innerHTML=`<article><small>کل نظرات</small><b>${fa(st.total||0)}</b></article><article><small>در انتظار بررسی</small><b>${fa(st.pending||0)}</b></article><article><small>میانگین امتیاز</small><b>${fa(st.avg_rating||0)} / ۵</b></article>`;box.innerHTML=reviewItems.length?`<table class="table"><thead><tr><th>مشتری</th><th>محصول</th><th>امتیاز</th><th>نظر</th><th>وضعیت</th><th>پاسخ مدیریت</th><th>عملیات</th></tr></thead><tbody>${reviewItems.map(x=>`<tr><td><b>${esc(x.customer_name)}</b><small class="cms-sub">${esc(x.customer_email||'')}</small></td><td>${esc(x.product_name||'—')}</td><td><span class="review-stars">${'★'.repeat(Math.min(5,Math.max(0,Number(x.rating)||0)))}${'☆'.repeat(5-Math.min(5,Math.max(0,Number(x.rating)||0)))}</span></td><td>${esc(x.review_text)}</td><td><span class="loyalty-tier ${x.status==='approved'?'tier-gold':x.status==='rejected'||x.status==='spam'?'tier-gold':'tier-silver'}">${x.status==='approved'?'تأییدشده':x.status==='rejected'?'ردشده':x.status==='spam'?'اسپم':'در انتظار بررسی'}</span></td><td>${esc(x.admin_reply||'—')}</td><td><div class="cms-actions"><button data-review-edit="${esc(x.id)}">بررسی / پاسخ</button><button class="danger" data-review-delete="${esc(x.id)}">حذف</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="notice">نظری در این فیلتر وجود ندارد. می‌توانی برای آزمایش از «ثبت نظر» استفاده کنی.</div>';
$$('[data-review-edit]').forEach(b=>b.onclick=()=>editReview(reviewItems.find(x=>x.id===b.dataset.reviewEdit)));
$$('[data-review-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('این نظر برای همیشه حذف شود؟'))return;try{await adminApi('/api/admin/reviews?id='+encodeURIComponent(b.dataset.reviewDelete),{method:'DELETE'});loadReviews()}catch(e){alert(e.message)}})
}catch(e){box.innerHTML=`<div class="notice">${esc(e.message)}</div>`}}
function editReview(item={customer_name:'',customer_email:'',product_name:'',product_id:'',rating:5,review_text:'',status:'pending',admin_reply:''}){openModal(`<button class="close">×</button><div class="cms-modal"><span class="eyebrow">AVAN GALLERY • REVIEWS</span><h2>${item.id?'بررسی نظر مشتری':'ثبت نظر آزمایشی'}</h2><form id="reviewForm"><input type="hidden" name="id" value="${esc(item.id||'')}"><div class="cms-two"><label>نام مشتری *<input name="customer_name" required value="${esc(item.customer_name||'')}"></label><label>ایمیل مشتری<input name="customer_email" type="email" value="${esc(item.customer_email||'')}"></label></div><div class="cms-two"><label>نام محصول<input name="product_name" value="${esc(item.product_name||'')}"></label><label>شناسه محصول (اختیاری)<input name="product_id" value="${esc(item.product_id||'')}"></label></div><label>امتیاز<select name="rating">${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(item.rating)===n?'selected':''}>${n} از ۵</option>`).join('')}</select></label><label>متن نظر *<textarea name="review_text" required rows="4">${esc(item.review_text||'')}</textarea></label>${item.id?`<label>وضعیت<select name="status">${[['pending','در انتظار بررسی'],['approved','تأیید و انتشار'],['rejected','رد نظر'],['spam','اسپم']].map(([v,l])=>`<option value="${v}" ${item.status===v?'selected':''}>${l}</option>`).join('')}</select></label><label>پاسخ مدیریت<textarea name="admin_reply" rows="3">${esc(item.admin_reply||'')}</textarea></label>`:''}<div class="cms-actions"><button class="#ffffff" type="submit">${item.id?'ذخیره بررسی':'ثبت نظر'}</button><button type="button" class="ghost close2">انصراف</button></div><p id="reviewFormMessage" class="inline-message"></p></form></div>`);
$('#modalCard .close2').onclick=closeModal;$('#reviewForm').onsubmit=async e=>{e.preventDefault();const f=e.target,p=Object.fromEntries(new FormData(f));try{await adminApi('/api/admin/reviews',{method:item.id?'PATCH':'POST',body:JSON.stringify(p)});closeModal();loadReviews()}catch(err){$('#reviewFormMessage').textContent=err.message}}}

function adminsPage(){return head('مدیران و دسترسی‌ها','ساخت حساب مدیران، تعیین نقش و فعال یا غیرفعال کردن دسترسی')+`<section class="panel staff-create"><h3>افزودن مدیر جدید</h3><form id="staffForm" class="staff-form"><label>نام و نام خانوادگی<input name="name" required placeholder="نام مدیر"></label><label>ایمیل ورود<input name="email" type="email" required dir="ltr" placeholder="manager@example.com"></label><label>رمز عبور اولیه<input name="password" type="password" minlength="8" required placeholder="حداقل ۸ کاراکتر"></label><label>نقش دسترسی<select name="role"><option value="order_operator">اپراتور سفارش — سفارش‌ها و پشتیبانی</option><option value="content_manager">مدیر محتوا — محصولات و تنظیمات عمومی</option></select></label><button class="#ffffff" type="submit">＋ ایجاد مدیر</button><span id="staffMessage" class="inline-message"></span></form></section><section class="panel"><div class="panel-title-row"><h3>مدیران ثبت‌شده</h3><button class="ghost" id="refreshStaff">↻ بروزرسانی</button></div><div id="staffList" class="staff-list"><div class="notice">در حال دریافت مدیران…</div></div></section><div class="notice">حساب مدیر اصلی از رمز مدیریت Cloudflare استفاده می‌کند. حساب‌های این فهرست با ایمیل و رمز جداگانه وارد می‌شوند و نقش آن‌ها در API بررسی می‌شود.</div>`}
async function loadStaff(){
 const box=$('#staffList');if(!box)return;box.innerHTML='<div class="notice">در حال دریافت مدیران…</div>';
 try{const d=await adminApi('/api/admin/staff');const list=d.staff||[];
 box.innerHTML=list.length?list.map(s=>`<article class="staff-row"><div class="staff-avatar">${esc((s.name||'م').trim().charAt(0))}</div><div class="staff-info"><b>${esc(s.name)}</b><small dir="ltr">${esc(s.email)}</small><small>ایجاد: ${esc(s.created_at||'—')}</small></div><label class="staff-role">نقش<select data-staff-role="${esc(s.id)}"><option value="content_manager" ${s.role==='content_manager'?'selected':''}>مدیر محتوا</option><option value="order_operator" ${s.role==='order_operator'?'selected':''}>اپراتور سفارش</option></select></label><label class="staff-active"><input type="checkbox" data-staff-active="${esc(s.id)}" ${Number(s.active)===1?'checked':''}> فعال</label><button class="#ffffff" data-staff-save="${esc(s.id)}">ذخیره</button></article>`).join(''):'<div class="notice">هنوز مدیر دیگری ساخته نشده است.</div>';
 $$('[data-staff-save]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const id=b.dataset.staffSave;await adminApi('/api/admin/staff/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({role:$(`[data-staff-role="${CSS.escape(id)}"]`).value,active:$(`[data-staff-active="${CSS.escape(id)}"]`).checked})});b.textContent='ذخیره شد ✓';setTimeout(()=>{b.textContent='ذخیره';b.disabled=false},1000)}catch(e){alert(e.message);b.disabled=false}});
 }catch(e){box.innerHTML=`<div class="notice">${esc(e.message)}</div>`}
}
function activityPage(){return head('گزارش فعالیت','ردیابی تغییرات مدیریتی و عملیات حساس فروشگاه')+`<section class="panel"><div class="panel-title-row"><h3>آخرین فعالیت‌ها</h3><button class="ghost" id="refreshActivity">↻ بروزرسانی</button></div><div id="activityList" class="activity-list"><div class="notice">در حال دریافت گزارش‌ها…</div></div></section>`}
async function loadActivity(){const box=$('#activityList');if(!box)return;try{const d=await adminApi('/api/admin/activity');const rows=d.activities||[];box.innerHTML=rows.length?`<div class="activity-header"><span>مدیر</span><span>عملیات</span><span>جزئیات</span><span>زمان</span></div>`+rows.map(a=>`<div class="activity-row"><b>${esc(a.actor)}</b><span>${esc(a.action)}</span><small>${esc(a.details||'—')}</small><time>${esc(a.created_at||'')}</time></div>`).join(''):'<div class="notice">هنوز فعالیتی ثبت نشده است. عملیات بعدی مدیران در این بخش ثبت می‌شود.</div>'}catch(e){box.innerHTML=`<div class="notice">${esc(e.message)}</div>`}}
function settingsPage(){return head('تنظیمات فروشگاه','اطلاعات تماس، نشانی و تنظیمات پایه ارسال')+`<form id="storeSettingsForm" class="panel store-settings-form"><div class="settings-grid"><label>نام فروشگاه<input name="store_name" required placeholder="آوان گالری"></label><label>شماره تماس<input name="store_phone" dir="ltr" placeholder="شماره تماس فروشگاه"></label><label>ایمیل پشتیبانی<input name="store_email" type="email" dir="ltr" placeholder="support@example.com"></label><label>شماره پشتیبانی<input name="support_phone" dir="ltr" placeholder="شماره پشتیبانی"></label><label>ایمیل پشتیبانی مشتریان<input name="support_email" type="email" dir="ltr" placeholder="ایمیل پشتیبانی"></label><label>شرکت ارسال پیش‌فرض<input name="shipping_company" placeholder="مثلاً پست یا تیپاکس"></label><label>روش ارسال<input name="shipping_method" placeholder="پست پیشتاز / تیپاکس"></label><label>هزینه ارسال (تومان)<input name="shipping_cost" type="number" min="0" step="1000"></label><label>حداقل خرید ارسال رایگان (تومان)<input name="free_shipping_min" type="number" min="0" step="10000"></label><label class="settings-wide">آدرس فروشگاه<textarea name="store_address" rows="3" placeholder="آدرس کامل فروشگاه"></textarea></label></div><div class="settings-actions"><button class="#ffffff" type="submit">ذخیره تنظیمات</button><span id="storeSettingsMessage" class="inline-message"></span><button class="ghost" type="button" id="openPaymentSettings">مدیریت کارت و درگاه پرداخت ←</button></div></form><div class="notice">تنظیمات پرداخت و کارت‌به‌کارت در صفحه «پرداخت و کارت» مدیریت می‌شود؛ این فرم تنظیمات عمومی فروشگاه و ارسال را ذخیره می‌کند.</div>`}
async function loadStoreSettings(){try{const d=await adminApi('/api/admin/store-settings');const form=$('#storeSettingsForm');if(!form)return;for(const [k,v] of Object.entries(d.settings||{})){const el=form.elements.namedItem(k);if(el)el.value=v;} }catch(e){const m=$('#storeSettingsMessage');if(m)m.textContent=e.message;}}
function wireFunctionalPage(){
 if(current==='admins'){
  $('#staffForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.target,btn=form.querySelector('button[type="submit"]'),msg=$('#staffMessage');btn.disabled=true;try{const payload=Object.fromEntries(new FormData(form));await adminApi('/api/admin/staff',{method:'POST',body:JSON.stringify(payload)});msg.textContent='مدیر با موفقیت ایجاد شد ✓';form.reset();await loadStaff();}catch(err){msg.textContent=err.message;}finally{btn.disabled=false;}});
  $('#refreshStaff')?.addEventListener('click',loadStaff);loadStaff();
 }
 if(current==='activity'){$('#refreshActivity')?.addEventListener('click',loadActivity);loadActivity();}
 if(current==='settings'){
  loadStoreSettings();$('#openPaymentSettings')?.addEventListener('click',()=>{current='payment';render();});
  $('#storeSettingsForm')?.addEventListener('submit',async e=>{e.preventDefault();const btn=e.target.querySelector('button[type="submit"]'),msg=$('#storeSettingsMessage');btn.disabled=true;try{await adminApi('/api/admin/store-settings',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});msg.textContent='تنظیمات ذخیره شد ✓';}catch(err){msg.textContent=err.message;}finally{btn.disabled=false;}});
 }
}


function exportDailyReport(){
 const rows=currentReportData?.daily||[];if(!rows.length){alert('اطلاعاتی برای خروجی وجود ندارد.');return;}
 const csv=[['date','orders','paid_sales'],...rows.map(r=>[r.day,r.orders_count,r.sales_total])].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
 const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='avan-sales-report.csv';a.click();URL.revokeObjectURL(url);
}

function render(){let html='';if(current==='dashboard')html=dashboard();if(current==='products')html=productsPage();if(current==='orders'){html=orders();setTimeout(loadOrders,0);}if(current==='payment'){html=paymentPage();setTimeout(()=>{loadPaymentSettings();$$('#payCardNumber,#payCardName,#payBankName').forEach(e=>e.addEventListener('input',updatePaymentPreview));$('#gatewayEnabled')?.addEventListener('change',updateGatewayBadge);$('#savePaymentCard')?.addEventListener('click',()=>savePaymentSettings('card'));$('#saveGateway')?.addEventListener('click',()=>savePaymentSettings('gateway'));},0);}if(current==='customers'){renderCustomersPage();return;}if(current==='categories')html=categoriesPage();if(current==='brands')html=brandsPage();if(current==='coupons')html=couponsPage();if(current==='reviews'){html=reviewsPage();setTimeout(()=>{loadReviews();$('#addReview')?.addEventListener('click',()=>editReview());$$('[data-review-status]').forEach(b=>b.addEventListener('click',()=>{activeReviewStatus=b.dataset.reviewStatus;$$('[data-review-status]').forEach(x=>x.classList.toggle('active',x===b));loadReviews()}));},0);}if(current==='content'){html=contentPage();setTimeout(()=>{$('#addContent')?.addEventListener('click',()=>editContent());$$('[data-content-type]').forEach(b=>b.addEventListener('click',()=>{activeContentType=b.dataset.contentType;$$('[data-content-type]').forEach(x=>x.classList.toggle('active',x===b));loadContent()}));loadContent()},0);}if(current==='notifications'){html=announcementsPage();setTimeout(()=>{$('#addAnnouncement')?.addEventListener('click',()=>editAnnouncement());loadAnnouncements()},0);}if(current==='tickets'){renderTickets();return;}if(current==='wallet'){html=walletPage();setTimeout(()=>{loadWallet();$('#walletRefresh')?.addEventListener('click',()=>loadWallet($('#walletSearch')?.value||''));$('#walletSearch')?.addEventListener('input',()=>{clearTimeout(window.__walletSearchTimer);window.__walletSearchTimer=setTimeout(()=>loadWallet($('#walletSearch')?.value||''),250)});$('#walletLedgerRefresh')?.addEventListener('click',loadWalletLedger);},0);}if(current==='reports'){html=reportsPage();setTimeout(()=>{loadReports();$('#reportsFilter')?.addEventListener('submit',e=>{e.preventDefault();loadReports()});$('#reportsReset')?.addEventListener('click',()=>{const f=$('#reportsFilter');f.reset();loadReports()});$('#exportDailyReport')?.addEventListener('click',exportDailyReport);},0);}if(current==='admins')html=adminsPage();if(current==='activity')html=activityPage();if(current==='settings')html=settingsPage();$('#content').innerHTML=html;$$('[data-page-go]').forEach(b=>b.onclick=()=>{current=b.dataset.pageGo;render();});$$('[data-add-product]').forEach(b=>b.onclick=()=>{current='products';render();setTimeout(()=>openProduct(''),30);});wireFunctionalPage();const nav=document.querySelector(`#nav button[data-page="${current}"]`);$('#title').textContent=nav?.querySelector('span')?.textContent||'داشبورد';if(current==='products'){
  renderProducts();
  $('#newProduct').onclick=()=>openProduct();
  $('#pSearch').oninput=renderProducts;
  $('#pSort').onchange=renderProducts;
  $('#minPrice').oninput=renderProducts;
  $('#maxPrice').oninput=renderProducts;
  $$('.stockFilter').forEach(x=>x.onchange=()=>{if(x.value==='all'&&x.checked)$$('.stockFilter').filter(y=>y!==x).forEach(y=>y.checked=false);if(x.value!=='all'&&x.checked){const a=$('.stockFilter[value="all"]');if(a)a.checked=false}if(!$$('.stockFilter').some(y=>y.checked)){const a=$('.stockFilter[value="all"]');if(a)a.checked=true}renderProducts()});
  $$('.catFilter').forEach(x=>x.onchange=()=>{if(x.value==='all'&&x.checked)$$('.catFilter').filter(y=>y!==x).forEach(y=>y.checked=false);if(x.value!=='all'&&x.checked){const a=$('.catFilter[value="all"]');if(a)a.checked=false}if(!$$('.catFilter').some(y=>y.checked)){const a=$('.catFilter[value="all"]');if(a)a.checked=true}renderProducts()});
  $$('.brandFilter').forEach(x=>x.onchange=()=>{if(x.value==='all'&&x.checked)$$('.brandFilter').filter(y=>y!==x).forEach(y=>y.checked=false);if(x.value!=='all'&&x.checked){const a=$('.brandFilter[value="all"]');if(a)a.checked=false}if(!$$('.brandFilter').some(y=>y.checked)){const a=$('.brandFilter[value="all"]');if(a)a.checked=true}renderProducts()});
  $('#resetFilters').onclick=()=>{['.stockFilter','.catFilter','.brandFilter'].forEach(sel=>{$$(sel).forEach(x=>x.checked=x.value==='all')});$('#pSearch').value='';$('#minPrice').value='';$('#maxPrice').value='';$('#pSort').value='new';renderProducts()};
  $('#exportProducts').onclick=exportProducts;
}if(current==='categories')$('#addCategory').onclick=addCategory;if(current==='brands')$('#addBrand').onclick=addBrand;if(current==='coupons')$('#addCoupon').onclick=addCoupon;}
function openModal(html){if(window.__avanChatAdminTimer){clearInterval(window.__avanChatAdminTimer);window.__avanChatAdminTimer=null}$('#modalCard').innerHTML=html;$('#modal').classList.add('open');$('#modal').setAttribute('aria-hidden','false');$('#modalCard .close')?.addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()},{once:true})}function closeModal(){if(window.__avanChatAdminTimer){clearInterval(window.__avanChatAdminTimer);window.__avanChatAdminTimer=null}$('#modal').classList.remove('open');$('#modal').setAttribute('aria-hidden','true')}
function openProductPreview(p){
  const logo=brandLogo(p.brand); const meta=stockMeta(p.stock);
  const category=categories.find(c=>c.id===p.category)?.name||p.category||'—';
  openModal(`<button class="close">×</button><div class="product-preview">
    <div class="preview-media"><img src="${productImage(p.image)}" alt="${esc(p.name)}"></div>
    <div class="preview-body">
      <div class="preview-brand">${logo?`<img src="${logo}" alt="${esc(p.brand)}">`:''}<span>${esc(p.brand||'بدون برند')}</span></div>
      <h2>${esc(p.name||'بدون نام')}</h2>
      <p class="preview-desc">${esc(p.desc||'برای این محصول توضیحی ثبت نشده است.')}</p>
      <div class="preview-price">${fa(p.price)} <small>تومان</small></div>
      <div class="preview-grid">
        <div><small>دسته‌بندی</small><b>${esc(category)}</b></div>
        <div><small>موجودی</small><b>${fa(p.stock)} عدد</b></div>
        <div><small>SKU</small><b>${esc(p.sku||'—')}</b></div>
        <div><small>وضعیت</small><b class="preview-status ${meta.cls}">${meta.label}</b></div>
      </div>
      <div class="modal-actions"><button class="ghost close2">بستن</button><button class="#ffffff edit-preview">ویرایش محصول</button></div>
    </div>
  </div>`);
  $('#modalCard .close2').onclick=closeModal;
  $('#modalCard .edit-preview').onclick=()=>{closeModal();openProduct(p.id)};
}
async function openProduct(id=''){
  const p=products.find(x=>String(x.id)===String(id));
  const m=p?.metadata||{};
  const specs=m.specs||{}, seo=m.seo||{};
  const gallery=Array.isArray(m.gallery)&&m.gallery.length?m.gallery:[p?.image||'assets/watch-1.jpg'];
  const selectedBrand=brandKey(p?.brand||'');
  const brandCards=brands.map(b=>`<button type="button" class="brand-option ${brandKey(b)===selectedBrand?'selected':''}" data-brand-value="${esc(b)}"><span class="brand-choice-logo">${brandLogo(b)?`<img src="${brandLogo(b)}" alt="${esc(b)}">`:'★'}</span><span>${esc(b)}</span></button>`).join('');
  openModal(`<button class="close">×</button>
    <div class="product-form-head"><div><h2>${p?'ویرایش محصول':'افزودن محصول'}</h2><p>اطلاعات محصول را کامل کنید؛ این اطلاعات مستقیماً در D1 ذخیره می‌شود.</p></div><span class="form-save-state">● D1</span></div>
    <div class="form-tabs" role="tablist">
      <button type="button" class="form-tab active" data-tab="basic">اطلاعات اصلی</button>
      <button type="button" class="form-tab" data-tab="images">تصاویر</button>
      <button type="button" class="form-tab" data-tab="specs">مشخصات ساعت</button>
      <button type="button" class="form-tab" data-tab="seo">SEO</button>
    </div>
    <form id="productForm" class="product-form">
      <section class="form-pane active" data-pane="basic">
        <div class="form-section-title"><b>اطلاعات اصلی</b><small>نام، برند، دسته‌بندی و قیمت محصول</small></div>
        <div class="form-grid">
          <label>نام محصول<input name="name" required value="${esc(p?.name||'') }" placeholder="مثلاً Casio Edifice EFV-100"></label>
          <div class="field-group full"><span class="field-label">برند</span><input type="hidden" name="brand" id="brandValue" value="${esc(p?.brand||'')}"><div class="brand-picker">${brandCards}</div></div>
          <label>دسته‌بندی<select name="category">${categories.map(c=>`<option value="${esc(c.id)}" ${p?.category===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
          <label>مناسب برای<select name="gender"><option value="" ${!m.gender?'selected':''}>انتخاب کنید</option><option value="مردانه" ${m.gender==='مردانه'?'selected':''}>مردانه</option><option value="زنانه" ${m.gender==='زنانه'?'selected':''}>زنانه</option><option value="یونیسکس" ${m.gender==='یونیسکس'?'selected':''}>یونیسکس</option></select></label>
          <label>قیمت فروش (تومان)<input name="price" type="number" min="0" required value="${p?.price??''}" placeholder="12500000"></label>
          <label>قیمت قبل از تخفیف<input name="oldPrice" type="number" min="0" value="${m.oldPrice||''}" placeholder="15000000"></label>
          <label>موجودی<input name="stock" type="number" min="0" required value="${p?.stock??''}" placeholder="20"></label>
          <label>SKU<input name="sku" value="${esc(p?.sku||'')}" placeholder="AV-CAS-001"></label>
          <div class="field-group full discount-preview" id="discountPreview"><span>تخفیف</span><b>${fa(m.discountPercent||0)}٪</b></div>
        </div>
        <div class="form-checks">
          <label><input type="checkbox" name="active" ${m.active!==false?'checked':''}> نمایش در فروشگاه</label>
          <label><input type="checkbox" name="featured" ${m.featured?'checked':''}> محصول ویژه</label>
          <label><input type="checkbox" name="bestseller" ${m.bestseller?'checked':''}> پرفروش</label>
          <label><input type="checkbox" name="isNew" ${m.isNew?'checked':''}> جدید</label>
        </div>
        <label class="full">توضیح کوتاه<textarea name="shortDesc" rows="2" placeholder="یک معرفی کوتاه برای کارت محصول...">${esc(m.shortDesc||'')}</textarea></label>
        <label class="full">توضیحات کامل<textarea name="desc" rows="5" placeholder="توضیحات کامل محصول...">${esc(p?.desc||'')}</textarea></label>
      </section>
      <section class="form-pane" data-pane="images">
        <div class="form-section-title"><b>گالری تصاویر</b><small>R2 استفاده نمی‌شود؛ آدرس فایل محلی یا URL تصویر را وارد کنید.</small></div>
        <div class="image-manager-grid">
          <div class="image-manager-main">
            <div class="image-main-field"><label>تصویر اصلی<input name="image" id="mainImage" value="${esc(p?.image||gallery[0]||'assets/watch-1.jpg')}" placeholder="assets/watch-1.jpg یا https://..."></label><div class="main-image-preview"><img id="mainImagePreview" src="${productImage(p?.image||gallery[0]||'assets/watch-1.jpg')}" alt="پیش‌نمایش"></div></div>
            <label class="full">تصاویر گالری <small>هر آدرس را در یک خط وارد کنید.</small><textarea name="gallery" id="galleryInput" rows="6" placeholder="assets/watch-1.jpg\nassets/watch-2.jpg\nhttps://...">${esc(gallery.join('\n'))}</textarea></label>
            <div class="gallery-preview" id="galleryPreview">${gallery.map(src=>`<div class="gallery-thumb"><img src="${productImage(src)}" alt=""><button type="button" data-remove-image="${esc(src)}">×</button></div>`).join('')}</div>
          </div>
          <aside class="device-image-panel">
            <div class="device-image-head"><span class="device-image-icon">✦</span><div><b>تصاویر از دستگاه</b><small>برای پیش‌نمایش سریع تصاویر محصول</small></div></div>
            <label class="device-drop" id="deviceDrop">
              <input type="file" id="deviceImageInput" accept="image/*" multiple hidden>
              <span class="device-upload-icon">↑</span>
              <strong>انتخاب تصویر از دستگاه</strong>
              <small>PNG / JPG / WEBP · چند تصویر همزمان</small>
              <span class="device-select-btn">انتخاب فایل</span>
            </label>
            <div class="device-selected" id="deviceSelected"><span>هیچ فایلی انتخاب نشده</span></div>
            <button type="button" class="device-clear ghost" id="deviceClear">پاک کردن</button>
            <div class="device-note">تصاویر انتخاب‌شده فعلاً برای پیش‌نمایش هستند. برای ذخیره دائمی، URL یا مسیر فایل پروژه را در گالری ثبت کنید.</div>
          </aside>
        </div>
        <div class="image-tip">پیشنهاد آوان: تصویر اصلی، نمای نزدیک صفحه، پشت ساعت، جعبه و تصویر روی دست را وارد کنید.</div>
      </section>
      <section class="form-pane" data-pane="specs">
        <div class="form-section-title"><b>مشخصات تخصصی ساعت</b><small>این مشخصات در معرفی محصول قابل نمایش هستند.</small></div>
        <div class="form-grid">
          <label>نوع موتور<select name="movement"><option value="">انتخاب کنید</option><option ${specs.movement==='کوارتز'?'selected':''}>کوارتز</option><option ${specs.movement==='اتوماتیک'?'selected':''}>اتوماتیک</option><option ${specs.movement==='دستی'?'selected':''}>دستی</option><option ${specs.movement==='دیجیتال'?'selected':''}>دیجیتال</option></select></label>
          <label>جنس قاب<input name="caseMaterial" value="${esc(specs.caseMaterial||'')}" placeholder="استیل ضدزنگ"></label>
          <label>جنس بند<input name="strapMaterial" value="${esc(specs.strapMaterial||'')}" placeholder="استیل / چرم / سیلیکون"></label>
          <label>رنگ صفحه<input name="dialColor" value="${esc(specs.dialColor||'')}" placeholder="مشکی"></label>
          <label>رنگ قاب<input name="caseColor" value="${esc(specs.caseColor||'')}" placeholder="نقره‌ای"></label>
          <label>مقاومت در برابر آب<input name="waterResistance" value="${esc(specs.waterResistance||'')}" placeholder="50 متر"></label>
          <label>نوع شیشه<input name="crystal" value="${esc(specs.crystal||'')}" placeholder="معدنی / یاقوت کبود"></label>
          <label>قطر قاب<input name="caseDiameter" value="${esc(specs.caseDiameter||'')}" placeholder="42 میلی‌متر"></label>
        </div>
      </section>
      <section class="form-pane" data-pane="seo">
        <div class="form-section-title"><b>بهینه‌سازی موتور جستجو</b><small>برای صفحه اختصاصی محصول</small></div>
        <div class="form-grid">
          <label class="full">Slug<input name="slug" value="${esc(seo.slug||'')}" placeholder="casio-edifice-efv-100"></label>
          <label class="full">عنوان SEO<input name="seoTitle" value="${esc(seo.title||'')}" placeholder="خرید ساعت کاسیو ادیفایس | آوان گالری"></label>
          <label class="full">توضیحات SEO<textarea name="seoDescription" rows="3" maxlength="160" placeholder="توضیحات کوتاه برای نتایج جستجو...">${esc(seo.description||'')}</textarea></label>
          <label class="full">کلمات کلیدی<input name="keywords" value="${esc(seo.keywords||'')}" placeholder="کاسیو، ساعت کاسیو، ادیفایس"></label>
        </div>
      </section>
      <div class="modal-actions product-form-actions"><button type="button" class="ghost close2">انصراف</button><button type="button" class="ghost preview-before-save">پیش‌نمایش</button><button class="#ffffff">ذخیره محصول</button></div>
    </form>`);
  const form=$('#productForm');
  const setTab=(name)=>{$$('.form-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));$$('.form-pane').forEach(x=>x.classList.toggle('active',x.dataset.pane===name));};
  $$('.form-tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  $('#modalCard .close2').onclick=closeModal;
  $$('.brand-option').forEach(btn=>btn.onclick=()=>{$$('.brand-option').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');$('#brandValue').value=btn.dataset.brandValue;});
  const updateDiscount=()=>{const price=Number(form.price.value)||0, old=Number(form.oldPrice.value)||0;const pct=old>price&&old>0?Math.round((1-price/old)*100):0;$('#discountPreview b').textContent=`${fa(pct)}٪`;};
  form.price.oninput=updateDiscount; form.oldPrice.oninput=updateDiscount; updateDiscount();
  const refreshGallery=()=>{const urls=form.gallery.value.split(/\n+/).map(x=>x.trim()).filter(Boolean);$('#galleryPreview').innerHTML=urls.map(src=>`<div class="gallery-thumb"><img src="${productImage(src)}" alt=""><button type="button" data-remove-image="${esc(src)}">×</button></div>`).join('')||'<div class="gallery-empty">هنوز تصویری اضافه نشده است.</div>';};
  form.gallery.oninput=refreshGallery;
  const deviceInput=$('#deviceImageInput'), deviceDrop=$('#deviceDrop'), deviceSelected=$('#deviceSelected'), deviceClear=$('#deviceClear');
  let deviceObjectUrls=[];
  const clearDeviceUrls=()=>{deviceObjectUrls.forEach(u=>URL.revokeObjectURL(u));deviceObjectUrls=[];};
  const renderDeviceFiles=(files)=>{
    clearDeviceUrls();
    const list=Array.from(files||[]).filter(f=>f.type.startsWith('image/'));
    if(!list.length){deviceSelected.innerHTML='<span>هیچ فایل تصویری انتخاب نشده است</span>';return;}
    deviceSelected.innerHTML=list.map((f,i)=>{const u=URL.createObjectURL(f);deviceObjectUrls.push(u);return `<div class="device-file-card"><img src="${u}" alt=""><span>${esc(f.name)}</span></div>`;}).join('');
  };
  deviceInput?.addEventListener('change',e=>renderDeviceFiles(e.target.files));
  deviceDrop?.addEventListener('dragover',e=>{e.preventDefault();deviceDrop.classList.add('dragover');});
  deviceDrop?.addEventListener('dragleave',()=>deviceDrop.classList.remove('dragover'));
  deviceDrop?.addEventListener('drop',e=>{e.preventDefault();deviceDrop.classList.remove('dragover');renderDeviceFiles(e.dataTransfer.files);});
  deviceClear?.addEventListener('click',()=>{if(deviceInput)deviceInput.value='';clearDeviceUrls();if(deviceSelected)deviceSelected.innerHTML='<span>هیچ فایلی انتخاب نشده است</span>';});
  form.image.oninput=()=>{$('#mainImagePreview').src=productImage(form.image.value)};
  $('#galleryPreview').onclick=e=>{const b=e.target.closest('[data-remove-image]');if(!b)return;const val=b.dataset.removeImage;form.gallery.value=form.gallery.value.split(/\n+/).filter(x=>x.trim()!==val).join('\n');refreshGallery();};
  $('.preview-before-save').onclick=()=>{
    const d=Object.fromEntries(new FormData(form));
    const preview={name:d.name,brand:d.brand,category:d.category,price:Number(d.price),stock:Number(d.stock),sku:d.sku,image:d.image,desc:d.desc,metadata:{oldPrice:Number(d.oldPrice)||0,shortDesc:d.shortDesc,gender:d.gender}};
    closeModal();openProductPreview(preview);
  };
  form.onsubmit=async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(form));
    const galleryUrls=d.gallery.split(/\n+/).map(x=>x.trim()).filter(Boolean);
    const obj={name:d.name,brand:d.brand,category:d.category,price:Number(d.price),stock:Number(d.stock),sku:d.sku,image:d.image||galleryUrls[0]||'assets/watch-1.jpg',desc:d.desc,metadata:{
      oldPrice:Number(d.oldPrice)||0,
      discountPercent:Number(d.oldPrice)>Number(d.price)?Math.round((1-(Number(d.price)||0)/(Number(d.oldPrice)||1))*100):0,
      active:d.active==='on',featured:d.featured==='on',bestseller:d.bestseller==='on',isNew:d.isNew==='on',gender:d.gender||'',shortDesc:d.shortDesc||'',gallery:galleryUrls,
      specs:{movement:d.movement||'',caseMaterial:d.caseMaterial||'',strapMaterial:d.strapMaterial||'',dialColor:d.dialColor||'',caseColor:d.caseColor||'',waterResistance:d.waterResistance||'',crystal:d.crystal||'',caseDiameter:d.caseDiameter||''},
      seo:{slug:d.slug||'',title:d.seoTitle||'',description:d.seoDescription||'',keywords:d.keywords||''}
    }};
    try{await apiProduct(p?'PUT':'POST',p?.id,obj);closeModal();await loadProducts();}catch(err){alert(err.message)}
  };
}

function addCategory(){openModal(`<button class="close">×</button><h2>افزودن دسته‌بندی</h2><form id="simpleForm" class="form"><label class="full">نام دسته<input name="name" required></label><div class="modal-actions full"><button class="#ffffff">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const id=Date.now().toString();categories.push({id,name:d.name});save();closeModal();render()}}
function addBrand(){openModal(`<button class="close">×</button><h2>افزودن برند</h2><form id="simpleForm" class="form"><label class="full">نام برند<input name="name" required></label><div class="modal-actions full"><button class="#ffffff">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));brands.push(d.name.toUpperCase());save();closeModal();render()}}
function addCoupon(){openModal(`<button class="close">×</button><h2>ساخت کد تخفیف</h2><form id="simpleForm" class="form"><label>کد<input name="code" required></label><label>درصد تخفیف<input name="percent" type="number" min="1" max="100" required></label><label>حداقل خرید<input name="min" type="number" min="0" value="0"></label><div class="modal-actions full"><button class="#ffffff">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));coupons.push({id:Date.now(),code:d.code.toUpperCase(),percent:Number(d.percent),min:Number(d.min)});save();closeModal();render()}}
function exportProducts(){const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='avan-products.json';a.click();URL.revokeObjectURL(a.href)}
$('#nav').onclick=e=>{const b=e.target.closest('button[data-page]');if(!b)return;current=b.dataset.page;$$('#nav button').forEach(x=>x.classList.toggle('active',x===b));render();$('#sidebar').classList.remove('open')};$('#content').onclick=e=>{const ed=e.target.closest('[data-edit]'),view=e.target.closest('[data-view]'),del=e.target.closest('[data-del]'),cd=e.target.closest('[data-cat-del]'),bd=e.target.closest('[data-brand-del]'),cp=e.target.closest('[data-coupon-del]');if(ed)openProduct(ed.dataset.edit);if(view){const p=products.find(x=>String(x.id)===String(view.dataset.view));if(p)openProductPreview(p)}if(del&&confirm('این محصول حذف شود؟')){apiProduct('DELETE',del.dataset.del).then(loadProducts).catch(err=>alert(err.message))}if(cd&&confirm('این دسته حذف شود؟')){categories=categories.filter(x=>x.id!==cd.dataset.catDel);save();render()}if(bd&&confirm('این برند حذف شود؟')){brands=brands.filter(x=>x!==bd.dataset.brandDel);save();render()}if(cp){coupons=coupons.filter(x=>String(x.id)!==String(cp.dataset.couponDel));save();render()}};$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');
async function refreshSupportBadge(){try{const d=await supportApi('/api/admin/support/unread');const b=document.querySelector('#nav button[data-page=\"tickets\"]');if(b){let x=b.querySelector('.support-count');if(!x){x=document.createElement('b');x.className='support-count';b.appendChild(x)}x.textContent=fa((d.tickets||0)+(d.chats||0));x.hidden=!((d.tickets||0)+(d.chats||0));}}catch(_){}}
setInterval(refreshSupportBadge,8000);refreshSupportBadge();$('#logout').onclick=async()=>{await fetch('/api/admin/logout',{method:'POST'});location.href='/admin';};save();render();loadProducts();
