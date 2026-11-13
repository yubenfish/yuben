-- ============================================================
-- data.sql  —  种入 12 款商品（仅当表为空时插入）
-- ============================================================

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT '华为 Mate 60 Pro 旗舰智能手机 12GB+512GB', 6999, 7999, '📱',
       'linear-gradient(135deg,#e6f4ff,#bae0ff)', 'digital', 'hot', '热销'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE '华为 Mate 60 Pro%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT 'MacBook Air M3 13英寸 轻薄笔记本电脑 512GB', 8999, 9999, '💻',
       'linear-gradient(135deg,#f0f0f5,#d9d9e6)', 'digital', 'new', '新品'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE 'MacBook Air M3%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT '索尼 WH-1000XM5 无线降噪头戴式耳机', 1999, 2899, '🎧',
       'linear-gradient(135deg,#fff1f0,#ffa39e)', 'digital', 'discount', '直降900'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE '索尼 WH-1000XM5%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT 'Nike Air Max 2025 男子气垫缓震运动鞋', 899, 1299, '👟',
       'linear-gradient(135deg,#e6fffb,#87e8de)', 'fashion', 'hot', '爆款'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE 'Nike Air Max 2025%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT '优衣库 2026 春季新款纯棉休闲夹克', 399, 599, '🧥',
       'linear-gradient(135deg,#fff7e6,#ffd591)', 'fashion', 'discount', '限时'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE '优衣库%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT 'Apple Watch Series 10 GPS 智能手表', 2599, 2999, '⌚',
       'linear-gradient(135deg,#f6ffed,#b7eb8f)', 'digital', 'new', '新品'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE 'Apple Watch Series 10%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT '戴森 V15 Detect 无绳吸尘器激光显尘', 3990, 4990, '🧹',
       'linear-gradient(135deg,#f9f0ff,#d3adf7)', 'home', 'discount', '省1000'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE '戴森 V15%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT 'MUJI 日式简约布艺沙发三人位', 2899, 3599, '🛋️',
       'linear-gradient(135deg,#fffbe6,#ffe58f)', 'home', 'hot', '热销'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE 'MUJI%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT '兰蔻小黑瓶精华肌底液 50ml 新版', 1080, 1380, '💧',
       'linear-gradient(135deg,#fff0f6,#ffadd2)', 'beauty', 'discount', '会员价'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE '兰蔻小黑瓶%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT 'DJI Osmo Pocket 3 口袋云台相机', 3499, 3999, '📷',
       'linear-gradient(135deg,#f0f5ff,#adc6ff)', 'digital', 'new', '新品'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE 'DJI Osmo%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT 'Levi''s 501 Original 复古直筒牛仔裤', 499, 699, '👖',
       'linear-gradient(135deg,#e6fffb,#87e8de)', 'fashion', 'hot', '经典'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE 'Levi''s%');

INSERT INTO product (name, price, old_price, emoji, bg, cat, tag, tag_text)
SELECT '飞利浦电动牙刷 HX9393 智能声波震动', 599, 899, '🪥',
       'linear-gradient(135deg,#e6f7ff,#91d5ff)', 'home', 'discount', '直降300'
WHERE NOT EXISTS (SELECT 1 FROM product WHERE name LIKE '飞利浦电动牙刷%');

-- ============================================================
-- 🆕 示例评论（仅当对应商品尚无评论时插入，幂等）
-- ============================================================

-- 华为 Mate 60 Pro
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '数码发烧友', 5, '麒麟芯片太强了！拍照、信号、做工全是顶级。'
FROM product p WHERE p.name LIKE '华为 Mate 60 Pro%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '麒麟芯片太强了！拍照、信号、做工全是顶级。');

INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '商务人士', 4, '整体满意，就是价格偏高，期待下一代。'
FROM product p WHERE p.name LIKE '华为 Mate 60 Pro%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '整体满意，就是价格偏高，期待下一代。');

-- MacBook Air M3
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '设计师小李', 5, '轻薄又强劲，M3 芯片剪视频丝滑流畅！'
FROM product p WHERE p.name LIKE 'MacBook Air M3%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '轻薄又强劲，M3 芯片剪视频丝滑流畅！');

INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '程序员阿强', 4, '续航真的顶，但 C 口太少了。'
FROM product p WHERE p.name LIKE 'MacBook Air M3%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '续航真的顶，但 C 口太少了。');

-- 索尼 WH-1000XM5
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '音乐爱好者', 5, '降噪效果无敌，坐飞机地铁都安静。音质也棒！'
FROM product p WHERE p.name LIKE '索尼 WH-1000XM5%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '降噪效果无敌，坐飞机地铁都安静。音质也棒！');

INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '通勤党', 5, '戴一整天也不夹头，续航 30 小时名不虚传。'
FROM product p WHERE p.name LIKE '索尼 WH-1000XM5%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '戴一整天也不夹头，续航 30 小时名不虚传。');

-- AirPods Pro 2
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '果粉', 5, '空间音频太酷了，通透模式过马路也安全。'
FROM product p WHERE p.name LIKE 'AirPods Pro 2%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '空间音频太酷了，通透模式过马路也安全。');

INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '跑步达人', 4, '佩戴很稳，就是出汗多了会滑。'
FROM product p WHERE p.name LIKE 'AirPods Pro 2%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '佩戴很稳，就是出汗多了会滑。');

-- 雅诗兰黛小棕瓶
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '护肤达人', 5, '维稳神器！换季脸痒抹它第二天就好。'
FROM product p WHERE p.name LIKE '雅诗兰黛小棕瓶%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '维稳神器！换季脸痒抹它第二天就好。');

INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '敏感肌姐姐', 4, '质地清爽不闷痘，就是用量省得离谱一瓶能用半年。'
FROM product p WHERE p.name LIKE '雅诗兰黛小棕瓶%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '质地清爽不闷痘，就是用量省得离谱一瓶能用半年。');

-- 戴森 V15 Detect
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '家务克星', 5, '激光探测太牛了，肉眼看不见的灰尘全被照出来！'
FROM product p WHERE p.name LIKE '戴森 V15 Detect%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '激光探测太牛了，肉眼看不见的灰尘全被照出来！');

INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '养宠家庭', 5, '吸猫毛一绝，地毯沙发床垫都救了。'
FROM product p WHERE p.name LIKE '戴森 V15 Detect%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '吸猫毛一绝，地毯沙发床垫都救了。');

-- 小米智能手环
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '运动青年', 4, '性价比高，功能齐全，屏幕再大点就完美了。'
FROM product p WHERE p.name LIKE '小米智能手环%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '性价比高，功能齐全，屏幕再大点就完美了。');

-- Levi''s 501
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '复古控', 5, '经典就是经典，版型正，洗水自然。'
FROM product p WHERE p.name LIKE 'Levi''s%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '经典就是经典，版型正，洗水自然。');

-- 飞利浦电动牙刷
INSERT INTO review (product_id, user_id, nickname, rating, content)
SELECT p.id, 0, '牙医推荐', 5, '声波震动温和不出血，刷头能用 3 个月。'
FROM product p WHERE p.name LIKE '飞利浦电动牙刷%'
AND NOT EXISTS (SELECT 1 FROM review r WHERE r.product_id = p.id AND r.content = '声波震动温和不出血，刷头能用 3 个月。');

-- ========== 🆕 优惠券种子数据（3 张）==========
INSERT INTO coupon (code, discount, total_min, title, expire_at, max_use)
SELECT 'MEGA50', 50, 100, '新人满100减50', DATE_ADD(NOW(), INTERVAL 1 YEAR), 0
WHERE NOT EXISTS (SELECT 1 FROM coupon WHERE code = 'MEGA50');

INSERT INTO coupon (code, discount, total_min, title, expire_at, max_use)
SELECT 'SHOP20', 20, 0, '全场立减20', DATE_ADD(NOW(), INTERVAL 1 YEAR), 100
WHERE NOT EXISTS (SELECT 1 FROM coupon WHERE code = 'SHOP20');

INSERT INTO coupon (code, discount, total_min, title, expire_at, max_use)
SELECT 'VIP100', 100, 300, '满300减100', DATE_ADD(NOW(), INTERVAL 3 MONTH), 50
WHERE NOT EXISTS (SELECT 1 FROM coupon WHERE code = 'VIP100');

-- ========== 🆕 回写商品的 平均评分 + 评论数（种子评论写入后执行）==========
