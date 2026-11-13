package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.entity.Review;
import com.shop.demo.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户评论 REST API（含点赞 + 管理员回复）
 */
@RestController
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // ==================== 用户端 ====================

    /** GET /api/review?productId=1&page=0&size=10 —— 商品评论列表 */
    @GetMapping("/api/review")
    public Result<Page<Review>> list(
            @RequestParam Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Result.ok(reviewService.listByProduct(productId, page, size));
    }

    /** POST /api/review —— 发表评论 */
    @PostMapping("/api/review")
    public Result<Review> create(@Valid @RequestBody Review review) {
        return Result.ok(reviewService.create(review));
    }

    /** DELETE /api/review/{id} —— 删除评论（仅本人） */
    @DeleteMapping("/api/review/{id}")
    public Result<?> delete(@PathVariable Long id,
                            @RequestParam Long userId) {
        reviewService.delete(id, userId);
        return Result.ok(null);
    }

    /** GET /api/review/check?productId=1&userId=2 —— 检查是否已评价 */
    @GetMapping("/api/review/check")
    public Result<Map<String, Boolean>> check(@RequestParam Long productId,
                                              @RequestParam(required = false) Long userId) {
        return Result.ok(Map.of("hasReviewed", reviewService.hasReviewed(productId, userId)));
    }

    /** 🆕 POST /api/review/{id}/like?userId=3 —— 点赞（toggle） */
    @PostMapping("/api/review/{id}/like")
    public Result<Review> like(@PathVariable Long id,
                               @RequestParam Long userId) {
        return Result.ok(reviewService.toggleLike(id, userId));
    }

    // ==================== 🆕 管理员端 ====================

    /** GET /api/admin/review?page=0&size=10&productId=  —— 全部评论 */
    @GetMapping("/api/admin/review")
    public Result<Page<Review>> adminList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long productId) {
        return Result.ok(reviewService.adminList(page, size, productId));
    }

    /** DELETE /api/admin/review/{id} —— 管理员删除评论 */
    @DeleteMapping("/api/admin/review/{id}")
    public Result<?> adminDelete(@PathVariable Long id) {
        reviewService.deleteAsAdmin(id);
        return Result.ok(null);
    }

    /** 🆕 POST /api/admin/review/{id}/reply —— 管理员回复 */
    @PostMapping("/api/admin/review/{id}/reply")
    public Result<Review> adminReply(@PathVariable Long id,
                                     @RequestBody Map<String, String> body) {
        String content = body.get("content");
        String repliedBy = body.get("repliedBy");
        return Result.ok(reviewService.adminReply(id, content, repliedBy));
    }
}
