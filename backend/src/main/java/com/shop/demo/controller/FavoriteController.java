package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.entity.Favorite;
import com.shop.demo.entity.Product;
import com.shop.demo.repository.FavoriteRepository;
import com.shop.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 🆕 收藏 API（全部是用户自己的，不需要 admin 鉴权）
 */
@RestController
@RequestMapping("/api/favorite")
public class FavoriteController {

    @Autowired private FavoriteRepository favRepo;
    @Autowired private ProductRepository productRepo;

    /** 加入收藏 */
    @PostMapping
    public Result<Favorite> add(@RequestBody Map<String, Long> body) {
        Long uid = body.get("userId"), pid = body.get("productId");
        if (uid == null || pid == null) return Result.err(400, "userId 和 productId 必填");
        if (!productRepo.existsById(pid)) return Result.err(404, "商品不存在");
        if (favRepo.existsByUserIdAndProductId(uid, pid)) return Result.err(400, "已经收藏过了");
        Favorite f = new Favorite();
        f.setUserId(uid); f.setProductId(pid);
        return Result.ok(favRepo.save(f));
    }

    /** 取消收藏 */
    @DeleteMapping
    @Transactional
    public Result<?> remove(@RequestParam Long userId, @RequestParam Long productId) {
        favRepo.deleteByUserIdAndProductId(userId, productId);
        return Result.ok(null);
    }

    /** 我的收藏列表（✅ 带完整商品信息，过滤掉已下架的商品） */
    @GetMapping
    public Result<Map<String, Object>> list(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(1, size), 100));
        Page<Favorite> favPage = favRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        // 1. 收集所有 productId，批量查商品（一次 SQL，避免 N+1）
        List<Long> productIds = favPage.getContent().stream()
                .map(Favorite::getProductId).distinct().toList();
        Map<Long, Product> productMap = productIds.isEmpty()
                ? Map.of()
                : productRepo.findAllById(productIds).stream()
                        .collect(Collectors.toMap(Product::getId, p -> p));

        // 2. 组装：Favorite + Product 扁平结构，商品已下架（不存在）的过滤掉
        List<Map<String, Object>> items = favPage.getContent().stream()
                .map(fav -> {
                    Product prod = productMap.get(fav.getProductId());
                    if (prod == null) return null;  // 商品已下架，跳过
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("favoriteId", fav.getId());
                    m.put("productId", prod.getId());
                    m.put("product", prod);
                    m.put("favoritedAt", fav.getCreatedAt());
                    return m;
                })
                .filter(Objects::nonNull)
                .toList();

        Map<String, Object> data = new HashMap<>();
        data.put("items", items);
        data.put("total", favPage.getTotalElements());
        data.put("validCount", items.size());    // 实际还在售的数量
        data.put("page", favPage.getNumber() + 1);
        data.put("size", favPage.getSize());
        data.put("pages", favPage.getTotalPages());
        return Result.ok(data);
    }

    /** 检查是否已收藏（前端星星按钮状态用） */
    @GetMapping("/check")
    public Result<Map<String, Object>> check(@RequestParam Long userId, @RequestParam Long productId) {
        boolean fav = favRepo.existsByUserIdAndProductId(userId, productId);
        Map<String, Object> data = new HashMap<>();
        data.put("productId", productId);
        data.put("favorited", fav);
        return Result.ok(data);
    }
}
