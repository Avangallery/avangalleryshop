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
function dashboard(){return head('داشبورد','نمای کلی فروشگاه آوان گالری')+`<div class="stats"><div class="stat"><span class="k">⌚</span><small>محصولات</small><b>${fa(products.length)}</b></div><div class="stat"><span class="k">▣</span><small>سفارش‌های امروز</small><b>۰</b></div><div class="stat"><span class="k">♙</span><small>مشتریان</small><b>۰</b></div><div class="stat"><span class="k">₽</span><small>فروش امروز</small><b>۰ تومان</b></div><div class="stat"><span class="k">☆</span><small>نظرات جدید</small><b>۰</b></div></div><div class="layout2"><section class="panel"><h3>فروش ۷ روز اخیر</h3><div class="bars">${[25,42,35,60,48,76,58].map(h=>`<i class="bar" style="height:${h}%"></i>`).join('')}</div></section><section class="panel"><h3>وضعیت فروشگاه</h3><div class="cards3" style="grid-template-columns:1fr"><div class="info"><h4>محصولات</h4><p>${products.length?'محصول فعال دارید.':'هنوز محصولی ثبت نشده؛ از بخش محصولات اولین محصول را اضافه کنید.'}</p></div><div class="info"><h4>اتصال فروشگاه</h4><p>این نسخه داده‌ها را محلی نگه می‌دارد و ساختار برای اتصال Worker + D1 آماده است.</p></div></div></section></div>`}
function productImage(src){
  const value=String(src||'assets/watch-1.jpg').trim();
  if(/^https?:\/\//i.test(value)||value.startsWith('data:')||value.startsWith('/')) return value;
  return '/'+value.replace(/^\.\//,'').replace(/^\/+/, '');
}
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
  return head('مدیریت محصولات','افزودن، ویرایش، موجودی، تصاویر و قیمت محصولات',`<button class="gold" id="newProduct">＋ افزودن محصول جدید</button>`)+
  `<div class="product-summary">
    <div class="product-stat"><span class="stat-icon gold-icon">▣</span><div><small>ارزش کل موجودی</small><b>${fa(totalValue)} <em>تومان</em></b></div></div>
    <div class="product-stat"><span class="stat-icon blue-icon">⌚</span><div><small>کل محصولات</small><b>${fa(products.length)} <em>محصول</em></b></div></div>
    <div class="product-stat"><span class="stat-icon green-icon">✓</span><div><small>موجود در انبار</small><b>${fa(inStock)} <em>محصول</em></b></div></div>
    <div class="product-stat"><span class="stat-icon amber-icon">!</span><div><small>موجودی کم</small><b>${fa(lowStock)} <em>محصول</em></b></div></div>
    <div class="product-stat"><span class="stat-icon red-icon">×</span><div><small>ناموجود</small><b>${fa(outStock)} <em>محصول</em></b></div></div>
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
        ${categories.map(c=>`<label class="checkline"><input type="checkbox" value="${c.id}" class="catFilter"><span>${c.name}</span><b>${fa(products.filter(p=>p.category===c.id).length)}</b></label>`).join('')}
      </div>
      <div class="filter-block"><strong>برندها</strong>
        <label class="checkline"><input type="checkbox" value="all" class="brandFilter" checked><span>همه</span><b>${fa(products.length)}</b></label>
        ${brandOptions.slice(0,12).map(b=>`<label class="checkline"><input type="checkbox" value="${String(b).replace(/"/g,'&quot;')}" class="brandFilter"><span>${b}</span><b>${fa(products.filter(p=>p.brand===b).length)}</b></label>`).join('')}
      </div>
    </aside>
    <section class="product-main">
      <div class="product-tools panel">
        <div class="search-box"><span>⌕</span><input id="pSearch" placeholder="جستجوی محصول، برند یا SKU ..."></div>
        <select id="pSort"><option value="new">جدیدترین</option><option value="priceAsc">قیمت: کم به زیاد</option><option value="priceDesc">قیمت: زیاد به کم</option><option value="stockAsc">موجودی: کم به زیاد</option><option value="stockDesc">موجودی: زیاد به کم</option><option value="name">نام محصول</option></select>
        <button class="ghost" id="exportProducts">خروجی JSON</button>
      </div>
      <section class="panel products-panel">
        <div class="products-table-head"><div><h3>فهرست محصولات</h3><small id="productsCount">${fa(products.length)} محصول</small></div><span class="server-chip">● اتصال D1 فعال</span></div>
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
      <div class="cell-brand">${p.brand||'—'}</div>
      <div class="price-cell">${fa(p.price)}<small>تومان</small></div>
      <div><span class="stock-number ${meta.cls}">${fa(p.stock)}</span></div>
      <div><span class="status-chip ${meta.cls}"><i></i>${meta.label}</span></div>
      <div class="cell-muted">${dateText}</div>
      <div class="row-actions"><button class="icon-action view" title="مشاهده" data-view="${p.id}">◉</button><button class="icon-action edit" title="ویرایش" data-edit="${p.id}">✎</button><button class="icon-action delete" title="حذف" data-del="${p.id}">⌫</button></div>
    </article>`;
  }).join(''):`<div class="empty-products"><div class="empty-icon">⌚</div><h3>محصولی پیدا نشد</h3><p>فیلترها یا عبارت جستجو را تغییر دهید.</p></div>`;
}
function simple(title,sub,items){return head(title,sub)+`<div class="cards3">${items.map(x=>`<div class="info"><h4>${x[0]}</h4><p>${x[1]}</p></div>`).join('')}</div>`}
function orders(){return head('سفارش‌ها','مدیریت پرداخت، ارسال و کد رهگیری')+`<section class="panel"><div class="notice">فعلاً سفارشی ثبت نشده است. پس از اتصال D1، سفارش‌های واقعی اینجا نمایش داده می‌شوند.</div><div class="table-wrap"><table class="table"><tr><th>شماره</th><th>مشتری</th><th>مبلغ</th><th>پرداخت</th><th>ارسال</th><th>کد رهگیری</th></tr><tr><td>—</td><td>—</td><td>۰ تومان</td><td>—</td><td>—</td><td>—</td></tr></table></div></section>`}
function categoriesPage(){return head('دسته‌بندی‌ها','ساختار دسته‌بندی محصولات',`<button class="gold" id="addCategory">＋ دسته جدید</button>`)+`<div class="cards3" id="categoryList">${categories.map(c=>`<div class="info"><h4>${c.name}</h4><p>شناسه: ${c.id}<br>محصولات: ${fa(products.filter(p=>p.category===c.id).length)}<br><button class="mini" data-cat-del="${c.id}">حذف</button></p></div>`).join('')}</div>`}
function brandsPage(){return head('برندها','کاتالوگ برندهای قابل انتخاب در محصول',`<button class="gold" id="addBrand">＋ برند جدید</button>`)+`<div class="cards3" id="brandList">${brands.map(b=>`<div class="info"><h4>${b}</h4><p>محصولات: ${fa(products.filter(p=>p.brand===b).length)}<br><button class="mini" data-brand-del="${b}">حذف از کاتالوگ</button></p></div>`).join('')}</div>`}
function couponsPage(){return head('کدهای تخفیف','ساخت و مدیریت کمپین‌های تخفیف',`<button class="gold" id="addCoupon">＋ کد تخفیف</button>`)+`<div class="cards3" id="couponList">${coupons.length?coupons.map(c=>`<div class="info"><h4>${c.code}</h4><p>${fa(c.percent)}٪ تخفیف • حداقل خرید ${fa(c.min)} تومان<br><button class="mini" data-coupon-del="${c.id}">حذف</button></p></div>`).join(''):'<div class="notice">هنوز کد تخفیفی ایجاد نشده است.</div>'}</div>`}
function render(){let html='';if(current==='dashboard')html=dashboard();if(current==='products')html=productsPage();if(current==='orders')html=orders();if(current==='customers')html=simple('مشتریان','حساب‌ها، سوابق خرید و وضعیت کاربران',[['کل مشتریان','۰ حساب ثبت شده'],['مشتری جدید','۰ در ۳۰ روز اخیر'],['وفاداری','ساختار آماده اتصال به D1']]);if(current==='categories')html=categoriesPage();if(current==='brands')html=brandsPage();if(current==='coupons')html=couponsPage();if(current==='reviews')html=simple('نظرات مشتریان','تأیید، رد و پاسخ به دیدگاه‌ها',[['در انتظار بررسی','۰ نظر'],['امتیاز محصولات','پس از ثبت خرید فعال می‌شود'],['گزارش اسپم','مدیریت گزارش‌های کاربران']]);if(current==='content')html=simple('محتوا و بنرها','مدیریت Hero، بنر، مجله و صفحات ثابت',[['Hero اصلی','تصویر، عنوان و CTA صفحه اول'],['مجله آوان','مقالات و محتوای آموزشی'],['صفحات ثابت','درباره ما، تماس، قوانین و حریم خصوصی']]);if(current==='notifications')html=simple('اعلان‌ها','مدیریت اعلان‌های فروشگاه',[['اعلان سفارش','ثبت، پرداخت و ارسال سفارش'],['اعلان مدیریتی','موجودی کم و سفارش جدید'],['اعلان مشتری','ساختار آماده اتصال به SMS/Email']]);if(current==='tickets')html=simple('تیکت پشتیبانی','مدیریت درخواست‌های مشتریان',[['باز','۰ تیکت'],['در حال بررسی','۰ تیکت'],['بسته','۰ تیکت']]);if(current==='wallet')html=simple('کیف پول و وفاداری','امتیاز، اعتبار و باشگاه مشتریان',[['امتیاز خرید','قابل فعال‌سازی برای مشتریان'],['کیف پول','شارژ و برداشت اعتبار'],['سطوح مشتری','برنزی، نقره‌ای، طلایی']]);if(current==='reports')html=simple('گزارش‌ها','گزارش فروش، محصولات و مشتریان',[['گزارش فروش','روزانه، ماهانه و بازه دلخواه'],['محصولات پرفروش','قابل محاسبه از سفارش‌ها'],['گزارش موجودی','هشدار موجودی کم']]);if(current==='admins')html=simple('مدیران و دسترسی‌ها','مدیریت کاربران پنل و سطح دسترسی',[['مدیر اصلی','دسترسی کامل'],['مدیر محتوا','بنر، مجله و صفحات'],['اپراتور سفارش','سفارش‌ها و مشتریان']]);if(current==='activity')html=simple('گزارش فعالیت','ثبت عملیات مدیران و تغییرات',[['ورود مدیران','زمان و نشست‌ها'],['تغییر محصول','قیمت، موجودی و اطلاعات'],['تغییر تنظیمات','ثبت عملیات حساس']]);if(current==='settings')html=simple('تنظیمات فروشگاه','تنظیمات اصلی آوان',[['اطلاعات فروشگاه','نام، لوگو، تماس و آدرس'],['پرداخت','درگاه و وضعیت پرداخت'],['ارسال','روش‌ها، هزینه و کد رهگیری'],['امنیت','مدیران و نشست‌ها']]);$('#content').innerHTML=html;const nav=document.querySelector(`#nav button[data-page="${current}"]`);$('#title').textContent=nav?.querySelector('span')?.textContent||'داشبورد';if(current==='products'){
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
function openModal(html){$('#modalCard').innerHTML=html;$('#modal').classList.add('open');$('#modal').setAttribute('aria-hidden','false');$('#modalCard .close')?.addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()},{once:true})}function closeModal(){$('#modal').classList.remove('open');$('#modal').setAttribute('aria-hidden','true')}
async function openProduct(id=''){const p=products.find(x=>String(x.id)===String(id));openModal(`<button class="close">×</button><h2>${p?'ویرایش محصول':'افزودن محصول'}</h2><form id="productForm" class="form"><label>نام محصول<input name="name" required value="${p?.name||''}"></label><label>برند<input name="brand" required value="${p?.brand||''}"></label><label>دسته‌بندی<select name="category">${categories.map(c=>`<option value="${c.id}" ${p?.category===c.id?'selected':''}>${c.name}</option>`).join('')}</select></label><label>قیمت<input name="price" type="number" min="0" required value="${p?.price||''}"></label><label>موجودی<input name="stock" type="number" min="0" required value="${p?.stock??''}"></label><label>SKU<input name="sku" value="${p?.sku||''}"></label><label class="full">تصویر محصول<input name="image" value="${p?.image||'assets/watch-1.jpg'}"><small style="color:#7893a2">فعلاً آدرس تصویر را وارد کنید؛ R2 استفاده نمی‌شود.</small></label><label class="full">توضیحات<textarea name="desc" rows="5">${p?.desc||''}</textarea></label><div class="modal-actions full"><button type="button" class="ghost close2">انصراف</button><button class="gold">ذخیره محصول</button></div></form>`);$('#modalCard .close2').onclick=closeModal;$('#productForm').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const obj={name:d.name,brand:d.brand,category:d.category,price:Number(d.price),stock:Number(d.stock),sku:d.sku,image:d.image||'assets/watch-1.jpg',desc:d.desc};try{await apiProduct(p?'PUT':'POST',p?.id,obj);closeModal();await loadProducts();}catch(err){alert(err.message)}}}
function addCategory(){openModal(`<button class="close">×</button><h2>افزودن دسته‌بندی</h2><form id="simpleForm" class="form"><label class="full">نام دسته<input name="name" required></label><div class="modal-actions full"><button class="gold">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const id=Date.now().toString();categories.push({id,name:d.name});save();closeModal();render()}}
function addBrand(){openModal(`<button class="close">×</button><h2>افزودن برند</h2><form id="simpleForm" class="form"><label class="full">نام برند<input name="name" required></label><div class="modal-actions full"><button class="gold">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));brands.push(d.name.toUpperCase());save();closeModal();render()}}
function addCoupon(){openModal(`<button class="close">×</button><h2>ساخت کد تخفیف</h2><form id="simpleForm" class="form"><label>کد<input name="code" required></label><label>درصد تخفیف<input name="percent" type="number" min="1" max="100" required></label><label>حداقل خرید<input name="min" type="number" min="0" value="0"></label><div class="modal-actions full"><button class="gold">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));coupons.push({id:Date.now(),code:d.code.toUpperCase(),percent:Number(d.percent),min:Number(d.min)});save();closeModal();render()}}
function exportProducts(){const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='avan-products.json';a.click();URL.revokeObjectURL(a.href)}
$('#nav').onclick=e=>{const b=e.target.closest('button[data-page]');if(!b)return;current=b.dataset.page;$$('#nav button').forEach(x=>x.classList.toggle('active',x===b));render();$('#sidebar').classList.remove('open')};$('#content').onclick=e=>{const ed=e.target.closest('[data-edit]'),view=e.target.closest('[data-view]'),del=e.target.closest('[data-del]'),cd=e.target.closest('[data-cat-del]'),bd=e.target.closest('[data-brand-del]'),cp=e.target.closest('[data-coupon-del]');if(ed)openProduct(ed.dataset.edit);if(view){const p=products.find(x=>String(x.id)===String(view.dataset.view));if(p)openProduct(p.id)}if(del&&confirm('این محصول حذف شود؟')){apiProduct('DELETE',del.dataset.del).then(loadProducts).catch(err=>alert(err.message))}if(cd&&confirm('این دسته حذف شود؟')){categories=categories.filter(x=>x.id!==cd.dataset.catDel);save();render()}if(bd&&confirm('این برند حذف شود؟')){brands=brands.filter(x=>x!==bd.dataset.brandDel);save();render()}if(cp){coupons=coupons.filter(x=>String(x.id)!==String(cp.dataset.couponDel));save();render()}};$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');$('#logout').onclick=async()=>{await fetch('/api/admin/logout',{method:'POST'});location.href='/admin';};save();render();loadProducts();
