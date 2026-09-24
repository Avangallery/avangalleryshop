const products=[
{id:1,name:"کلاسیک آوان 01",cat:"classic",price:4890000,old:5590000,discount:13},
{id:2,name:"آوان رویال 02",cat:"luxury",price:7290000,old:8290000,discount:12},
{id:3,name:"کلاسیک نقره‌ای 03",cat:"classic",price:3950000,old:0,discount:0},
{id:4,name:"آوان پرستیژ 04",cat:"new",price:8950000,old:9990000,discount:10},
{id:5,name:"آوان کلاسیک 05",cat:"classic",price:5290000,old:5990000,discount:12},
{id:6,name:"رویال مشکی 06",cat:"luxury",price:9600000,old:10900000,discount:12},
{id:7,name:"آوان اِلگانس 07",cat:"new",price:6490000,old:0,discount:0},
{id:8,name:"کلاسیک گلد 08",cat:"luxury",price:7990000,old:8990000,discount:11}
];
let cart=[];
const fa=n=>new Intl.NumberFormat('fa-IR').format(n);
function renderProducts(list=products){
 document.getElementById('productGrid').innerHTML=list.map(p=>`
 <article class="product"><div class="product-img">${p.discount?`<span class="discount">${fa(p.discount)}٪ تخفیف</span>`:''}<button class="heart">♡</button><div class="mini-watch">AVAN</div></div>
 <div class="product-info"><small>AVAN GALLERY</small><h3>${p.name}</h3><div class="price"><b>${fa(p.price)} تومان</b>${p.old?`<span class="old">${fa(p.old)}</span>`:''}</div><button class="add" onclick="addCart(${p.id})">افزودن به سبد</button></div></article>`).join('');
}
function filterProducts(cat,el){if(el){document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));el.classList.add('active')}renderProducts(cat==='all'?products:products.filter(p=>p.cat===cat))}
function addCart(id){const p=products.find(x=>x.id===id);cart.push(p);renderCart();document.getElementById('cartCount').textContent=fa(cart.length);openCart()}
function renderCart(){document.getElementById('cartItems').innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-item"><div class="cart-item-img">A</div><div><h4>${p.name}</h4><small>${fa(p.price)} تومان</small></div><button onclick="removeCart(${i})" style="margin-right:auto;background:none;border:0;color:#c9a55b;cursor:pointer">×</button></div>`).join(''):'<p style="color:#7f8d9e;text-align:center;padding:50px 0">سبد خرید شما خالی است.</p>';document.getElementById('cartTotal').textContent=fa(cart.reduce((s,p)=>s+p.price,0))+' تومان'}
function removeCart(i){cart.splice(i,1);renderCart();document.getElementById('cartCount').textContent=fa(cart.length)}
function openCart(){document.getElementById('cart').classList.add('open');document.getElementById('backdrop').classList.add('show')}
function closeCart(){document.getElementById('cart').classList.remove('open');document.getElementById('backdrop').classList.remove('show')}
function toggleMenu(){document.getElementById('mobileMenu').classList.toggle('show')}
function toggleSearch(){document.getElementById('searchOverlay').classList.toggle('show');if(document.getElementById('searchOverlay').classList.contains('show'))document.getElementById('searchInput').focus()}
function searchProducts(){const q=document.getElementById('searchInput').value.trim();const r=document.getElementById('searchResults');const list=products.filter(p=>p.name.includes(q));r.innerHTML=q?list.map(p=>`<div style="padding:12px;border-bottom:1px solid #1e3245">${p.name} — ${fa(p.price)} تومان</div>`).join(''):'<p style="color:#8290a0">نام ساعت را جستجو کنید.</p>'}
renderProducts();renderCart();
