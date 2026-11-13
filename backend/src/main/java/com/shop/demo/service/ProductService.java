package com.shop.demo.service;

import com.shop.demo.common.BusinessException;
import com.shop.demo.entity.Product;
import com.shop.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 商品服务 —— 支持分页 + 🆕 Spring Cache 热数据缓存
 *
 * 前台 enabled 过滤：SQL 层 findEnabled
 * 后台：findAllWithFilter 返回全部（含下架）
 */
@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepo;

    /** 前台列表：SQL 层过滤 enabled=true + cat + keyword + 价格区间 + 分页 */
    public Page<Product> list(String cat, String keyword, Integer minPrice, Integer maxPrice, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepo.findEnabled(
                normalize(cat), normalize(keyword),
                minPrice != null ? minPrice : 0,
                maxPrice != null ? maxPrice : Integer.MAX_VALUE, pageable);
    }

    /** 🆕 后台列表：返回全部（含已下架）—— 给 admin 面板用 */
    public Page<Product> adminList(String cat, String keyword, Integer minPrice, Integer maxPrice, int page, int size) {
        Pageable p = PageRequest.of(page, size);
        return productRepo.findAllWithFilter(
                normalize(cat), normalize(keyword),
                minPrice != null ? minPrice : 0,
                maxPrice != null ? maxPrice : Integer.MAX_VALUE, p);
    }

    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isBlank() || "all".equalsIgnoreCase(t)) return null;
        return t;
    }

    /** 🆕 商品上架/下架切换 —— 清缓存 */
    @CacheEvict(value = "product", key = "#id")
    public Product toggleEnabled(Long id) {
        Product p = productRepo.findById(id)
                .orElseThrow(() -> new BusinessException("商品不存在"));
        p.setEnabled(p.getEnabled() == null || !p.getEnabled());
        return productRepo.save(p);
    }

    /** 🆕 按 ID 查询 —— 热缓存（Redis 可用时 5min，否则内存） */
    @Cacheable(value = "product", key = "#id")
    public Optional<Product> findById(Long id) {
        return productRepo.findById(id);
    }

    /** 新增商品（后台） */
    public Product create(Product p) {
        if (p.getStock() == null) p.setStock(999);
        if (p.getSales() == null) p.setSales(0);
        if (p.getRating() == null) p.setRating(4.8);
        if (p.getReviewCount() == null) p.setReviewCount(0);
        return productRepo.save(p);
    }

    /** 更新商品（后台） */
    public Product update(Long id, Product payload) {
        Product p = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在: " + id));
        if (payload.getName() != null)       p.setName(payload.getName());
        if (payload.getPrice() != null)      p.setPrice(payload.getPrice());
        if (payload.getOldPrice() != null)   p.setOldPrice(payload.getOldPrice());
        if (payload.getEmoji() != null)      p.setEmoji(payload.getEmoji());
        if (payload.getBg() != null)         p.setBg(payload.getBg());
        if (payload.getCat() != null)        p.setCat(payload.getCat());
        if (payload.getTag() != null)        p.setTag(payload.getTag());
        if (payload.getTagText() != null)    p.setTagText(payload.getTagText());
        if (payload.getDescription() != null) p.setDescription(payload.getDescription());
        if (payload.getStock() != null)      p.setStock(payload.getStock());
        if (payload.getRating() != null)     p.setRating(payload.getRating());
        return productRepo.save(p);
    }

    /** 删除商品（后台） */
    public boolean delete(Long id) {
        if (!productRepo.existsById(id)) return false;
        productRepo.deleteById(id);
        return true;
    }
}
