package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.entity.Product;
import com.shop.demo.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 管理员端商品 API —— 路径 /api/admin/products/**，AdminAuthInterceptor 保护
 * （和 ProductController /api/products/** 分开，拦截器路径对得上）
 */
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    @Autowired
    private ProductService productService;

    /** GET /api/admin/products —— 后台列表（含已下架） */
    @GetMapping
    public Result<Map<String, Object>> adminList(
            @RequestParam(required = false) String cat,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Product> p = productService.adminList(cat, keyword, minPrice, maxPrice,
                Math.max(0, page - 1), Math.min(Math.max(1, size), 100));
        Map<String, Object> data = new HashMap<>();
        data.put("items", p.getContent());
        data.put("total", p.getTotalElements());
        data.put("page", p.getNumber() + 1);
        data.put("size", p.getSize());
        return Result.ok(data);
    }

    /** POST /api/admin/products/{id}/toggle —— 上架/下架切换 */
    @PostMapping("/{id}/toggle")
    public Result<Product> toggle(@PathVariable Long id) {
        return Result.ok(productService.toggleEnabled(id));
    }
}
