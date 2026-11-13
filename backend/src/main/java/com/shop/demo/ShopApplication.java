package com.shop.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * 万物商城 - SpringBoot 启动类
 */
@SpringBootApplication
@EnableCaching   // 🆕 Spring Cache 启用（@Cacheable/@CachePut/@CacheEvict 生效）
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
        System.out.println("\n================================");
        System.out.println(" 万物商城后端已启动 → http://localhost:8081");
        System.out.println("================================\n");
    }
}
