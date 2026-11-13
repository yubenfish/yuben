package com.shop.demo.service;

import com.shop.demo.common.BusinessException;
import com.shop.demo.entity.Cart;
import com.shop.demo.entity.Product;
import com.shop.demo.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 🆕 购物车服务 —— 双层隔离
 *
 *  userId != null     → 已登录用户购物车（跨设备持久化）
 *  guestId != null    → 浏览器隔离的游客购物车（UUID 存 localStorage）
 *  两者都为 null       → legacy 兼容（旧数据，无隔离）
 *
 * 调用约定：
 *  登录态请求 → caller 传 (userId, guestId=null)
 *  游客态请求 → caller 传 (null, guestId="xxx-xxx-xxx")
 */
@Service
public class CartService {

    @Autowired private CartRepository cartRepo;
    @Autowired private ProductService productService;

    // ===== 统一定位某条购物车条目 =====
    private Optional<Cart> findOne(Long userId, String guestId, Long productId) {
        if (userId != null) return cartRepo.findByUserIdAndProductId(userId, productId);
        if (guestId != null) return cartRepo.findByUserIdIsNullAndGuestIdAndProductId(guestId, productId);
        return cartRepo.findByUserIdIsNullAndGuestIdIsNullAndProductId(productId);
    }

    // ===== 统一查全部 =====
    private List<Cart> findAll(Long userId, String guestId) {
        if (userId != null) return cartRepo.findByUserId(userId);
        if (guestId != null) return cartRepo.findByUserIdIsNullAndGuestId(guestId);
        return cartRepo.findByUserIdIsNullAndGuestIdIsNull();
    }

    private void deleteAll(Long userId, String guestId) {
        if (userId != null) cartRepo.deleteByUserId(userId);
        else if (guestId != null) cartRepo.deleteByUserIdIsNullAndGuestId(guestId);
        else cartRepo.deleteByUserIdIsNullAndGuestIdIsNull();
    }

    private void deleteOne(Long userId, String guestId, Long productId) {
        if (userId != null) cartRepo.deleteByUserIdAndProductId(userId, productId);
        else if (guestId != null) cartRepo.deleteByUserIdIsNullAndGuestIdAndProductId(guestId, productId);
        else cartRepo.deleteByUserIdIsNullAndGuestIdIsNullAndProductId(productId);
    }

    /** 查购物车（完整商品列表） */
    public List<Cart> list(Long userId, String guestId) {
        return findAll(userId, guestId);
    }

    /** 合计金额 */
    public int total(Long userId, String guestId) {
        return findAll(userId, guestId).stream().mapToInt(Cart::getSubtotal).sum();
    }

    /** 商品总件数 */
    public int count(Long userId, String guestId) {
        return findAll(userId, guestId).stream().mapToInt(Cart::getQty).sum();
    }

    /** 加购（+1，已存在则 qty++） */
    @Transactional
    public Cart add(Long userId, String guestId, Long productId) {
        Product product = productService.findById(productId)
                .orElseThrow(() -> new BusinessException("商品不存在: " + productId));

        Optional<Cart> opt = findOne(userId, guestId, productId);
        if (opt.isPresent()) {
            Cart existing = opt.get();
            existing.setQty(existing.getQty() + 1);
            return cartRepo.save(existing);
        }

        Cart item = new Cart();
        item.setUserId(userId);
        item.setGuestId(userId == null ? guestId : null);   // 已登录 → 不再需要 guestId
        item.setProductId(productId);
        item.setName(product.getName());
        item.setPrice(product.getPrice());
        item.setEmoji(product.getEmoji());
        item.setBg(product.getBg());
        item.setQty(1);
        return cartRepo.save(item);
    }

    /** 改数量（qty <= 0 自动删） */
    @Transactional
    public Cart updateQty(Long userId, String guestId, Long productId, int qty) {
        Cart item = findOne(userId, guestId, productId)
                .orElseThrow(() -> new BusinessException("购物车中没有该商品"));
        if (qty <= 0) {
            deleteOne(userId, guestId, productId);
            return null;
        }
        item.setQty(qty);
        return cartRepo.save(item);
    }

    /** 移除商品 */
    @Transactional
    public boolean remove(Long userId, String guestId, Long productId) {
        boolean exists = findOne(userId, guestId, productId).isPresent();
        deleteOne(userId, guestId, productId);
        return exists;
    }

    /** 清空购物车 */
    @Transactional
    public void clear(Long userId, String guestId) {
        deleteAll(userId, guestId);
    }

    /**
     * 🆕 登录后合并游客购物车 → 登录用户购物车
     *
     * 策略：只合并当前浏览器（guestId）的游客购物车，不碰其他浏览器的。
     * 这样 A 设备的游客购物车只归 A 自己，不会污染 B 的账号。
     *
     * @param userId 登录用户 ID
     * @param guestId 当前浏览器 guestId（可 null：兼容 legacy userId=NULL）
     * @return 合并了多少种商品
     */
    @Transactional
    public int mergeGuestToUser(Long userId, String guestId) {
        if (userId == null) return 0;

        // 先找这个浏览器的游客购物车
        List<Cart> guestItems;
        if (guestId != null) {
            guestItems = cartRepo.findByUserIdIsNullAndGuestId(guestId);
            // 同时也把 legacy userId=NULL, guestId=NULL 的一并收了（保险）
            guestItems.addAll(cartRepo.findByUserIdIsNullAndGuestIdIsNull());
        } else {
            guestItems = cartRepo.findByUserIdIsNullAndGuestIdIsNull();
        }
        if (guestItems.isEmpty()) return 0;

        int merged = 0;
        for (Cart guest : guestItems) {
            // 用户购物车里是否已有该商品
            Cart existing = cartRepo.findByUserIdAndProductId(userId, guest.getProductId()).orElse(null);

            if (existing != null) {
                // 已有 → qty 累加
                existing.setQty(existing.getQty() + guest.getQty());
                cartRepo.save(existing);
                cartRepo.delete(guest);
            } else {
                // 没有 → 直接归到用户
                guest.setUserId(userId);
                guest.setGuestId(null);  // 登录态不需要 guestId 了
                cartRepo.save(guest);
            }
            merged++;
        }
        return merged;
    }
}
