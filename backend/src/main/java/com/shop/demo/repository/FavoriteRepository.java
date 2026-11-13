package com.shop.demo.repository;

import com.shop.demo.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 🆕 收藏 Repository
 */
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Page<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.userId = :uid AND f.productId = :pid")
    int deleteByUserIdAndProductId(@Param("uid") Long userId, @Param("pid") Long productId);
}
