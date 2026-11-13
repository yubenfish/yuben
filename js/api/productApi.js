/* =========================================================
   js/api/productApi.js  —  商品相关接口（全局函数）
   ========================================================= */

/** 获取商品列表：cat + keyword + 🆕价格区间 组合 — 兼容分页包装 */
async function fetchProducts(cat = 'all', keyword = '', minPrice = null, maxPrice = null) {
  const params = new URLSearchParams();
  if (cat && cat !== 'all') params.set('cat', cat);
  if (keyword) params.set('keyword', keyword);
  if (minPrice != null && minPrice !== '') params.set('minPrice', minPrice);
  if (maxPrice != null && maxPrice !== '') params.set('maxPrice', maxPrice);
  params.set('size', 100);
  const qs = params.toString();
  const resp = await httpGet(`/api/products${qs ? '?' + qs : ''}`);
  if (resp.code !== 0) throw new Error(resp.message);
  const data = resp.data;
  return Array.isArray(data) ? data : (data.items || []);
}

/** 获取单个商品详情 */
async function fetchProductById(id) {
  const resp = await httpGet(`/api/products/${id}`);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}

/** 🆕 后台：新增商品 */
async function createProduct(p) {
  const resp = await httpPost('/api/products', p);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}
/** 🆕 后台：更新商品 */
async function updateProduct(id, p) {
  const resp = await httpPut(`/api/products/${id}`, p);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}
/** 🆕 后台：删除商品 */
async function deleteProduct(id) {
  const resp = await httpDelete(`/api/products/${id}`);
  if (resp.code !== 0) throw new Error(resp.message);
  return resp.data;
}
