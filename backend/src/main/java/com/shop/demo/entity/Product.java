package com.shop.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 商品实体 —— 映射 product 表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "商品名不能为空")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @NotNull(message = "价格必填")
    @Min(value = 0, message = "价格不能为负")
    @Column(nullable = false)
    private Integer price;

    @Min(value = 0)
    @Column(name = "old_price")
    private Integer oldPrice;

    @Column(length = 10)
    private String emoji;

    @Column(length = 200)
    private String bg;

    @Column(length = 20)
    private String cat;

    @Column(length = 20)
    private String tag;

    @Column(name = "tag_text", length = 20)
    private String tagText;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Min(value = 0)
    @Column(nullable = false)
    private Integer stock = 999;

    @Min(value = 0)
    @Column(nullable = false)
    private Integer sales = 0;

    @Min(value = 0) @Max(value = 5)
    @Column
    private Double rating = 4.8;

    @Column(name = "review_count")
    private Integer reviewCount = 128;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** 🆕 乐观锁版本号 —— 防止并发库存扣减超卖 */
    @Version
    @Column
    private Integer version = 0;

    /** 🆕 上架/下架（soft delete）—— false=已下架，前台不显示 */
    @Column(nullable = false)
    private Boolean enabled = true;
}
