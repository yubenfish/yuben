package com.shop.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 🆕 购物车条目 —— 双层隔离：
 *
 *  ① userId != null  → 已登录用户购物车（按 user 隔离，跨设备持久化）
 *  ② userId == null + guestId != null → 游客购物车（按浏览器隔离，防止跨设备污染）
 *  ③ userId == null + guestId == null → 旧数据/匿名（兼容迁移用）
 *
 * 冗余快照设计：name/price/emoji/bg 直接存商品快照，避免 join
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cart")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 已登录用户 ID（非空时优先级最高） */
    @Column(name = "user_id")
    private Long userId;

    /** 🆕 游客浏览器唯一 ID（UUID，存前端 localStorage，防止跨设备污染） */
    @Column(name = "guest_id", length = 48)
    private String guestId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private Integer price;

    @Column(length = 10)
    private String emoji;

    @Column(length = 200)
    private String bg;

    @Column(nullable = false)
    private Integer qty;

    public Integer getSubtotal() {
        return price * qty;
    }
}
