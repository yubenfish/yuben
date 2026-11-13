package com.shop.demo.repository;

import com.shop.demo.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    /** 🆕 Dashboard: 热销 Top N（SQL 层 GROUP BY + ORDER BY + LIMIT） */
    @Query(value = "SELECT oi.product_id AS productId, oi.name AS name, oi.emoji AS emoji, oi.price AS price, SUM(oi.qty) AS sold " +
                   "FROM order_item oi GROUP BY oi.product_id, oi.name, oi.emoji, oi.price " +
                   "ORDER BY SUM(oi.qty) DESC LIMIT :limit", nativeQuery = true)
    List<Map<String, Object>> findTopSelling(@Param("limit") int limit);
}
