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
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT 'google',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run();
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
    const exp = Number(new TextDecoder().decode(unb64u(payload)));
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, unb64u(sig), new TextEncoder().encode(payload));
  } catch (_) { return false; }
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

async function api(request, env, url) {
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
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302, {
      'Set-Cookie': oauthCookie(GOOGLE_STATE_COOKIE, state, GOOGLE_STATE_TTL)
    });
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
        const id = crypto.randomUUID();
        await env.DB.prepare(`INSERT INTO users (id,google_id,email,name,avatar,provider,created_at,updated_at) VALUES (?,?,?,?,?,'google',datetime('now'),datetime('now'))`).bind(id, googleUser.googleId, googleUser.email, googleUser.name, googleUser.avatar).run();
        user = await env.DB.prepare(`SELECT * FROM users WHERE id=?`).bind(id).first();
      }
      const sessionSecret = String(env.GOOGLE_CLIENT_SECRET || '');
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
    const session = await validUserSession(request, String(env.GOOGLE_CLIENT_SECRET || ''));
    if (!session) return json({ ok:true, authenticated:false });
    const user = await env.DB.prepare(`SELECT id,email,name,avatar,provider,created_at FROM users WHERE id=?`).bind(session.uid).first();
    if (!user) return json({ ok:true, authenticated:false }, 200, { 'Set-Cookie': clearCookie(USER_SESSION_COOKIE) });
    return json({ ok:true, authenticated:true, user });
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return json({ ok:true }, 200, { 'Set-Cookie': clearCookie(USER_SESSION_COOKIE) });
  }
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
    let rows;
    if (q) {
      const like = `%${q}%`;
      const r = await env.DB.prepare(`SELECT id,email,name,avatar,provider,created_at,updated_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ${limit}`).bind(like, like).all();
      rows = r.results || [];
    } else {
      const r = await env.DB.prepare(`SELECT id,email,name,avatar,provider,created_at,updated_at FROM users ORDER BY created_at DESC LIMIT ${limit}`).all();
      rows = r.results || [];
    }
    const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users`).first();
    const recent = await env.DB.prepare(`SELECT COUNT(*) AS n FROM users WHERE created_at >= datetime('now','-30 day')`).first();
    const providers = await env.DB.prepare(`SELECT provider, COUNT(*) AS n FROM users GROUP BY provider`).all();
    return json({ok:true, customers:rows, stats:{total:Number(total?.n||0), recent:Number(recent?.n||0), providers:providers.results||[]}});
  }

  if (!url.pathname.startsWith('/api/products')) return json({ ok: false, error: 'Not found' }, 404);
  if (!env.DB) return json({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
  const isAdmin = await validSession(request, env.ADMIN_PASSWORD);

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
    return json({ ok: true, product: { ...product, metadata: body.metadata } });
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
