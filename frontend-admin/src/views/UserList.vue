<template>
  <div v-loading="loading">
    <el-card class="table-card" shadow="never" style="padding:0;">
      <el-table :data="page.items" stripe empty-text="暂无注册用户">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="nickname" label="昵称" min-width="150">
          <template #default="{ row }">{{ row.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default>
            <el-tag type="success" effect="light">正常</el-tag>
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
import { reactive, onMounted } from 'vue'
import { listUsers } from '@/api/user.js'

const loading = reactive({ v: false })

/** 🆕 分页状态 */
const page = reactive({
  items: [], total: 0, page: 1, size: 10, pages: 0
})

function formatTime(t) {
  return (t || '').replace('T', ' ').substring(0, 16) || '-'
}

async function load() {
  loading.v = true
  try {
    const data = await listUsers({ page: page.page, size: page.size })
    Object.assign(page, data)
  } catch { page.items = [] } finally { loading.v = false }
}

onMounted(load)
defineExpose({ refresh: load })
</script>
