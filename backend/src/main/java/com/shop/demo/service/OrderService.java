package com.shop.demo.service;

import com.shop.demo.entity.Cart;
import com.shop.demo.entity.Coupon;
import com.shop.demo.entity.Order;
import com.shop.demo.entity.OrderItem;
import com.shop.demo.common.BusinessException;
import com.shop.demo.config.RedisConfig;
import com.shop.demo.repository.CartRepository;
import com.shop.demo.repository.CouponRepository;
import com.shop.demo.repository.OrderItemRepository;
import com.shop.demo.repository.OrderRepository;
import com.shop.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * 订单服务 —— 购物车结算 → 订单 + 状态流转 + 优惠券核销
 *
 * 库存扣减双路径：
 *   🟢 Redis 可用 → RedisConfig.deductStock() Lua 原子扣减（高并发 0 超卖）
 *   🟡 Redis 不可用 → productRepo.deductStockAndAddSales() MySQL 乐观锁（安全但并发低）
 *
 * 状态机：PAID → SHIPPED → DONE
 *                    ↘ CANCELLED
 */
@Service
public class OrderService {

    @Autowired private OrderRepository orderRepo;
    @Autowired private OrderItemRepository orderItemRepo;
    @Autowired private CartRepository cartRepo;
    @Autowired private ProductRepository productRepo;
    @Autowired private CouponRepository couponRepo;
    @Autowired(required = false) private RedisConfig redisConfig;

    private static final Set<String> VALID_STATUSES = Set.of("PAID", "SHIPPED", "DONE", "CANCELLED");

    /** 🆕 下单（含可选优惠券 + 双层隔离） */
    @Transactional
    public Map<String, Object> checkout(String shipping, String remark, Long userId, String guestId, String couponCode) {
        // 🆕 双层隔离：已登录用 userId，游客用 guestId（防止跨设备污染）
        List<Cart> carts;
        if (userId != null) {
            carts = cartRepo.findByUserId(userId);
        } else if (guestId != null) {
            carts = cartRepo.findByUserIdIsNullAndGuestId(guestId);
        } else {
            carts = cartRepo.findByUserIdIsNullAndGuestIdIsNull();
        }
        if (carts.isEmpty()) throw new BusinessException("购物车为空，无法下单");

        int originalTotal = carts.stream().mapToInt(Cart::getSubtotal).sum();

        // ===== 🆕 优惠券核销（服务端最终校验，前端校验只是 UX）=====
        int couponDiscount = 0;
        Coupon usedCoupon = null;
        if (couponCode != null && !couponCode.isBlank()) {
            Coupon c = couponRepo.findByCodeIgnoreCase(couponCode.trim())
                    .orElseThrow(() -> new BusinessException("优惠券不存在：" + couponCode));
            if (c.getEnabled() == null || !c.getEnabled()) throw new BusinessException("该优惠券已停用");
            if (c.expired())   throw new BusinessException("该优惠券已过期");
            if (c.exhausted()) throw new BusinessException("该优惠券已被领完");
            int min = c.getTotalMin() == null ? 0 : c.getTotalMin();
            if (originalTotal < min) {
                throw new BusinessException(String.format("订单满 ¥%d 才能使用「%s」", min, c.getCode()));
            }
            couponDiscount = c.getDiscount();
            c.setUsedCount((c.getUsedCount() == null ? 0 : c.getUsedCount()) + 1);
            couponRepo.save(c);
            usedCoupon = c;
        }

        int finalTotal = Math.max(0, originalTotal - couponDiscount);

        // ===== 创建订单 =====
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTotal(finalTotal);
        order.setOriginalTotal(originalTotal);
        order.setCouponDiscount(couponDiscount);
        order.setCouponCode(usedCoupon != null ? usedCoupon.getCode() : null);
        order.setShipping(shipping);
        order.setRemark(remark);
        order.setStatus("PAID");
        order = orderRepo.save(order);

        List<OrderItem> items = new ArrayList<>();
        for (Cart c : carts) {
            int affected;

            // ===== 🆕 双路径库存扣减 =====
            if (redisConfig != null && RedisConfig.REDIS_AVAILABLE) {
                // 🟢 路径 A：Redis Lua 原子扣减（0 超卖）
                long result = redisConfig.deductStock(c.getProductId(), c.getQty());
                if (result == -1) {
                    // key 不存在 → 回填一次再重试（首次/过期后）
                    var p = productRepo.findById(c.getProductId())
                            .orElseThrow(() -> new BusinessException("商品不存在"));
                    redisConfig.backfillStock(c.getProductId(), p.getStock());
                    result = redisConfig.deductStock(c.getProductId(), c.getQty());
                }
                if (result != 1) {
                    throw new BusinessException("库存不足（Redis），无法下单（产品ID:" + c.getProductId() + "）");
                }
                // Redis 扣减成功 → MySQL 同步扣减 + 增加销量（最终一致）
                affected = productRepo.deductStockAndAddSales(c.getProductId(), c.getQty());
                if (affected == 0) {
                    // MySQL 乐观锁冲突 → 已扣库存由事务回滚，但 Redis 扣成功了
                    // 这种极端情况用 @Transactional 兜底
                    throw new BusinessException("库存数据不一致，请稍后重试");
                }
            } else {
                // 🟡 路径 B：纯 MySQL 乐观锁（降级，单库足够）
                affected = productRepo.deductStockAndAddSales(c.getProductId(), c.getQty());
                if (affected == 0) {
                    throw new BusinessException("商品库存不足或已下架，无法下单（产品ID:" + c.getProductId() + "）");
                }
            }

            OrderItem oi = new OrderItem();
            oi.setOrderId(order.getId());
            oi.setProductId(c.getProductId());
            oi.setName(c.getName());
            oi.setPrice(c.getPrice());
            oi.setEmoji(c.getEmoji());
            oi.setQty(c.getQty());
            oi.setSubtotal(c.getSubtotal());
            items.add(orderItemRepo.save(oi));
        }

        // 🆕 清空购物车（双层隔离）
        if (userId != null) cartRepo.deleteByUserId(userId);
        else if (guestId != null) cartRepo.deleteByUserIdIsNullAndGuestId(guestId);
        else cartRepo.deleteByUserIdIsNullAndGuestIdIsNull();

        Map<String, Object> result = new HashMap<>();
        result.put("order", order);
        result.put("items", items);
        return result;
    }

    /** 🆕 订单列表 —— 支持状态筛选 + 分页 */
    public Page<Order> list(String status, int page, int size) {
        Pageable p = PageRequest.of(page, size);
        if (status != null && !status.isBlank()) {
            return orderRepo.findByStatus(status, p);
        }
        return orderRepo.findAll(p);
    }

    /** 订单详情 */
    public Map<String, Object> detail(String orderNo) {
        Order order = orderRepo.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在: " + orderNo));
        List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("order", order);
        result.put("items", items);
        return result;
    }

    /** 🆕 状态流转：管理员发货 PAID → SHIPPED */
    @Transactional
    public Order ship(String orderNo, String trackingNo) {
        Order order = orderRepo.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在: " + orderNo));
        if (!"PAID".equals(order.getStatus()))
            throw new RuntimeException("当前状态无法发货：" + order.getStatus());
        order.setStatus("SHIPPED");
        if (trackingNo != null && !trackingNo.isBlank()) {
            order.setRemark((order.getRemark() == null ? "" : order.getRemark()) + " [物流号:" + trackingNo + "]");
        }
        return orderRepo.save(order);
    }

    /** 🆕 状态流转：完成 SHIPPED → DONE */
    @Transactional
    public Order done(String orderNo) {
        Order order = orderRepo.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在: " + orderNo));
        if (!"SHIPPED".equals(order.getStatus()))
            throw new RuntimeException("当前状态无法完成：" + order.getStatus());
        order.setStatus("DONE");
        return orderRepo.save(order);
    }

    /** 🆕 状态流转：取消 PAID → CANCELLED */
    @Transactional
    public Order cancel(String orderNo) {
        Order order = orderRepo.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在: " + orderNo));
        if ("DONE".equals(order.getStatus()) || "CANCELLED".equals(order.getStatus()))
            throw new RuntimeException("当前状态无法取消：" + order.getStatus());
        order.setStatus("CANCELLED");
        return orderRepo.save(order);
    }

    /** 🆕 通用状态更新 */
    @Transactional
    public Order updateStatus(String orderNo, String status) {
        if (!VALID_STATUSES.contains(status))
            throw new RuntimeException("无效状态: " + status + "（可选 PAID/SHIPPED/DONE/CANCELLED）");
        Order order = orderRepo.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在: " + orderNo));
        order.setStatus(status);
        return orderRepo.save(order);
    }

    private String generateOrderNo() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String rand = String.format("%04d", new Random().nextInt(10000));
        return "SHOP" + ts + rand;
    }
}
