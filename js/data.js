/* =========================================================
   js/data.js  —  本地 Mock 数据
   仅在后端 API 不可用时作为 Fallback 使用
   暴露: window._MOCK_PRODUCTS
   ========================================================= */

const _MOCK_PRODUCTS = [
  { id:1,  name:'华为 Mate 60 Pro 旗舰智能手机 12GB+512GB', price:6999, oldPrice:7999, emoji:'📱', bg:'linear-gradient(135deg,#e6f4ff,#bae0ff)', cat:'digital',  tag:'hot',     tagText:'热销' },
  { id:2,  name:'MacBook Air M3 13英寸 轻薄笔记本电脑 512GB', price:8999, oldPrice:9999, emoji:'💻', bg:'linear-gradient(135deg,#f0f0f5,#d9d9e6)', cat:'digital',  tag:'new',     tagText:'新品' },
  { id:3,  name:'索尼 WH-1000XM5 无线降噪头戴式耳机',         price:1999, oldPrice:2899, emoji:'🎧', bg:'linear-gradient(135deg,#fff1f0,#ffa39e)', cat:'digital',  tag:'discount',tagText:'直降900' },
  { id:4,  name:'Nike Air Max 2025 男子气垫缓震运动鞋',      price:899,  oldPrice:1299, emoji:'👟', bg:'linear-gradient(135deg,#e6fffb,#87e8de)', cat:'fashion',  tag:'hot',     tagText:'爆款' },
  { id:5,  name:'优衣库 2026 春季新款纯棉休闲夹克',            price:399,  oldPrice:599,  emoji:'🧥', bg:'linear-gradient(135deg,#fff7e6,#ffd591)', cat:'fashion',  tag:'discount',tagText:'限时' },
  { id:6,  name:'Apple Watch Series 10 GPS 智能手表',          price:2599, oldPrice:2999, emoji:'⌚', bg:'linear-gradient(135deg,#f6ffed,#b7eb8f)', cat:'digital',  tag:'new',     tagText:'新品' },
  { id:7,  name:'戴森 V15 Detect 无绳吸尘器激光显尘',           price:3990, oldPrice:4990, emoji:'🧹', bg:'linear-gradient(135deg,#f9f0ff,#d3adf7)', cat:'home',     tag:'discount',tagText:'省1000' },
  { id:8,  name:'MUJI 日式简约布艺沙发三人位',                  price:2899, oldPrice:3599, emoji:'🛋️', bg:'linear-gradient(135deg,#fffbe6,#ffe58f)', cat:'home',     tag:'hot',     tagText:'热销' },
  { id:9,  name:'兰蔻小黑瓶精华肌底液 50ml 新版',               price:1080, oldPrice:1380, emoji:'💧', bg:'linear-gradient(135deg,#fff0f6,#ffadd2)', cat:'beauty',   tag:'discount',tagText:'会员价' },
  { id:10, name:'DJI Osmo Pocket 3 口袋云台相机',               price:3499, oldPrice:3999, emoji:'📷', bg:'linear-gradient(135deg,#f0f5ff,#adc6ff)', cat:'digital',  tag:'new',     tagText:'新品' },
  { id:11, name:"Levi's 501 Original 复古直筒牛仔裤",           price:499,  oldPrice:699,  emoji:'👖', bg:'linear-gradient(135deg,#e6fffb,#87e8de)', cat:'fashion',  tag:'hot',     tagText:'经典' },
  { id:12, name:'飞利浦电动牙刷 HX9393 智能声波震动',           price:599,  oldPrice:899,  emoji:'🪥', bg:'linear-gradient(135deg,#e6f7ff,#91d5ff)', cat:'home',     tag:'discount',tagText:'直降300' },
];

// 挂到 window 上供 products.js / cart.js Fallback 使用
window._MOCK_PRODUCTS = _MOCK_PRODUCTS;
