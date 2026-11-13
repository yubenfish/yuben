<template>
  <div v-loading="loading">
    <!-- 工具栏 -->
    <el-card class="table-card" shadow="never" style="margin-bottom:18px;">
      <el-form inline>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width:160px;" @change="resetAndLoad">
            <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="load">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 + 分页 -->
    <el-card class="table-card" shadow="never" style="padding:0;">
      <el-table :data="page.orders" stripe empty-text="暂无订单">
        <el-table-column label="订单号" min-width="180">
          <template #default="{ row }">
            <span style="font-family:monospace;font-size:12px;">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="90">
          <template #default="{ row }">#{{ row.userId || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }"><b>¥{{ row.total }}</b></template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status]" effect="light">{{ statusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'PAID'"  link type="warning" :icon="Van" @click="handleShip(row)">发货</el-button>
            <el-button v-if="row.status === 'SHIPPED'" link type="success" :icon="CircleCheck" @click="handleDone(row)">完成</el-button>
            <el-button v-if="row.status === 'PAID'"  link type="danger" :icon="Close" @click="handleCancel(row)">取消</el-button>
            <span v-if="row.status === 'DONE'"   style="color:#10b981;font-size:12px;">✓ 已完成</span>
            <span v-if="row.status === 'CANCELLED'" style="color:#999;font-size:12px;">已取消</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 🆕 分页 -->
      <div style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#6b7280;">共 {{ page.total }} 条</span>
        <el-pagination
          v-model:current-page="page.page"
          v-model:page-size="page.size"
          :page-sizes="[10, 20, 50]"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="load"
          @current-change="load" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Van, CircleCheck, Close } from '@element-plus/icons-vue'
import { listOrders, shipOrder, doneOrder, cancelOrder } from '@/api/order.js'

const statusMap = { PAID: '已支付', SHIPPED: '已发货', DONE: '已完成', CANCELLED: '已取消' }
const statusTagType = { PAID: '', SHIPPED: 'warning', DONE: 'success', CANCELLED: 'info' }

const loading = ref(false)
const statusFilter = ref('')

/** 🆕 分页状态 */
const page = reactive({
  orders: [], total: 0, page: 1, size: 10, pages: 0
})

function formatTime(t) {
  return (t || '').replace('T', ' ').substring(0, 16) || '-'
}

async function load() {
  loading.value = true
  try {
    const data = await listOrders({ status: statusFilter.value || undefined, page: page.page, size: page.size })
    Object.assign(page, data)
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  page.page = 1
  load()
}

async function handleShip(row) {
  try {
    await ElMessageBox.confirm(`确定发货订单 ${row.orderNo}？`, '发货确认', { type: 'warning' })
    await shipOrder(row.orderNo); ElMessage.success('发货成功'); await load()
  } catch {}
}
async function handleDone(row) {
  try {
    await ElMessageBox.confirm(`确定确认收货 ${row.orderNo}？`, '完成确认', { type: 'warning' })
    await doneOrder(row.orderNo); ElMessage.success('已完成'); await load()
  } catch {}
}
async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(`确定取消订单 ${row.orderNo}？`, '取消确认', { type: 'warning' })
    await cancelOrder(row.orderNo); ElMessage.success('已取消'); await load()
  } catch {}
}

onMounted(load)
defineExpose({ refresh: load })
</script>
