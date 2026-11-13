package com.shop.demo.controller;

import com.shop.demo.common.BusinessException;
import com.shop.demo.common.Result;
import com.shop.demo.entity.Coupon;
import com.shop.demo.repository.CouponRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 优惠券 REST API（用户校验 + 管理员 CRUD）
 */
@RestController
@RequestMapping("/api")
public class CouponController {

    private final CouponRepository couponRepo;

    public CouponController(CouponRepository couponRepo) {
        this.couponRepo = couponRepo;
    }

    /**
     * GET /api/coupon/validate?code=MEGA50&total=200
     * 用户端校验券码（不改库存，仅返回能不能用 + 减多少）
     */
    @GetMapping("/coupon/validate")
    public Result<Map<String, Object>> validate(@RequestParam String code,
                                                @RequestParam int total) {
        Map<String, Object> r = new HashMap<>();
        Coupon c = couponRepo.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BusinessException("优惠券不存在：" + code));
        if (c.getEnabled() == null || !c.getEnabled()) throw new BusinessException("该优惠券已停用");
        if (c.expired())       throw new BusinessException("该优惠券已过期");
        if (c.exhausted())     throw new BusinessException("该优惠券已被领完");
        if (total < (c.getTotalMin() == null ? 0 : c.getTotalMin())) {
            throw new BusinessException(String.format("订单满 ¥%d 才能使用", c.getTotalMin()));
        }
        r.put("valid", true);
        r.put("couponId", c.getId());
        r.put("code", c.getCode());
        r.put("title", c.getTitle());
        r.put("discount", c.getDiscount());
        r.put("finalTotal", Math.max(0, total - c.getDiscount()));
        return Result.ok(r);
    }

    // ==================== 管理员端 ====================

    @GetMapping("/admin/coupon")
    public Result<?> listAll() {
        return Result.ok(couponRepo.findAll());
    }

    @PostMapping("/admin/coupon")
    public Result<Coupon> create(@Valid @RequestBody Coupon c) {
        if (couponRepo.findByCodeIgnoreCase(c.getCode()).isPresent()) {
            throw new BusinessException("券码已存在：" + c.getCode());
        }
        return Result.ok(couponRepo.save(c));
    }

    @PutMapping("/admin/coupon/{id}")
    public Result<Coupon> update(@PathVariable Long id, @Valid @RequestBody Coupon c) {
        c.setId(id);
        return Result.ok(couponRepo.save(c));
    }

    @DeleteMapping("/admin/coupon/{id}")
    public Result<?> delete(@PathVariable Long id) {
        couponRepo.deleteById(id);
        return Result.ok(null);
    }
}
