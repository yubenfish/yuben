package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.config.JWTTool;
import com.shop.demo.entity.Cart;
import com.shop.demo.service.CartService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 🆕 购物车 API —— 双层隔离
 *
 *  已登录用户：resolveUserId() 非空 → 用 userId 隔离（跨设备持久化）
 *  浏览器游客：resolveUserId() 空 → 用 guestId 隔离（UUID 存 localStorage）
 *  legacy 兼容：两者都空 → 旧数据
 *
 *  /api/cart/** 不在 JWT 拦截器里，Controller 自己解析 Authorization。
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired private CartService cartService;
    @Autowired private JWTTool jwt;

    // ===== 统一解析 userId（已登录）=====
    private Long resolveUserId(HttpServletRequest request, Long queryUserId) {
        if (request != null) {
            Object attr = request.getAttribute("currentUserId");
            if (attr instanceof Long) return (Long) attr;
            if (attr instanceof Integer) return ((Integer) attr).longValue();
            // 手动解析 JWT header（购物车路径软拦截）
            String token = jwt.extract(request.getHeader("Authorization"));
            if (token != null) {
                Claims c = jwt.parse(token);
                if (c != null) {
                    try { return Long.parseLong(c.getSubject()); } catch (NumberFormatException ignored) {}
                }
            }
            String header = request.getHeader("X-User-Id");
            if (header != null && !header.isBlank()) {
                try { return Long.parseLong(header.trim()); } catch (NumberFormatException ignored) {}
            }
        }
        return queryUserId;
    }

    // ===== 🆕 统一解析 guestId（浏览器唯一 ID，UUID）=====
    private String resolveGuestId(HttpServletRequest request, String queryGuestId) {
        if (request != null) {
            String header = request.getHeader("X-Guest-Id");
            if (header != null && !header.isBlank()) return header.trim();
        }
        return queryGuestId;
    }

    @GetMapping
    public Result<Map<String, Object>> list(
            HttpServletRequest request,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String guestId) {
        Long uid = resolveUserId(request, userId);
        String gid = (uid == null) ? resolveGuestId(request, guestId) : null;
        List<Cart> items = cartService.list(uid, gid);
        Map<String, Object> payload = new HashMap<>();
        payload.put("items", items);
        payload.put("total", cartService.total(uid, gid));
        payload.put("count", cartService.count(uid, gid));
        return Result.ok(payload);
    }

    @PostMapping("/{productId}")
    public Result<Cart> add(
            @PathVariable Long productId,
            HttpServletRequest request,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String guestId) {
        Long uid = resolveUserId(request, userId);
        String gid = (uid == null) ? resolveGuestId(request, guestId) : null;
        return Result.ok(cartService.add(uid, gid, productId));
    }

    @PutMapping("/{productId}")
    public Result<Cart> update(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") int qty,
            HttpServletRequest request,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String guestId) {
        Long uid = resolveUserId(request, userId);
        String gid = (uid == null) ? resolveGuestId(request, guestId) : null;
        return Result.ok(cartService.updateQty(uid, gid, productId, qty));
    }

    @DeleteMapping("/{productId}")
    public Result<Void> remove(
            @PathVariable Long productId,
            HttpServletRequest request,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String guestId) {
        Long uid = resolveUserId(request, userId);
        String gid = (uid == null) ? resolveGuestId(request, guestId) : null;
        cartService.remove(uid, gid, productId);
        return Result.ok();
    }

    @DeleteMapping
    public Result<Void> clear(
            HttpServletRequest request,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String guestId) {
        Long uid = resolveUserId(request, userId);
        String gid = (uid == null) ? resolveGuestId(request, guestId) : null;
        cartService.clear(uid, gid);
        return Result.ok();
    }
}
