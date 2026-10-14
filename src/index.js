const SESSION_COOKIE = 'avan_admin_session';
const SESSION_TTL = 60 * 60 * 24;
const USER_SESSION_COOKIE = 'avan_user_session';
const USER_SESSION_TTL = 60 * 60 * 24 * 30;
const GOOGLE_STATE_COOKIE = 'avan_google_oauth_state';
const GOOGLE_STATE_TTL = 600;

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra }
  });
}

function cookieValue(request, name) {
  const raw = request.headers.get('Cookie') || '';
  const part = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

function b64u(bytes) {
  let s = '';
  const arr = new Uint8Array(bytes);
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
}
async function makeSession(secret) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const payload = b64u(new TextEncoder().encode(String(exp)));
  const sig = b64u(await hmac(secret, payload));
  return `${payload}.${sig}`;
}
async function makeUserSession(secret, userId) {
  const exp = Math.floor(Date.now() / 1000) + USER_SESSION_TTL;
  const payload = b64u(new TextEncoder().encode(JSON.stringify({ uid: String(userId), exp })));
  const sig = b64u(await hmac(secret, payload));
  return `${payload}.${sig}`;
}

async function validUserSession(request, secret) {
  if (!secret) return null;
  const token = cookieValue(request, USER_SESSION_COOKIE);
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', key, unb64u(sig), new TextEncoder().encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64u(payload)));
    if (!data?.uid || !Number.isFinite(Number(data.exp)) || Number(data.exp) < Math.floor(Date.now() / 1000)) return null;
    return { uid: String(data.uid), exp: Number(data.exp) };
  } catch (_) { return null; }
}

async function ensureUsersTable(env) {
  if (!env.DB) throw new Error('D1 binding DB is not configured.');
  // Create the table for fresh installs. Existing installations are migrated
  // conservatively: never change the primary-key type and never use a
  // non-constant DEFAULT in ALTER TABLE (SQLite rejects that).
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT,
    email TEXT,
    name TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT 'google',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`).run();

  const info = await env.DB.prepare(`PRAGMA table_info(users)`).all();
  const columns = new Set((info.results || []).map(row => String(row.name)));
  const additions = [
    ['google_id', `ALTER TABLE users ADD COLUMN google_id TEXT`],
    ['email', `ALTER TABLE users ADD COLUMN email TEXT`],
    ['name', `ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''`],
    ['avatar', `ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT ''`],
    ['provider', `ALTER TABLE users ADD COLUMN provider TEXT NOT NULL DEFAULT 'google'`],
    ['created_at', `ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`],
    ['updated_at', `ALTER TABLE users ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`],
    ['password_hash', `ALTER TABLE users ADD COLUMN password_hash TEXT`],
    ['phone', `ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT ''`]
  ];
  for (const [name, sql] of additions) {
    if (!columns.has(name)) {
      try { await env.DB.prepare(sql).run(); } catch (_) { /* continue; route has a safe fallback */ }
    }
  }
  // Backfill nullable/empty legacy fields without changing the PK or data.
  try { await env.DB.prepare(`UPDATE users SET created_at=datetime('now') WHERE created_at IS NULL OR created_at=''`).run(); } catch (_) {}
  try { await env.DB.prepare(`UPDATE users SET updated_at=COALESCE(NULLIF(updated_at,''), created_at, datetime('now')) WHERE updated_at IS NULL OR updated_at=''`).run(); } catch (_) {}
  try { await env.DB.prepare(`UPDATE users SET provider='google' WHERE provider IS NULL OR provider=''`).run(); } catch (_) {}
  // Indexes are best-effort; an old/odd schema must never prevent the customer panel from loading.
  try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`).run(); } catch (_) {}
  try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run(); } catch (_) {}
}

async function createUserCompat(env, data = {}) {
  const info = await env.DB.prepare(`PRAGMA table_info(users)`).all();
  const cols = (info.results || []).map(r => ({name:String(r.name), type:String(r.type||"").toUpperCase(), notnull:Number(r.notnull||0)===1, pk:Number(r.pk||0)===1, dflt:r.dflt_value}));
  const byName = new Map(cols.map(c => [c.name,c]));
  const values = {google_id:data.googleId ?? null, email:data.email ?? '', name:data.name ?? '', avatar:data.avatar ?? '', provider:data.provider ?? 'guest', phone:data.phone ?? ''};
  const idCol=byName.get('id');
  const idIsIntegerPk=!!(idCol && /INT/.test(idCol.type) && idCol.pk);
  let idValue=data.id;
  if (!idIsIntegerPk && byName.has('id')) { idValue=idValue ?? ('usr-'+crypto.randomUUID()); values.id=idValue; }
  const names=[],exprs=[],binds=[];
  for (const c of cols) {
    if (c.name==='id' && idIsIntegerPk) continue;
    if (c.name==='created_at' || c.name==='updated_at') { names.push(c.name); exprs.push(`datetime('now')`); continue; }
    if (Object.prototype.hasOwnProperty.call(values,c.name)) { names.push(c.name); exprs.push('?'); binds.push(values[c.name]); }
    else if (c.notnull && c.dflt === null && !c.pk) { names.push(c.name); exprs.push('?'); binds.push(''); }
  }
  await env.DB.prepare(`INSERT INTO users (${names.join(',')}) VALUES (${exprs.join(',')})`).bind(...binds).run();
  let user=idIsIntegerPk ? await env.DB.prepare(`SELECT * FROM users ORDER BY rowid DESC LIMIT 1`).first() : await env.DB.prepare(`SELECT * FROM users WHERE id=? LIMIT 1`).bind(idValue).first();
  if (!user && data.email) user=await env.DB.prepare(`SELECT * FROM users WHERE email=? ORDER BY rowid DESC LIMIT 1`).bind(data.email).first();
  return user;
}

async function readUsersForAdmin(env, q, limit) {
  const info = await env.DB.prepare(`PRAGMA table_info(users)`).all();
  const cols = new Set((info.results || []).map(r => String(r.name)));
  const pick = name => cols.has(name) ? name : null;
  const id = pick('id') || 'rowid';
  const email = pick('email'); const name = pick('name'); const avatar = pick('avatar');
  const provider = pick('provider'); const created = pick('created_at'); const updated = pick('updated_at');
  const select = [id, email ? `${email} AS email` : `'' AS email`, name ? `${name} AS name` : `'' AS name`, avatar ? `${avatar} AS avatar` : `'' AS avatar`, provider ? `${provider} AS provider` : `'unknown' AS provider`, created ? `${created} AS created_at` : `'' AS created_at`, updated ? `${updated} AS updated_at` : `'' AS updated_at`].join(',');
  const whereParts=[]; const binds=[];
  if(q){
    const like=`%${q}%`;
    if(name) { whereParts.push(`${name} LIKE ?`); binds.push(like); }
    if(email) { whereParts.push(`${email} LIKE ?`); binds.push(like); }
  }
  const where=whereParts.length?` WHERE ${whereParts.join(' OR ')}`:'';
  const order=created?` ORDER BY ${created} DESC`:` ORDER BY ${id} DESC`;
  const r=await env.DB.prepare(`SELECT ${select} FROM users${where}${order} LIMIT ${limit}`).bind(...binds).all();
  return r.results||[];
}

async function ensureProductMetaTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS product_meta (
    product_id TEXT PRIMARY KEY,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_product_meta_updated ON product_meta(updated_at DESC)`).run();
}


async function ensureOrdersTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, user_id TEXT, customer_name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
    province TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', postal_code TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
    subtotal INTEGER NOT NULL DEFAULT 0, shipping INTEGER NOT NULL DEFAULT 0, discount INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'card_transfer', payment_status TEXT NOT NULL DEFAULT 'pending', order_status TEXT NOT NULL DEFAULT 'pending_payment',
    tracking_code TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT ''
  )`).run();
  const info = await env.DB.prepare(`PRAGMA table_info(orders)`).all();
  const cols = new Set((info.results || []).map(r => String(r.name)));
  const additions = [
    ['user_id', `ALTER TABLE orders ADD COLUMN user_id TEXT`], ['customer_name', `ALTER TABLE orders ADD COLUMN customer_name TEXT NOT NULL DEFAULT ''`],
    ['phone', `ALTER TABLE orders ADD COLUMN phone TEXT NOT NULL DEFAULT ''`], ['email', `ALTER TABLE orders ADD COLUMN email TEXT NOT NULL DEFAULT ''`],
    ['province', `ALTER TABLE orders ADD COLUMN province TEXT NOT NULL DEFAULT ''`], ['city', `ALTER TABLE orders ADD COLUMN city TEXT NOT NULL DEFAULT ''`],
    ['address', `ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT ''`], ['postal_code', `ALTER TABLE orders ADD COLUMN postal_code TEXT NOT NULL DEFAULT ''`],
    ['notes', `ALTER TABLE orders ADD COLUMN notes TEXT NOT NULL DEFAULT ''`], ['subtotal', `ALTER TABLE orders ADD COLUMN subtotal INTEGER NOT NULL DEFAULT 0`],
    ['shipping', `ALTER TABLE orders ADD COLUMN shipping INTEGER NOT NULL DEFAULT 0`], ['discount', `ALTER TABLE orders ADD COLUMN discount INTEGER NOT NULL DEFAULT 0`],
    ['total', `ALTER TABLE orders ADD COLUMN total INTEGER NOT NULL DEFAULT 0`], ['payment_method', `ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'card_transfer'`],
    ['payment_status', `ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'`], ['order_status', `ALTER TABLE orders ADD COLUMN order_status TEXT NOT NULL DEFAULT 'pending_payment'`],
    ['tracking_code', `ALTER TABLE orders ADD COLUMN tracking_code TEXT NOT NULL DEFAULT ''`], ['payment_reference', `ALTER TABLE orders ADD COLUMN payment_reference TEXT NOT NULL DEFAULT ''`], ['receipt_image', `ALTER TABLE orders ADD COLUMN receipt_image TEXT NOT NULL DEFAULT ''`], ['created_at', `ALTER TABLE orders ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`],
    ['updated_at', `ALTER TABLE orders ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`]
  ];
  for (const [name, sql] of additions) if (!cols.has(name)) await env.DB.prepare(sql).run();
  await env.DB.prepare(`UPDATE orders SET created_at=datetime('now') WHERE created_at IS NULL OR created_at=''`).run();
  await env.DB.prepare(`UPDATE orders SET updated_at=datetime('now') WHERE updated_at IS NULL OR updated_at=''`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL DEFAULT '', product_image TEXT NOT NULL DEFAULT '', unit_price INTEGER NOT NULL DEFAULT 0, quantity INTEGER NOT NULL DEFAULT 1, line_total INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE)`).run();
  const itemInfo = await env.DB.prepare(`PRAGMA table_info(order_items)`).all();
  const itemCols = new Set((itemInfo.results || []).map(r => String(r.name)));
  const itemAdds = [['product_name',`ALTER TABLE order_items ADD COLUMN product_name TEXT NOT NULL DEFAULT ''`],['product_image',`ALTER TABLE order_items ADD COLUMN product_image TEXT NOT NULL DEFAULT ''`],['unit_price',`ALTER TABLE order_items ADD COLUMN unit_price INTEGER NOT NULL DEFAULT 0`],['quantity',`ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1`],['line_total',`ALTER TABLE order_items ADD COLUMN line_total INTEGER NOT NULL DEFAULT 0`]];
  for (const [name, sql] of itemAdds) if (!itemCols.has(name)) await env.DB.prepare(sql).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status,payment_status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id,created_at DESC)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`).run();
}

async function ensureStoreSettings(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
}

async function paymentConfig(env) {
  await ensureStoreSettings(env);
  const {results} = await env.DB.prepare(`SELECT key,value FROM store_settings WHERE key IN ('payment_card_number','payment_card_name','payment_bank_name','payment_gateway_enabled','payment_gateway_name','payment_gateway_merchant_id','payment_gateway_note')`).all();
  const m = Object.fromEntries((results || []).map(r => [r.key, r.value]));
  return {
    cardNumber: String(m.payment_card_number || env.PAYMENT_CARD_NUMBER || '').trim(),
    cardName: String(m.payment_card_name || env.PAYMENT_CARD_NAME || 'آوان گالری').trim(),
    bankName: String(m.payment_bank_name || env.PAYMENT_BANK_NAME || '').trim(),
    gatewayEnabled: m.payment_gateway_enabled === '1', gatewayName: m.payment_gateway_name || '', merchantId: m.payment_gateway_merchant_id || '', note: m.payment_gateway_note || ''
  };
}

function googleRedirectUri(request) {
  return new URL('/api/auth/google/callback', request.url).toString();
}

function oauthCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function clearCookie(name) {
  return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function redirectWithCookies(target, cookies) {
  const response = new Response(null, { status: 302, headers: { Location: target } });
  for (const cookie of (cookies || [])) response.headers.append('Set-Cookie', cookie);
  return response;
}

async function googleTokenExchange(env, request, code) {
  const redirectUri = googleRedirectUri(request);
  const params = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id_token) throw new Error(data.error_description || data.error || 'Google token exchange failed.');
  return data;
}

async function verifyGoogleIdToken(idToken, clientId) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error_description || data.error) throw new Error('Google identity verification failed.');
  if (String(data.aud || '') !== String(clientId || '')) throw new Error('Google client ID mismatch.');
  const iss = String(data.iss || '');
  if (iss && iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') throw new Error('Invalid Google issuer.');
  if (!data.sub || !data.email) throw new Error('Google account information is incomplete.');
  if (String(data.email_verified) !== 'true') throw new Error('Google email is not verified.');
  if (Number(data.exp || 0) < Math.floor(Date.now() / 1000)) throw new Error('Google identity token has expired.');
  return {
    googleId: String(data.sub),
    email: String(data.email).trim().toLowerCase(),
    name: String(data.name || data.email.split('@')[0] || '').trim(),
    avatar: String(data.picture || '').trim()
  };
}

async function validSession(request, secret) {
  if (!secret) return false;
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('HMAC', key, unb64u(sig), new TextEncoder().encode(payload))) return false;
    const raw = new TextDecoder().decode(unb64u(payload));
    const exp = Number(raw);
    if (Number.isFinite(exp) && exp > 0) return exp >= Math.floor(Date.now()/1000);
    const data = JSON.parse(raw);
    return data?.kind === 'staff' && Number(data.exp) >= Math.floor(Date.now()/1000);
  } catch (_) { return false; }
}



async function ensureWalletTables(env) {
  if(!env.DB)throw new Error('D1 binding DB is not configured.');
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS wallet_ledger (
    id TEXT PRIMARY KEY, customer_id TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
    entry_type TEXT NOT NULL CHECK(entry_type IN ('credit','debit','points')),
    amount INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_wallet_customer ON wallet_ledger(customer_id,email,created_at DESC)`).run();
}
function loyaltyTier(points) {
  const n=Math.max(0,Number(points)||0);
  if(n>=10000)return 'طلایی';
  if(n>=3000)return 'نقره‌ای';
  return 'برنزی';
}

async function ensureAdminTables(env) {
  if (!env.DB) throw new Error('D1 binding DB is not configured.');
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_staff (
    id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'order_operator',
    active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_activity (
    id TEXT PRIMARY KEY, actor TEXT NOT NULL DEFAULT 'مدیر فروشگاه', action TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await ensureStoreSettings(env);
}
async function makeStaffSession(secret, staff) {
  const exp=Math.floor(Date.now()/1000)+SESSION_TTL;
  const payload=b64u(new TextEncoder().encode(JSON.stringify({kind:'staff',id:String(staff.id),role:String(staff.role),name:String(staff.name||staff.email),email:String(staff.email),exp})));
  return `${payload}.${b64u(await hmac(secret,payload))}`;
}
async function adminSessionInfo(request, env) {
  const token=cookieValue(request,SESSION_COOKIE);
  if(!token||!env.ADMIN_PASSWORD)return null;
  const [payload,sig]=token.split('.');
  if(!payload||!sig)return null;
  try {
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(env.ADMIN_PASSWORD)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('HMAC',key,unb64u(sig),new TextEncoder().encode(payload)))return null;
    const raw=new TextDecoder().decode(unb64u(payload)), numeric=Number(raw);
    if(Number.isFinite(numeric)&&numeric>0) return numeric>=Math.floor(Date.now()/1000)?{kind:'master',role:'super_admin',name:'مدیر اصلی',exp:numeric}:null;
    const data=JSON.parse(raw);
    if(data?.kind!=='staff'||!data.id||Number(data.exp)<Math.floor(Date.now()/1000)||!env.DB)return null;
    await ensureAdminTables(env);
    const staff=await env.DB.prepare(`SELECT id,name,email,role,active FROM admin_staff WHERE id=?`).bind(String(data.id)).first();
    if(!staff||Number(staff.active)!==1)return null;
    return {kind:'staff',id:String(staff.id),role:String(staff.role),name:String(staff.name||staff.email),email:String(staff.email),exp:Number(data.exp)};
  } catch (_) { return null; }
}
function staffAllowed(info, pathname) {
  if(!info)return false;
  if(info.kind==='master'||info.role==='super_admin')return true;
  const p=String(pathname||'');
  if(p==='/api/admin/me'||p==='/api/admin/logout')return true;
  if(info.role==='content_manager')return p.startsWith('/api/products')||p==='/api/admin/store-settings'||p==='/api/admin/activity'||p.startsWith('/api/admin/reports')||p.startsWith('/api/admin/content')||p.startsWith('/api/admin/notifications')||p.startsWith('/api/admin/reviews');
  if(info.role==='order_operator')return p.startsWith('/api/admin/orders')||p.startsWith('/api/admin/support')||p==='/api/admin/customers'||p==='/api/admin/activity'||p.startsWith('/api/admin/wallet')||p.startsWith('/api/admin/reports')||p.startsWith('/api/admin/reviews')||p.startsWith('/api/admin/notifications');
  return false;
}
async function logAdminActivity(env, request, action, details='') {
  try {
    if(!env.DB)return;
    await ensureAdminTables(env);
    const identity=await adminSessionInfo(request,env);
    await env.DB.prepare(`INSERT INTO admin_activity(id,actor,action,details,created_at) VALUES(?,?,?,?,datetime('now'))`)
      .bind('ACT-'+crypto.randomUUID(),identity?.name||'مدیر اصلی',String(action).slice(0,160),String(details).slice(0,1200)).run();
  } catch (_) {}
}

function normalizeMetadata(input) {
  const raw = input && typeof input.metadata === 'object' ? input.metadata : {};
  const gallery = Array.isArray(raw.gallery) ? raw.gallery.map(v => String(v || '').trim()).filter(Boolean) : [];
  return {
    oldPrice: Math.max(0, Number(raw.oldPrice) || 0),
    discountPercent: Math.max(0, Math.min(100, Number(raw.discountPercent) || 0)),
    active: raw.active !== false,
    featured: raw.featured === true,
    bestseller: raw.bestseller === true,
    isNew: raw.isNew === true,
    gender: String(raw.gender || '').trim(),
    shortDesc: String(raw.shortDesc || '').trim(),
    gallery,
    specs: {
      movement: String(raw.specs?.movement || '').trim(),
      caseMaterial: String(raw.specs?.caseMaterial || '').trim(),
      strapMaterial: String(raw.specs?.strapMaterial || '').trim(),
      dialColor: String(raw.specs?.dialColor || '').trim(),
      caseColor: String(raw.specs?.caseColor || '').trim(),
      waterResistance: String(raw.specs?.waterResistance || '').trim(),
      crystal: String(raw.specs?.crystal || '').trim(),
      caseDiameter: String(raw.specs?.caseDiameter || '').trim()
    },
    seo: {
      slug: String(raw.seo?.slug || '').trim(),
      title: String(raw.seo?.title || '').trim(),
      description: String(raw.seo?.description || '').trim(),
      keywords: String(raw.seo?.keywords || '').trim()
    }
  };
}

function cleanProduct(input) {
  return {
    name: String(input.name || '').trim(),
    brand: String(input.brand || '').trim(),
    category: String(input.category || '').trim(),
    price: Math.max(0, Number(input.price) || 0),
    stock: Math.max(0, Number(input.stock) || 0),
    sku: String(input.sku || '').trim(),
    image: String(input.image || 'assets/watch-1.jpg').trim(),
    desc: String(input.desc || '').trim(),
    metadata: normalizeMetadata(input)
  };
}


async function hashCustomerPassword(password, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/.{1,2}/g).map(x => parseInt(x,16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:150000, hash:'SHA-256'}, key, 256);
  const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
  return {salt:hex(salt), hash:hex(bits)};
}
async function verifyCustomerPassword(password, stored) {
  if (!stored || !String(stored).includes('$')) return false;
  const [salt, expected] = String(stored).split('$');
  const result = await hashCustomerPassword(password, salt);
  return result.hash === expected;
}
function customerSessionSecret(env) {
  return String(env.AUTH_SESSION_SECRET || env.GOOGLE_CLIENT_SECRET || env.ADMIN_PASSWORD || '');
}

async function api(request, env, url) {

  // Customer email/password registration and login
  if ((url.pathname === '/api/auth/register' || url.pathname === '/api/auth/login') && request.method === 'POST') {
    if (!env.DB) return json({ok:false,error:'اتصال پایگاه داده حساب‌های کاربری تنظیم نشده است. Binding با نام DB را در Cloudflare بررسی کنید.'},500);
    const sessionSecret = customerSessionSecret(env);
    if (!sessionSecret) return json({ok:false,error:'کلید نشست حساب کاربری تنظیم نشده است. در Cloudflare یک Secret با نام AUTH_SESSION_SECRET تعریف کنید و دوباره Deploy کنید.'},500);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || body.identity || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    const isRegister = url.pathname.endsWith('/register');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ok:false,error:'یک آدرس ایمیل معتبر وارد کنید.'},400);
    if (password.length < 6) return json({ok:false,error:'رمز عبور باید حداقل ۶ کاراکتر باشد.'},400);
    if (isRegister && !name) return json({ok:false,error:'نام و نام خانوادگی را وارد کنید.'},400);
    try {
      await ensureUsersTable(env);
      let user = await env.DB.prepare('SELECT * FROM users WHERE lower(email)=? LIMIT 1').bind(email).first();
      if (isRegister) {
        if (user) return json({ok:false,error:'این ایمیل قبلاً ثبت‌نام کرده است. وارد حساب شوید یا از ورود با گوگل استفاده کنید.'},409);
        const hashed = await hashCustomerPassword(password);
        const userInfo = await env.DB.prepare(`PRAGMA table_info(users)`).all();
        const userCols = (userInfo.results || []).map(c => ({name:String(c.name),type:String(c.type||'').toUpperCase(),notnull:Number(c.notnull||0)===1,pk:Number(c.pk||0)===1,dflt:c.dflt_value}));
        const idCol = userCols.find(c=>c.name==='id');
        const integerId = !!(idCol && /INT/.test(idCol.type) && idCol.pk);
        const id = integerId ? null : ('usr-' + crypto.randomUUID());
        const values = {
          // Keep google_id NULL for password accounts. The original schema
          // makes google_id UNIQUE, and empty strings collide after the first account.
          id, google_id:null, email, name, avatar:'', provider:'password',
          password_hash:hashed.salt+'$'+hashed.hash, phone:'',
          created_at:new Date().toISOString(), updated_at:new Date().toISOString()
        };
        const insertCols=[], insertVals=[];
        for (const c of userCols) {
          if (c.pk && c.name==='id' && integerId) continue;
          if (Object.prototype.hasOwnProperty.call(values,c.name)) {
            if (c.name==='id' && (values.id===null || values.id===undefined)) continue;
            insertCols.push(c.name); insertVals.push(values[c.name]);
          } else if (c.notnull && c.dflt===null && !c.pk) {
            // Compatibility for legacy schemas with extra required columns.
            insertCols.push(c.name); insertVals.push(/INT|REAL|NUMERIC|DECIMAL/.test(c.type) ? 0 : '');
          }
        }
        if (!insertCols.includes('email') || !insertCols.includes('password_hash')) throw new Error('users schema lacks email/password_hash columns');
        const marks=insertCols.map(()=>'?').join(',');
        await env.DB.prepare(`INSERT INTO users (${insertCols.map(c=>'"'+c.replace(/"/g,'""')+'"').join(',')}) VALUES (${marks})`).bind(...insertVals).run();
        user = await env.DB.prepare(`SELECT * FROM users WHERE lower(email)=? LIMIT 1`).bind(email).first();
        if (!user || user.id === undefined || user.id === null) throw new Error('User row was not returned after registration');
      } else {
        if (!user || !(await verifyCustomerPassword(password, user.password_hash))) return json({ok:false,error:'ایمیل یا رمز عبور صحیح نیست.'},401);
      }
      const session = await makeUserSession(sessionSecret, user.id);
      return json({ok:true,user:{id:user.id,email:user.email,name:user.name,provider:user.provider}},200,{
        'Set-Cookie': oauthCookie(USER_SESSION_COOKIE, session, USER_SESSION_TTL),
        'Cache-Control':'no-store'
      });
    } catch (err) {
      const detail = String(err?.message || err || 'unknown error');
      // Keep implementation details out of the public response, but make the
      // common setup failures actionable for the shop owner.
      let message = 'عملیات ورود یا ثبت‌نام انجام نشد. اتصال D1 و ساختار جدول users را بررسی کنید.';
      if (/UNIQUE constraint failed: users\.email/i.test(detail)) message = 'این ایمیل قبلاً ثبت شده است؛ وارد حساب شوید یا از ایمیل دیگری استفاده کنید.';
      else if (/UNIQUE constraint failed: users\.google_id/i.test(detail)) message = 'ساختار قدیمی جدول کاربران با ثبت‌نام سازگار نبود. یک بار دیگر تلاش کنید؛ اگر خطا ادامه داشت، جدول users در D1 نیاز به بررسی دارد.';
      else if (/no such column: password_hash|users schema lacks email\/password_hash/i.test(detail)) message = 'ستون‌های ورود در جدول کاربران کامل نیستند. اجرای مهاجرت D1 لازم است.';
      else if (/D1 binding DB is not configured/i.test(detail)) message = 'اتصال پایگاه داده با نام DB در تنظیمات Worker موجود نیست.';
      else if (/crypto|secret|key/i.test(detail)) message = 'کلید نشست حساب کاربری معتبر نیست. مقدار AUTH_SESSION_SECRET را در Cloudflare بررسی کنید.';
      console.error('Customer authentication failed:', detail);
      return json({ok:false,error:message},500);
    }
  }

  // Customer Google OAuth
  if (url.pathname === '/api/auth/google' && request.method === 'GET') {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ ok:false, error: !env.GOOGLE_CLIENT_ID ? 'Google OAuth Client ID is missing.' : 'Google OAuth Client Secret is missing. Add GOOGLE_CLIENT_SECRET as a Production Secret in Cloudflare.' }, 500);
    const state = crypto.randomUUID();
    const redirectUri = googleRedirectUri(request);
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account'
    });
    return redirectWithCookies(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, [oauthCookie(GOOGLE_STATE_COOKIE, state, GOOGLE_STATE_TTL)]);
  }
  if (url.pathname === '/api/auth/google/callback' && request.method === 'GET') {
    if (!env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return Response.redirect(new URL('/login.html?google=error&reason=not-configured', request.url), 302);
    const state = url.searchParams.get('state') || '';
    const savedState = cookieValue(request, GOOGLE_STATE_COOKIE) || '';
    const code = url.searchParams.get('code') || '';
    const oauthError = url.searchParams.get('error') || '';
    const clearState = clearCookie(GOOGLE_STATE_COOKIE);
    if (oauthError) return redirectWithCookies(new URL(`/login.html?google=error&reason=${encodeURIComponent(oauthError)}`, request.url).toString(), [clearState]);
    if (!state || !savedState || state !== savedState || !code) return redirectWithCookies(new URL('/login.html?google=error&reason=invalid-state', request.url).toString(), [clearState]);
    try {
      const tokens = await googleTokenExchange(env, request, code);
      const googleUser = await verifyGoogleIdToken(tokens.id_token, env.GOOGLE_CLIENT_ID);
      await ensureUsersTable(env);
      let user = await env.DB.prepare(`SELECT * FROM users WHERE google_id=? OR email=? LIMIT 1`).bind(googleUser.googleId, googleUser.email).first();
      if (user) {
        await env.DB.prepare(`UPDATE users SET google_id=?,email=?,name=?,avatar=?,provider='google',updated_at=datetime('now') WHERE id=?`).bind(googleUser.googleId, googleUser.email, googleUser.name, googleUser.avatar, user.id).run();
        user = await env.DB.prepare(`SELECT * FROM users WHERE id=?`).bind(user.id).first();
      } else {
        user = await createUserCompat(env, {id:crypto.randomUUID(), googleId:googleUser.googleId, email:googleUser.email, name:googleUser.name, avatar:googleUser.avatar, provider:'google', phone:''});
      }
      const sessionSecret = customerSessionSecret(env);
      const session = await makeUserSession(sessionSecret, user.id);
      return redirectWithCookies(new URL('/account.html?login=success', request.url).toString(), [
        oauthCookie(USER_SESSION_COOKIE, session, USER_SESSION_TTL),
        clearState
      ]);
    } catch (err) {
      return redirectWithCookies(new URL(`/login.html?google=error&reason=${encodeURIComponent(err?.message || 'oauth-failed')}`, request.url).toString(), [clearState]);
    }
  }
  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    if (!env.DB) return json({ ok:true, authenticated:false });
    const session = await validUserSession(request, customerSessionSecret(env));
    if (!session) return json({ ok:true, authenticated:false });
    const user = await env.DB.prepare(`SELECT id,email,name,avatar,provider,created_at FROM users WHERE id=?`).bind(session.uid).first();
    if (!user) return json({ ok:true, authenticated:false }, 200, { 'Set-Cookie': clearCookie(USER_SESSION_COOKIE) });
    return json({ ok:true, authenticated:true, user });
  }
  if (url.pathname === '/api/store-settings' && request.method === 'GET') {
    if(!env.DB)return json({ok:true,settings:{}});
    await ensureStoreSettings(env);
    const {results}=await env.DB.prepare(`SELECT key,value FROM store_settings WHERE key IN ('store_name','store_logo_url','store_phone','store_email','store_address','support_phone','support_email','shipping_method','shipping_cost','free_shipping_min','shipping_company')`).all();
    return json({ok:true,settings:Object.fromEntries((results||[]).map(x=>[x.key,x.value]))});
  }
  if (url.pathname === '/api/account/orders' && request.method === 'GET') {
    if (!env.DB) return json({ok:false,error:'پایگاه داده در دسترس نیست.'},500);
    await ensureOrdersTables(env);
    const session=await validUserSession(request,customerSessionSecret(env));
    if(!session) return json({ok:false,error:'برای مشاهده سفارش‌ها وارد حساب شوید.'},401);
    const user=await env.DB.prepare(`SELECT id FROM users WHERE id=? LIMIT 1`).bind(session.uid).first();
    if(!user) return json({ok:false,error:'حساب کاربری پیدا نشد.'},404);
    const userIdCol=(await env.DB.prepare(`PRAGMA table_info(orders)`).all()).results?.find(c=>String(c.name)==='user_id');
    const orderUserId=/INT/i.test(String(userIdCol?.type||''))?Number(user.id):String(user.id);
    const {results:orders}=await env.DB.prepare(`SELECT id,customer_name,email,total,subtotal,shipping,discount,payment_status,order_status,tracking_code,created_at,updated_at FROM orders WHERE user_id=? OR lower(email)=lower((SELECT email FROM users WHERE id=?)) ORDER BY created_at DESC LIMIT 100`).bind(orderUserId,user.id).all();
    const items=[];
    for(const o of (orders||[])){
      const {results}=await env.DB.prepare(`SELECT * FROM order_items WHERE order_id=? ORDER BY rowid ASC`).bind(String(o.id)).all().catch(()=>({results:[]}));
      o.items=(results||[]).map(i=>({product_id:i.product_id, name:i.product_name||i.name||'محصول آوان', image:i.product_image||i.image||'', price:Number(i.unit_price??i.price??0), quantity:Number(i.quantity??i.qty??1), total:Number(i.line_total??i.total??i.amount??0)}));
    }
    return json({ok:true,orders:orders||[]});
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return json({ ok:true }, 200, { 'Set-Cookie': clearCookie(USER_SESSION_COOKIE) });
  }
  if (url.pathname === '/api/admin/login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const password = String(body.password || '');
    const email = String(body.email || '').trim().toLowerCase();
    if (!env.ADMIN_PASSWORD) return json({ok:false,error:'رمز مدیریت در تنظیمات Cloudflare تعریف نشده است.'},500);
    if (email) {
      if (!env.DB) return json({ok:false,error:'پایگاه داده مدیران تنظیم نشده است.'},500);
      await ensureAdminTables(env);
      const staff=await env.DB.prepare(`SELECT * FROM admin_staff WHERE lower(email)=? AND active=1 LIMIT 1`).bind(email).first();
      if(!staff || !(await verifyCustomerPassword(password,staff.password_hash))) return json({ok:false,error:'ایمیل یا رمز عبور مدیر صحیح نیست.'},401);
      const token=await makeStaffSession(env.ADMIN_PASSWORD,staff);
      await logAdminActivity(env,{headers:new Headers({'Cookie':`${SESSION_COOKIE}=${encodeURIComponent(token)}`})},'ورود مدیر',`ورود ${staff.email}`);
      return json({ok:true,role:staff.role},200,{'Set-Cookie':`${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL}`});
    }
    if (password !== env.ADMIN_PASSWORD) return json({ ok: false, error: 'رمز واردشده صحیح نیست.' }, 401);
    const token = await makeSession(env.ADMIN_PASSWORD);
    await logAdminActivity(env,request,'ورود مدیر اصلی','ورود با رمز اصلی مدیریت');
    return json({ ok: true, role:'super_admin' }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL}` });
  }
  if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` });
  }
  if (url.pathname === '/api/admin/me' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);
    return json({ ok: !!info, role:info?.role||'', name:info?.name||'' });
  }

  if (url.pathname.startsWith('/api/admin/') && !['/api/admin/login','/api/admin/logout','/api/admin/me'].includes(url.pathname)) {
    const info=await adminSessionInfo(request,env);
    if(!info)return json({ok:false,error:'نشست مدیریت معتبر نیست؛ دوباره وارد شوید.'},401);
    if(!staffAllowed(info,url.pathname))return json({ok:false,error:'نقش شما اجازه انجام این عملیات را ندارد.'},403);
  }

  // Customer support: D1-backed tickets and live chat
  if (url.pathname === '/api/support/ticket' && request.method === 'POST') {
    if (!env.DB) return json({ ok:false, error:'D1 binding DB is not configured.' },500);
    const body = await request.json().catch(()=>({}));
    const name=String(body.name||'').trim(), phone=String(body.phone||'').trim(), subject=String(body.subject||'').trim(), message=String(body.message||'').trim();
    if(!name||!phone||!subject||!message) return json({ok:false,error:'لطفاً همه فیلدهای تیکت را کامل کنید.'},400);
    const id='AV-'+crypto.randomUUID().split('-')[0].toUpperCase();
    await env.DB.prepare(`INSERT INTO support_tickets (id,name,phone,subject,message,status,admin_reply,created_at,updated_at) VALUES (?,?,?,?,?,'open','',datetime('now'),datetime('now'))`).bind(id,name,phone,subject,message).run();
    return json({ok:true,ticket:{id,name,phone,subject,message,status:'open'}} ,201);
  }
  if (url.pathname === '/api/support/chat' && request.method === 'POST') {
    if (!env.DB) return json({ok:false,error:'D1 binding DB is not configured.'},500);
    const body=await request.json().catch(()=>({}));
    const visitorId=String(body.visitorId||'').trim() || crypto.randomUUID();
    const message=String(body.message||'').trim();
    const name=String(body.name||'').trim(), phone=String(body.phone||'').trim();
    if(!message) return json({ok:false,error:'پیام خالی است.'},400);
    let chat=await env.DB.prepare(`SELECT * FROM support_chats WHERE visitor_id=?`).bind(visitorId).first();
    if(!chat){ const id=crypto.randomUUID(); await env.DB.prepare(`INSERT INTO support_chats (id,visitor_id,name,phone,status,created_at,updated_at) VALUES (?,?,?,?,'open',datetime('now'),datetime('now'))`).bind(id,visitorId,name,phone).run(); chat={id,visitor_id:visitorId}; }
    await env.DB.prepare(`INSERT INTO support_messages (id,chat_id,sender_type,message,created_at) VALUES (?,?, 'customer',?,datetime('now'))`).bind(crypto.randomUUID(),chat.id,message).run();
    await env.DB.prepare(`UPDATE support_chats SET status='open',updated_at=datetime('now'),name=CASE WHEN ?<>'' THEN ? ELSE name END,phone=CASE WHEN ?<>'' THEN ? ELSE phone END WHERE id=?`).bind(name,name,phone,phone,chat.id).run();
    return json({ok:true,visitorId,chatId:chat.id});
  }
  if (url.pathname === '/api/support/chat' && request.method === 'GET') {
    if (!env.DB) return json({ok:false,error:'D1 binding DB is not configured.'},500);
    const visitorId=String(url.searchParams.get('visitor_id')||'').trim();
    if(!visitorId) return json({ok:true,messages:[]});
    const chat=await env.DB.prepare(`SELECT * FROM support_chats WHERE visitor_id=?`).bind(visitorId).first();
    if(!chat) return json({ok:true,messages:[]});
    const {results}=await env.DB.prepare(`SELECT id,sender_type,message,created_at FROM support_messages WHERE chat_id=? ORDER BY created_at ASC`).bind(chat.id).all();
    return json({ok:true,chat,messages:results||[]});
  }
  if (url.pathname === '/api/admin/support/tickets' && request.method === 'GET') {
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    const status=url.searchParams.get('status');
    const q=status && status!=='all' ? ` WHERE status=?` : '';
    const stmt=q?env.DB.prepare(`SELECT * FROM support_tickets${q} ORDER BY created_at DESC`):env.DB.prepare(`SELECT * FROM support_tickets ORDER BY created_at DESC`);
    const {results}=q?await stmt.bind(status).all():await stmt.all();
    return json({ok:true,tickets:results||[]});
  }
  if (url.pathname === '/api/admin/support/chats' && request.method === 'GET') {
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    const {results}=await env.DB.prepare(`SELECT c.*, (SELECT COUNT(*) FROM support_messages m WHERE m.chat_id=c.id) AS message_count FROM support_chats c ORDER BY c.updated_at DESC`).all();
    return json({ok:true,chats:results||[]});
  }
  const ticketReply=url.pathname.match(/^\/api\/admin\/support\/tickets\/([^/]+)$/);
  if(ticketReply && request.method==='PUT'){
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    const id=decodeURIComponent(ticketReply[1]); const body=await request.json().catch(()=>({}));
    const reply=String(body.reply||'').trim(); const status=String(body.status||'open');
    await env.DB.prepare(`UPDATE support_tickets SET admin_reply=?,status=?,updated_at=datetime('now') WHERE id=?`).bind(reply,status,id).run();
    return json({ok:true});
  }
  const chatAdmin=url.pathname.match(/^\/api\/admin\/support\/chats\/([^/]+)$/);
  if(chatAdmin && request.method==='GET'){
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    const chatId=decodeURIComponent(chatAdmin[1]);
    const {results}=await env.DB.prepare(`SELECT id,sender_type,message,created_at FROM support_messages WHERE chat_id=? ORDER BY created_at ASC`).bind(chatId).all();
    return json({ok:true,messages:results||[]});
  }
  if(chatAdmin && request.method==='POST'){
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    const chatId=decodeURIComponent(chatAdmin[1]); const body=await request.json().catch(()=>({})); const message=String(body.message||'').trim();
    if(!message) return json({ok:false,error:'پیام خالی است.'},400);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO support_messages (id,chat_id,sender_type,message,created_at) VALUES (?,?, 'admin',?,datetime('now'))`).bind(crypto.randomUUID(),chatId,message),
      env.DB.prepare(`UPDATE support_chats SET status='open',updated_at=datetime('now') WHERE id=?`).bind(chatId)
    ]);
    return json({ok:true});
  }
  if (url.pathname === '/api/admin/support/unread' && request.method === 'GET') {
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    const t=await env.DB.prepare(`SELECT COUNT(*) AS n FROM support_tickets WHERE status='open'`).first();
    const c=await env.DB.prepare(`SELECT COUNT(*) AS n FROM support_chats WHERE status='open'`).first();
    return json({ok:true,tickets:Number(t?.n||0),chats:Number(c?.n||0)});
  }

  // Admin customers — Google accounts stored in D1
  if (url.pathname === '/api/admin/customers' && request.method === 'GET') {
    if (!await validSession(request, env.ADMIN_PASSWORD)) return json({ ok:false, error:'Unauthorized' }, 401);
    if (!env.DB) return json({ ok:false, error:'D1 binding DB is not configured.' }, 500);
    await ensureUsersTable(env);
    const q = String(url.searchParams.get('q') || '').trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 100), 1), 300);
    let rows = [];
    try { rows = await readUsersForAdmin(env, q, limit); } catch (e) {
      return json({ok:false,error:'خطا در خواندن جدول مشتریان: '+String(e?.message||e)},500);
    }
    let total={n:rows.length}, recent={n:0}, providers={results:[]};
    try { total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users`).first() || total; } catch (_) {}
    try { recent = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE COALESCE(created_at,'') >= datetime('now','-30 day')`).first() || recent; } catch (_) {}
    try { providers = await env.DB.prepare(`SELECT COALESCE(provider,'unknown') AS provider, COUNT(*) AS n FROM users GROUP BY provider`).all() || providers; } catch (_) {}
    return json({ok:true, customers:rows, stats:{total:Number(total?.n||0), recent:Number(recent?.n||0), providers:providers.results||[]}});
  }

  // Checkout + manual card transfer orders (no R2 required)
  if (url.pathname === '/api/orders' && request.method === 'POST') {
    if (!env.DB) return json({ok:false,error:'D1 binding DB is not configured.'},500);
    await ensureOrdersTables(env);
    const body = await request.json().catch(()=>({}));
    const items = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};
    if (!items.length) return json({ok:false,error:'سبد خرید خالی است.'},400);
    const name=String(customer.name||'').trim(), phone=String(customer.phone||'').trim(), email=String(customer.email||'').trim();
    const province=String(customer.province||'').trim(), city=String(customer.city||'').trim(), address=String(customer.address||'').trim(), postal=String(customer.postalCode||'').trim(), notes=String(customer.notes||'').trim();
    if(!name||!phone||!province||!city||!address) return json({ok:false,error:'لطفاً نام، شماره موبایل، استان، شهر و آدرس را کامل کنید.'},400);
    const ids=[...new Set(items.map(x=>String(x.id||'').trim()).filter(Boolean))];
    if(!ids.length) return json({ok:false,error:'محصول معتبر پیدا نشد.'},400);
    const products=[];
    for(const id of ids){ const row=await env.DB.prepare(`SELECT id,name,price,stock,image,active FROM products WHERE id=? LIMIT 1`).bind(id).first(); if(row) products.push(row); }
    const map=new Map(products.map(p=>[String(p.id),p]));
    let subtotal=0; const normalized=[];
    for(const raw of items){ const p=map.get(String(raw.id)); const qty=Math.max(1,Math.floor(Number(raw.qty)||1)); if(!p||Number(p.active)!==1) return json({ok:false,error:`محصول ${raw.id} در دسترس نیست.`},400); if(Number(p.stock)<qty) return json({ok:false,error:`موجودی ${p.name} برای تعداد درخواستی کافی نیست.`},409); const line=Number(p.price)*qty; subtotal+=line; normalized.push({product:p,qty,line}); }
    await ensureStoreSettings(env);
    const {results:shippingRows}=await env.DB.prepare(`SELECT key,value FROM store_settings WHERE key IN ('shipping_cost','free_shipping_min')`).all();
    const shippingSettings=Object.fromEntries((shippingRows||[]).map(x=>[x.key,x.value]));
    const shippingCost=Math.max(0,Number(shippingSettings.shipping_cost)||0);
    const freeShippingMin=Number(shippingSettings.free_shipping_min)>0?Number(shippingSettings.free_shipping_min):5000000;
    const shipping = subtotal >= freeShippingMin ? 0 : shippingCost;
    const discount = 0;
    const total = Math.max(0,subtotal+shipping-discount);
    // Create the order using the EXISTING D1 schema instead of assuming id/user_id types.
    // This makes checkout compatible with older databases that used INTEGER PRIMARY KEYs.
    const orderInfo2=await env.DB.prepare(`PRAGMA table_info(orders)`).all();
    const orderCols=new Map((orderInfo2.results||[]).map(r=>[String(r.name),r]));
    const ordersIdCol=orderCols.get('id');
    const ordersUserIdCol=orderCols.get('user_id');
    const ordersIdIsInteger=/INT/.test(String(ordersIdCol?.type||'').toUpperCase()) && Number(ordersIdCol?.pk||0)===1;
    const ordersUserIdIsInteger=/INT/.test(String(ordersUserIdCol?.type||'').toUpperCase());

    const userSession=await validUserSession(request,customerSessionSecret(env));
    await ensureUsersTable(env);
    const userInfo=await env.DB.prepare(`PRAGMA table_info(users)`).all();
    const userCols=new Map((userInfo.results||[]).map(r=>[String(r.name),r]));
    const usersIdCol=userCols.get('id');
    const usersIdIsInteger=/INT/.test(String(usersIdCol?.type||'').toUpperCase()) && Number(usersIdCol?.pk||0)===1;

    let userId=null;
    if(userSession?.uid){
      const sessionUser=await env.DB.prepare(`SELECT id FROM users WHERE id=? LIMIT 1`).bind(usersIdIsInteger ? Number(userSession.uid) : String(userSession.uid)).first().catch(()=>null);
      if(sessionUser?.id!==undefined && sessionUser?.id!==null) userId=sessionUser.id;
    }

    if(userId===null || userId===undefined || userId===''){
      const guestEmail=`guest-${crypto.randomUUID()}@avan.local`;
      const guest=await createUserCompat(env, {id:usersIdIsInteger ? undefined : ('guest-'+crypto.randomUUID()), email:guestEmail, name, avatar:'', provider:'guest', phone});
      userId=guest?.id;
    }
    if(userId===null || userId===undefined || userId==='') return json({ok:false,error:'شناسه کاربر برای ثبت سفارش ایجاد نشد.'},500);
    const orderUserValue=ordersUserIdIsInteger ? Number(userId) : String(userId);
    if(ordersUserIdIsInteger && !Number.isFinite(orderUserValue)) return json({ok:false,error:'ساختار شناسه کاربر در دیتابیس با سفارش سازگار نیست.'},500);

    // Insert order dynamically so an old INTEGER PRIMARY KEY does not receive a text id.
    let orderId;
    if(ordersIdIsInteger){
      const sql=`INSERT INTO orders (user_id,customer_name,phone,email,province,city,address,postal_code,notes,subtotal,shipping,discount,total,payment_method,payment_status,order_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,datetime('now'),datetime('now'))`;
      await env.DB.prepare(sql).bind(orderUserValue,name,phone,email,province,city,address,postal,notes,subtotal,shipping,discount,total,'card_transfer','pending','pending_payment').run();
      const created=await env.DB.prepare(`SELECT id FROM orders ORDER BY rowid DESC LIMIT 1`).first();
      orderId=created?.id;
    }else{
      orderId='AVN-'+Date.now().toString(36).toUpperCase()+'-'+crypto.randomUUID().split('-')[0].toUpperCase();
      await env.DB.prepare(`INSERT INTO orders (id,user_id,customer_name,phone,email,province,city,address,postal_code,notes,subtotal,shipping,discount,total,payment_method,payment_status,order_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`).bind(orderId,orderUserValue,name,phone,email,province,city,address,postal,notes,subtotal,shipping,discount,total,'card_transfer','pending','pending_payment').run();
    }
    if(orderId===undefined || orderId===null || orderId==='') return json({ok:false,error:'شماره سفارش ایجاد نشد.'},500);

    const itemInfo2=await env.DB.prepare(`PRAGMA table_info(order_items)`).all();
    const itemCols2=(itemInfo2.results||[]).map(c=>({name:String(c.name),type:String(c.type||'').toUpperCase(),notnull:Number(c.notnull||0)===1,pk:Number(c.pk||0)===1,dflt:c.dflt_value}));
    const itemIdCol=itemCols2.find(c=>c.name==='id');
    const itemOrderIdCol=itemCols2.find(c=>c.name==='order_id');
    const itemIdIsInteger=!!(itemIdCol && /INT/.test(itemIdCol.type) && itemIdCol.pk);
    const itemOrderIdIsInteger=!!(itemOrderIdCol && /INT/.test(itemOrderIdCol.type));
    const productInfoForItems=await env.DB.prepare(`PRAGMA table_info(products)`).all();
    const productsIdCol=(productInfoForItems.results||[]).find(c=>String(c.name)==='id');
    const itemProductIdIsInteger=!!(productsIdCol && /INT/.test(String(productsIdCol.type||'').toUpperCase()) && Number(productsIdCol.pk||0)===1);
    for(const x of normalized){
      const values={
        id:itemIdIsInteger?undefined:crypto.randomUUID(),
        order_id:itemOrderIdIsInteger?Number(orderId):String(orderId),
        product_id:itemProductIdIsInteger?Number(x.product.id):String(x.product.id),
        product_name:String(x.product.name||''),
        product_image:String(x.product.image||''),
        price:Number(x.product.price),
        unit_price:Number(x.product.price),
        quantity:x.qty,
        qty:x.qty,
        line_total:x.line,
        total:x.line,
        amount:x.line
      };
      const insertCols=[],insertVals=[];
      for(const c of itemCols2){
        if(c.name==='id' && (values.id===undefined || values.id===null)) continue;
        if(Object.prototype.hasOwnProperty.call(values,c.name) && values[c.name]!==undefined){
          insertCols.push(c.name);insertVals.push(values[c.name]);
        }else if(c.notnull && c.dflt===null && !c.pk){
          // Common legacy required columns can be safely filled from the current item.
          if(/price/i.test(c.name)){insertCols.push(c.name);insertVals.push(Number(x.product.price));}
          else if(/qty|quantity/i.test(c.name)){insertCols.push(c.name);insertVals.push(x.qty);}
          else if(/name/i.test(c.name)){insertCols.push(c.name);insertVals.push(String(x.product.name||''));}
          else if(/image|photo/i.test(c.name)){insertCols.push(c.name);insertVals.push(String(x.product.image||''));}
          else if(/total|amount|subtotal/i.test(c.name)){insertCols.push(c.name);insertVals.push(x.line);}
          else if(/INT|REAL|NUMERIC|DECIMAL/.test(c.type)){insertCols.push(c.name);insertVals.push(0);}
          else {insertCols.push(c.name);insertVals.push('');}
        }
      }
      if(!insertCols.includes('order_id')||!insertCols.includes('product_id')) throw new Error('order_items schema lacks order_id or product_id');
      const marks=insertCols.map(()=>'?').join(',');
      await env.DB.prepare(`INSERT INTO order_items (${insertCols.map(c=>'"'+c.replace(/"/g,'""')+'"').join(',')}) VALUES (${marks})`).bind(...insertVals).run();
    }
    return json({ok:true,order:{id:orderId,total,subtotal,shipping,discount,paymentStatus:'pending',orderStatus:'pending_payment',payment:await paymentConfig(env)}},201);
  }
  if (url.pathname.match(/^\/api\/orders\/[^/]+\/payment$/) && request.method === 'POST') {
    if (!env.DB) return json({ok:false,error:'D1 binding DB is not configured.'},500);
    await ensureOrdersTables(env);
    const orderId=decodeURIComponent(url.pathname.split('/')[3]);
    const body=await request.json().catch(()=>({}));
    const reference=String(body.reference||'').trim();
    const receiptImage=String(body.receiptImage||'').trim();
    if(!receiptImage) return json({ok:false,error:'بارگذاری تصویر رسید پرداخت الزامی است.'},400);
    if(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(receiptImage)) return json({ok:false,error:'فرمت تصویر رسید معتبر نیست. فایل JPG، PNG یا WebP انتخاب کنید.'},400);
    if(receiptImage && receiptImage.length > 2800000) return json({ok:false,error:'حجم تصویر رسید باید کمتر از ۲ مگابایت باشد.'},413);
    const order=await env.DB.prepare(`SELECT id,payment_status FROM orders WHERE id=?`).bind(orderId).first();
    if(!order) return json({ok:false,error:'سفارش پیدا نشد.'},404);
    await env.DB.prepare(`UPDATE orders SET payment_reference=?,receipt_image=?,payment_status='submitted',order_status='awaiting_verification',updated_at=datetime('now') WHERE id=?`).bind(reference,receiptImage,orderId).run();
    return json({ok:true,message:'اطلاعات پرداخت و رسید ثبت شد و پس از بررسی مدیر تأیید می‌شود.'});
  }
  if (url.pathname.match(/^\/api\/orders\/[^/]+$/) && request.method === 'GET') {
    if (!env.DB) return json({ok:false,error:'D1 binding DB is not configured.'},500);
    await ensureOrdersTables(env);
    const orderId=decodeURIComponent(url.pathname.split('/')[3]);
    const order=await env.DB.prepare(`SELECT * FROM orders WHERE id=?`).bind(orderId).first();
    if(!order) return json({ok:false,error:'سفارش پیدا نشد.'},404);
    const {results}=await env.DB.prepare(`SELECT * FROM order_items WHERE order_id=? ORDER BY rowid ASC`).bind(orderId).all();
    return json({ok:true,order,items:results||[],payment:await paymentConfig(env)});
  }


  async function ensureCmsTables(env) {
    if(!env.DB)throw new Error('D1 binding DB is not configured.');
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_content (
      id TEXT PRIMARY KEY, content_type TEXT NOT NULL DEFAULT 'page', title TEXT NOT NULL DEFAULT '',
      slug TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '',
      button_text TEXT NOT NULL DEFAULT '', button_url TEXT NOT NULL DEFAULT '', is_published INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_announcements (
      id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '',
      audience TEXT NOT NULL DEFAULT 'customers', is_active INTEGER NOT NULL DEFAULT 1,
      starts_at TEXT NOT NULL DEFAULT '', ends_at TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_reviews (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL DEFAULT '', product_name TEXT NOT NULL DEFAULT '',
      customer_name TEXT NOT NULL DEFAULT '', customer_email TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 5, review_text TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending', admin_reply TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  }
  const cmsId=()=>crypto.randomUUID();
  if (url.pathname === '/api/admin/content' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureCmsTables(env);const type=String(url.searchParams.get('type')||'').trim();
    const {results}=await env.DB.prepare(`SELECT * FROM store_content WHERE (?='' OR content_type=?) ORDER BY sort_order ASC,updated_at DESC`).bind(type,type).all();
    return json({ok:true,items:results||[]});
  }
  if (url.pathname === '/api/admin/content' && ['POST','PUT','DELETE'].includes(request.method)) {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureCmsTables(env);
    if(request.method==='DELETE'){const id=String(url.searchParams.get('id')||'');if(!id)return json({ok:false,error:'شناسه محتوا الزامی است.'},400);await env.DB.prepare(`DELETE FROM store_content WHERE id=?`).bind(id).run();return json({ok:true});}
    const b=await request.json().catch(()=>({})),id=String(b.id||cmsId()),type=String(b.content_type||'page');
    if(!['hero','banner','article','page'].includes(type))return json({ok:false,error:'نوع محتوا معتبر نیست.'},400);
    const title=String(b.title||'').trim().slice(0,180),slug=String(b.slug||'').trim().slice(0,180);
    if(!title)return json({ok:false,error:'عنوان الزامی است.'},400);
    await env.DB.prepare(`INSERT INTO store_content(id,content_type,title,slug,body,image_url,button_text,button_url,is_published,sort_order,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET content_type=excluded.content_type,title=excluded.title,slug=excluded.slug,body=excluded.body,image_url=excluded.image_url,button_text=excluded.button_text,button_url=excluded.button_url,is_published=excluded.is_published,sort_order=excluded.sort_order,updated_at=datetime('now')`)
      .bind(id,type,title,slug,String(b.body||'').slice(0,20000),String(b.image_url||'').slice(0,2000),String(b.button_text||'').slice(0,100),String(b.button_url||'').slice(0,2000),b.is_published?1:0,Math.max(0,Number(b.sort_order)||0)).run();
    await logAdminActivity(env,request,'ویرایش محتوا',title);return json({ok:true,id});
  }
  if (url.pathname === '/api/admin/notifications' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureCmsTables(env);const {results}=await env.DB.prepare(`SELECT * FROM store_announcements ORDER BY created_at DESC LIMIT 300`).all();return json({ok:true,items:results||[]});
  }
  if (url.pathname === '/api/admin/notifications' && ['POST','PUT','DELETE'].includes(request.method)) {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureCmsTables(env);
    if(request.method==='DELETE'){const id=String(url.searchParams.get('id')||'');await env.DB.prepare(`DELETE FROM store_announcements WHERE id=?`).bind(id).run();return json({ok:true});}
    const b=await request.json().catch(()=>({})),id=String(b.id||cmsId()),title=String(b.title||'').trim().slice(0,180),message=String(b.message||'').trim().slice(0,3000),audience=String(b.audience||'customers');
    if(!title||!message)return json({ok:false,error:'عنوان و متن اعلان الزامی است.'},400);
    if(!['customers','admins','all'].includes(audience))return json({ok:false,error:'مخاطب اعلان معتبر نیست.'},400);
    await env.DB.prepare(`INSERT INTO store_announcements(id,title,message,audience,is_active,starts_at,ends_at,created_at) VALUES(?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET title=excluded.title,message=excluded.message,audience=excluded.audience,is_active=excluded.is_active,starts_at=excluded.starts_at,ends_at=excluded.ends_at`)
      .bind(id,title,message,audience,b.is_active===false?0:1,String(b.starts_at||''),String(b.ends_at||'')).run();
    await logAdminActivity(env,request,'مدیریت اعلان',title);return json({ok:true,id});
  }
  if (url.pathname === '/api/admin/reviews' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureCmsTables(env);const status=String(url.searchParams.get('status')||'').trim();
    const {results}=await env.DB.prepare(`SELECT * FROM store_reviews WHERE (?='' OR status=?) ORDER BY created_at DESC LIMIT 500`).bind(status,status).all();
    const stats=await env.DB.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) pending,ROUND(AVG(rating),1) avg_rating FROM store_reviews`).first();
    return json({ok:true,items:results||[],stats:stats||{}});
  }
  if (url.pathname === '/api/admin/reviews' && ['POST','PATCH','DELETE'].includes(request.method)) {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureCmsTables(env);
    if(request.method==='DELETE'){const id=String(url.searchParams.get('id')||'');await env.DB.prepare(`DELETE FROM store_reviews WHERE id=?`).bind(id).run();return json({ok:true});}
    const b=await request.json().catch(()=>({})),id=String(b.id||cmsId());
    if(request.method==='POST'){
      const customer=String(b.customer_name||'').trim().slice(0,160),product=String(b.product_name||'').trim().slice(0,180),text=String(b.review_text||'').trim().slice(0,5000),rating=Math.min(5,Math.max(1,Math.round(Number(b.rating)||5)));
      if(!customer||!text)return json({ok:false,error:'نام مشتری و متن نظر الزامی است.'},400);
      await env.DB.prepare(`INSERT INTO store_reviews(id,product_id,product_name,customer_name,customer_email,rating,review_text,status,admin_reply) VALUES(?,?,?,?,?,?,?,'pending','')`).bind(id,String(b.product_id||''),product,customer,String(b.customer_email||'').slice(0,200),rating,text).run();
      return json({ok:true,id});
    }
    const status=String(b.status||'pending');if(!['pending','approved','rejected','spam'].includes(status))return json({ok:false,error:'وضعیت نظر معتبر نیست.'},400);
    await env.DB.prepare(`UPDATE store_reviews SET status=?,admin_reply=?,updated_at=datetime('now') WHERE id=?`).bind(status,String(b.admin_reply||'').slice(0,3000),id).run();
    await logAdminActivity(env,request,'بررسی نظر مشتری',id+' • '+status);return json({ok:true});
  }
  if (url.pathname === '/api/announcements' && request.method === 'GET') {
    await ensureCmsTables(env);const now=new Date().toISOString();
    const {results}=await env.DB.prepare(`SELECT id,title,message FROM store_announcements WHERE is_active=1 AND audience IN ('customers','all') AND (starts_at='' OR starts_at<=?) AND (ends_at='' OR ends_at>=?) ORDER BY created_at DESC LIMIT 20`).bind(now,now).all();
    return json({ok:true,items:results||[]});
  }

  if (url.pathname === '/api/admin/wallet' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureUsersTable(env);await ensureOrdersTables(env);await ensureWalletTables(env);
    const urlQ=new URL(request.url),q=String(urlQ.searchParams.get('q')||'').trim().slice(0,100);
    const {results:users}=await env.DB.prepare(`SELECT id,name,email,phone,created_at FROM users WHERE (?='' OR name LIKE ? OR email LIKE ? OR phone LIKE ?) ORDER BY created_at DESC LIMIT 300`).bind(q,`%${q}%`,`%${q}%`,`%${q}%`).all();
    const customers=[];
    for(const u of (users||[])){
      const id=String(u.id??''),email=String(u.email||'');
      const bal=await env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN entry_type='credit' THEN amount WHEN entry_type='debit' THEN -amount ELSE 0 END),0) AS balance,COALESCE(SUM(CASE WHEN entry_type='points' THEN amount ELSE 0 END),0) AS points FROM wallet_ledger WHERE customer_id=? OR (customer_id='' AND lower(email)=lower(?))`).bind(id,email).first();
      const earned=await env.DB.prepare(`SELECT COALESCE(SUM(CAST(o.total/10000 AS INTEGER)),0) AS points,COUNT(*) AS orders,COALESCE(SUM(o.total),0) AS paid_total FROM orders o WHERE o.payment_status='paid' AND ((o.user_id IS NOT NULL AND CAST(o.user_id AS TEXT)=?) OR (o.email<>'' AND lower(o.email)=lower(?)))`).bind(id,email).first();
      const points=Math.max(0,Number(earned?.points||0)+Number(bal?.points||0));
      customers.push({...u,id,balance:Number(bal?.balance||0),points,tier:loyaltyTier(points),orders:Number(earned?.orders||0),paid_total:Number(earned?.paid_total||0)});
    }
    return json({ok:true,customers,summary:{customers:customers.length,balance:customers.reduce((s,c)=>s+c.balance,0),points:customers.reduce((s,c)=>s+c.points,0)}});
  }
  if (url.pathname === '/api/admin/wallet/ledger' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureWalletTables(env);
    const q=new URL(request.url).searchParams,id=String(q.get('customer_id')||''),email=String(q.get('email')||'');
    const {results}=await env.DB.prepare(`SELECT id,customer_id,email,entry_type,amount,note,created_by,created_at FROM wallet_ledger WHERE (?='' OR customer_id=?) AND (?='' OR lower(email)=lower(?)) ORDER BY created_at DESC LIMIT 200`).bind(id,id,email,email).all();
    return json({ok:true,entries:results||[]});
  }
  if (url.pathname === '/api/admin/wallet/ledger' && request.method === 'POST') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureUsersTable(env);await ensureWalletTables(env);
    const b=await request.json().catch(()=>({}));
    const customerId=String(b.customerId||'').trim(),email=String(b.email||'').trim().toLowerCase();
    const type=String(b.type||''),amount=Math.round(Number(b.amount)||0),note=String(b.note||'').trim().slice(0,500);
    if(!customerId&&!email)return json({ok:false,error:'مشتری انتخاب نشده است.'},400);
    if(!['credit','debit','points'].includes(type)||amount<=0||amount>100000000000)return json({ok:false,error:'نوع تراکنش یا مبلغ معتبر نیست.'},400);
    if(type==='debit'){
      const row=await env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN entry_type='credit' THEN amount WHEN entry_type='debit' THEN -amount ELSE 0 END),0) AS balance FROM wallet_ledger WHERE customer_id=? OR (customer_id='' AND lower(email)=lower(?))`).bind(customerId,email).first();
      if(Number(row?.balance||0)<amount)return json({ok:false,error:'موجودی کیف پول برای این برداشت کافی نیست.'},400);
    }
    const identity=await adminSessionInfo(request,env);
    await env.DB.prepare(`INSERT INTO wallet_ledger(id,customer_id,email,entry_type,amount,note,created_by,created_at) VALUES(?,?,?,?,?,?,?,datetime('now'))`).bind('WAL-'+crypto.randomUUID(),customerId,email,type,amount,note,identity?.name||'مدیر اصلی').run();
    await logAdminActivity(env,request,'تراکنش کیف پول',`${email||customerId} • ${type} • ${amount}`);
    return json({ok:true});
  }
  if (url.pathname === '/api/admin/reports' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureOrdersTables(env);
    const q=new URL(request.url).searchParams;
    const from=String(q.get('from')||'').slice(0,10),to=String(q.get('to')||'').slice(0,10);
    const validDate=s=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s);
    if(!validDate(from)||!validDate(to))return json({ok:false,error:'بازه تاریخ معتبر نیست.'},400);
    if(from&&to&&from>to)return json({ok:false,error:'تاریخ شروع بعد از تاریخ پایان است.'},400);
    const where=`(?='' OR date(created_at)>=date(?)) AND (?='' OR date(created_at)<=date(?))`;
    const summary=await env.DB.prepare(`SELECT COUNT(*) AS orders_count,COALESCE(SUM(CASE WHEN payment_status='paid' THEN total ELSE 0 END),0) AS sales_total,COALESCE(SUM(CASE WHEN payment_status='paid' THEN 1 ELSE 0 END),0) AS paid_count,COALESCE(SUM(CASE WHEN payment_status<>'paid' THEN 1 ELSE 0 END),0) AS unpaid_count,COALESCE(SUM(CASE WHEN payment_status='paid' THEN shipping ELSE 0 END),0) AS shipping_total FROM orders WHERE ${where}`).bind(from,from,to,to).first();
    const {results:daily}=await env.DB.prepare(`SELECT date(created_at) AS day,COUNT(*) AS orders_count,COALESCE(SUM(CASE WHEN payment_status='paid' THEN total ELSE 0 END),0) AS sales_total FROM orders WHERE ${where} GROUP BY date(created_at) ORDER BY day DESC LIMIT 90`).bind(from,from,to,to).all();
    const {results:topProducts}=await env.DB.prepare(`SELECT oi.product_id,COALESCE(NULLIF(oi.product_name,''),p.name,'محصول حذف‌شده') AS name,COALESCE(SUM(oi.quantity),0) AS quantity,COALESCE(SUM(oi.line_total),0) AS gross FROM order_items oi JOIN orders o ON o.id=oi.order_id LEFT JOIN products p ON p.id=oi.product_id WHERE o.payment_status='paid' AND ${where.replaceAll('created_at','o.created_at')} GROUP BY oi.product_id,name ORDER BY quantity DESC,gross DESC LIMIT 10`).bind(from,from,to,to).all();
    const {results:inventory}=await env.DB.prepare(`SELECT id,name,sku,stock,price,updated_at FROM products WHERE active=1 ORDER BY CAST(stock AS INTEGER) ASC,name ASC LIMIT 50`).all().catch(()=>({results:[]}));
    return json({ok:true,from,to,summary:summary||{},daily:daily||[],topProducts:topProducts||[],inventory:inventory||[]});
  }

  if (url.pathname === '/api/admin/staff' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env); if(!info||info.role!=='super_admin')return json({ok:false,error:'دسترسی مدیر اصلی لازم است.'},403);
    await ensureAdminTables(env);
    const {results}=await env.DB.prepare(`SELECT id,name,email,role,active,created_at,updated_at FROM admin_staff ORDER BY created_at DESC`).all();
    return json({ok:true,staff:results||[]});
  }
  if (url.pathname === '/api/admin/staff' && request.method === 'POST') {
    const info=await adminSessionInfo(request,env); if(!info||info.role!=='super_admin')return json({ok:false,error:'دسترسی مدیر اصلی لازم است.'},403);
    await ensureAdminTables(env);
    const b=await request.json().catch(()=>({}));
    const name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||''),role=String(b.role||'order_operator');
    if(!name||!/^\S+@\S+\.\S+$/.test(email)||password.length<8||!['content_manager','order_operator'].includes(role))return json({ok:false,error:'نام، ایمیل معتبر، رمز حداقل ۸ کاراکتری و نقش مجاز را وارد کنید.'},400);
    const hashed=await hashCustomerPassword(password);
    try{await env.DB.prepare(`INSERT INTO admin_staff(id,name,email,password_hash,role,active,created_at,updated_at) VALUES(?,?,?,?,?,1,datetime('now'),datetime('now'))`).bind('ADM-'+crypto.randomUUID(),name,email,hashed.salt+'$'+hashed.hash,role).run();}
    catch(e){return json({ok:false,error:'این ایمیل قبلاً ثبت شده یا ذخیره مدیر ناموفق بود.'},409);}
    await logAdminActivity(env,request,'ایجاد مدیر',`${email} • ${role}`);
    return json({ok:true});
  }
  const staffMatch=url.pathname.match(/^\/api\/admin\/staff\/([^/]+)$/);
  if(staffMatch && request.method==='PATCH'){
    const info=await adminSessionInfo(request,env);if(!info||info.role!=='super_admin')return json({ok:false,error:'دسترسی مدیر اصلی لازم است.'},403);
    await ensureAdminTables(env);const id=decodeURIComponent(staffMatch[1]);const b=await request.json().catch(()=>({}));
    const role=String(b.role||'').trim(),active=b.active;
    if(role&&!['content_manager','order_operator'].includes(role))return json({ok:false,error:'نقش نامعتبر است.'},400);
    await env.DB.prepare(`UPDATE admin_staff SET role=CASE WHEN ?<>'' THEN ? ELSE role END,active=CASE WHEN ? IS NULL THEN active ELSE ? END,updated_at=datetime('now') WHERE id=?`).bind(role,role,active===undefined?null:Number(!!active),Number(!!active),id).run();
    await logAdminActivity(env,request,'تغییر دسترسی مدیر',id);return json({ok:true});
  }
  if (url.pathname === '/api/admin/activity' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info)return json({ok:false,error:'Unauthorized'},401);
    await ensureAdminTables(env);const {results}=await env.DB.prepare(`SELECT id,actor,action,details,created_at FROM admin_activity ORDER BY created_at DESC LIMIT 200`).all();
    return json({ok:true,activities:results||[]});
  }
  if (url.pathname === '/api/admin/store-settings' && request.method === 'GET') {
    const info=await adminSessionInfo(request,env);if(!info)return json({ok:false,error:'Unauthorized'},401);
    await ensureAdminTables(env);const {results}=await env.DB.prepare(`SELECT key,value,updated_at FROM store_settings`).all();
    return json({ok:true,settings:Object.fromEntries((results||[]).map(x=>[x.key,x.value]))});
  }
  if (url.pathname === '/api/admin/store-settings' && request.method === 'POST') {
    const info=await adminSessionInfo(request,env);if(!info||!staffAllowed(info,url.pathname))return json({ok:false,error:'دسترسی لازم را ندارید.'},403);
    await ensureAdminTables(env);const b=await request.json().catch(()=>({}));
    const allowed=['store_name','store_logo_url','store_phone','store_email','store_address','shipping_method','shipping_cost','free_shipping_min','shipping_company','support_phone','support_email'];
    for(const key of allowed){if(b[key]!==undefined)await env.DB.prepare(`INSERT INTO store_settings(key,value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=datetime('now')`).bind(key,String(b[key]??'').trim().slice(0,1000)).run();}
    await logAdminActivity(env,request,'ذخیره تنظیمات فروشگاه',allowed.filter(k=>b[k]!==undefined).join(', '));
    return json({ok:true});
  }

  if (url.pathname === '/api/admin/orders' && request.method === 'GET') {
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    await ensureOrdersTables(env);
    const {results}=await env.DB.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
    for(const o of (results||[])){
      const {results:items}=await env.DB.prepare(`SELECT * FROM order_items WHERE order_id=? ORDER BY rowid ASC`).bind(String(o.id)).all().catch(()=>({results:[]}));
      o.items=(items||[]).map(i=>({name:i.product_name||i.name||'محصول',image:i.product_image||i.image||'',price:Number(i.unit_price??i.price??0),quantity:Number(i.quantity??i.qty??1),total:Number(i.line_total??i.total??i.amount??0)}));
    }
    return json({ok:true,orders:results||[]});
  }
  if (url.pathname === '/api/admin/payment-settings' && request.method === 'GET') {
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    const payment=await paymentConfig(env);
    return json({ok:true,payment});
  }
  if (url.pathname === '/api/admin/payment-settings' && request.method === 'POST') {
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    await ensureStoreSettings(env);
    const b=await request.json().catch(()=>({}));
    const values={payment_card_number:String(b.cardNumber||'').trim(),payment_card_name:String(b.cardName||'').trim(),payment_bank_name:String(b.bankName||'').trim(),payment_gateway_enabled:b.gatewayEnabled?'1':'0',payment_gateway_name:String(b.gatewayName||'').trim(),payment_gateway_merchant_id:String(b.merchantId||'').trim(),payment_gateway_note:String(b.note||'').trim()};
    for(const [key,value] of Object.entries(values)) await env.DB.prepare(`INSERT INTO store_settings(key,value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=datetime('now')`).bind(key,value).run();
    await logAdminActivity(env,request,'ذخیره تنظیمات پرداخت','اطلاعات کارت یا تنظیمات درگاه تغییر کرد');
    return json({ok:true,payment:await paymentConfig(env)});
  }

  const adminOrder=url.pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if(adminOrder && request.method === 'PATCH') {
    if(!await validSession(request,env.ADMIN_PASSWORD)) return json({ok:false,error:'Unauthorized'},401);
    await ensureOrdersTables(env);
    const orderId=decodeURIComponent(adminOrder[1]);
    const body=await request.json().catch(()=>({}));
    const paymentStatus=String(body.paymentStatus||'').trim();
    let orderStatus=String(body.orderStatus||'').trim();
    const tracking=String(body.trackingCode||'').trim();
    const allowedPay=['pending','submitted','paid','failed','refunded']; const allowedOrder=['pending_payment','awaiting_verification','processing','shipped','delivered','cancelled'];
    if(paymentStatus && !allowedPay.includes(paymentStatus)) return json({ok:false,error:'وضعیت پرداخت نامعتبر است.'},400);
    if(orderStatus && !allowedOrder.includes(orderStatus)) return json({ok:false,error:'وضعیت سفارش نامعتبر است.'},400);
    const currentOrder=await env.DB.prepare(`SELECT order_status FROM orders WHERE id=?`).bind(orderId).first();
    if(!currentOrder)return json({ok:false,error:'سفارش پیدا نشد.'},404);
    if(!orderStatus && paymentStatus==='paid' && ['pending_payment','awaiting_verification'].includes(String(currentOrder.order_status)))orderStatus='processing';
    if(!orderStatus && paymentStatus==='failed' && String(currentOrder.order_status)==='awaiting_verification')orderStatus='pending_payment';
    await env.DB.prepare(`UPDATE orders SET payment_status=CASE WHEN ?<>'' THEN ? ELSE payment_status END,order_status=CASE WHEN ?<>'' THEN ? ELSE order_status END,tracking_code=CASE WHEN ?<>'' THEN ? ELSE tracking_code END,updated_at=datetime('now') WHERE id=?`).bind(paymentStatus,paymentStatus,orderStatus,orderStatus,tracking,tracking,orderId).run();
    await logAdminActivity(env,request,'به‌روزرسانی سفارش',`سفارش ${orderId} • پرداخت: ${paymentStatus||'بدون تغییر'} • وضعیت: ${orderStatus||'بدون تغییر'} • رهگیری: ${tracking||'بدون تغییر'}`);
    return json({ok:true});
  }

  if (!url.pathname.startsWith('/api/products')) return json({ ok: false, error: 'Not found' }, 404);
  if (!env.DB) return json({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
  await ensureProductMetaTable(env);
  const adminInfo = await adminSessionInfo(request, env);
  const isAdmin = !!adminInfo && staffAllowed(adminInfo, url.pathname);

  if (url.pathname === '/api/products' && request.method === 'GET') {
    const visibility = isAdmin ? '' : ' WHERE p.active=1';
    const { results } = await env.DB.prepare(`SELECT p.id,p.name,p.brand,p.category,p.price,p.stock,p.sku,p.image,p.desc,p.active,p.created_at,p.updated_at,m.metadata_json FROM products p LEFT JOIN product_meta m ON m.product_id=p.id${visibility} ORDER BY p.created_at DESC`).all();
    const products = (results || []).map(row => {
      let metadata = {};
      try { metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch (_) {}
      delete row.metadata_json;
      return { ...row, metadata };
    });
    return json({ ok: true, products });
  }
  if (!isAdmin) return json({ ok: false, error: 'Unauthorized' }, 401);

  if (url.pathname === '/api/products' && request.method === 'POST') {
    const body = cleanProduct(await request.json().catch(() => ({})));
    if (!body.name || !body.brand) return json({ ok: false, error: 'نام و برند محصول الزامی است.' }, 400);
    const id = crypto.randomUUID();
    const active = body.metadata.active !== false ? 1 : 0;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO products (id,name,brand,category,price,stock,sku,image,desc,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`).bind(id, body.name, body.brand, body.category, body.price, body.stock, body.sku, body.image, body.desc, active),
      env.DB.prepare(`INSERT INTO product_meta (product_id,metadata_json,updated_at) VALUES (?,?,datetime('now'))`).bind(id, JSON.stringify(body.metadata))
    ]);
    const product = await env.DB.prepare(`SELECT * FROM products WHERE id=?`).bind(id).first();
    await logAdminActivity(env,request,'ایجاد محصول',`${body.name} • ${id}`);
    return json({ ok: true, product: { ...product, metadata: body.metadata } }, 201);
  }

  const match = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  if (!match) return json({ ok: false, error: 'Not found' }, 404);
  const id = decodeURIComponent(match[1]);
  if (request.method === 'PUT') {
    const body = cleanProduct(await request.json().catch(() => ({})));
    await env.DB.batch([
      env.DB.prepare(`UPDATE products SET name=?,brand=?,category=?,price=?,stock=?,sku=?,image=?,desc=?,active=?,updated_at=datetime('now') WHERE id=?`).bind(body.name, body.brand, body.category, body.price, body.stock, body.sku, body.image, body.desc, body.metadata.active !== false ? 1 : 0, id),
      env.DB.prepare(`INSERT INTO product_meta (product_id,metadata_json,updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(product_id) DO UPDATE SET metadata_json=excluded.metadata_json,updated_at=datetime('now')`).bind(id, JSON.stringify(body.metadata))
    ]);
    const product = await env.DB.prepare(`SELECT * FROM products WHERE id=?`).bind(id).first();
    await logAdminActivity(env,request,'ویرایش محصول',`${body.name} • ${id}`);
    return json({ ok: true, product: { ...product, metadata: body.metadata } });
  }
  if (request.method === 'DELETE') {
    await env.DB.prepare(`UPDATE products SET active=0,updated_at=datetime('now') WHERE id=?`).bind(id).run();
    await logAdminActivity(env,request,'غیرفعال‌سازی محصول',id);
    return json({ ok: true });
  }
  return json({ ok: false, error: 'Method not allowed' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return await api(request, env, url);
      // Keep the working V78 admin route. No redirect chain is used.
      if (url.pathname === '/admin' || url.pathname === '/admin/') {
        return env.ASSETS.fetch(new Request(new URL('/admin/index.html', request.url), request));
      }
      if (url.pathname === '/admin/dashboard' || url.pathname === '/admin/payment' || url.pathname === '/checkout') {
        if (env.DB) {
          await ensureProductMetaTable(env);
          await ensureOrdersTables(env);
          await ensureStoreSettings(env);
        }
      }
      if (url.pathname === '/admin/dashboard') {
        return env.ASSETS.fetch(new Request(new URL('/admin/dashboard.html', request.url), request));
      }
      if (url.pathname === '/admin/payment') {
        return env.ASSETS.fetch(new Request(new URL('/admin/payment.html', request.url), request));
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ ok: false, error: err?.message || 'Server error' }, 500);
    }
  }
};
