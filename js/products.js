/* =========================================================
   js/products.js  —  商品渲染 + 后端搜索 API + 分类筛选 + 🆕价格区间 + 🆕收藏星星
   ========================================================= */

let currentFilter = 'all';
let productsCache = [];
let currentKeyword = '';
let currentMinPrice = null;   // 🆕 价格筛选
let currentMaxPrice = null;

/* ---------- 🆕 已收藏集合（登录后预加载） ---------- */
const favoritedSet = new Set();
async function refreshFavoriteSet(userId) {
  favoritedSet.clear();
  if (!userId) return;
  try {
    const favs = await fetchMyFavorites(userId);
    favs.forEach(f => favoritedSet.add(f.productId));
  } catch { /* 静默失败 */ }
}

/* ---------- 从后端加载（cat + keyword + 🆕价格） ---------- */
async function loadProductsFromApi() {
  try {
    productsCache = await fetchProducts(currentFilter, currentKeyword, currentMinPrice, currentMaxPrice);
    console.log(`[API] 商品: ${productsCache.length} 款（cat=${currentFilter}, kw=${currentKeyword}, price=${currentMinPrice||0}-${currentMaxPrice||'∞'}）`);
  } catch (err) {
    console.warn('[API] 商品接口不可用，使用本地 Mock');
    productsCache = window._MOCK_PRODUCTS || [];
  }
}

/* ---------- 渲染 ---------- */
async function renderProducts() {
  await loadProductsFromApi();
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = productsCache.length
    ? productsCache.map(p => productCardHTML(p)).join('')
    : '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#999;">未找到相关商品 😢<br><small style="margin-top:8px;display:block;">试试清除价格筛选？</small></div>';
}

/* ---------- 商品卡片（🆕 收藏星星替换 wishlist-btn） ---------- */
function productCardHTML(p) {
  const faved = favoritedSet.has(p.id);
  return `
  <div class="product-card" data-id="${p.id}" onclick="openDetail(${p.id})" style="cursor:pointer;">
    <div class="product-img">
      ${p.tag ? `<span class="product-tag ${p.tag}">${p.tagText || p.tag}</span>` : ''}
      <button class="wishlist-btn ${faved ? 'faved' : ''}" title="${faved ? '已收藏 · 点一下取消' : '加入收藏（需要登录）'}" onclick="event.stopPropagation();toggleFavoriteCard(${p.id}, this)">
        ${faved ? '★' : '☆'}
      </button>
      <div class="product-img-bg" style="background:${p.bg}">${p.emoji || '📦'}</div>
    </div>
    <div class="product-info">
      <div class="product-name">${highlight(p.name, currentKeyword)}</div>
      <div class="product-rating">
        <span class="stars">★★★★★</span>
        <span>${p.rating || 4.8} · ${p.reviewCount || 0} 评价</span>
      </div>
      <div class="product-footer">
        <div class="price-group">
          <span class="price-now"><small>¥</small>${p.price.toLocaleString()}</span>
          ${p.oldPrice ? `<span class="price-old">¥${p.oldPrice.toLocaleString()}</span>` : ''}
        </div>
        <button class="add-cart-btn" onclick="event.stopPropagation();addToCart(${p.id})" title="加入购物车">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/><path d="M12 5v14"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

/* ---------- 🆕 收藏/取消收藏（卡片星星按钮） ---------- */
async function toggleFavoriteCard(productId, btn) {
  const user = window.getUser?.() || null;
  if (!user) {
    showConfirm('收藏需要登录，\n要不要先登录一下？', () => openAuth(), '去登录', '再想想');
    return;
  }
  try {
    if (favoritedSet.has(productId)) {
      await removeFavorite(user.id, productId);
      favoritedSet.delete(productId);
      btn.classList.remove('faved');
      btn.textContent = '☆';
      showToast('已取消收藏');
    } else {
      await addFavorite(user.id, productId);
      favoritedSet.add(productId);
      btn.classList.add('faved');
      btn.textContent = '★';
      showToast('⭐ 已加入收藏');
    }
  } catch (e) {
    showToast('操作失败：' + e.message);
  }
}

/* ---------- 分类筛选 ---------- */
function bindCategoryFilter() {
  document.querySelectorAll('.cat-filter').forEach(btn => {
    btn.addEventListener('click', () => setActiveFilter(btn.dataset.filter, btn));
  });
  document.querySelectorAll('.category-item').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const cat = item.dataset.cat;
      const topBtn = document.querySelector(`.cat-filter[data-filter="${cat}"]`);
      if (topBtn) setActiveFilter(cat, topBtn);
      else { currentFilter = cat; renderProducts(); }
      document.querySelectorAll('.category-item').forEach(i => { i.style.background = ''; i.style.color = ''; });
      item.style.background = 'var(--primary)';
      item.style.color = '#fff';
    });
  });
}

function setActiveFilter(filter, activeBtn) {
  document.querySelectorAll('.cat-filter').forEach(b => {
    b.classList.remove('active');
    b.style.background = 'transparent';
    b.style.color = 'var(--text-secondary)';
    b.style.fontWeight = '500';
  });
  activeBtn.classList.add('active');
  activeBtn.style.background = 'var(--primary)';
  activeBtn.style.color = '#fff';
  activeBtn.style.fontWeight = '700';
  currentFilter = filter;
  renderProducts();
}

/* ---------- 🆕 价格筛选 ---------- */
function bindPriceFilter() {
  document.querySelectorAll('.price-filter').forEach(btn => {
    btn.addEventListener('click', () => setActivePrice(btn.dataset.min, btn.dataset.max, btn));
  });

  const applyBtn = document.getElementById('priceApply');
  const resetBtn = document.getElementById('priceReset');
  if (applyBtn) applyBtn.addEventListener('click', () => {
    const min = document.getElementById('priceMin').value.trim();
    const max = document.getElementById('priceMax').value.trim();
    const minN = min ? parseInt(min) : null;
    const maxN = max ? parseInt(max) : null;
    if (minN != null && maxN != null && minN > maxN) { showToast('最低价不能大于最高价'); return; }
    setActivePrice(minN, maxN, null);
  });
  if (resetBtn) resetBtn.addEventListener('click', () => {
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    setActivePrice(null, null, null);
  });
}

function setActivePrice(min, max, activeBtn) {
  // 更新 Tab 状态
  document.querySelectorAll('.price-filter').forEach(b => { b.classList.remove('active'); });
  if (activeBtn) activeBtn.classList.add('active');

  // 自定义输入框同步
  const minEl = document.getElementById('priceMin');
  const maxEl = document.getElementById('priceMax');
  if (minEl) minEl.value = min ?? '';
  if (maxEl) maxEl.value = max ?? '';

  currentMinPrice = min;
  currentMaxPrice = max;
  renderProducts();
}

/* =========================================================
   🆕 搜索系统（下拉面板 + 热门词 + 历史 + 实时建议 + 高亮）
   localStorage key: "shop_search_history"  (最多 10 条)
   ========================================================= */
const _HOT_KEYWORDS = [
  { text: 'iPhone', hot: true },
  { text: '耳机',   hot: true },
  { text: '运动鞋', hot: true },
  { text: '降噪',   hot: false },
  { text: '笔记本', hot: false },
  { text: '手表',   hot: false },
  { text: '吸尘器', hot: false },
  { text: '沙发',   hot: false },
];
const _HISTORY_KEY = 'shop_search_history';
const _HISTORY_MAX = 10;

/* ---------- localStorage 历史 ---------- */
function getSearchHistory() {
  try { return JSON.parse(localStorage.getItem(_HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function addSearchHistory(kw) {
  if (!kw || kw.length > 50) return;
  let list = getSearchHistory().filter(k => k !== kw); // 去重
  list.unshift(kw);
  list = list.slice(0, _HISTORY_MAX);
  localStorage.setItem(_HISTORY_KEY, JSON.stringify(list));
}
function removeSearchHistory(kw) {
  localStorage.setItem(_HISTORY_KEY, JSON.stringify(
    getSearchHistory().filter(k => k !== kw)
  ));
}
function clearSearchHistory() { localStorage.removeItem(_HISTORY_KEY); }

/* ---------- keyword 高亮（包 <mark class="search-hl">） ---------- */
function highlight(text, kw) {
  if (!kw) return text;
  const safe = String(text || '');
  const k = String(kw).trim();
  if (!k) return safe;
  // 转义 regex 特殊字符
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${esc})`, 'gi'), '<mark class="search-hl">$1</mark>');
}

/* ---------- 执行搜索（保存历史 + 拉 API） ---------- */
function doSearchAndSave(kw) {
  kw = (kw || '').trim();
  const input = document.getElementById('searchInput');
  input.value = kw;
  currentKeyword = kw;
  if (kw) addSearchHistory(kw);
  hideSearchDropdown();
  renderProducts();
}

/* ---------- 实时建议（基于已加载的 productsCache） ---------- */
function getLiveSuggestions(kw) {
  if (!kw) return { suggestions: [], products: [] };
  const k = kw.toLowerCase();
  const matchedProducts = productsCache
    .filter(p => (p.name || '').toLowerCase().includes(k))
    .slice(0, 5);
  // 匹配历史里的子串
  const matchedHistory = getSearchHistory()
    .filter(h => h.toLowerCase().includes(k) && h.toLowerCase() !== kw.toLowerCase())
    .slice(0, 3);
  return { suggestions: matchedHistory, products: matchedProducts };
}

/* ---------- 渲染下拉面板 ---------- */
function renderSearchDropdown() {
  const input = document.getElementById('searchInput');
  const kw = input.value.trim();
  const panel = document.getElementById('searchDropdown');

  if (!kw) {
    // ===== focus 空输入：热门词 + 历史 =====
    const history = getSearchHistory();
    const hotTags = _HOT_KEYWORDS.map(t =>
      `<span class="sd-tag ${t.hot ? 'hot' : ''}" data-kw="${t.text}">${t.hot ? '🔥 ' : ''}${t.text}</span>`
    ).join('');
    const historyHTML = history.length ? history.map((h, i) => `
      <div class="sd-item" data-kw="${h}">
        <span class="sd-item-icon">🕐</span>
        <span class="sd-item-text">${h}</span>
        <span class="sd-item-del" data-del="${h}" title="删除">✕</span>
      </div>
    `).join('') : '';

    panel.innerHTML = `
      <div class="sd-section">
        <div class="sd-title">🔥 热门搜索</div>
        <div class="sd-hot-tags">${hotTags}</div>
      </div>
      ${history.length ? `
      <div class="sd-section">
        <div class="sd-title">
          <span>🕐 搜索历史</span>
          <span class="sd-clear" id="sdClearHistory">清空</span>
        </div>
        <div class="sd-list">${historyHTML}</div>
      </div>` : ''}
    `;
  } else {
    // ===== 有输入：匹配历史 + 商品实时建议 =====
    const { suggestions, products } = getLiveSuggestions(kw);
    const items = [];

    if (suggestions.length) {
      items.push(`<div class="sd-section">
        <div class="sd-title">💡 相关搜索</div>
        <div class="sd-list">${suggestions.map(s => `
          <div class="sd-item" data-kw="${s}">
            <span class="sd-item-icon">🔍</span>
            <span class="sd-item-text">${highlight(s, kw)}</span>
          </div>`).join('')}</div>
      </div>`);
    }
    if (products.length) {
      items.push(`<div class="sd-section">
        <div class="sd-title">🛍 商品建议</div>
        ${products.map(p => `
          <div class="sd-suggest-item" data-kw="${kw}" data-pid="${p.id}">
            <div class="sd-suggest-img" style="background:${p.bg}">${p.emoji || '📦'}</div>
            <div class="sd-suggest-info">
              <div class="sd-suggest-name">${highlight(p.name, kw)}</div>
              <div class="sd-suggest-price">¥${p.price.toLocaleString()}</div>
            </div>
          </div>`).join('')}
      </div>`);
    }
    if (!suggestions.length && !products.length) {
      items.push(`<div class="sd-section" style="text-align:center;padding:10px;color:#9ca3af;">
        没有找到相关建议，回车直接搜索 "<b style="color:#6b7280;">${kw}</b>"
      </div>`);
    }
    panel.innerHTML = items.join('');
  }
  panel.style.display = 'block';
  bindDropdownClicks();
}

/* ---------- 下拉面板内部点击绑定（事件委托） ---------- */
function bindDropdownClicks() {
  const panel = document.getElementById('searchDropdown');
  panel.querySelectorAll('[data-kw]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const kw = el.dataset.kw;
      const pid = el.dataset.pid;
      if (pid) {
        // 点具体商品 → 直接打开详情
        hideSearchDropdown();
        document.getElementById('searchInput').value = kw;
        doSearchAndSave(kw);
        setTimeout(() => openDetail(Number(pid)), 300);
      } else {
        doSearchAndSave(kw);
      }
    });
  });
  // 删除单条历史
  panel.querySelectorAll('[data-del]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSearchHistory(el.dataset.del);
      renderSearchDropdown(); // 刷新
    });
  });
  // 清空历史
  const clearBtn = document.getElementById('sdClearHistory');
  if (clearBtn) clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSearchHistory();
    renderSearchDropdown();
  });
}

function hideSearchDropdown() {
  document.getElementById('searchDropdown').style.display = 'none';
}

/* ---------- 🆕 搜索主入口（重写） ---------- */
function bindSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  let debounce;

  // input 事件：实时建议
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      // 不立即搜，只显示建议面板
      renderSearchDropdown();
    }, 200);
  });

  // focus 空输入 → 显示热门词+历史
  input.addEventListener('focus', () => {
    renderSearchDropdown();
  });

  // 点搜索按钮 / 回车 → 正式搜索
  const submitSearch = () => doSearchAndSave(input.value);
  btn.addEventListener('click', submitSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitSearch(); }
    if (e.key === 'Escape') hideSearchDropdown();
  });

  // 点页面其他地方 → 关闭面板
  document.addEventListener('click', (e) => {
    const bar = document.querySelector('.search-bar');
    if (!bar.contains(e.target)) hideSearchDropdown();
  });
}

/* ---------- 倒计时 ---------- */
function startCountdown() {
  let total = 2 * 3600 + 45 * 60 + 30;
  const hEl = document.getElementById('cdH');
  const mEl = document.getElementById('cdM');
  const sEl = document.getElementById('cdS');
  setInterval(() => {
    total--;
    if (total < 0) total = 2 * 3600 + 45 * 60 + 30;
    hEl.textContent = String(Math.floor(total / 3600)).padStart(2, '0');
    mEl.textContent = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    sEl.textContent = String(total % 60).padStart(2, '0');
  }, 1000);
}

/* =========================================================
   🆕 我的收藏弹窗（⭐ 前端核心功能）
   - 调后端 GET /api/favorite?userId=X 拿到带商品详情的列表
   - 空状态、取消收藏、加购、点商品卡跳转详情
   ========================================================= */
async function openFavorites() {
  const user = window.getUser?.();
  if (!user) { openAuth(); return; }

  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('favoriteModal').classList.add('active');
  document.getElementById('favoriteList').innerHTML =
    '<div style="text-align:center;padding:40px;color:#999;">加载中...</div>';
  document.getElementById('favCount').textContent = '';

  try {
    const resp = await httpGet(`/api/favorite?userId=${user.id}&size=100`);
    if (resp.code !== 0) throw new Error(resp.message || '加载失败');
    const items = resp.data?.items || [];

    // 标题带上数量
    document.getElementById('favCount').textContent =
      items.length ? `· 共 ${items.length} 件` : '';

    const listEl = document.getElementById('favoriteList');
    if (!items.length) {
      listEl.innerHTML = `
        <div class="fav-empty">
          <div class="fav-empty-icon">🌙</div>
          <div class="fav-empty-text">还没有收藏任何商品哦</div>
          <div class="fav-empty-hint">去首页逛逛，看到喜欢的就点一下 ⭐ 吧~</div>
          <button class="fav-empty-btn" onclick="closeModal('favoriteModal');document.getElementById('products').scrollIntoView({behavior:'smooth'});">
            🛍 去逛逛
          </button>
        </div>`;
      return;
    }

    // 渲染收藏列表（每个 item 含完整 product 对象）
    listEl.innerHTML = items.map(item => {
      const p = item.product;
      const d = new Date(item.favoritedAt).toLocaleDateString('zh-CN');
      return `
      <div class="fav-item">
        <div class="fav-img" style="background:${p.bg}" onclick="closeModal('favoriteModal');openDetail(${p.id})">
          ${p.emoji || '📦'}
          ${p.tag ? `<span class="product-tag ${p.tag}" style="top:6px;left:6px;font-size:11px;padding:2px 6px;">${p.tagText || p.tag}</span>` : ''}
        </div>
        <div class="fav-info">
          <div class="fav-name" onclick="closeModal('favoriteModal');openDetail(${p.id})">${p.name}</div>
          <div class="fav-meta">
            <span>📅 收藏于 ${d}</span>
            <span>💬 ${p.reviewCount || 0} 评价</span>
            ${p.stock <= 0 ? '<span style="color:#ff4d4f;">⚠ 已下架</span>' :
              p.stock < 10 ? `<span style="color:#faad14;">⚠ 仅剩 ${p.stock} 件</span>` : ''}
          </div>
          <div class="fav-bottom">
            <div class="fav-price-group">
              <span class="fav-price-now">¥${p.price.toLocaleString()}</span>
              ${p.oldPrice ? `<span class="fav-price-old">¥${p.oldPrice.toLocaleString()}</span>` : ''}
            </div>
            <div class="fav-actions">
              <button class="fav-remove" title="取消收藏" onclick="removeFromFavorites(${p.id}, this)">
                ★ 已收藏
              </button>
              ${p.stock > 0 ? `
                <button class="fav-add-cart" onclick="closeModal('favoriteModal');addToCart(${p.id})">
                  🛒 加入购物车
                </button>` : `
                <button class="fav-add-cart" disabled style="opacity:.4;cursor:not-allowed;">已售罄</button>`}
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

  } catch (e) {
    document.getElementById('favoriteList').innerHTML =
      `<div style="text-align:center;padding:40px;color:#ff4d4f;">❌ 加载失败：${e.message}</div>`;
  }
}

/** 从收藏列表移除（弹窗内按钮 + 同步首页星星） */
async function removeFromFavorites(productId, btn) {
  const user = window.getUser?.();
  if (!user) return;
  try {
    await removeFavorite(user.id, productId);
    favoritedSet.delete(productId);
    showToast('已取消收藏');
    // 刷新弹窗列表
    openFavorites();
    // 同步首页星星（如果商品还在渲染中）
    const starBtn = document.querySelector(`.product-card[data-id="${productId}"] .wishlist-btn`);
    if (starBtn) { starBtn.classList.remove('faved'); starBtn.textContent = '☆'; }
  } catch (e) {
    showToast('操作失败：' + e.message);
  }
}

/* =========================================================
   🆕 浏览历史系统（👣 localStorage 纯前端）
   - 每次 openDetail 自动记录（商品预览信息扁平化存储）
   - 同一商品再次查看 → 顶置（去重）
   - 上限 20 条
   - 弹窗支持：查看 / 加购 / 去详情 / 单条删除 / 全部清空
   localStorage key: "shop_browse_history"
   ========================================================= */
const _BROWSE_KEY = 'shop_browse_history';
const _BROWSE_MAX = 20;

/* ---------- CRUD ---------- */
function getBrowseHistory() {
  try { return JSON.parse(localStorage.getItem(_BROWSE_KEY) || '[]'); }
  catch { return []; }
}
function addBrowseHistory(preview) {
  if (!preview || !preview.id) return;
  let list = getBrowseHistory().filter(x => x.id !== preview.id); // 同商品去重
  list.unshift(preview);
  list = list.slice(0, _BROWSE_MAX);
  localStorage.setItem(_BROWSE_KEY, JSON.stringify(list));
}
function removeBrowseHistory(productId) {
  localStorage.setItem(_BROWSE_KEY, JSON.stringify(
    getBrowseHistory().filter(x => x.id !== productId)
  ));
}
function clearBrowseHistory() { localStorage.removeItem(_BROWSE_KEY); }

/* ---------- 友好时间格式化 ---------- */
function browseTimeAgo(ts) {
  if (!ts) return '';
  const now = Date.now();
  const diff = now - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

/* ---------- 🆕 打开浏览历史弹窗 ---------- */
function openBrowseHistory() {
  const list = getBrowseHistory();
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('browseHistoryModal').classList.add('active');
  document.getElementById('browseCount').textContent = list.length ? `· 共 ${list.length} 件` : '';

  const listEl = document.getElementById('browseHistoryList');

  if (!list.length) {
    listEl.innerHTML = `
      <div class="browse-empty">
        <div class="browse-empty-icon">👣</div>
        <div class="browse-empty-text">还没有浏览足迹呢</div>
        <div class="browse-empty-hint">逛逛首页，点开商品详情就会出现在这里~</div>
        <button class="browse-empty-btn" onclick="closeModal('browseHistoryModal');document.getElementById('products').scrollIntoView({behavior:'smooth'});">
          🛍 去逛逛
        </button>
      </div>`;
    // 隐藏清空按钮
    const clearBtn = document.getElementById('browseClear');
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  // 渲染浏览历史卡片（复用 fav-item 结构但加时间、单删按钮）
  listEl.innerHTML = list.map(p => `
    <div class="browse-item">
      <div class="browse-img" style="background:${p.bg}" onclick="closeModal('browseHistoryModal');openDetail(${p.id})">
        ${p.emoji || '📦'}
        ${p.tag ? `<span class="product-tag ${p.tag}" style="top:6px;left:6px;font-size:11px;padding:2px 6px;">${p.tagText || p.tag}</span>` : ''}
      </div>
      <div class="browse-info">
        <div class="browse-name" onclick="closeModal('browseHistoryModal');openDetail(${p.id})">${p.name}</div>
        <div class="browse-meta">
          <span>🕐 ${browseTimeAgo(p.viewedAt)}</span>
          <span>💬 ${p.reviewCount || 0} 评价</span>
          ${p.stock <= 0 ? '<span style="color:#ff4d4f;">⚠ 已下架</span>' :
            p.stock < 10 ? `<span style="color:#faad14;">⚠ 仅剩 ${p.stock} 件</span>` : ''}
        </div>
        <div class="browse-bottom">
          <div class="browse-price-group">
            <span class="browse-price-now">¥${p.price.toLocaleString()}</span>
            ${p.oldPrice ? `<span class="browse-price-old">¥${p.oldPrice.toLocaleString()}</span>` : ''}
          </div>
          <div class="browse-actions">
            <button class="browse-detail"   title="再看一次" onclick="closeModal('browseHistoryModal');openDetail(${p.id})">👁 查看</button>
            <button class="browse-add-cart" title="加购"    onclick="closeModal('browseHistoryModal');addToCart(${p.id})">🛒 加购</button>
            <button class="browse-remove"  title="从足迹移除" onclick="removeFromBrowse(${p.id}, this)">✕</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // 显示清空按钮
  const clearBtn = document.getElementById('browseClear');
  if (clearBtn) clearBtn.style.display = 'inline-flex';
}

/* ---------- 浏览历史弹窗：单条删除 / 全部清空 ---------- */
function removeFromBrowse(productId) {
  removeBrowseHistory(productId);
  showToast('已从足迹移除');
  openBrowseHistory(); // 刷新弹窗
}
function clearAllBrowse() {
  const list = getBrowseHistory();
  if (!list.length) return;
  showConfirm(`确定要清空全部浏览足迹吗？\n（共 ${list.length} 件）`, () => {
    clearBrowseHistory();
    showToast('已清空浏览足迹');
    openBrowseHistory();
  }, '全部清空', '再想想');
}
