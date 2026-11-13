package com.shop.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 🆕 Web MVC 扩展配置 —— 注册 JWT 认证拦截器 + 管理员权限拦截器
 *
 * 拦截顺序（addInterceptor 调用顺序 = 执行顺序）：
 *   1. AdminAuthInterceptor —— 先验 admin key（X-Admin-Key），对 /api/admin/** 放行 admin 专属接口
 *   2. JwtAuthInterceptor   —— 再验 JWT（Authorization: Bearer ...），对 /api/** 通用接口
 *
 * 排除路径（excludePathPatterns）= 公开接口（不需要登录/鉴权）
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired private AdminAuthInterceptor adminAuthInterceptor;
    @Autowired private JwtAuthInterceptor jwtAuthInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        // ===== 1️⃣ Admin 拦截器（X-Admin-Key） =====
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/api/admin/**");

        // ===== 2️⃣ JWT 用户拦截器 =====
        registry.addInterceptor(jwtAuthInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        // ✅ 完全公开（不需要 token）
                        "/api/user/login",
                        "/api/user/register",
                        "/api/user/logout",
                        "/api/user/check-username",
                        "/api/products/**",
                        "/api/coupon/validate",
                        // ✅ 购物车（游客态和登录态都能调，CartController 内部自己解析 JWT）
                        "/api/cart/**",
                        // ✅ 收藏（游客态无法收藏，但 check 可以公开）
                        "/api/favorite/**",
                        // ✅ Admin 拦截器先处理过的，不需要 JWT 再拦
                        "/api/admin/**",
                        // ✅ H2 Console（开发用）
                        "/h2-console/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/v3/api-docs/**",
                        "/error"
                );
    }
}
