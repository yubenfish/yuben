/* =========================================================
   js/main.js  —  应用初始化入口
   启动顺序:
     1. 加载商品（优先后端 API，失败回退本地 Mock）
     2. 拉取购物车（优先后端 API，失败回退 sessionStorage）
     3. 绑定交互
     4. 启动限时抢购倒计时
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. 🆕 先预加载已收藏集合（需要在 renderProducts 之前）
  const user = window.getUser?.();
  if (user) await refreshFavoriteSet(user.id);

  // 2. 渲染商品（异步加载 API）
  await renderProducts();

  // 3. 购物车初始状态
  await updateCartFromApi();

  // 4. 绑定分类筛选
  bindCategoryFilter();

  // 5. 🆕 绑定价格区间筛选
  bindPriceFilter();

  // 6. 绑定搜索框
  bindSearch();

  // 7. 启动倒计时
  startCountdown();

  console.log('🛍️ 万物商城初始化完成');
});

// 🆕 登录/退出时刷新收藏集合（auth.js 调用 saveUser / logout 后触发）
window.refreshFavoritesOnInit = async function() {
  const u = window.getUser?.();
  if (u) {
    await refreshFavoriteSet(u.id);
    await renderProducts(); // 重新渲染星星状态
  } else {
    favoritedSet.clear();
    await renderProducts();
  }
};
