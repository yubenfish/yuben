package com.shop.demo.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 🆕 JWT 用户认证拦截器
 * 拦截范围：所有 /api/** 路径（除已排除的 login/register/public）
 *
 * 作用：
 *   1. 从 Authorization: Bearer <token> 提取 token
 *   2. 解析校验 → 有效则把 userId/role 放进 request.setAttribute()
 *   3. 无效 → 401 JSON 返回
 *
 * 🆕 同时兼容管理端：如果请求带了有效的 X-Admin-Key，直接放行
 *    （管理端的 adminFetch() 自动加 admin key，不走 JWT）
 */
@Component
public class JwtAuthInterceptor implements HandlerInterceptor {

    @Autowired
    private JWTTool jwt;

    @Value("${shop.admin.key:admin123}")
    private String adminKey;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        // 🆕 如果管理端带了有效的 X-Admin-Key → 直接放行
        // （AdminAuthInterceptor 已经校验过，但它只拦 /api/admin/**；
        //   /api/user/list、/api/orders 这些管理端也会调，JWT 拦截器先看到 admin key 就跳过）
        String key = request.getHeader("X-Admin-Key");
        if (key != null && adminKey.equals(key)) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        String token = jwt.extract(authHeader);

        if (token == null) {
            writeErr(response, 401, "未登录：缺少 Authorization: Bearer <token>");
            return false;
        }

        Claims claims = jwt.parse(token);
        if (claims == null) {
            writeErr(response, 401, "登录已过期或 Token 无效，请重新登录");
            return false;
        }

        // 挂到 request 上，Controller/Service 用 ((Long) request.getAttribute("currentUserId")) 取
        Long userId = Long.parseLong(claims.getSubject());
        String role = claims.get("role", String.class);
        request.setAttribute("currentUserId", userId);
        request.setAttribute("currentUserRole", role == null ? "USER" : role);
        return true;
    }

    private void writeErr(HttpServletResponse response, int code, String msg) throws Exception {
        response.setStatus(code);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":" + code + ",\"message\":\"" + msg.replace("\"", "\\\"") + "\",\"data\":null}");
    }
}
