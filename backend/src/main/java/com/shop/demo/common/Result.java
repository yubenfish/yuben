package com.shop.demo.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 🆕 统一响应包装 —— 替代各 Controller 手写的 Map 拼包
 * 前端约定 { code: 0, message: "ok", data: ... }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {

    private int code;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        return new Result<>(0, "ok", data);
    }

    public static <T> Result<T> ok() {
        return new Result<>(0, "ok", null);
    }

    public static <T> Result<T> err(int code, String message) {
        return new Result<>(code, message, null);
    }
}
