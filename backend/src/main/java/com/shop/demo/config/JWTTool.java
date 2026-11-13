package com.shop.demo.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 工具 —— 签发 / 解析 / 校验
 * 使用 JJWT 0.12.x（纯 Java，无 Spring Security 强依赖）
 *
 * Token 结构：
 *   Header  { alg: "HS256", typ: "JWT" }
 *   Payload { sub: "1", role: "USER", iat: ..., exp: ... }
 *   Signature HMAC-SHA256(key, header.payload)
 */
@Component
public class JWTTool {

    @Value("${shop.jwt.secret:万物商城-dev-secret-key-must-be-at-least-32-chars-long}")
    private String secret;

    @Value("${shop.jwt.expire-minutes:1440}")
    private long expireMinutes;

    /** 签发 Access Token（默认 24h，admin 可单独设更长） */
    public String issue(Long userId, String role) {
        return issue(userId, role, expireMinutes);
    }

    public String issue(Long userId, String role, long minutes) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role == null ? "USER" : role)
                .issuedAt(new Date(now))
                .expiration(new Date(now + minutes * 60_000L))
                .signWith(getKey())
                .compact();
    }

    /** 解析并校验 Token（返回 Claims；过期/篡改返回 null） */
    public Claims parse(String token) {
        if (token == null || token.isBlank()) return null;
        try {
            return Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            return null;   // 过期
        } catch (MalformedJwtException | SignatureException | IllegalArgumentException e) {
            return null;   // 篡改 / 格式错
        }
    }

    /** 从 Authorization header 提取 Token */
    public String extract(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return authHeader.substring(7).trim();
    }

    private SecretKey getKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        // HMAC-SHA256 要求 key >= 256 bits (32 bytes)
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            return Keys.hmacShaKeyFor(padded);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
