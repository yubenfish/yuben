<template>
  <el-container class="admin-container" height="100vh">
    <el-aside width="220px" class="admin-aside">
      <div class="sidebar-brand">
        <div class="logo">🛒</div>
        <span>万物商城管理</span>
      </div>
      <el-menu
        :default-active="route.path"
        router
        background-color="transparent"
        text-color="rgba(255,255,255,.65)"
        active-text-color="#fff"
        style="border-right:none;">
        <el-menu-item index="/dashboard"><el-icon><DataAnalysis /></el-icon><span>仪表盘</span></el-menu-item>
        <el-menu-item index="/products"> <el-icon><Goods /></el-icon><span>商品管理</span></el-menu-item>
        <el-menu-item index="/orders">   <el-icon><Tickets /></el-icon><span>订单管理</span></el-menu-item>
        <el-menu-item index="/users">    <el-icon><User /></el-icon><span>用户管理</span></el-menu-item>
        <el-menu-item index="http://127.0.0.1:8080/index.html" target="_blank">
          <el-icon><HomeFilled /></el-icon><span>返回前台</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="page-title">{{ pageTitle }}</div>
        <div class="admin-info">
          <div class="admin-avatar">A</div>
          <span>{{ adminName }}</span>
          <el-button link type="danger" @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const pageTitle = computed(() => route.meta.title || '管理后台')
const adminName = computed(() => localStorage.getItem('admin_username') || '管理员')

function logout() {
  localStorage.removeItem('admin_username')
  router.push('/login')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
