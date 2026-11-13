package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.entity.Product;
import com.shop.demo.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 商品 API
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    /** 商品列表（分页 + 筛选 + 🆕 价格区间） */
    @GetMapping
    public Result<Map<String, Object>> list(
            @RequestParam(required = false) String cat,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Product> p = productService.list(cat, keyword, minPrice, maxPrice,
                Math.max(0, page - 1), Math.min(Math.max(1, size), 100));
        Map<String, Object> data = new HashMap<>();
        data.put("items", p.getContent());
        data.put("total", p.getTotalElements());
        data.put("page", p.getNumber() + 1);
        data.put("size", p.getSize());
        return Result.ok(data);
    }

    /** 商品详情 */
    @GetMapping("/{id}")
    public Result<Product> detail(@PathVariable Long id) {
        return productService.findById(id)
                .<Result<Product>>map(Result::ok)
                .orElse(Result.err(404, "商品不存在"));
    }

    /** 后台：新增商品 */
    @PostMapping
    public Result<Product> create(@Valid @RequestBody Product p) {
        return Result.ok(productService.create(p));
    }

    /** 后台：更新商品 */
    @PutMapping("/{id}")
    public Result<Product> update(@PathVariable Long id, @Valid @RequestBody Product p) {
        return Result.ok(productService.update(id, p));
    }

    /** 后台：删除商品 */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        if (productService.delete(id)) return Result.ok();
        return Result.err(404, "商品不存在");
    }
}
