const SESSION_COOKIE = 'avan_admin_session';
const SESSION_TTL = 60 * 60 * 24;

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
async function validSession(request, secret) {
  if (!secret) return false;
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  try {
    const exp = Number(new TextDecoder().decode(unb64u(payload)));
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, unb64u(sig), new TextEncoder().encode(payload));
  } catch (_) { return false; }
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
    desc: String(input.desc || '').trim()
  };
}

async function api(request, env, url) {
  if (url.pathname === '/api/admin/login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const password = String(body.password || '');
    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) return json({ ok: false, error: 'رمز واردشده صحیح نیست.' }, 401);
    const token = await makeSession(env.ADMIN_PASSWORD);
    return json({ ok: true }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL}` });
  }
  if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` });
  }
  if (url.pathname === '/api/admin/me' && request.method === 'GET') {
    return json({ ok: await validSession(request, env.ADMIN_PASSWORD) });
  }

  if (!url.pathname.startsWith('/api/products')) return json({ ok: false, error: 'Not found' }, 404);
  if (!env.DB) return json({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
  const isAdmin = await validSession(request, env.ADMIN_PASSWORD);

  if (url.pathname === '/api/products' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT id,name,brand,category,price,stock,sku,image,desc,created_at,updated_at FROM products WHERE active=1 ORDER BY created_at DESC`).all();
    return json({ ok: true, products: results || [] });
  }
  if (!isAdmin) return json({ ok: false, error: 'Unauthorized' }, 401);

  if (url.pathname === '/api/products' && request.method === 'POST') {
    const body = cleanProduct(await request.json().catch(() => ({})));
    if (!body.name || !body.brand) return json({ ok: false, error: 'نام و برند محصول الزامی است.' }, 400);
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO products (id,name,brand,category,price,stock,sku,image,desc,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,datetime('now'),datetime('now'))`).bind(id, body.name, body.brand, body.category, body.price, body.stock, body.sku, body.image, body.desc).run();
    const product = await env.DB.prepare(`SELECT * FROM products WHERE id=?`).bind(id).first();
    return json({ ok: true, product }, 201);
  }

  const match = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  if (!match) return json({ ok: false, error: 'Not found' }, 404);
  const id = decodeURIComponent(match[1]);
  if (request.method === 'PUT') {
    const body = cleanProduct(await request.json().catch(() => ({})));
    await env.DB.prepare(`UPDATE products SET name=?,brand=?,category=?,price=?,stock=?,sku=?,image=?,desc=?,updated_at=datetime('now') WHERE id=?`).bind(body.name, body.brand, body.category, body.price, body.stock, body.sku, body.image, body.desc, id).run();
    const product = await env.DB.prepare(`SELECT * FROM products WHERE id=?`).bind(id).first();
    return json({ ok: true, product });
  }
  if (request.method === 'DELETE') {
    await env.DB.prepare(`UPDATE products SET active=0,updated_at=datetime('now') WHERE id=?`).bind(id).run();
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
      if (url.pathname === '/admin/dashboard') {
        return env.ASSETS.fetch(new Request(new URL('/admin/dashboard.html', request.url), request));
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ ok: false, error: err?.message || 'Server error' }, 500);
    }
  }
};
