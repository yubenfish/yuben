package com.shop.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 用户评论 —— 映射 review 表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "review")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Size(max = 50)
    @Column(length = 50)
    private String nickname;

    @NotNull(message = "评分必填")
    @Min(value = 1, message = "最低 1 星")
    @Max(value = 5, message = "最高 5 星")
    @Column(nullable = false)
    private Integer rating;

    @Size(max = 500, message = "评论不超过 500 字")
    @Column(length = 500)
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /* ==================== 🆕 增强字段 ==================== */

    /** 点赞数（冗余字段，跟 likedBy 同步） */
    @Column(name = "like_count")
    private Integer likeCount = 0;

    /** 点赞用户 ID 集合（JSON 字符串，例如 "[1,3,5]"） */
    @Column(name = "liked_by", length = 2000)
    private String likedBy = "[]";

    /** 管理员回复内容 */
    @Size(max = 500, message = "回复不超过 500 字")
    @Column(length = 500)
    private String reply;

    /** 管理员回复时间 */
    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    /** 管理员回复人（存 nickname 就行，反查麻烦） */
    @Size(max = 50)
    @Column(name = "replied_by", length = 50)
    private String repliedBy;
}
