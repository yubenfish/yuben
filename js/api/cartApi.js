/* =========================================================
   js/api/cartApi.js  —  购物车相关接口
   🆕 认证全自动：request() 自动注入 Authorization + X-Guest-Id header
      后端根据 header 自动选 userId 还是 guestId 隔离，前端不需要关心
   ========================================================= */

/** 获取购物车 */
async function fetchCart() {
  const resp = await httpGet('/api/cart');
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;  // { items, total, count }
}

/** 添加商品（数量 +1） */
async function addToCartApi(productId) {
  const resp = await httpPost(`/api/cart/${productId}`);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}

/** 更新数量 */
async function updateCartQtyApi(productId, qty) {
  const resp = await httpPut(`/api/cart/${productId}?qty=${qty}`);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}

/** 移除商品 */
async function removeFromCartApi(productId) {
  const resp = await httpDelete(`/api/cart/${productId}`);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}

/** 清空购物车 */
async function clearCartApi() {
  const resp = await httpDelete('/api/cart');
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}
