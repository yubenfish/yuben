/* =========================================================
   js/api/favoriteApi.js  —  🆕 收藏 API（全局函数）
   ========================================================= */

/** 加入收藏 */
async function addFavorite(userId, productId) {
  const resp = await httpPost('/api/favorite', { userId, productId });
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}

/** 取消收藏 */
async function removeFavorite(userId, productId) {
  const resp = await httpDelete(`/api/favorite?userId=${userId}&productId=${productId}`);
  if (resp.code !== 0) throw new Error(resp.message);
}

/** 检查是否已收藏 */
async function checkFavorite(userId, productId) {
  const resp = await httpGet(`/api/favorite/check?userId=${userId}&productId=${productId}`);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data?.favorited || false;
}

/** 我的收藏列表 */
async function fetchMyFavorites(userId) {
  const resp = await httpGet(`/api/favorite?userId=${userId}&size=100`);
  if (resp.code !== 0) throw new Error(resp.message);
  const d = resp.data;
  return Array.isArray(d) ? d : (d.items || []);
}
