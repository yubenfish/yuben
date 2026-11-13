package com.shop.demo.repository;

import com.shop.demo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 商品 Repository —— 支持分页 / 价格筛选 / 原子库存扣减
 *
 * 前台启用 findEnabled：过滤 enabled=true（已上架）
 * 后台启用 findAllWithFilter：返回全部（含下架）
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

    /** 前台：只返回 enabled=true 的商品 */
    @Query("SELECT p FROM Product p WHERE p.enabled = true AND " +
            "(:cat IS NULL OR LOWER(p.cat) = LOWER(:cat)) " +
            "AND (:kw IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :kw, '%'))) " +
            "AND p.price BETWEEN :minPrice AND :maxPrice " +
            "ORDER BY p.id DESC")
    Page<Product> findEnabled(@Param("cat") String cat,
                              @Param("kw") String kw,
                              @Param("minPrice") int minPrice,
                              @Param("maxPrice") int maxPrice,
                              Pageable pageable);

    /** 后台通用查询：返回全部（含下架） */
    @Query("SELECT p FROM Product p WHERE " +
            "(:cat IS NULL OR LOWER(p.cat) = LOWER(:cat)) " +
            "AND (:kw IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :kw, '%'))) " +
            "AND p.price BETWEEN :minPrice AND :maxPrice " +
            "ORDER BY p.id DESC")
    Page<Product> findAllWithFilter(@Param("cat") String cat,
                                     @Param("kw") String kw,
                                     @Param("minPrice") int minPrice,
                                     @Param("maxPrice") int maxPrice,
                                     Pageable pageable);

    /** 🆕 Dashboard: 分类分布 —— 下推 SQL 层 GROUP BY */
    @Query(value = "SELECT cat, COUNT(*) AS cnt FROM product GROUP BY cat", nativeQuery = true)
    List<Object[]> countGroupByCat();

    /** 🆕 原子扣减库存 —— 单条商品：检查 stock>=qty 后扣减 + 增加销量
     *  @return 影响行数，0 表示库存不足或商品不存在
     */
    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE product SET stock = stock - :qty, sales = sales + :qty " +
            "WHERE id = :id AND stock >= :qty", nativeQuery = true)
    int deductStockAndAddSales(@Param("id") Long id, @Param("qty") int qty);

    /** 🆕 Dashboard 库存预警 —— 低于阈值的商品，按库存升序 */
    @Query("SELECT p FROM Product p WHERE p.stock < :threshold ORDER BY p.stock ASC")
    List<Product> findLowStock(@Param("threshold") int threshold);
}
