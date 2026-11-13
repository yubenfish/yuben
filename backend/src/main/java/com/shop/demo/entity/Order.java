package com.shop.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 订单主表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "订单号不能为空")
    @Column(name = "order_no", nullable = false, length = 32, unique = true)
    private String orderNo;

    @Column(name = "user_id")
    private Long userId;

    @NotNull(message = "总额必填")
    @Min(value = 0, message = "总额不能为负")
    @Column(nullable = false)
    private Integer total;

    /* ==================== 🆕 优惠券字段 ==================== */

    /** 原始总额（减券前） */
    @Column(name = "original_total")
    private Integer originalTotal;

    /** 优惠金额（= originalTotal - total） */
    @Column(name = "coupon_discount")
    private Integer couponDiscount = 0;

    /** 使用的券码（冗余存一份，方便订单列表展示） */
    @Column(name = "coupon_code", length = 32)
    private String couponCode;

    @NotBlank(message = "订单状态必填")
    @Column(nullable = false, length = 20)
    private String status = "PAID";

    @Column(length = 300)
    private String shipping;

    @Column(length = 300)
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
