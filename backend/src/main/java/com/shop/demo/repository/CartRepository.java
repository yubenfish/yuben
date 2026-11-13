package com.shop.demo.repository;

import com.shop.demo.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/**
 * 🆕 购物车 Repository —— 双层隔离
 *
 *  已登录用户：userId 非空，所有查删都用 userId
 *  游客态：userId = NULL，用 guestId（浏览器 UUID）隔离
 *  legacy 兼容：userId=null, guestId=null 的旧数据也能查到
 */
public interface CartRepository extends JpaRepository<Cart, Long> {

    // ===== 已登录用户（userId 非空）=====
    List<Cart> findByUserId(Long userId);
    Optional<Cart> findByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserId(Long userId);

    // ===== 游客（userId = NULL，按 guestId 隔离）=====
    List<Cart> findByUserIdIsNullAndGuestId(String guestId);
    Optional<Cart> findByUserIdIsNullAndGuestIdAndProductId(String guestId, Long productId);
    void deleteByUserIdIsNullAndGuestIdAndProductId(String guestId, Long productId);
    void deleteByUserIdIsNullAndGuestId(String guestId);

    // ===== legacy：userId=NULL, guestId=NULL（旧数据兼容）=====
    List<Cart> findByUserIdIsNullAndGuestIdIsNull();
    Optional<Cart> findByUserIdIsNullAndGuestIdIsNullAndProductId(Long productId);
    void deleteByUserIdIsNullAndGuestIdIsNullAndProductId(Long productId);
    void deleteByUserIdIsNullAndGuestIdIsNull();
}
