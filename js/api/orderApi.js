/* =========================================================
   js/api/orderApi.js  —  订单接口（全局函数）
   🆕 fetchOrders 支持 page/size 参数，默认 size=100（拉全量给原生前台）
   ========================================================= */

/** 下单：POST /api/orders  body: { shipping, remark, userId } */
async function checkout(shipping, remark, userId) {
    const resp = await httpPost('/api/orders', { shipping, remark, userId });
    if (resp.code !== 0) throw new Error(resp.message);
    return resp;
}

/**
 * 🆕 订单列表（原生前台不分页，默认 size=100 拉全量）
 * @param {object} params  { status, page, size }
 */
async function fetchOrders(params = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    qs.set('page', params.page || 1);
    qs.set('size', params.size || 100);  // 🆕 原生前台默认拉 100 条
    const resp = await httpGet(`/api/orders?${qs.toString()}`);
    if (resp.code !== 0) throw new Error(resp.message);
    return resp;
}

/** 订单详情 by orderNo */
async function fetchOrderDetail(orderNo) {
    const resp = await httpGet(`/api/orders/${orderNo}`);
    if (resp.code !== 0) throw new Error(resp.message);
    return resp;
}
