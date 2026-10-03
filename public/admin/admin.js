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
function orders(){return head('سفارش‌ها','مدیریت پرداخت، ارسال و کد رهگیری')+`<section class="panel"><div class="notice">فعلاً سفارشی ثبت نشده است. پس از اتصال D1، سفارش‌های واقعی اینجا نمایش داده می‌شوند.</div><div class="table-wrap"><table class="table"><tr><th>شماره</th><th>مشتری</th><th>مبلغ</th><th>پرداخت</th><th>ارسال</th><th>کد رهگیری</th></tr><tr><td>—</td><td>—</td><td>۰ تومان</td><td>—</td><td>—</td><td>—</td></tr></table></div></section>`}
function categoriesPage(){return head('دسته‌بندی‌ها','ساختار دسته‌بندی محصولات',`<button class="gold" id="addCategory">＋ دسته جدید</button>`)+`<div class="cards3" id="categoryList">${categories.map(c=>`<div class="info"><h4>${c.name}</h4><p>شناسه: ${c.id}<br>محصولات: ${fa(products.filter(p=>p.category===c.id).length)}<br><button class="mini" data-cat-del="${c.id}">حذف</button></p></div>`).join('')}</div>`}
function brandsPage(){return head('برندها','کاتالوگ برندهای قابل انتخاب در محصول',`<button class="gold" id="addBrand">＋ برند جدید</button>`)+`<div class="cards3" id="brandList">${brands.map(b=>`<div class="info"><h4>${b}</h4><p>محصولات: ${fa(products.filter(p=>p.brand===b).length)}<br><button class="mini" data-brand-del="${b}">حذف از کاتالوگ</button></p></div>`).join('')}</div>`}
function couponsPage(){return head('کدهای تخفیف','ساخت و مدیریت کمپین‌های تخفیف',`<button class="gold" id="addCoupon">＋ کد تخفیف</button>`)+`<div class="cards3" id="couponList">${coupons.length?coupons.map(c=>`<div class="info"><h4>${c.code}</h4><p>${fa(c.percent)}٪ تخفیف • حداقل خرید ${fa(c.min)} تومان<br><button class="mini" data-coupon-del="${c.id}">حذف</button></p></div>`).join(''):'<div class="notice">هنوز کد تخفیفی ایجاد نشده است.</div>'}</div>`}

async function supportApi(path, options={}){const r=await fetch(path,{cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'خطا در ارتباط با پشتیبانی');return d}
function supportStatusLabel(v){return v==='closed'?'بسته':v==='pending'?'در حال بررسی':'باز'}
async function ticketsPage(){
  const [td,cd]=await Promise.all([supportApi('/api/admin/support/tickets'),supportApi('/api/admin/support/chats')]);
  const tickets=td.tickets||[], chats=cd.chats||[];
  return head('پشتیبانی آوان','تیکت‌ها و چت‌های مشتریان؛ پاسخ شما مستقیم برای مشتری ارسال می‌شود.',`<div class="support-admin-tools"><button class="gold" id="refreshSupport">↻ بروزرسانی</button></div>`)+
  `<div class="support-admin-stats"><div><b>${fa(tickets.filter(x=>x.status==='open').length)}</b><small>تیکت باز</small></div><div><b>${fa(tickets.filter(x=>x.status==='pending').length)}</b><small>در حال بررسی</small></div><div><b>${fa(chats.filter(x=>x.status==='open').length)}</b><small>گفت‌وگوی فعال</small></div><div><b>${fa(tickets.length)}</b><small>کل تیکت‌ها</small></div></div>`+
  `<div class="support-admin-grid"><section class="panel support-admin-list"><div class="support-admin-head"><h3>تیکت‌های مشتریان</h3><span>${fa(tickets.length)} مورد</span></div>${tickets.length?tickets.map(t=>`<button class="support-admin-item" data-ticket-open="${esc(t.id)}"><div><b>${esc(t.subject)}</b><small>${esc(t.name)} • ${esc(t.phone)}</small></div><span class="support-status ${esc(t.status)}">${supportStatusLabel(t.status)}</span><time>${new Date(t.created_at).toLocaleString('fa-IR')}</time></button>`).join(''):`<div class="support-empty">هنوز تیکتی ثبت نشده است.</div>`}</section>`+
  `<section class="panel support-admin-list"><div class="support-admin-head"><h3>چت‌های آنلاین</h3><span>${fa(chats.length)} گفتگو</span></div>${chats.length?chats.map(c=>`<button class="support-admin-item" data-chat-open="${esc(c.id)}"><div><b>${esc(c.name||'مهمان سایت')}</b><small>${esc(c.phone||'بدون شماره')} • ${fa(c.message_count)} پیام</small></div><span class="support-status ${esc(c.status)}">${c.status==='open'?'فعال':'بسته'}</span><time>${new Date(c.updated_at).toLocaleString('fa-IR')}</time></button>`).join(''):`<div class="support-empty">هنوز گفت‌وگویی ثبت نشده است.</div>`}</section></div>`;
}
function openTicketSupport(t){
  openModal(`<button class="close">×</button><div class="support-reply-head"><div><h2>${esc(t.subject)}</h2><p>${esc(t.name)} • <span dir="ltr">${esc(t.phone)}</span> • ${esc(t.id)}</p></div><span class="support-status ${esc(t.status)}">${supportStatusLabel(t.status)}</span></div><div class="support-original"><small>درخواست مشتری</small><p>${esc(t.message)}</p></div><label class="support-label">پاسخ مدیر<textarea id="ticketReplyText" rows="6" placeholder="پاسخ مشتری را بنویسید...">${esc(t.admin_reply||'')}</textarea></label><label class="support-label">وضعیت<select id="ticketStatus"><option value="open" ${t.status==='open'?'selected':''}>باز</option><option value="pending" ${t.status==='pending'?'selected':''}>در حال بررسی</option><option value="closed" ${t.status==='closed'?'selected':''}>بسته</option></select></label><div class="modal-actions"><button class="ghost close2">انصراف</button><button class="gold" id="saveTicketReply">ذخیره و ارسال پاسخ</button></div>`);
  $('#modalCard .close2').onclick=closeModal;$('#modalCard #saveTicketReply').onclick=async()=>{const b=$('#modalCard #saveTicketReply');b.disabled=true;try{await supportApi('/api/admin/support/tickets/'+encodeURIComponent(t.id),{method:'PUT',body:JSON.stringify({reply:$('#ticketReplyText').value,status:$('#ticketStatus').value})});closeModal();renderTickets();}catch(e){alert(e.message)}finally{b.disabled=false}};
}
async function openChatSupport(id){
  const d=await supportApi('/api/admin/support/chats/'+encodeURIComponent(id));
  const chat=(d.messages||[]);openModal(`<button class="close">×</button><div class="support-reply-head"><div><h2>چت آنلاین مشتری</h2><p>گفت‌وگوی مستقیم با مشتری</p></div><span class="support-live-dot">● آنلاین</span></div><div class="admin-chat-messages" id="adminChatMessages">${chat.map(m=>`<div class="admin-chat-row ${m.sender_type==='admin'?'admin':'customer'}"><div>${esc(m.message)}<small>${m.sender_type==='admin'?'پشتیبانی آوان':'مشتری'} • ${new Date(m.created_at).toLocaleString('fa-IR')}</small></div></div>`).join('')}</div><form id="adminChatForm" class="admin-chat-form"><input id="adminChatInput" required placeholder="پاسخ خود را بنویسید..."><button class="gold">ارسال پاسخ</button></form>`);
  const box=$('#adminChatMessages');if(box)box.scrollTop=box.scrollHeight;
  $('#adminChatForm').onsubmit=async e=>{e.preventDefault();const input=$('#adminChatInput');const btn=e.target.querySelector('button');btn.disabled=true;try{await supportApi('/api/admin/support/chats/'+encodeURIComponent(id),{method:'POST',body:JSON.stringify({message:input.value})});input.value='';const fresh=await supportApi('/api/admin/support/chats/'+encodeURIComponent(id));if(box){box.innerHTML=(fresh.messages||[]).map(m=>`<div class="admin-chat-row ${m.sender_type==='admin'?'admin':'customer'}"><div>${esc(m.message)}<small>${m.sender_type==='admin'?'پشتیبانی آوان':'مشتری'} • ${new Date(m.created_at).toLocaleString('fa-IR')}</small></div></div>`).join('');box.scrollTop=box.scrollHeight;}}catch(err){alert(err.message)}finally{btn.disabled=false}};
  window.__avanChatAdminTimer=setInterval(async()=>{if(!document.body.contains(box)){clearInterval(window.__avanChatAdminTimer);window.__avanChatAdminTimer=null;return}try{const fresh=await supportApi('/api/admin/support/chats/'+encodeURIComponent(id));if(box){const wasBottom=box.scrollHeight-box.scrollTop-box.clientHeight<30;box.innerHTML=(fresh.messages||[]).map(m=>`<div class="admin-chat-row ${m.sender_type==='admin'?'admin':'customer'}"><div>${esc(m.message)}<small>${m.sender_type==='admin'?'پشتیبانی آوان':'مشتری'} • ${new Date(m.created_at).toLocaleString('fa-IR')}</small></div></div>`).join('');if(wasBottom)box.scrollTop=box.scrollHeight;}}catch(_){}},4000);
}
async function renderTickets(){try{$('#content').innerHTML='<div class="support-loading">در حال دریافت پیام‌های مشتریان…</div>';$('#title').textContent='تیکت پشتیبانی';const html=await ticketsPage();$('#content').innerHTML=html;$('#refreshSupport').onclick=renderTickets;$$('[data-ticket-open]').forEach(b=>b.onclick=async()=>{try{const d=await supportApi('/api/admin/support/tickets');const t=(d.tickets||[]).find(x=>x.id===b.dataset.ticketOpen);if(t)openTicketSupport(t)}catch(e){alert(e.message)}});$$('[data-chat-open]').forEach(b=>b.onclick=()=>openChatSupport(b.dataset.chatOpen));}catch(e){$('#content').innerHTML=`<div class="notice">${esc(e.message)}</div>`}}

function render(){let html='';if(current==='dashboard')html=dashboard();if(current==='products')html=productsPage();if(current==='orders')html=orders();if(current==='customers')html=simple('مشتریان','حساب‌ها، سوابق خرید و وضعیت کاربران',[['کل مشتریان','۰ حساب ثبت شده'],['مشتری جدید','۰ در ۳۰ روز اخیر'],['وفاداری','ساختار آماده اتصال به D1']]);if(current==='categories')html=categoriesPage();if(current==='brands')html=brandsPage();if(current==='coupons')html=couponsPage();if(current==='reviews')html=simple('نظرات مشتریان','تأیید، رد و پاسخ به دیدگاه‌ها',[['در انتظار بررسی','۰ نظر'],['امتیاز محصولات','پس از ثبت خرید فعال می‌شود'],['گزارش اسپم','مدیریت گزارش‌های کاربران']]);if(current==='content')html=simple('محتوا و بنرها','مدیریت Hero، بنر، مجله و صفحات ثابت',[['Hero اصلی','تصویر، عنوان و CTA صفحه اول'],['مجله آوان','مقالات و محتوای آموزشی'],['صفحات ثابت','درباره ما، تماس، قوانین و حریم خصوصی']]);if(current==='notifications')html=simple('اعلان‌ها','مدیریت اعلان‌های فروشگاه',[['اعلان سفارش','ثبت، پرداخت و ارسال سفارش'],['اعلان مدیریتی','موجودی کم و سفارش جدید'],['اعلان مشتری','ساختار آماده اتصال به SMS/Email']]);if(current==='tickets'){renderTickets();return;}if(current==='wallet')html=simple('کیف پول و وفاداری','امتیاز، اعتبار و باشگاه مشتریان',[['امتیاز خرید','قابل فعال‌سازی برای مشتریان'],['کیف پول','شارژ و برداشت اعتبار'],['سطوح مشتری','برنزی، نقره‌ای، طلایی']]);if(current==='reports')html=simple('گزارش‌ها','گزارش فروش، محصولات و مشتریان',[['گزارش فروش','روزانه، ماهانه و بازه دلخواه'],['محصولات پرفروش','قابل محاسبه از سفارش‌ها'],['گزارش موجودی','هشدار موجودی کم']]);if(current==='admins')html=simple('مدیران و دسترسی‌ها','مدیریت کاربران پنل و سطح دسترسی',[['مدیر اصلی','دسترسی کامل'],['مدیر محتوا','بنر، مجله و صفحات'],['اپراتور سفارش','سفارش‌ها و مشتریان']]);if(current==='activity')html=simple('گزارش فعالیت','ثبت عملیات مدیران و تغییرات',[['ورود مدیران','زمان و نشست‌ها'],['تغییر محصول','قیمت، موجودی و اطلاعات'],['تغییر تنظیمات','ثبت عملیات حساس']]);if(current==='settings')html=simple('تنظیمات فروشگاه','تنظیمات اصلی آوان',[['اطلاعات فروشگاه','نام، لوگو، تماس و آدرس'],['پرداخت','درگاه و وضعیت پرداخت'],['ارسال','روش‌ها، هزینه و کد رهگیری'],['امنیت','مدیران و نشست‌ها']]);$('#content').innerHTML=html;const nav=document.querySelector(`#nav button[data-page="${current}"]`);$('#title').textContent=nav?.querySelector('span')?.textContent||'داشبورد';if(current==='products'){
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
      <div class="modal-actions"><button class="ghost close2">بستن</button><button class="gold edit-preview">ویرایش محصول</button></div>
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
      <div class="modal-actions product-form-actions"><button type="button" class="ghost close2">انصراف</button><button type="button" class="ghost preview-before-save">پیش‌نمایش</button><button class="gold">ذخیره محصول</button></div>
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

function addCategory(){openModal(`<button class="close">×</button><h2>افزودن دسته‌بندی</h2><form id="simpleForm" class="form"><label class="full">نام دسته<input name="name" required></label><div class="modal-actions full"><button class="gold">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const id=Date.now().toString();categories.push({id,name:d.name});save();closeModal();render()}}
function addBrand(){openModal(`<button class="close">×</button><h2>افزودن برند</h2><form id="simpleForm" class="form"><label class="full">نام برند<input name="name" required></label><div class="modal-actions full"><button class="gold">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));brands.push(d.name.toUpperCase());save();closeModal();render()}}
function addCoupon(){openModal(`<button class="close">×</button><h2>ساخت کد تخفیف</h2><form id="simpleForm" class="form"><label>کد<input name="code" required></label><label>درصد تخفیف<input name="percent" type="number" min="1" max="100" required></label><label>حداقل خرید<input name="min" type="number" min="0" value="0"></label><div class="modal-actions full"><button class="gold">ذخیره</button></div></form>`);$('#simpleForm').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));coupons.push({id:Date.now(),code:d.code.toUpperCase(),percent:Number(d.percent),min:Number(d.min)});save();closeModal();render()}}
function exportProducts(){const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='avan-products.json';a.click();URL.revokeObjectURL(a.href)}
$('#nav').onclick=e=>{const b=e.target.closest('button[data-page]');if(!b)return;current=b.dataset.page;$$('#nav button').forEach(x=>x.classList.toggle('active',x===b));render();$('#sidebar').classList.remove('open')};$('#content').onclick=e=>{const ed=e.target.closest('[data-edit]'),view=e.target.closest('[data-view]'),del=e.target.closest('[data-del]'),cd=e.target.closest('[data-cat-del]'),bd=e.target.closest('[data-brand-del]'),cp=e.target.closest('[data-coupon-del]');if(ed)openProduct(ed.dataset.edit);if(view){const p=products.find(x=>String(x.id)===String(view.dataset.view));if(p)openProductPreview(p)}if(del&&confirm('این محصول حذف شود؟')){apiProduct('DELETE',del.dataset.del).then(loadProducts).catch(err=>alert(err.message))}if(cd&&confirm('این دسته حذف شود؟')){categories=categories.filter(x=>x.id!==cd.dataset.catDel);save();render()}if(bd&&confirm('این برند حذف شود؟')){brands=brands.filter(x=>x!==bd.dataset.brandDel);save();render()}if(cp){coupons=coupons.filter(x=>String(x.id)!==String(cp.dataset.couponDel));save();render()}};$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');
async function refreshSupportBadge(){try{const d=await supportApi('/api/admin/support/unread');const b=document.querySelector('#nav button[data-page=\"tickets\"]');if(b){let x=b.querySelector('.support-count');if(!x){x=document.createElement('b');x.className='support-count';b.appendChild(x)}x.textContent=fa((d.tickets||0)+(d.chats||0));x.hidden=!((d.tickets||0)+(d.chats||0));}}catch(_){}}
setInterval(refreshSupportBadge,8000);refreshSupportBadge();$('#logout').onclick=async()=>{await fetch('/api/admin/logout',{method:'POST'});location.href='/admin';};save();render();loadProducts();
