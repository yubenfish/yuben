-- ========== MySQL 8.4 schema（兼容 H2 schema.sql 迁移而来） ==========
-- MySQL 方言 vs H2：DATEADD→DATE_ADD, CREATE TABLE IF NOT EXISTS 同义, AUTO_INCREMENT 同义
-- 注意：MySQL 8 默认 utf8mb4 + InnoDB

CREATE DATABASE IF NOT EXISTS shop
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE shop;

-- ========== 用户表 ==========
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(200) NOT NULL,
  nickname   VARCHAR(50),
  phone      VARCHAR(20),
  avatar     VARCHAR(200),
  address    VARCHAR(300),
  bio        VARCHAR(100),
  email      VARCHAR(100),
  role       VARCHAR(10)  DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 商品表 ==========
CREATE TABLE IF NOT EXISTS product (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  price       INT NOT NULL,
  old_price   INT,
  emoji       VARCHAR(10),
  bg          VARCHAR(300),
  cat         VARCHAR(30),
  tag         VARCHAR(20),
  tag_text    VARCHAR(50),
  description TEXT,
  stock       INT NOT NULL DEFAULT 0,
  sales       INT DEFAULT 0,
  rating      DECIMAL(3,2) DEFAULT 4.8,
  review_count INT DEFAULT 0,
  version     INT DEFAULT 0,
  enabled     BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cat (cat),
  KEY idx_tag (tag),
  KEY idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 订单表 ==========
CREATE TABLE IF NOT EXISTS orders (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no        VARCHAR(32) NOT NULL UNIQUE,
  user_id         BIGINT,
  original_total  INT,
  coupon_discount INT DEFAULT 0,
  coupon_code     VARCHAR(32),
  total           INT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PAID',
  shipping        VARCHAR(300),
  remark          TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 订单项表 ==========
CREATE TABLE IF NOT EXISTS order_item (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id     BIGINT NOT NULL,
  product_id   BIGINT NOT NULL,
  product_name VARCHAR(200),
  emoji        VARCHAR(10),
  price        INT NOT NULL,
  qty          INT NOT NULL,
  subtotal     INT NOT NULL,
  KEY idx_order (order_id),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 购物车 ==========
CREATE TABLE IF NOT EXISTS cart (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT,
  product_id BIGINT NOT NULL,
  qty        INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 收藏 ==========
CREATE TABLE IF NOT EXISTS favorites (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product (user_id, product_id),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 评论 ==========
CREATE TABLE IF NOT EXISTS review (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,
  nickname    VARCHAR(50),
  rating      INT NOT NULL,
  content     VARCHAR(500),
  like_count  INT DEFAULT 0,
  liked_by    VARCHAR(2000),
  reply       VARCHAR(500),
  replied_at  TIMESTAMP NULL,
  replied_by  VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_review_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========== 优惠券 ==========
CREATE TABLE IF NOT EXISTS coupon (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(32)  NOT NULL UNIQUE,
  discount   INT          NOT NULL,
  total_min  INT          NOT NULL DEFAULT 0,
  title      VARCHAR(50),
  expire_at  TIMESTAMP NULL,
  used_count INT          DEFAULT 0,
  max_use    INT          DEFAULT 0,
  enabled    BOOLEAN      DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
