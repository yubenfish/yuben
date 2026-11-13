package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.entity.Order;
import com.shop.demo.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 订单 API
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    /** 🆕 统一解析 userId —— 优先 JWT token，再 body，最后 X-User-Id header */
    private Long resolveUserId(HttpServletRequest request, Map<String, Object> body) {
        // 1️⃣ 最优先：JWT 拦截器已经解析好挂在 request 上
        if (request != null) {
            Object jwtUid = request.getAttribute("currentUserId");
            if (jwtUid instanceof Long) return (Long) jwtUid;
            if (jwtUid instanceof Integer) return ((Integer) jwtUid).longValue();
        }
        // 2. body 里显式传了
        if (body != null && body.get("userId") != null) {
            try { return ((Number) body.get("userId")).longValue(); } catch (Exception ignored) {}
        }
        // 3. X-User-Id header（向后兼容）
        if (request != null) {
            String h = request.getHeader("X-User-Id");
            if (h != null && !h.isBlank()) {
                try { return Long.parseLong(h.trim()); } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    /** 下单 —— userId 从 JWT/body/header；guestId 从 X-Guest-Id header（双层隔离） */
    @PostMapping
    public Result<Map<String, Object>> checkout(
            HttpServletRequest request,
            @RequestBody(required = false) Map<String, Object> body) {
        String shipping = body != null ? (String) body.getOrDefault("shipping", "") : "";
        String remark   = body != null ? (String) body.getOrDefault("remark", "") : "";
        String couponCode = body != null ? (String) body.get("couponCode") : null;
        Long userId = resolveUserId(request, body);
        // 🆕 从 header 取 guestId（浏览器唯一 UUID）
        String guestId = request.getHeader("X-Guest-Id");
        return Result.ok(orderService.checkout(shipping, remark, userId, guestId, couponCode));
    }

    /** 订单列表（状态筛选 + 分页） */
    @GetMapping
    public Result<Map<String, Object>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Order> p = orderService.list(status, Math.max(0, page - 1), Math.min(Math.max(1, size), 100));
        Map<String, Object> data = new HashMap<>();
        data.put("orders", p.getContent());
        data.put("total", p.getTotalElements());
        data.put("page", p.getNumber() + 1);
        data.put("size", p.getSize());
        data.put("pages", p.getTotalPages());
        return Result.ok(data);
    }

    /** 订单详情 */
    @GetMapping("/{orderNo}")
    public Result<Map<String, Object>> detail(@PathVariable String orderNo) {
        return Result.ok(orderService.detail(orderNo));
    }

    /** 发货 */
    @PutMapping("/{orderNo}/ship")
    public Result<Order> ship(
            @PathVariable String orderNo,
            @RequestBody(required = false) Map<String, String> body) {
        String tracking = body != null ? body.getOrDefault("trackingNo", "") : "";
        return Result.ok(orderService.ship(orderNo, tracking));
    }

    /** 完成 */
    @PutMapping("/{orderNo}/done")
    public Result<Order> done(@PathVariable String orderNo) {
        return Result.ok(orderService.done(orderNo));
    }

    /** 取消 */
    @PutMapping("/{orderNo}/cancel")
    public Result<Order> cancel(@PathVariable String orderNo) {
        return Result.ok(orderService.cancel(orderNo));
    }

    /** 通用状态更新 */
    @PutMapping("/{orderNo}/status")
    public Result<Order> updateStatus(
            @PathVariable String orderNo,
            @RequestParam String status) {
        return Result.ok(orderService.updateStatus(orderNo, status));
    }
}
