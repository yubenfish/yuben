/**
 * checkout.js —— 结算 + 下单 + 🆕 优惠券 + 订单列表
 */

/** 🆕 结算弹窗内优惠券状态 */
let _checkoutCoupon = null;   // { code, discount, title, finalTotal, couponId }
let _checkoutRawTotal = 0;    // 购物车原始总额（减券前）

/** 🆕 登录后自动继续结账的 pending 标记 */
let _pendingCheckout = false;
window._resumeCheckoutIfPending = function() {
    if (_pendingCheckout) {
        _pendingCheckout = false;
        setTimeout(openCheckout, 300);   // 等购物车 merge 完再打开
    }
};

/** 打开结算弹窗 —— 🆕 游客态跳登录，登录后自动继续 */
async function openCheckout() {
    // 🔒 下单必须登录（购物车可以加，但结账必须登录）
    if (!window.getUser()) {
        _pendingCheckout = true;
        showToast('请先登录再下单 🛒', 'info', 2000);
        openAuth();
        return;
    }
    const user = window.getUser();
    if (user.phone) document.getElementById('shipPhone').value = user.phone;
    if (user.address) document.getElementById('shipAddress').value = user.address;
    if (user.nickname) document.getElementById('shipNickname').value = user.nickname;
    const cart = await window.fetchCart();
    if (!cart || !cart.items || cart.items.length === 0) {
        showToast('购物车是空的');
        return;
    }
    renderCheckoutItems(cart.items);
    _checkoutRawTotal = cart.total;
    _checkoutCoupon = null;
    document.getElementById('couponCodeInput').value = '';
    document.getElementById('couponResult').innerHTML = '';
    document.getElementById('checkoutTotal').textContent = cart.total.toLocaleString();
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('checkoutModal').classList.add('active');
}

function renderCheckoutItems(items) {
    const el = document.getElementById('checkoutItems');
    el.innerHTML = items.map(i => `
        <div class="checkout-item">
            <div class="checkout-item-emoji">${i.emoji || '📦'}</div>
            <div class="checkout-item-info">
                <div class="name">${i.name}</div>
                <div class="meta">¥${i.price} × ${i.qty}</div>
            </div>
            <div class="checkout-item-price">¥${i.subtotal}</div>
        </div>
    `).join('');
}

/** 🆕 优惠券校验 */
async function applyCouponCheckout() {
    const code = document.getElementById('couponCodeInput').value.trim().toUpperCase();
    const resultEl = document.getElementById('couponResult');
    if (!code) { resultEl.innerHTML = ''; _checkoutCoupon = null; updateCheckoutTotal(); return; }
    try {
        const r = await httpGet(`/api/coupon/validate?code=${encodeURIComponent(code)}&total=${_checkoutRawTotal}`);
        if (r.code === 0 && r.data && r.data.valid) {
            _checkoutCoupon = r.data;
            resultEl.innerHTML = `
                <div class="coupon-ok">
                    ✅ <b>${r.data.title || code}</b> 已生效 · 立减 <b>¥${r.data.discount}</b>
                    <button onclick="clearCouponCheckout()" class="coupon-clear">取消</button>
                </div>`;
            showToast(`🎟️ 立减 ¥${r.data.discount}！`);
        } else {
            resultEl.innerHTML = `<div class="coupon-err">${r.message || '券码无效'}</div>`;
            _checkoutCoupon = null;
        }
    } catch (e) {
        resultEl.innerHTML = `<div class="coupon-err">${e.message || '校验失败'}</div>`;
        _checkoutCoupon = null;
    }
    updateCheckoutTotal();
}

/** 🆕 取消优惠券 */
function clearCouponCheckout() {
    _checkoutCoupon = null;
    document.getElementById('couponCodeInput').value = '';
    document.getElementById('couponResult').innerHTML = '';
    updateCheckoutTotal();
}

/** 🆕 刷新合计显示（考虑优惠券） */
function updateCheckoutTotal() {
    const final = _checkoutCoupon ? _checkoutCoupon.finalTotal : _checkoutRawTotal;
    const el = document.getElementById('checkoutTotal');
    el.textContent = final.toLocaleString();
    // 如果减了，在原始价位置划一条虚线
    const row = document.querySelector('.checkout-total-row');
    if (_checkoutCoupon) {
        row.innerHTML = `
            <span>合计</span>
            <span>
                <span style="text-decoration:line-through;color:#999;font-size:13px;margin-right:8px;">¥${_checkoutRawTotal.toLocaleString()}</span>
                <span class="checkout-total-price">¥<span id="checkoutTotal">${final.toLocaleString()}</span></span>
                <span style="color:#f43f5e;font-size:12px;font-weight:600;margin-left:6px;">-¥${_checkoutCoupon.discount}</span>
            </span>`;
    } else {
        row.innerHTML = `
            <span>合计</span>
            <span class="checkout-total-price">¥<span id="checkoutTotal">${final.toLocaleString()}</span></span>`;
    }
}

/** 提交订单 —— 🆕 带 couponCode */
async function handlePlaceOrder() {
    const shipping = document.getElementById('shipNickname').value.trim() +
                    ' ' + document.getElementById('shipAddress').value.trim() +
                    ' ' + document.getElementById('shipPhone').value.trim();
    const remark = document.getElementById('shipRemark').value.trim();
    const user = window.getUser();

    if (!shipping.trim()) { showToast('请填写收货信息'); return; }

    const btn = document.getElementById('placeOrderBtn');
    btn.textContent = '提交中...';
    btn.disabled = true;

    try {
        const body = { shipping, remark, userId: user ? user.id : null };
        if (_checkoutCoupon) body.couponCode = _checkoutCoupon.code;

        const resp = await window.httpPost('/api/orders', body);

        if (resp.code === 0) {
            closeModal('checkoutModal');
            const order = resp.data.order;
            document.getElementById('successOrderNo').textContent = order.orderNo;
            document.getElementById('successOrderTotal').textContent = order.total.toLocaleString();
            // 🆕 成功弹窗附加优惠信息
            const extra = document.getElementById('successCouponInfo');
            if (extra) extra.remove();
            if (order.couponDiscount && order.couponDiscount > 0) {
                const div = document.createElement('div');
                div.id = 'successCouponInfo';
                div.style.cssText = 'margin-top:6px;color:#f43f5e;font-size:13px;font-weight:600;';
                div.textContent = `🎟️ 已使用 ${order.couponCode} · 优惠 ¥${order.couponDiscount}`;
                document.getElementById('successOrderTotal').parentElement.appendChild(div);
            }
            document.getElementById('modalOverlay').classList.add('active');
            document.getElementById('successModal').classList.add('active');
            _checkoutCoupon = null;
            await refreshCart();
        } else {
            showToast(resp.message || '下单失败');
        }
    } catch (e) {
        showToast('下单失败：' + e.message);
    } finally {
        btn.textContent = '🎯 立即下单';
        btn.disabled = false;
    }
}

/** 订单列表弹窗 —— 🆕 展示原价/券后/已用券 */
async function openOrderList() {
    const user = window.getUser();
    if (!user) { openAuth(); return; }
    try {
        const resp = await window.fetchOrders();
        const list = resp.data?.orders || [];
        const el = document.getElementById('orderList');
        if (list.length === 0) {
            el.innerHTML = `<div style="text-align:center;padding:40px;color:#999;">
                <div style="font-size:40px;">📭</div>
                <p style="margin-top:10px;">还没有订单</p>
            </div>`;
        } else {
            el.innerHTML = list.map(o => {
                const hasCoupon = o.couponDiscount && o.couponDiscount > 0;
                return `
                <div class="order-card">
                    <div class="order-card-header">
                        <span class="order-no">${o.orderNo}</span>
                        <span class="order-status ${o.status}">${statusText(o.status)}</span>
                    </div>
                    <div class="order-total">
                        <span>下单时间：${formatTime(o.createdAt)}</span>
                        <span class="price">
                            ${hasCoupon ? `<span style="text-decoration:line-through;color:#999;font-size:12px;margin-right:6px;">¥${(o.originalTotal ?? o.total).toLocaleString()}</span>` : ''}
                            ¥${o.total.toLocaleString()}
                        </span>
                    </div>
                    ${hasCoupon ? `<div style="color:#f43f5e;font-size:12px;margin-top:4px;">🎟️ 使用 ${o.couponCode} · 优惠 ¥${o.couponDiscount}</div>` : ''}
                </div>`;
            }).join('');
        }
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById('orderListModal').classList.add('active');
    } catch (e) {
        showToast('加载订单失败');
    }
}

function statusText(s) {
    return { PAID: '已支付', SHIPPED: '已发货', DONE: '已完成', CANCELLED: '已取消' }[s] || s;
}
function formatTime(t) {
    if (!t) return '';
    return t.replace('T', ' ').substring(0, 16);
}

// ========== 绑定 ==========
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('placeOrderBtn').addEventListener('click', handlePlaceOrder);
    document.getElementById('successOK').addEventListener('click', () => closeModal('successModal'));
    // 优惠券输入框回车直接验证
    const cp = document.getElementById('couponCodeInput');
    if (cp) cp.addEventListener('keydown', e => { if (e.key === 'Enter') applyCouponCheckout(); });
});
