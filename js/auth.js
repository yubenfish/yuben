/**
 * auth.js —— 登录注册（升级版）
 * ✅ 登录失败 code=404 → 自动切到注册 Tab 并预填用户名
 * ✅ 注册时用户名失焦实时唯一性校验
 * ✅ 退出登录按钮（userBtn 下拉）
 */

let _authTab = 'login';

function openAuth(preselectUsername = '') {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('authModal').classList.add('active');
    document.getElementById('authUsername').value = preselectUsername || '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authNickname').value = '';
    document.getElementById('authHint').textContent = '';
    setAuthTab('login');
}
function closeAuth() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('authModal').classList.remove('active');
}

function setAuthTab(tab) {
    _authTab = tab;
    document.querySelectorAll('.auth-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    const nicknameField = document.getElementById('authNickname');
    const checkHint = document.getElementById('authUsernameCheck');
    if (tab === 'register') {
        nicknameField.style.display = 'block';
        if (checkHint) checkHint.style.display = 'block';
        bindUsernameCheck();
    } else {
        nicknameField.style.display = 'none';
        if (checkHint) checkHint.style.display = 'none';
    }
    document.getElementById('authSubmit').textContent = tab === 'login' ? '登 录' : '注 册';
    document.getElementById('authHint').textContent = '';
}

/** 🆕 登录 —— 失败时根据 code 决定是否跳注册 */
async function handleAuthSubmit() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    if (!username || !password) { showToast('请填写用户名和密码'); return; }

    try {
        let resp;
        if (_authTab === 'register') {
            const nickname = document.getElementById('authNickname').value.trim();
            if (username.length < 3) { showToast('用户名至少 3 位'); return; }
            if (password.length < 6) { showToast('密码至少 6 位'); return; }
            resp = await window.register(username, password, nickname || username);
        } else {
            resp = await window.login(username, password);
        }
        if (resp.code === 0) {
            window.saveUser(resp.data);
            showToast(_authTab === 'register' ? '🎉 注册成功，欢迎加入！' : '✅ 登录成功');
            closeAuth();
            refreshUserUI();
            // 🆕 登录后刷新收藏集合 → 星星实时变对
            window.refreshFavoritesOnInit?.();
            // 🆕 登录后刷新购物车 → 拉取该用户自己的购物车（如果有）
            if (typeof updateCartFromApi === 'function') {
                updateCartFromApi();  // 不 await，后台拉
            }
            // 🆕 登录前 pending 了下单（游客点结算被拦）→ 自动继续结账
            window._resumeCheckoutIfPending?.();
        } else {
            handleAuthError(resp.code, resp.message, username);
        }
    } catch (e) {
        // httpPost 在非 0 code 时会 throw new Error(resp.message)
        const msg = e.message || '网络错误';
        showToast(msg);
    }
}

/** 🆕 统一处理登录/注册错误 —— 智能跳转 */
function handleAuthError(code, message, username) {
    if (_authTab === 'login') {
        if (code === 404 || message.includes('未注册')) {
            // 账号不存在 → 建议注册
            showConfirm('账号 "' + username + '" 还没注册哦，\n要不要现在去注册一个？', () => {
                setAuthTab('register');
                document.getElementById('authNickname').focus();
            }, '去注册', '再想想');
        } else {
            showToast(message); // 密码错
        }
    } else {
        // 注册页
        showToast(message);
    }
}

/** 🆕 用户名失焦时实时唯一性校验 */
let _usernameCheckTimer = null;
function bindUsernameCheck() {
    const input = document.getElementById('authUsername');
    const hint = document.getElementById('authUsernameCheck');
    if (!input || !hint) return;
    if (input.dataset.bound) return;
    input.dataset.bound = '1';

    input.addEventListener('input', () => {
        const v = input.value.trim();
        if (v.length < 3) {
            hint.textContent = ''; hint.className = 'auth-check';
            return;
        }
        clearTimeout(_usernameCheckTimer);
        _usernameCheckTimer = setTimeout(async () => {
            try {
                const r = await window.checkUsername(v);
                if (r.exists) {
                    hint.textContent = '❌ 该账号已被占用';
                    hint.className = 'auth-check bad';
                } else {
                    hint.textContent = '✅ 账号可用';
                    hint.className = 'auth-check good';
                }
            } catch { hint.textContent = ''; hint.className = 'auth-check'; }
        }, 300);
    });
}

// ========== 🆕 退出登录 ==========
function doLogout() {
    showConfirm('确定要退出登录吗？', async () => {
        await window.serverLogout?.();
        window.logout?.();
        showToast('已退出登录');
        refreshUserUI();
        // 🆕 退出后清空收藏集合 → 星星变空心
        window.refreshFavoritesOnInit?.();
        // 🆕 退出后刷新购物车 → 拉取匿名购物车（userId=null），徽章清零
        if (typeof updateCartFromApi === 'function') {
            await updateCartFromApi();
        } else {
            // 如果 cart.js 还没加载，直接清
            if (typeof localCart !== 'undefined') {
                localCart = []; saveLocalCart(); updateCartUI();
            }
        }
    }, '退出', '取消');
}

/** 🆕 已登录用户点击 userBtn → 显示下拉菜单（订单 / 退出） */
function toggleUserMenu() {
    const menu = document.getElementById('userDropdown');
    if (!menu) return;
    menu.classList.toggle('show');
}

function refreshUserUI() {
    const user = window.getUser();
    const btn = document.getElementById('userBtn');
    const nameSpan = document.getElementById('userName');
    const menu = document.getElementById('userDropdown');
    const svg = btn?.querySelector('svg');

    if (user && user.username) {
        // ✅ 只改 userName 这个 span 的文本，别用 btn.textContent（会干掉下拉菜单！）
        if (nameSpan) { nameSpan.textContent = (user.nickname || user.username) + ' ▾'; nameSpan.style.display = 'inline'; }
        if (svg) svg.style.display = 'none'; // 已登录隐藏图标
        if (menu) menu.classList.remove('show'); // 默认隐藏，点击 toggleUserMenu() 才展开
    } else {
        // 未登录状态：只清 span 文本，恢复图标
        if (nameSpan) { nameSpan.textContent = ''; nameSpan.style.display = 'none'; }
        if (svg) svg.style.display = '';
        if (menu) menu.classList.remove('show');
    }
}

// ========== 绑定 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 用户按钮：已登录 → 下拉菜单，未登录 → 打开登录
    document.getElementById('userBtn').addEventListener('click', (e) => {
        const user = window.getUser();
        if (user) {
            toggleUserMenu();
        } else {
            openAuth();
        }
    });

    // Tab 切换
    document.querySelectorAll('.auth-tab').forEach(el => {
        el.addEventListener('click', () => setAuthTab(el.dataset.tab));
    });

    // 提交
    document.getElementById('authSubmit').addEventListener('click', handleAuthSubmit);

    // 遮罩关闭
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        // 别把 userDropdown 也算进 modal
        if (e.target.id === 'modalOverlay') closeAllModals();
    });

    // 所有 modal 关闭按钮
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    refreshUserUI();
});

function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
    checkOverlay();
}
function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    document.getElementById('modalOverlay').classList.remove('active');
}
function checkOverlay() {
    const any = document.querySelector('.modal.active');
    document.getElementById('modalOverlay').classList.toggle('active', !!any);
}

/** 🆕 全局确认对话框（比 showToast 重的操作） */
function showConfirm(message, onOk, okText = '确定', cancelText = '取消') {
    const div = document.createElement('div');
    div.className = 'confirm-overlay';
    div.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-msg">${message.replace(/\n/g, '<br>')}</div>
        <div class="confirm-btns">
          <button class="confirm-cancel">${cancelText}</button>
          <button class="confirm-ok">${okText}</button>
        </div>
      </div>`;
    document.body.appendChild(div);
    const close = () => div.remove();
    div.querySelector('.confirm-cancel').onclick = close;
    div.querySelector('.confirm-ok').onclick = () => { close(); onOk && onOk(); };
}

// ========== 🆕 个人资料面板 ==========

const _AVATAR_EMOJIS = ['👤','👨','👩','👴','👵','🧑','🦊','🐱','🐶','🐼','🐨','🐯','🦁','🐸','🐵','🦄','🐙','🦀','🐳','🦋','🌸','🌻','🍎','🍕','🍔','🎮','🎧','📷','🚀','⭐'];
const _AVATAR_BGS = [
    'linear-gradient(135deg,#ffecd2,#fcb69f)',
    'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
    'linear-gradient(135deg,#ff9a9e,#fecfef)',
    'linear-gradient(135deg,#a8edea,#fed6e3)',
    'linear-gradient(135deg,#ffecd2,#fcb69f)',
    'linear-gradient(135deg,#d4fc79,#96e6a1)',
    'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
    'linear-gradient(135deg,#f6d365,#fda085)',
    'linear-gradient(135deg,#5ee7df,#b490ca)',
    'linear-gradient(135deg,#cfd9df,#e2ebf0)'
];
const _DEFAULT_BG = _AVATAR_BGS[0];

function openProfile() {
    const user = window.getUser();
    if (!user) { openAuth(); return; }
    // 🆕 用 httpGet（config.js 自动带 Bearer token）
    window.httpGet(`/api/user/${user.id}`)
        .then(r => {
            if (r.code === 0) {
                window.saveUser(r.data); // 只存 User 对象（token 不丢）
                // 别覆盖 window.getUser 函数！直接刷新 localStorage 即可
            }
            fillProfileForm(r.data || user);
            showProfileModal();
        }).catch(() => {
            fillProfileForm(user);
            showProfileModal();
        });
}

function showProfileModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('profileModal').classList.add('active');
    document.getElementById('avatarPicker').style.display = 'none';
    setTimeout(bindAvatarPicker, 50);
}

function fillProfileForm(u) {
    // 头像区
    const avatarEl = document.getElementById('profileAvatar');
    avatarEl.textContent = u.avatar || '👤';
    avatarEl.style.background = u.avatarBg || _DEFAULT_BG;
    document.getElementById('profileUsername').textContent = u.nickname || u.username;
    document.getElementById('profileBioPreview').textContent = u.bio || '这个人很懒，还没写签名~';

    // 表单
    document.getElementById('pfNickname').value = u.nickname || '';
    document.getElementById('pfBio').value = u.bio || '';
    document.getElementById('pfUsername').value = u.username || '';
    document.getElementById('pfPhone').value = u.phone || '';
    document.getElementById('pfEmail').value = u.email || '';
    document.getElementById('pfAddress').value = u.address || '';
}

let _pfAvatar = '👤', _pfAvatarBg = _DEFAULT_BG;

function bindAvatarPicker() {
    const avatarEl = document.getElementById('profileAvatar');
    const picker = document.getElementById('avatarPicker');
    if (!avatarEl || avatarEl.dataset.bound) return;
    avatarEl.dataset.bound = '1';

    avatarEl.addEventListener('click', (e) => {
        e.stopPropagation();
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('profileAvatarEdit')?.addEventListener('click', () => {
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    });

    // emoji grid
    const emojiGrid = document.getElementById('avatarEmojiGrid');
    emojiGrid.innerHTML = _AVATAR_EMOJIS.map(e => `<div class="ap-cell" data-avatar="${e}">${e}</div>`).join('');
    emojiGrid.querySelectorAll('.ap-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            _pfAvatar = cell.dataset.avatar;
            avatarEl.textContent = _pfAvatar;
            avatarEl.style.background = _pfAvatarBg;
            document.querySelectorAll('.ap-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
        });
    });

    // bg grid
    const bgGrid = document.getElementById('avatarBgGrid');
    bgGrid.innerHTML = _AVATAR_BGS.map((bg, i) => `<div class="ap-bg-cell" data-bg="${bg}" style="background:${bg}"></div>`).join('');
    bgGrid.querySelectorAll('.ap-bg-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            _pfAvatarBg = cell.dataset.bg;
            avatarEl.style.background = _pfAvatarBg;
            document.querySelectorAll('.ap-bg-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
        });
    });
}

// 保存资料绑定
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('pfSaveBtn');
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
            const user = window.getUser();
            if (!user) return;
            const data = {
                nickname: document.getElementById('pfNickname').value.trim(),
                bio: document.getElementById('pfBio').value.trim(),
                phone: document.getElementById('pfPhone').value.trim(),
                email: document.getElementById('pfEmail').value.trim(),
                address: document.getElementById('pfAddress').value.trim(),
                avatar: _pfAvatar,
                avatarBg: _pfAvatarBg
            };
            // 客户端校验 email
            if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                showToast('邮箱格式不正确'); return;
            }
            if (data.nickname.length > 50) { showToast('昵称太长（最多 50 字）'); return; }
            if (data.bio.length > 100) { showToast('签名太长（最多 100 字）'); return; }

            btn.disabled = true; btn.textContent = '保存中...';
            try {
                const resp = await window.updateProfile(user.id, data);
                // 更新 localStorage
                window.saveUser(resp.data);
                fillProfileForm(resp.data);
                showToast('✅ 个人资料已更新');
                closeModal('profileModal');
                refreshUserUI();
            } catch (e) {
                showToast('保存失败：' + e.message);
            } finally {
                btn.disabled = false; btn.textContent = '💾 保存修改';
            }
        });
    }
});

// 覆盖下拉菜单里的 openAuth(true) 调用
function openAuthForSettings() { openProfile(); }
