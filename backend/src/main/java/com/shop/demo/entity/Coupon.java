package com.shop.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 优惠券 —— 满减型（code 触发）
 * 极简设计，够用：满 totalMin 减 discount，expireAt 过期失效
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "coupon")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 券码（全局唯一，用户输入这个） */
    @NotBlank
    @Size(max = 32)
    @Column(nullable = false, unique = true, length = 32)
    private String code;

    /** 优惠金额（元，整数） */
    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer discount;

    /** 满减门槛 —— 订单总额 >= totalMin 才能用 */
    @NotNull
    @Min(0)
    @Column(name = "total_min", nullable = false)
    private Integer totalMin = 0;

    /** 标题（比如"新用户满减券"） */
    @Size(max = 50)
    private String title;

    /** 有效期到期时间 */
    @Column(name = "expire_at")
    private LocalDateTime expireAt;

    /** 已使用次数 */
    @Column(name = "used_count")
    private Integer usedCount = 0;

    /** 最大可使用次数（0 = 不限次数） */
    @Column(name = "max_use")
    private Integer maxUse = 0;

    /** 是否启用 */
    @Column(nullable = false)
    private Boolean enabled = true;

    /* ---------- 辅助方法 ---------- */
    public boolean expired() {
        return expireAt != null && LocalDateTime.now().isAfter(expireAt);
    }
    public boolean exhausted() {
        return maxUse != null && maxUse > 0 && usedCount >= maxUse;
    }
    public boolean usableOn(int orderTotal) {
        return enabled != null && enabled
                && !expired()
                && !exhausted()
                && orderTotal >= (totalMin == null ? 0 : totalMin);
    }
}
