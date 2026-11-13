/* =========================================================
   js/admin.js  —  后台管理：商品 CRUD + 订单状态流转
   管理员入口：按 Ctrl+Shift+B 呼出（演示用）
   ========================================================= */

/* ---------- 打开后台 ---------- */
function openAdmin() {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('adminModal').classList.add('active');
  loadAdminProducts();
}
function closeAdmin() { closeModal('adminModal'); }

/* ---------- Tab 切换 ---------- */
function bindAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const t = tab.dataset.tab;
      document.getElementById('adminProducts').style.display = t === 'products' ? '' : 'none';
      document.getElementById('adminOrders').style.display = t === 'orders' ? '' : 'none';
      document.getElementById('adminReviews').style.display = t === 'reviews' ? '' : 'none';
      if (t === 'orders') loadAdminOrders();
      if (t === 'reviews') loadAdminReviews();
    });
  });
}

/* ---------- 商品管理 ---------- */
async function loadAdminProducts() {
  try {
    const list = await fetchProducts();
    const el = document.getElementById('adminProducts');
    el.innerHTML = `
      <div class="admin-toolbar">
        <button class="admin-add-btn" onclick="showProductForm()">+ 新增商品</button>
        <input type="text" placeholder="搜索商品..." id="adminSearch" oninput="filterAdminProducts()" />
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>ID</th><th>图标</th><th>商品名</th><th>分类</th>
            <th>价格</th><th>库存</th><th>销量</th><th>操作</th>
          </tr></thead>
          <tbody>${list.map(p => `
            <tr>
              <td>${p.id}</td>
              <td style="font-size:24px;">${p.emoji || '📦'}</td>
              <td class="admin-name">${p.name}</td>
              <td>${p.cat || '-'}</td>
              <td><b>¥${p.price}</b></td>
              <td>${p.stock ?? 999}</td>
              <td>${p.sales || 0}</td>
              <td>
                <button class="admin-btn edit" onclick='showProductForm(${JSON.stringify(p).replace(/'/g, "&apos;")})'>编辑</button>
                <button class="admin-btn del" onclick="deleteAdminProduct(${p.id})">删除</button>
              </td>
            </tr>`).join('')}
        </tbody></table>
      </div>
    `;
  } catch (e) { document.getElementById('adminProducts').innerHTML = `<p style="color:red;">加载失败</p>`; }
}

function filterAdminProducts() {
  const q = document.getElementById('adminSearch').value.toLowerCase();
  document.querySelectorAll('#adminProducts tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function showProductForm(product) {
  const p = product || {};
  const isNew = !p.id;
  const fields = [
    {k:'name', label:'商品名', val:p.name||''},
    {k:'price', label:'价格', val:p.price||''},
    {k:'oldPrice', label:'原价', val:p.oldPrice||''},
    {k:'emoji', label:'图标 Emoji', val:p.emoji||'📦'},
    {k:'bg', label:'背景渐变', val:p.bg||'linear-gradient(135deg,#e6f4ff,#bae0ff)'},
    {k:'cat', label:'分类', val:p.cat||'digital'},
    {k:'tag', label:'角标类型 (hot/new/discount)', val:p.tag||''},
    {k:'tagText', label:'角标文字', val:p.tagText||''},
    {k:'stock', label:'库存', val:p.stock??999},
    {k:'description', label:'商品描述', val:p.description||'', textarea:true},
  ];
  const form = `
    <div class="admin-form">
      <h4>${isNew ? '新增' : '编辑'}商品</h4>
      ${fields.map(f => f.textarea
        ? `<div class="form-row"><label>${f.label}</label><textarea id="f_${f.k}" rows="3">${f.val}</textarea></div>`
        : `<div class="form-row"><label>${f.label}</label><input id="f_${f.k}" value="${f.val}"></div>`
      ).join('')}
      <div class="form-actions">
        <button onclick="closeAdmin()">取消</button>
        <button class="primary" onclick="saveProduct(${p.id || 0})">保存</button>
      </div>
    </div>
  `;
  document.getElementById('adminProducts').innerHTML = form;
}

async function saveProduct(id) {
  const get = k => document.getElementById('f_' + k).value.trim();
  const data = {
    name: get('name'), price: Number(get('price')),
    oldPrice: Number(get('oldPrice')) || null,
    emoji: get('emoji'), bg: get('bg'), cat: get('cat'),
    tag: get('tag'), tagText: get('tagText'),
    stock: Number(get('stock')) || 999,
    description: get('description'),
  };
  try {
    if (id) await updateProduct(id, data); else await createProduct(data);
    showToast(id ? '更新成功' : '新增成功');
    loadAdminProducts();
  } catch (e) { showToast('保存失败：' + e.message); }
}

async function deleteAdminProduct(id) {
  if (!confirm('确定删除商品 #' + id + '?')) return;
  try { await deleteProduct(id); showToast('已删除'); loadAdminProducts(); }
  catch (e) { showToast(e.message); }
}

/* ---------- 订单管理（状态流转） ---------- */
async function loadAdminOrders() {
  try {
    const resp = await fetchOrders();
    const list = resp.data?.orders || [];
    const el = document.getElementById('adminOrders');
    el.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>订单号</th><th>用户</th><th>金额</th>
            <th>状态</th><th>下单时间</th><th>操作</th>
          </tr></thead>
          <tbody>${list.map(o => `
            <tr>
              <td style="font-family:monospace;font-size:12px;">${o.orderNo}</td>
              <td>#${o.userId || '-'}</td>
              <td><b>¥${o.total}</b></td>
              <td><span class="admin-status ${o.status}">${statusText(o.status)}</span></td>
              <td style="font-size:12px;">${(o.createdAt||'').replace('T',' ').substring(0,16)}</td>
              <td>${adminOrderActions(o)}</td>
            </tr>`).join('')}
        </tbody></table>
      </div>
    `;
  } catch (e) { document.getElementById('adminOrders').innerHTML = `<p style="color:red;">加载失败</p>`; }
}

function statusText(s) {
  return { PAID:'已支付', SHIPPED:'已发货', DONE:'已完成', CANCELLED:'已取消' }[s] || s;
}
function adminOrderActions(o) {
  const no = o.orderNo;
  if (o.status === 'PAID')
    return `<button class="admin-btn ship" onclick="shipOrder('${no}')">发货</button>`;
  if (o.status === 'SHIPPED')
    return `<button class="admin-btn done" onclick="doneOrder('${no}')">确认收货</button>`;
  if (o.status === 'DONE')
    return `<span style="color:#52c41a;font-size:12px;">✓ 交易完成</span>`;
  return `<span style="color:#999;font-size:12px;">已取消</span>`;
}

async function shipOrder(orderNo) {
  const tracking = prompt('请输入物流单号（可选）：');
  try {
    const body = tracking ? { trackingNo: tracking } : {};
    await httpPut(`/api/orders/${orderNo}/ship`, body);
    showToast('发货成功'); loadAdminOrders();
  } catch (e) { showToast(e.message); }
}
async function doneOrder(orderNo) {
  try { await httpPut(`/api/orders/${orderNo}/done`); showToast('已完成'); loadAdminOrders(); }
  catch (e) { showToast(e.message); }
}
async function cancelOrder(orderNo) {
  if (!confirm('确定取消订单?')) return;
  try { await httpPut(`/api/orders/${orderNo}/cancel`); showToast('已取消'); loadAdminOrders(); }
  catch (e) { showToast(e.message); }
}

/* ---------- 快捷键：Ctrl+Shift+B 呼出后台 ---------- */
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
    e.preventDefault();
    openAdmin();
  }
});

/* ---------- 🆕 评论管理 ---------- */
let _reviewPage = 0, _reviewSize = 10, _reviewProductId = null;

async function loadAdminReviews() {
  const el = document.getElementById('adminReviews');
  el.innerHTML = `<div class="admin-loading">加载评论中...</div>`;
  try {
    const page = await fetchAdminReviews(_reviewPage, _reviewSize, _reviewProductId);
    renderAdminReviews(page);
  } catch (e) {
    el.innerHTML = `<div class="admin-empty">加载失败：${e.message}</div>`;
  }
}

function renderAdminReviews(page) {
  const el = document.getElementById('adminReviews');
  const items = page.content || [];
  if (items.length === 0) {
    el.innerHTML = `<div class="admin-empty">暂无评论 📭</div>`;
    return;
  }
  el.innerHTML = `
    <div class="admin-toolbar">
      <select id="reviewFilter" onchange="_reviewProductId=this.value||null;_reviewPage=0;loadAdminReviews()" style="padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;">
        <option value="">全部商品</option>
      </select>
      <span style="font-size:12px;color:#6b7280;margin-left:auto;">共 ${page.totalElements} 条 · 第 ${page.number+1}/${page.totalPages} 页</span>
    </div>
    <div class="admin-review-list">
      ${items.map(r => `
        <div class="admin-review-item">
          <div class="admin-review-head">
            <span class="admin-review-name">${escapeHtml(r.nickname || '匿名')}</span>
            <span class="admin-review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
            <span class="admin-review-pid">商品 #${r.productId}</span>
            <span class="admin-review-time">${formatRevTime(r.createdAt)}</span>
            <button class="admin-btn del" onclick="deleteAdminReview(${r.id})">删除</button>
          </div>
          <div class="admin-review-content">${escapeHtml(r.content || '(无内容)')}</div>
        </div>
      `).join('')}
    </div>
    <div class="admin-pager">
      <button ${page.number === 0 ? 'disabled' : ''} onclick="_reviewPage--;loadAdminReviews()">上一页</button>
      <button ${page.number >= page.totalPages - 1 ? 'disabled' : ''} onclick="_reviewPage++;loadAdminReviews()">下一页</button>
    </div>
  `;
}

async function deleteAdminReview(reviewId) {
  if (!confirm('确定删除这条评论？删除后商品评分会自动重新计算。')) return;
  try {
    await adminDeleteReview(reviewId);
    showToast('评论已删除');
    loadAdminReviews();
  } catch (e) {
    showToast('删除失败：' + e.message);
  }
}

function formatRevTime(t) {
  if (!t) return '';
  const d = new Date(t);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function escapeHtml(s) {
  return String(s).replace(/[<>&"'`]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;' })[c]);
}

/* ---------- 绑定 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  bindAdminTabs();
  document.getElementById('adminBtn')?.addEventListener('click', openAdmin);
});
