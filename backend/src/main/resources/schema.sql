-- ============================================================
-- schema.sql  —  H2 / MySQL 通用建表（保留已有表数据）
-- ============================================================

CREATE TABLE IF NOT EXISTS product (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    price       INT          NOT NULL,
    old_price   INT,
    emoji       VARCHAR(10),
    bg          VARCHAR(200),
    cat         VARCHAR(20),
    tag         VARCHAR(20),
    tag_text    VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS cart (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT       NOT NULL,
    name        VARCHAR(200) NOT NULL,
    price       INT          NOT NULL,
    emoji       VARCHAR(10),
    bg          VARCHAR(200),
    qty         INT          NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(200) NOT NULL,
    nickname    VARCHAR(50),
    phone       VARCHAR(20),
    address     VARCHAR(300),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_no    VARCHAR(32)  NOT NULL UNIQUE,
    user_id     BIGINT,
    total       INT          NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PAID',
    shipping    VARCHAR(300),
    remark      VARCHAR(300),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_item (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT       NOT NULL,
    product_id  BIGINT       NOT NULL,
    name        VARCHAR(200) NOT NULL,
    price       INT          NOT NULL,
    emoji       VARCHAR(10),
    qty         INT          NOT NULL,
    subtotal    INT          NOT NULL
);

-- ========== 🆕 给已有 product 表补新字段（H2 支持 ADD COLUMN IF NOT EXISTS）==========
ALTER TABLE product ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE product ADD COLUMN IF NOT EXISTS stock INT DEFAULT 999 NOT NULL;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sales INT DEFAULT 0 NOT NULL;
ALTER TABLE product ADD COLUMN IF NOT EXISTS rating DOUBLE DEFAULT 4.8;
ALTER TABLE product ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 128;
ALTER TABLE product ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ========== 🆕 cart.user_id：已支持按用户隔离的购物车 ==========
ALTER TABLE cart ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- ========== 🆕 用户评论 / 评分 ==========
CREATE TABLE IF NOT EXISTS review (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    nickname    VARCHAR(50),
    rating      INT          NOT NULL,
    content     VARCHAR(500),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_review_product ON review(product_id);

-- ========== 🆕 评论增强（点赞 + 商家回复）==========
ALTER TABLE review ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE review ADD COLUMN IF NOT EXISTS liked_by VARCHAR(2000);  -- H2 用 VARCHAR 存 JSON 字符串
ALTER TABLE review ADD COLUMN IF NOT EXISTS reply VARCHAR(500);
ALTER TABLE review ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;
ALTER TABLE review ADD COLUMN IF NOT EXISTS replied_by VARCHAR(50);

-- ========== 🆕 订单表：补优惠券字段 ==========
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_total INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount INT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(32);

-- ========== 🆕 优惠券表 ==========
CREATE TABLE IF NOT EXISTS coupon (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(32)  NOT NULL UNIQUE,
    discount   INT          NOT NULL,
    total_min  INT          NOT NULL DEFAULT 0,
    title      VARCHAR(50),
    expire_at  TIMESTAMP,
    used_count INT          DEFAULT 0,
    max_use    INT          DEFAULT 0,
    enabled    BOOLEAN      DEFAULT TRUE
);

-- ========== 🆕 users 表：补个人资料字段 ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_bg VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(10) DEFAULT 'USER';

-- 🆕 product 乐观锁
ALTER TABLE product ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

-- 🆕 商品上架/下架（软删）
ALTER TABLE product ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;

-- ========== 🆕 收藏 / 愿望清单表 ==========
CREATE TABLE IF NOT EXISTS favorites (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_product ON favorites(product_id);
