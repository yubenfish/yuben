/* =========================================================
   js/api/reviewApi.js  —  评论 API 封装
   ✅ 修正：用 config.js 导出的全局 API_BASE（不是 window.API_BASE）
   ========================================================= */

/** 商品评论列表 */
async function fetchReviewsByProduct(productId, page = 0, size = 10) {
  const url = `${API_BASE}/api/review?productId=${productId}&page=${page}&size=${size}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}

/** 发表评论 */
async function submitReview({ productId, userId, nickname, rating, content }) {
  const res = await fetch(`${API_BASE}/api/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, userId, nickname, rating, content })
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}

/** 检查是否已评价 */
async function checkHasReviewed(productId, userId) {
  if (!userId) return false;
  const res = await fetch(`${API_BASE}/api/review/check?productId=${productId}&userId=${userId}`);
  const json = await res.json();
  return json.data?.hasReviewed || false;
}

/* ========== 管理员端 ========== */

/** 管理员：分页查询全部评论（可按商品筛选） */
async function fetchAdminReviews(page = 0, size = 10, productId = null) {
  let url = `${API_BASE}/api/admin/review?page=${page}&size=${size}`;
  if (productId) url += `&productId=${productId}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}

/** 管理员：删除评论（无 userId 限制） */
async function adminDeleteReview(reviewId) {
  const res = await fetch(`${API_BASE}/api/admin/review/${reviewId}`, { method: 'DELETE' });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return true;
}

/* ========== 🆕 评论增强：点赞 + 管理员回复 ========== */

/** 点赞 / 取消点赞（toggle） */
async function toggleReviewLike(reviewId, userId) {
  const res = await fetch(`${API_BASE}/api/review/${reviewId}/like?userId=${userId}`, {
    method: 'POST'
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data; // 返回更新后的 Review（含 likeCount, likedBy）
}

/** 管理员：回复评论 */
async function adminReplyReview(reviewId, content, repliedBy) {
  const res = await fetch(`${API_BASE}/api/admin/review/${reviewId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, repliedBy })
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}
