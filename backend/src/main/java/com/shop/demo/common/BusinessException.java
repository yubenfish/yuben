package com.shop.demo.common;

/**
 * 🆕 业务异常 —— Controller 抛这个就会被 GlobalExceptionHandler 转成 Result.err()
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
