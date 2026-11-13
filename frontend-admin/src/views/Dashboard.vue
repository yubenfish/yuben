<template>
  <div v-loading="loading">
    <!-- 4 张统计卡 -->
    <el-row :gutter="18" style="margin-bottom:24px;">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in cards" :key="card.key">
        <el-card class="stat-card" shadow="hover">
          <div class="icon">{{ card.icon }}</div>
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value" :style="{ color: card.color }">
            {{ card.prefix }}{{ card.value }}{{ card.suffix }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="18">
      <el-col :xs="24" :md="16">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;">订单状态分布</span>
            </div>
          </template>
          <div v-if="totalOrders">
            <div class="bar-row" v-for="(count, status) in statusDist" :key="status">
              <div class="head">
                <span>{{ statusMap[status] || status }}</span>
                <span>{{ count }}</span>
              </div>
              <div class="track">
                <div class="fill"
                     :style="{ width: ((count/totalOrders)*100).toFixed(1) + '%', background: statusColors[status] || '#94a3b8' }">
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-hint">暂无订单数据</div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card shadow="never">
          <template #header>
            <span style="font-weight:600;">🏆 热销商品 Top 5</span>
          </template>
          <div v-if="topSelling.length">
            <div class="top-item" v-for="(p, i) in topSelling" :key="p.id">
              <div class="rank">#{{ i + 1 }}</div>
              <div class="emoji">{{ p.emoji || '📦' }}</div>
              <div class="info">
                <div class="name">{{ p.name || '未命名' }}</div>
                <div class="sold">已售 {{ p.sold }} · ¥{{ p.price || 0 }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-hint">暂无销量数据</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboard } from '@/api/dashboard.js'

const loading = ref(false)
const data = ref({ cards: {}, statusDist: {}, topSelling: [] })

const statusMap = { PAID: '已支付', SHIPPED: '已发货', DONE: '已完成', CANCELLED: '已取消' }
const statusColors = { PAID: '#3b82f6', SHIPPED: '#f59e0b', DONE: '#10b981', CANCELLED: '#ef4444' }

const cards = computed(() => [
  { key: 'revenue', label: '总营收',   value: Number(data.value.cards.totalRevenue || 0).toLocaleString(), prefix: '¥', suffix: '',   color: '#4f46e5', icon: '💰' },
  { key: 'product', label: '商品数',   value: data.value.cards.totalProducts || 0,                         prefix: '',  suffix: '',   color: '#10b981', icon: '📦' },
  { key: 'order',   label: '订单数',   value: data.value.cards.totalOrders || 0,                          prefix: '',  suffix: '',   color: '#f59e0b', icon: '📋' },
  { key: 'user',    label: '注册用户', value: data.value.cards.totalUsers || 0,                           prefix: '',  suffix: '',   color: '#ef4444', icon: '👥' }
])

const statusDist = computed(() => data.value.statusDist || {})
const topSelling = computed(() => data.value.topSelling || [])
const totalOrders = computed(() => Object.values(statusDist.value).reduce((a, b) => a + b, 0))

async function load() {
  loading.value = true
  try { data.value = await getDashboard() } finally { loading.value = false }
}

onMounted(load)
defineExpose({ refresh: load })
</script>
