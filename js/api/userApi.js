/* =========================================================
   js/api/userApi.js  —  用户接口 API
   ⚠️ saveUser / getUser / logout 已迁移到 config.js（含 JWT token 管理），
      这里不再重复定义 —— 两份同名函数会互相覆盖！
   ========================================================= */

/** 注册 → 返回 { code:0, data:{ user, accessToken } } */
async function register(username, password, nickname) {
    const resp = await httpPost('/api/user/register', { username, password, nickname });
    if (resp.code !== 0) throw new Error(resp.message);
    return resp;
}

/** 登录 → 返回 { code:0, data:{ user, accessToken } } */
async function login(username, password) {
    const resp = await httpPost('/api/user/login', { username, password });
    if (resp.code !== 0) throw new Error(resp.message);
    return resp;
}

/** 🆕 检查账号是否已被占用（注册页实时校验） */
async function checkUsername(username) {
    const resp = await httpGet('/api/user/check-username?username=' + encodeURIComponent(username));
    return resp.data;
}

/** 🆕 后端退出（前端先清 localStorage，再调用后端留扩展） */
async function serverLogout() {
    try { await httpPost('/api/user/logout'); } catch {}
    window.logout?.();
}

/** 🆕 更新个人资料 */
async function updateProfile(userId, data) {
    return await httpPut('/api/user/' + userId + '/profile', data);
}

// ========== 挂载到 window ==========
window.register = register;
window.login = login;
window.checkUsername = checkUsername;
window.serverLogout = serverLogout;
window.updateProfile = updateProfile;
