/* =========================================================
   js/detail.js  —  商品详情模态框（含评论区）
   ========================================================= */

async function openDetail(id) {
  let product;
  try {
    product = await fetchProductById(id);
  } catch (e) {
    product = (window._MOCK_PRODUCTS || []).find(p => p.id === id);
  }
  if (!product) { showToast('商品不存在'); return; }

  // 🆕 自动记录浏览足迹（纯前端 localStorage，商品预览信息扁平化存储）
  addBrowseHistory({
    id: product.id, name: product.name, price: product.price,
    oldPrice: product.oldPrice, emoji: product.emoji, bg: product.bg,
    cat: product.cat, tag: product.tag, tagText: product.tagText,
    stock: product.stock, reviewCount: product.reviewCount, rating: product.rating,
    viewedAt: Date.now()
  });

  document.getElementById('detailTitle').textContent = product.name;
  document.getElementById('detailBody').innerHTML = detailHTML(product);

  // 先打开弹层（让 DOM 可见），再异步加载评论区，避免 null 问题
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('detailModal').classList.add('active');

  // 下一帧再加载评论 —— 确保 getElementById 一定能找到容器
  requestAnimationFrame(() => loadReviews(id));
}

function detailHTML(p) {
  const desc = p.description || '精选优质商品，品质保证，正品保障，7天无理由退换。更多商品详情请咨询客服。';
  const favorited = favoritedSet?.has(p.id) ?? false;
  return `
  <div class="detail-grid">
    <div class="detail-img" style="background:${p.bg}">
      <div class="detail-img-emoji">${p.emoji || '📦'}</div>
      ${p.tag ? `<span class="product-tag ${p.tag}" style="position:absolute;top:12px;left:12px;">${p.tagText || p.tag}</span>` : ''}
      <!-- 🆕 详情页收藏按钮 -->
      <button class="detail-fav-btn ${favorited ? 'faved' : ''}"
              title="${favorited ? '已收藏 · 点一下取消' : '加入收藏（需要登录）'}"
              onclick="event.stopPropagation();toggleDetailFavorite(${p.id}, this)">
        ${favorited ? '★' : '☆'}
      </button>
    </div>
    <div class="detail-info">
      <h2 class="detail-name">${p.name}</h2>
      <div class="detail-rating">
        <span class="stars">${starsHTML(p.rating)}</span>
        <span class="detail-rating-score">${(p.rating || 0).toFixed(1)}</span>
        <span class="detail-rating-count">（${p.reviewCount || 0} 条评价）</span>
        <span class="detail-stock">库存：${p.stock ?? 999} · 已售 ${p.sales || 0}</span>
      </div>
      <div class="detail-price-row">
        <span class="detail-price"><small>¥</small>${p.price.toLocaleString()}</span>
        ${p.oldPrice ? `<span class="detail-old-price">¥${p.oldPrice.toLocaleString()}</span>` : ''}
        ${p.oldPrice ? `<span class="detail-discount">省 ¥${(p.oldPrice - p.price).toLocaleString()}</span>` : ''}
      </div>
      <div class="detail-specs">
        <div class="spec-row"><span class="spec-label">分类</span><span>${catName(p.cat)}</span></div>
        <div class="spec-row"><span class="spec-label">编号</span><span>NO.${String(p.id).padStart(5,'0')}</span></div>
        <div class="spec-row"><span class="spec-label">保障</span><span>✓ 正品保证 · ✓ 7天退换 · ✓ 包邮</span></div>
      </div>
      <div class="detail-desc">${desc}</div>
      <!-- 🆕 两个按钮独立动作：加购不关弹窗 → 可继续收藏/评论 -->
      <div class="detail-actions">
        <button class="add-cart-btn-lg" onclick="addToCartWithFeedback(${p.id})">🛒 加入购物车</button>
        <button class="buy-now-btn" onclick="addToCartWithFeedback(${p.id}); setTimeout(() => { closeModal('detailModal'); openCheckout(); }, 200)">💳 立即购买</button>
      </div>
    </div>
  </div>

  <!-- ========== 🆕 用户评价区 ========== -->
  <div class="review-section" id="reviewSection">
    <div class="review-header">
      <h4>💬 用户评价</h4>
      <div id="reviewAvg" class="review-avg"></div>
    </div>
    <div id="reviewFormArea" class="review-loading">⏳ 加载中...</div>
    <div id="reviewListArea" class="review-loading">⏳ 加载评论中...</div>
  </div>`;
}

/* ========== 评论区异步加载 ========== */
async function loadReviews(productId) {
  try {
    const formArea = document.getElementById('reviewFormArea');
    const listArea = document.getElementById('reviewListArea');
    if (!formArea || !listArea) {
      console.warn('[Review] 找不到容器元素，跳过渲染');
      return;
    }

    // 1. 渲染提交表单
    const user = JSON.parse(localStorage.getItem('shop_user') || 'null');
    let hasReviewed = false;
    if (user) {
      try { hasReviewed = await checkHasReviewed(productId, user.id); } catch {}
    }

    if (!user) {
      formArea.innerHTML = `<div class="review-login-hint">🔐 登录后可发表评价 <a href="javascript:closeModal('detailModal');document.getElementById('userBtn').click()">立即登录</a></div>`;
    } else if (hasReviewed) {
      formArea.innerHTML = `<div class="review-login-hint">✅ 您已评价过该商品，感谢分享！</div>`;
    } else {
      formArea.innerHTML = reviewFormHTML(user);
      bindReviewSubmit(productId, user);
    }

    // 2. 加载评论列表
    const page = await fetchReviewsByProduct(productId, 0, 10);
    renderReviewList(page, user?.id ?? null);  // 🆕 传 userId 判断点赞状态
  } catch (e) {
    console.error('[Review] loadReviews 异常:', e);
    const listArea = document.getElementById('reviewListArea');
    if (listArea) listArea.innerHTML = `<div class="review-empty">评论加载失败：${e.message}</div>`;
  }
}

function reviewFormHTML(user) {
  const nickname = user.nickname || user.username || '匿名用户';
  return `
  <div class="review-form">
    <div class="review-stars-input">
      <span>我的评分：</span>
      <span class="star-input" data-val="1">★</span>
      <span class="star-input" data-val="2">★</span>
      <span class="star-input" data-val="3">★</span>
      <span class="star-input" data-val="4">★</span>
      <span class="star-input" data-val="5">★</span>
      <span class="star-input-label">点击星星评分</span>
    </div>
    <textarea id="reviewContent" class="review-textarea" maxlength="500" placeholder="说说你的使用感受...（500 字以内）"></textarea>
    <div class="review-form-footer">
      <span class="review-nickname">以 <b>${nickname}</b> 身份评价</span>
      <button id="reviewSubmitBtn" class="review-submit-btn">发表评价</button>
    </div>
  </div>`;
}

function bindReviewSubmit(productId, user) {
  let selectedRating = 0;
  const stars = document.querySelectorAll('.star-input');
  stars.forEach(s => {
    s.addEventListener('click', () => {
      selectedRating = parseInt(s.dataset.val);
      stars.forEach(x => x.classList.toggle('active', parseInt(x.dataset.val) <= selectedRating));
    });
  });

  document.getElementById('reviewSubmitBtn')?.addEventListener('click', async () => {
    if (selectedRating === 0) { showToast('请先选择评分'); return; }
    const content = document.getElementById('reviewContent')?.value.trim() || '';
    try {
      const nickname = user.nickname || user.username || '匿名用户';
      await submitReview({ productId, userId: user.id, nickname, rating: selectedRating, content });
      showToast('评价成功！');
      // 刷新评论区
      await loadReviews(productId);
    } catch (e) {
      showToast('评价失败：' + e.message);
    }
  });
}

function renderReviewList(page, currentUserId) {
  const listArea = document.getElementById('reviewListArea');
  const avgEl = document.getElementById('reviewAvg');
  if (!listArea) return;

  const items = page.content || [];
  if (items.length === 0) {
    listArea.innerHTML = `<div class="review-empty">还没有评价，快来抢沙发吧 🛋️</div>`;
    if (avgEl) avgEl.innerHTML = '';
    return;
  }

  if (avgEl) avgEl.innerHTML = `<span class="review-count-inline">共 ${page.totalElements ?? items.length} 条评价</span>`;

  listArea.innerHTML = items.map(r => {
    // 🆕 点赞状态
    let likedList = [];
    try { likedList = JSON.parse(r.likedBy || '[]'); } catch {}
    const liked = currentUserId ? likedList.includes(currentUserId) : false;
    const likeCount = r.likeCount ?? likedList.length ?? 0;

    // 🆕 商家回复块
    const replyHTML = r.reply ? `
      <div class="review-reply">
        <div class="review-reply-head">
          <span class="review-reply-badge">🏪 ${escapeHtml(r.repliedBy || '官方客服')}</span>
          ${r.repliedAt ? `<span class="review-reply-time">${formatTime(r.repliedAt)}</span>` : ''}
        </div>
        <div class="review-reply-content">${escapeHtml(r.reply)}</div>
      </div>` : '';

    return `
    <div class="review-item" data-id="${r.id}">
      <div class="review-item-head">
        <span class="review-nickname-badge">${escapeHtml(r.nickname || '匿名')}</span>
        <span class="review-item-stars">${starsHTML(r.rating)}</span>
        <span class="review-item-time">${formatTime(r.createdAt)}</span>
      </div>
      ${r.content ? `<div class="review-item-content">${escapeHtml(r.content)}</div>` : ''}
      ${replyHTML}
      <!-- 🆕 点赞条 -->
      <div class="review-item-actions">
        <button class="review-like ${liked ? 'liked' : ''}"
                data-review-id="${r.id}"
                data-liked="${liked}"
                data-like-count="${likeCount}"
                onclick="toggleReviewLikeUI(${r.id}, this)">
          <span class="review-like-icon">${liked ? '❤️' : '🤍'}</span>
          <span class="review-like-count">${likeCount || ''}</span>
          <span class="review-like-label">${liked ? '已赞' : '赞'}</span>
        </button>
      </div>
    </div>`;
  }).join('');

  // 🆕 绑定点赞按钮事件
  listArea.querySelectorAll('.review-like').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rid = Number(btn.dataset.reviewId);
      const user = window.getUser?.();
      if (!user) { showConfirm('登录后才能点赞哦~\n要不要先登录？', () => openAuth(), '去登录', '再想想'); return; }
      try {
        const updated = await toggleReviewLike(rid, user.id);
        // 前端同步更新 UI（不刷新整个评论区）
        let list = [];
        try { list = JSON.parse(updated.likedBy || '[]'); } catch {}
        const nowLiked = list.includes(user.id);
        const count = updated.likeCount ?? list.length ?? 0;
        btn.classList.toggle('liked', nowLiked);
        btn.querySelector('.review-like-icon').textContent = nowLiked ? '❤️' : '🤍';
        btn.querySelector('.review-like-count').textContent = count || '';
        btn.querySelector('.review-like-label').textContent = nowLiked ? '已赞' : '赞';
      } catch (e) {
        showToast('点赞失败：' + e.message);
      }
    });
  });
}

/* ========== 辅助函数 ========== */
function starsHTML(v) {
  const full = Math.round(v || 0);
  return '★★★★★'.split('').map((s, i) =>
    `<span class="${i < full ? 'star-on' : 'star-off'}">${s}</span>`
  ).join('');
}
function formatTime(t) {
  if (!t) return '';
  const d = new Date(t);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function escapeHtml(s) {
  return String(s).replace(/[<>&"'`]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;' })[c]);
}
function catName(c) {
  return { digital:'数码家电', fashion:'服饰鞋包', food:'生鲜食品',
           home:'家居生活', beauty:'美妆个护', sport:'运动户外',
           book:'图书文娱', baby:'母婴玩具' }[c] || c;
}

/* =========================================================
   🆕 详情页收藏按钮（独立函数，联动首页星星）
   依赖 products.js 的 favoritedSet / addFavorite / removeFavorite
   ========================================================= */
async function toggleDetailFavorite(productId, btn) {
  const user = window.getUser?.();
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
    // 同步首页星星按钮（如果那个商品卡还在渲染）
    const starBtn = document.querySelector(`.product-card[data-id="${productId}"] .wishlist-btn`);
    if (starBtn) {
      const isFav = favoritedSet.has(productId);
      starBtn.classList.toggle('faved', isFav);
      starBtn.textContent = isFav ? '★' : '☆';
    }
  } catch (e) {
    showToast('操作失败：' + e.message);
  }
}

/* =========================================================
   🆕 加购带反馈（调用 cart.js 的 addToCart —— 已内置 bump + Toast）
   封装一层主要是语义清晰 + 方便未来扩展（比如加购成功后弹窗提示）
   ========================================================= */
async function addToCartWithFeedback(productId) {
  try {
    await addToCart(productId);
    // cart.js 的 addToCart 已经会 bumpBadge() + showToast()
  } catch (e) {
    showToast('加购失败：' + e.message);
  }
}
