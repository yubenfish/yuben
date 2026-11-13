package com.shop.demo.repository;

import com.shop.demo.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNo(String orderNo);

    /** 按状态筛选 + 分页 */
    Page<Order> findByStatus(String status, Pageable pageable);

    /** Dashboard: 非 CANCELLED 订单的总收入 */
    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status <> 'CANCELLED'")
    long sumTotalExcludingCancelled();

    /** Dashboard: 状态分布 —— 下推 SQL 层 GROUP BY */
    @Query(value = "SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status", nativeQuery = true)
    List<Object[]> countGroupByStatus();

    /** Dashboard: 最近 10 个订单 */
    @Query(value = "SELECT * FROM orders ORDER BY id DESC LIMIT 10", nativeQuery = true)
    List<Order> findRecent10();
}
