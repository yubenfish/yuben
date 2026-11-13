package com.shop.demo.controller;

import com.shop.demo.common.Result;
import com.shop.demo.config.JWTTool;
import com.shop.demo.entity.User;
import com.shop.demo.service.CartService;
import com.shop.demo.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户 API —— 🆕 JWT 登录签发 Token
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private JWTTool jwt;
    @Autowired private CartService cartService;   // 🆕 登录后 merge 购物车

    /** 🆕 注册 → 签发 JWT → 返回 { user, accessToken } */
    @PostMapping("/register")
    public Result<Map<String, Object>> register(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String u = body.get("username");
        String p = body.get("password");
        if (u == null || p == null) return Result.err(400, "用户名和密码必填");
        User user = userService.register(u, p, body.get("nickname"));
        // 🆕 先 merge（此时 password 还在，Hibernate flush 不报错）
        // 从 X-Guest-Id header 取当前浏览器的游客购物车 → 只 merge 这一个浏览器
        String guestId = request.getHeader("X-Guest-Id");
        cartService.mergeGuestToUser(user.getId(), guestId);
        // 再清密码（为了不返回给前端）
        user.setPassword(null);
        return tokenOk(user);
    }

    /** 🆕 登录 → 签发 JWT → 返回 { user, accessToken } */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        User user = userService.login(body.get("username"), body.get("password"));
        // 🆕 先 merge（此时 password 还在）
        String guestId = request.getHeader("X-Guest-Id");
        cartService.mergeGuestToUser(user.getId(), guestId);
        user.setPassword(null);
        return tokenOk(user);
    }

    /** 🆕 从 JWT 里解析当前登录用户（前端刷新页面恢复用） */
    @GetMapping("/me")
    public Result<User> me(HttpServletRequest request) {
        Long uid = (Long) request.getAttribute("currentUserId");
        if (uid == null) return Result.err(401, "未登录");
        return userService.findById(uid)
                .map(u -> { u.setPassword(null); return Result.ok(u); })
                .orElse(Result.err(404, "用户不存在"));
    }

    private Result<Map<String, Object>> tokenOk(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("accessToken", jwt.issue(user.getId(), user.getRole()));
        data.put("tokenType", "Bearer");
        data.put("expiresIn", 60 * 24);   // 分钟（24h）
        return Result.ok(data);
    }

    @GetMapping("/{id}")
    public Result<User> get(@PathVariable Long id) {
        return userService.findById(id)
                .map(u -> { u.setPassword(null); return Result.ok(u); })
                .orElse(Result.err(404, "用户不存在"));
    }

    /** 管理端：用户列表（分页） */
    @GetMapping("/list")
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<User> p = userService.findAll(Math.max(0, page - 1), Math.min(Math.max(1, size), 100));
        p.getContent().forEach(u -> u.setPassword(null));
        Map<String, Object> data = new HashMap<>();
        data.put("items", p.getContent());
        data.put("total", p.getTotalElements());
        data.put("page", p.getNumber() + 1);
        data.put("size", p.getSize());
        data.put("pages", p.getTotalPages());
        return Result.ok(data);
    }

    /** 🆕 前端注册页：实时检查账号是否已被占用 */
    @GetMapping("/check-username")
    public Result<Map<String, Object>> checkUsername(@RequestParam String username) {
        boolean exists = userService.usernameExists(username);
        Map<String, Object> data = new HashMap<>();
        data.put("username", username);
        data.put("exists", exists);
        data.put("available", !exists);
        return Result.ok(data);
    }

    /** 🆕 退出登录（前端清 localStorage，这里返回成功即可） */
    @PostMapping("/logout")
    public Result<?> logout() {
        return Result.ok(null);
    }

    /** 🆕 更新个人资料（昵称 / 头像 / 签名 / 邮箱 / 手机 / 地址） */
    @PutMapping("/{id}/profile")
    public Result<User> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userService.findById(id).orElse(null);
        if (user == null) return Result.err(404, "用户不存在");
        // 安全地逐字段更新（null / 空串 不覆盖旧值）
        if (body.containsKey("nickname") && body.get("nickname") != null) user.setNickname(body.get("nickname").length() > 50 ? body.get("nickname").substring(0,50) : body.get("nickname"));
        if (body.containsKey("avatar") && body.get("avatar") != null) user.setAvatar(body.get("avatar"));
        if (body.containsKey("avatarBg") && body.get("avatarBg") != null) user.setAvatarBg(body.get("avatarBg"));
        if (body.containsKey("bio") && body.get("bio") != null) user.setBio(body.get("bio").length() > 100 ? body.get("bio").substring(0,100) : body.get("bio"));
        if (body.containsKey("email") && body.get("email") != null) user.setEmail(body.get("email"));
        if (body.containsKey("phone") && body.get("phone") != null) user.setPhone(body.get("phone"));
        if (body.containsKey("address") && body.get("address") != null) user.setAddress(body.get("address"));
        User saved = userService.save(user);
        saved.setPassword(null);
        return Result.ok(saved);
    }
}
