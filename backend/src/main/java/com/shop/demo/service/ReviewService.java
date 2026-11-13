package com.shop.demo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.demo.common.BusinessException;
import com.shop.demo.entity.Product;
import com.shop.demo.entity.Review;
import com.shop.demo.repository.ProductRepository;
import com.shop.demo.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepo;
    private final ProductRepository productRepo;

    public ReviewService(ReviewRepository reviewRepo, ProductRepository productRepo) {
        this.reviewRepo = reviewRepo;
        this.productRepo = productRepo;
    }

    /** 某商品评论列表（按时间倒序） */
    public Page<Review> listByProduct(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewRepo.findByProductIdOrderByCreatedAtDesc(productId, pageable);
    }

    /** 发表评论 —— 同时回写 Product.rating / reviewCount */
    @Transactional
    public Review create(Review review) {
        // 1. 校验商品存在
        Product product = productRepo.findById(review.getProductId())
                .orElseThrow(() -> new BusinessException("商品不存在"));

        // 2. 防重复评价（同一用户对同一商品只允许一条）
        if (reviewRepo.existsByProductIdAndUserId(review.getProductId(), review.getUserId())) {
            throw new BusinessException("您已评价过该商品，请勿重复提交");
        }

        // 3. 存评论
        Review saved = reviewRepo.save(review);

        // 4. 回写商品的 平均评分 + 评论数
        Double avg = reviewRepo.avgRatingOfProduct(review.getProductId());
        long count = reviewRepo.countByProductId(review.getProductId());
        product.setRating(Math.round(avg * 100.0) / 100.0);   // 保留 2 位小数
        product.setReviewCount((int) count);
        productRepo.save(product);

        return saved;
    }

    /** 删除评论（仅本人可删）—— 同时重新回写 Product.rating / reviewCount */
    @Transactional
    public void delete(Long reviewId, Long userId) {
        Review r = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new BusinessException("评论不存在"));
        if (!r.getUserId().equals(userId)) {
            throw new BusinessException("无权删除此评论");
        }
        doDeleteAndRecalc(r);
    }

    /** 🆕 管理员删除评论（跳过 userId 校验） */
    @Transactional
    public void deleteAsAdmin(Long reviewId) {
        Review r = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new BusinessException("评论不存在"));
        doDeleteAndRecalc(r);
    }

    private void doDeleteAndRecalc(Review r) {
        Long productId = r.getProductId();
        reviewRepo.delete(r);
        Product product = productRepo.findById(productId).orElse(null);
        if (product != null) {
            Double avg = reviewRepo.avgRatingOfProduct(productId);
            long count = reviewRepo.countByProductId(productId);
            product.setRating(count == 0 ? 0 : Math.round(avg * 100.0) / 100.0);
            product.setReviewCount((int) count);
            productRepo.save(product);
        }
    }

    /** 🆕 管理员端：分页查询全部评论（按时间倒序），可按商品/关键词筛选 */
    public Page<Review> adminList(int page, int size, Long productId) {
        Pageable pageable = PageRequest.of(page, size);
        if (productId != null) {
            return reviewRepo.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        }
        return reviewRepo.findAll(pageable);
    }

    /** 某用户是否已评价过某商品 */
    public boolean hasReviewed(Long productId, Long userId) {
        if (userId == null) return false;
        return reviewRepo.existsByProductIdAndUserId(productId, userId);
    }

    /* ==================== 🆕 点赞（toggle：点一次加，再点一次减）==================== */
    private final ObjectMapper om = new ObjectMapper();

    @Transactional
    public Review toggleLike(Long reviewId, Long userId) {
        if (userId == null) throw new BusinessException("登录后才能点赞");
        Review r = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new BusinessException("评论不存在"));

        // 解析 likedBy JSON 字符串 → List<Long>
        List<Long> list = parseLikedBy(r.getLikedBy());
        boolean liked;
        if (list.contains(userId)) {
            list.remove(userId);       // 已点赞 → 取消
            liked = false;
        } else {
            list.add(userId);          // 未点赞 → 加
            liked = true;
        }
        r.setLikedBy(toJson(list));
        r.setLikeCount(list.size());
        reviewRepo.save(r);
        return r;  // 前端可以根据 likeCount 判断状态
    }

    public boolean hasUserLiked(Long reviewId, Long userId) {
        if (userId == null) return false;
        return reviewRepo.findById(reviewId)
                .map(r -> parseLikedBy(r.getLikedBy()).contains(userId))
                .orElse(false);
    }

    /* ==================== 🆕 管理员回复 ==================== */
    @Transactional
    public Review adminReply(Long reviewId, String content, String repliedBy) {
        Review r = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new BusinessException("评论不存在"));
        if (content == null || content.isBlank()) {
            throw new BusinessException("回复内容不能为空");
        }
        if (content.length() > 500) {
            throw new BusinessException("回复不超过 500 字");
        }
        r.setReply(content.trim());
        r.setRepliedAt(LocalDateTime.now());
        r.setRepliedBy(repliedBy == null ? "官方客服" : repliedBy);
        return reviewRepo.save(r);
    }

    /* ==================== 🛠 内部工具 ==================== */
    private List<Long> parseLikedBy(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return om.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
    private String toJson(List<Long> list) {
        try { return om.writeValueAsString(list); }
        catch (Exception e) { return "[]"; }
    }
}
