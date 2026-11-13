package com.shop.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 🆕 密码加密配置 —— 统一 BCryptPasswordEncoder
 * 只引入 spring-security-crypto，不启用完整 Spring Security 过滤器链
 */
@Configuration
public class PasswordConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
