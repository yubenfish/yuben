/* =========================================================
   js/cart.js  —  购物车模块（对接 SpringBoot 后端）
   后端接口:
     GET    /api/cart                查看购物车
     POST   /api/cart/{productId}     添加
     PUT    /api/cart/{productId}?qty 更新数量
     DELETE /api/cart/{productId}     移除
   降级: API 不可用时用内存 + sessionStorage Fallback
   ========================================================= */

const cartBadge   = document.getElementById('cartBadge');
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsEl = document.getElementById('cartItems');
const cartFooterEl = document.getElementById('cartFooter');
const cartTotalEl = document.getElementById('cartTotal');
const toast       = document.getElementById('toast');
const toastMsg    = document.getElementById('toastMsg');
let   toastTimer;

/* ---------- 本地 Fallback 数据 ---------- */
let localCart = loadLocalCart();
function loadLocalCart() {
  try {
    return JSON.parse(sessionStorage.getItem('shop_cart') || '[]');
  } catch { return []; }
}
function saveLocalCart() {
  sessionStorage.setItem('shop_cart', JSON.stringify(localCart));
}

/* ---------- 判断后端是否可用（通过 fetchCart） ---------- */
let backendAvailable = null;  // null=未探测

async function isBackendAlive() {
  if (backendAvailable !== null) return backendAvailable;
  try {
    await fetchCart();
    backendAvailable = true;
  } catch {
    backendAvailable = false;
    console.warn('[Cart] 后端不可用，使用本地购物车');
  }
  return backendAvailable;
}

/* ---------- 加入购物车 ---------- */
async function addToCart(productId) {
  showToast('加入中...');

  // 先从内存商品缓存找快照
  const product = (window._MOCK_PRODUCTS || []).find(p => p.id === productId);

  const alive = await isBackendAlive();
  if (alive) {
    try {
      await addToCartApi(productId);
      await updateCartFromApi();
      showToast('已加入购物车 ✓');
      bumpBadge();
      return;
    } catch (err) {
      console.warn('[Cart] 后端添加失败，回退本地', err);
    }
  }

  // ---------- Fallback: 本地购物车 ----------
  if (!product) { showToast('商品信息缺失'); return; }
  const existing = localCart.find(i => i.productId === productId);
  if (existing) {
    existing.qty++;
  } else {
    localCart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      bg: product.bg,
      qty: 1,
    });
  }
  saveLocalCart();
  updateCartUI();
  showToast('已加入购物车 ✓（本地模式）');
  bumpBadge();
}

/* ---------- 改数量 ---------- */
async function changeQty(productId, delta) {
  const alive = await isBackendAlive();
  if (alive) {
    try {
      const current = localCart.find(i => i.productId === productId);  // 先尝试本地数
      const items = await fetchCart();
      const target = items.items.find(i => i.productId === productId);
      const newQty = (target?.qty || 1) + delta;
      if (newQty <= 0) {
        await removeFromCart(productId);
        return;
      }
      await updateCartQtyApi(productId, newQty);
      await updateCartFromApi();
      return;
    } catch (err) {
      console.warn('[Cart] 后端改数量失败，回退本地', err);
    }
  }

  // Fallback
  const item = localCart.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    localCart = localCart.filter(i => i.productId !== productId);
  }
  saveLocalCart();
  updateCartUI();
}

/* ---------- 移除 ---------- */
async function removeFromCart(productId) {
  const alive = await isBackendAlive();
  if (alive) {
    try {
      await removeFromCartApi(productId);
      await updateCartFromApi();
      return;
    } catch (err) {
      console.warn('[Cart] 后端移除失败，回退本地', err);
    }
  }

  // Fallback
  localCart = localCart.filter(i => i.productId !== productId);
  saveLocalCart();
  updateCartUI();
}

/* ---------- 从后端拉取购物车并渲染 ---------- */
async function updateCartFromApi() {
  try {
    const data = await fetchCart();
    localCart = data.items || [];
    saveLocalCart();
    updateCartUI();
  } catch (err) {
    console.warn('[Cart] 拉取后端购物车失败', err);
    updateCartUI();  // 用本地渲染
  }
}

/* ---------- 渲染购物车 UI（数据源：localCart） ---------- */
function updateCartUI() {
  // 徽标
  const count = localCart.reduce((s, i) => s + i.qty, 0);
  cartBadge.textContent = count;

  // 空态
  if (localCart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>购物车空空如也</p>
        <p style="font-size:13px;margin-top:6px;">快去挑选心仪的商品吧～</p>
      </div>`;
    cartFooterEl.style.display = 'none';
    return;
  }

  // 条目
  cartItemsEl.innerHTML = localCart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img" style="background:${item.bg}">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-bottom">
          <span class="cart-item-price">¥${item.price.toLocaleString()}</span>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${item.productId},-1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/></svg>
            </button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.productId},1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
        </div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.productId})" title="移除">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    </div>
  `).join('');

  // 合计
  cartFooterEl.style.display = 'block';
  const total = localCart.reduce((s, i) => s + i.price * i.qty, 0);
  cartTotalEl.textContent = total.toFixed(2);
}

/* ---------- 徽标跳动 ---------- */
function bumpBadge() {
  cartBadge.classList.add('bump');
  setTimeout(() => cartBadge.classList.remove('bump'), 300);
}

/* ---------- 抽屉开关 ---------- */
function openCart() {
  cartDrawer.classList.add('active');
  cartOverlay.classList.add('active');
  updateCartFromApi();
}
function closeCart() {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
}

/* ---------- 收藏 ---------- */
function toggleWishlist(btn) {
  btn.classList.toggle('active');
}

/* ---------- Toast ---------- */
function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ---------- 绑定抽屉事件 ---------- */
document.getElementById('openCart').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

/* ---------- 去结算 ---------- */
document.getElementById('checkoutBtn').addEventListener('click', () => {
    closeCart();
    if (typeof openCheckout === 'function') {
        openCheckout();
    } else {
        showToast('结算功能加载中...');
    }
});

/* ---------- 给 checkout.js 用的刷新方法 ---------- */
async function refreshCart() {
    await updateCartFromApi();
}
window.refreshCart = refreshCart;
