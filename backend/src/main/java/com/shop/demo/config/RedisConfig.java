package com.shop.demo.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

/**
 * 🆕 Redis 配置 —— 可选启用
 * 有 Redis 依赖 + host 可连通时自动生效；否则静默降级纯 MySQL
 */
@Configuration
@ConditionalOnClass(name = "org.springframework.data.redis.core.StringRedisTemplate")
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Autowired(required = false)
    private StringRedisTemplate redis;

    public static boolean REDIS_AVAILABLE = false;

    @PostConstruct
    public void probe() {
        try {
            if (redis == null) return;
            redis.opsForValue().get("__shop_ping__");
            REDIS_AVAILABLE = true;
            log.info("🟢 Redis 已连接 — 库存防超卖 / 热数据缓存 已启用");
        } catch (Exception e) {
            REDIS_AVAILABLE = false;
            log.warn("🟡 Redis 未连接（{}）—— 降级到 MySQL 乐观锁库存扣减", e.getMessage());
        }
    }

    /** 🆕 Lua 脚本 —— 原子检查 + 扣减库存
     *  返回：1 = 扣减成功，0 = 库存不足 / key 不存在
     *  KEYS[1] = "stock:{productId}"
     *  ARGV[1] = qty
     *  ARGV[2] = maxRetryBackfill (秒，可选)
     */
    public static final DefaultRedisScript<Long> DEDUCT_STOCK_SCRIPT = new DefaultRedisScript<>(
            // 先 GET，不存在返回 -1 提示"需要回填"
            "local stock = redis.call('GET', KEYS[1]);" +
            "if stock == nil then return -1 end;" +
            "local s = tonumber(stock);" +
            "if s < tonumber(ARGV[1]) then return 0 end;" +
            "redis.call('DECRBY', KEYS[1], ARGV[1]);" +
            "return 1;",
            Long.class
    );

    /** 🆕 回填 Redis 库存（MySQL 主库 → Redis 热缓存） */
    public void backfillStock(Long productId, int stock) {
        if (redis == null || !REDIS_AVAILABLE) return;
        redis.opsForValue().set("stock:" + productId, String.valueOf(stock));
    }

    /** 🆕 从 Redis 扣减（Lua 原子）；返回 1=成功, 0=不足, -1=key不存在要回填 */
    public long deductStock(Long productId, int qty) {
        if (redis == null || !REDIS_AVAILABLE) return -2; // 没 Redis，让调用方降级 MySQL
        try {
            return redis.execute(DEDUCT_STOCK_SCRIPT,
                    java.util.Collections.singletonList("stock:" + productId),
                    String.valueOf(qty));
        } catch (Exception e) {
            log.warn("Redis 扣减异常，降级 MySQL: {}", e.getMessage());
            return -2;
        }
    }
}
