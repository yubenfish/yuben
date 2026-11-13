package com.shop.demo.service;

import com.shop.demo.common.BusinessException;
import com.shop.demo.entity.User;
import com.shop.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * 用户服务 —— BCrypt 密码 + 后端 Sessionless
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    /** 注册 —— 账号唯一性校验（SQL 层 existsByUsername 已兜底） */
    public User register(String username, String password, String nickname) {
        if (username == null || username.isBlank()) {
            throw new BusinessException("用户名不能为空");
        }
        if (username.length() < 3 || username.length() > 20) {
            throw new BusinessException("用户名长度需 3-20 字符");
        }
        if (password == null || password.length() < 6) {
            throw new BusinessException("密码至少 6 位");
        }
        if (userRepo.existsByUsername(username)) {
            throw new BusinessException("账号 \"" + username + "\" 已被注册，请换一个");
        }
        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(password));
        u.setNickname(nickname != null && !nickname.isBlank() ? nickname : username);
        return userRepo.save(u);
    }

    /** 登录 —— 区分用户不存在 vs 密码错误，前端可据此决定是否跳转注册 */
    public User login(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new BusinessException("请输入用户名和密码");
        }
        Optional<User> opt = userRepo.findByUsername(username);
        if (opt.isEmpty()) {
            // 🆕 用错误码 404 表示"账号不存在"，前端识别后自动跳注册
            throw new BusinessException(404, "账号 \"" + username + "\" 未注册，请先注册");
        }
        if (!passwordEncoder.matches(password, opt.get().getPassword())) {
            throw new BusinessException("密码错误，请重试");
        }
        return opt.get();
    }

    public Optional<User> findById(Long id) {
        return userRepo.findById(id);
    }

    /** 🆕 更新资料用 */
    public User save(User user) {
        return userRepo.save(user);
    }

    /** 管理端：分页查全部用户 */
    public Page<User> findAll(int page, int size) {
        Pageable p = PageRequest.of(page, size);
        return userRepo.findAll(p);
    }

    /** 🆕 前端注册页可用：检查账号是否已被占用（实时唯一性校验） */
    public boolean usernameExists(String username) {
        return userRepo.existsByUsername(username);
    }
}
