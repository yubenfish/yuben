package com.shop.demo.repository;

import com.shop.demo.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** 按商品分页查评论，按时间倒序 */
    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    /** 某用户是否已评价过某商品（用于防重复评价） */
    boolean existsByProductIdAndUserId(Long productId, Long userId);

    /** 某用户对某商品的评价数量 */
    long countByProductIdAndUserId(Long productId, Long userId);

    /** 商品平均评分 */
    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.productId = :pid")
    Double avgRatingOfProduct(@Param("pid") Long productId);

    /** 商品评论总数 */
    long countByProductId(Long productId);
}
