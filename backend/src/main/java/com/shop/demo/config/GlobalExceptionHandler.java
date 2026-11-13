package com.shop.demo.config;

import com.shop.demo.common.BusinessException;
import com.shop.demo.common.Result;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * 全局异常处理器 —— 把异常统一转成 Result.err() 响应
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 🆕 JSR-303 校验失败 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return Result.err(400, "参数校验失败: " + msg);
    }

    /** 业务异常 */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException ex) {
        return Result.err(ex.getCode(), ex.getMessage());
    }

    /** 运行时异常（多数 Service 层抛的 RuntimeException） */
    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntime(RuntimeException ex) {
        return Result.err(400, ex.getMessage() == null ? "操作失败" : ex.getMessage());
    }

    /** 兜底 */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleOther(Exception ex) {
        return Result.err(500, "服务器内部错误: " + (ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage()));
    }
}
