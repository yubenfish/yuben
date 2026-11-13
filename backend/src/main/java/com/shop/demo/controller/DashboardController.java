package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.entity.Product;
import com.shop.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理端 Dashboard 统计接口
 * 所有聚合查询全部下推到 SQL 层，避免 findAll+stream 的 OOM 风险
 */
@RestController
@RequestMapping("/api/admin")
public class DashboardController {

    @Autowired private ProductRepository productRepo;
    @Autowired private OrderRepository orderRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private OrderItemRepository orderItemRepo;

    /** 把 native GROUP BY 返回的 List<Object[col, cnt]> 转成 Map<col, Long> */
    private Map<String, Long> toDistribution(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            Object key = row[0];
            Object cnt = row[1];
            map.put(key == null ? "unknown" : key.toString(),
                    cnt instanceof Number ? ((Number) cnt).longValue() : 0L);
        }
        return map;
    }

    @GetMapping("/dashboard")
    public Result<Map<String, Object>> dashboard() {
        Map<String, Object> data = new HashMap<>();

        // ===== 4 张 KPI 卡片 =====
        Map<String, Object> cards = new HashMap<>();
        cards.put("totalProducts", productRepo.count());
        cards.put("totalUsers",    userRepo.count());
        cards.put("totalOrders",   orderRepo.count());
        cards.put("totalRevenue",  orderRepo.sumTotalExcludingCancelled());
        data.put("cards", cards);

        // ===== 图表数据（SQL 层 GROUP BY）=====
        data.put("statusDist", toDistribution(orderRepo.countGroupByStatus()));
        data.put("catDist",    toDistribution(productRepo.countGroupByCat()));

        // ===== 最近 10 个订单 =====
        data.put("recentOrders", orderRepo.findRecent10());

        // ===== 热销 Top 5 =====
        data.put("topSelling", orderItemRepo.findTopSelling(5));

        return Result.ok(data);
    }

    /* ==================== 🆕 库存预警 ==================== */

    /** GET /api/admin/dashboard/low-stock?threshold=10 —— 库存低于阈值的商品 */
    @GetMapping("/dashboard/low-stock")
    public Result<List<Product>> lowStock(@RequestParam(defaultValue = "10") int threshold) {
        return Result.ok(productRepo.findLowStock(threshold));
    }
}
