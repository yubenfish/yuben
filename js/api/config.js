/* =========================================================
   js/api/config.js  —  API 基础配置 + 统一 fetch 封装 + JWT Bearer + 🆕 GuestId
   ========================================================= */

const API_BASE = 'http://localhost:8081';

/* =========================================================
   🆕 Guest ID（浏览器唯一）—— 防止跨设备游客购物车污染
   每个浏览器/设备首次访问时生成一个 UUID，存 localStorage 永久不变。
   后端据此把 userId=NULL 的游客购物车按 guestId 隔离。
   ========================================================= */
const GUEST_KEY = 'shop_guest_id';

/** 🆕 生成 UUID v4（浏览器端，原生 crypto 或 polyfill） */
function generateGuestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // 简易 fallback UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getGuestId() {
  let gid;
  try { gid = localStorage.getItem(GUEST_KEY); } catch { gid = null; }
  if (!gid) {
    gid = generateGuestId();
    try { localStorage.setItem(GUEST_KEY, gid); } catch {}
  }
  return gid;
}

/* =========================================================
   JWT Token 存储（localStorage）
   ========================================================= */
const TOKEN_KEY = 'shop_jwt_token';

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/* =========================================================
   用户对象（从 localStorage 取，不含 token）
   ========================================================= */
const USER_KEY = 'shop_user';

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}

/** 🆕 登录/注册后保存 —— 兼容两种格式：
 *   ① 新 JWT 后端返回 resp.data = { user, accessToken, ... } → 拆成 shop_user + shop_jwt_token
 *   ② 老接口直接返回 User（没有 id 以外的字段可能带 token）→ 直接存 shop_user
 */
function saveUser(payload) {
  if (!payload) return;
  if (payload.data && (payload.data.accessToken || payload.data.id)) {
    payload = payload.data;
  }
  if (payload.accessToken && payload.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    setToken(payload.accessToken);
    return;
  }
  if (payload.id && (payload.username || payload.nickname)) {
    localStorage.setItem(USER_KEY, JSON.stringify(payload));
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(payload));
}

function logout() {
  localStorage.removeItem(USER_KEY);
  clearToken();
  // 🆕 注意：**不清 guestId**！退出后这个浏览器还是同一个游客身份，购物车保留
  sessionStorage.removeItem('shop_cart');
  localStorage.removeItem('shop_browse_history');
  localStorage.removeItem('shop_search_history');
}

/* =========================================================
   统一请求封装 —— 自动加 Authorization + X-Guest-Id
   ========================================================= */
async function request(path, options = {}) {
  const url = API_BASE + path;

  // 合并 headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 🆕 自动注入 JWT（如果存在）
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  // 🆕 自动注入 X-Guest-Id（每次请求都带 —— 不管登录态；后端自己选 userId 还是 guestId）
  headers['X-Guest-Id'] = getGuestId();

  let resp;
  try {
    resp = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    console.warn('[API] 请求失败:', path, err.message);
    throw err;
  }

  // 🆕 401 自动登出
  if (resp.status === 401) {
    clearToken();
    console.warn('[JWT] 401 — token 已过期');
  }

  if (!resp.ok && resp.status !== 401) {
    throw new Error(`HTTP ${resp.status}`);
  }
  return resp.json();
}

/** GET 请求 */
function httpGet(path) { return request(path, { method: 'GET' }); }
/** POST 请求 */
function httpPost(path, body) {
  return request(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}
/** PUT 请求 */
function httpPut(path, body) {
  return request(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}
/** DELETE 请求 */
function httpDelete(path) { return request(path, { method: 'DELETE' }); }

/* =========================================================
   挂到 window 上（其他 JS 文件通过 window.xxx 调用）
   ========================================================= */
window.getUser = getUser;
window.saveUser = saveUser;
window.logout = logout;
window.httpGet = httpGet;
window.httpPost = httpPost;
window.httpPut = httpPut;
window.httpDelete = httpDelete;
