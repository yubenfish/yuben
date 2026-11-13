package com.shop.demo.config;

import com.shop.demo.entity.User;
import com.shop.demo.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

/**
 * 🆕 管理员权限拦截器
 * 拦截 /api/admin/** 路径，要求：
 *   1. Header "X-Admin-Key" 等于配置值（默认 admin123）
 *   2. 可选：Header "X-User-Id" 对应用户 role=ADMIN
 *
 * 教学项目简化实现，不引入完整 Spring Security + JWT
 */
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    @Value("${shop.admin.key:admin123}")
    private String adminKey;

    @Autowired
    private UserRepository userRepo;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 预检请求放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String key = request.getHeader("X-Admin-Key");
        String userIdHeader = request.getHeader("X-User-Id");

        // 1. Admin Key 必须匹配
        if (key == null || !adminKey.equals(key)) {
            response.setStatus(403);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":403,\"message\":\"管理员鉴权失败：X-Admin-Key 无效\",\"data\":null}");
            return false;
        }

        // 2. 如果带了 X-User-Id，额外要求该用户 role=ADMIN
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                Long uid = Long.parseLong(userIdHeader);
                Optional<User> opt = userRepo.findById(uid);
                if (opt.isEmpty() || !"ADMIN".equals(opt.get().getRole())) {
                    response.setStatus(403);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"code\":403,\"message\":\"该账号无管理员权限\",\"data\":null}");
                    return false;
                }
            } catch (NumberFormatException ignored) {}
        }

        return true;
    }
}
