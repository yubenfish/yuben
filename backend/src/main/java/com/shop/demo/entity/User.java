package com.shop.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 用户实体（含个人资料字段）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度 3-50")
    @Column(nullable = false, length = 50, unique = true)
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 200, message = "密码至少 6 位")
    @Column(nullable = false, length = 200)
    private String password;

    @Size(max = 50)
    @Column(length = 50)
    private String nickname;

    @Size(max = 20)
    @Column(length = 20)
    private String phone;

    @Size(max = 300)
    @Column(length = 300)
    private String address;

    // ===== 🆕 个人资料字段 =====

    /** emoji 头像，如 👤 🦊 🐱 */
    @Size(max = 10)
    @Column(name = "avatar", length = 10)
    private String avatar;

    /** 头像渐变背景色，如 linear-gradient(135deg,#ffb6c1,#ff69b4) */
    @Size(max = 100)
    @Column(name = "avatar_bg", length = 100)
    private String avatarBg;

    /** 个性签名 */
    @Size(max = 100)
    @Column(name = "bio", length = 100)
    private String bio;

    /** 邮箱 */
    @Email(message = "邮箱格式不正确")
    @Size(max = 100)
    @Column(name = "email", length = 100)
    private String email;

    /** 🆕 角色：USER / ADMIN */
    @Column(name = "role", length = 10)
    private String role = "USER";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
