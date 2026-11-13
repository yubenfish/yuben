<template>
  <div class="login-wrap">
    <div class="login-card">
      <h2>万物商城 · 管理后台</h2>
      <p class="sub">Vue 3 + Vite + Element Plus</p>

      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" size="large">
        <el-form-item label="管理员账号" prop="username">
          <el-input v-model="form.username" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="admin123" show-password @keyup.enter="submit" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width:100%" :loading="loading" @click="submit">登 录</el-button>
        </el-form-item>
      </el-form>

      <p class="login-tip">
        演示账号：<code>admin</code> / <code>admin123</code><br>
        或先用前台注册任意账号
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login as loginApi } from '@/api/user.js'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: 'admin', password: 'admin123' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function submit() {
  try {
    await formRef.value.validate()
  } catch { return }

  loading.value = true
  try {
    // 硬编码 admin 直接放行（演示用）
    if (form.username === 'admin' && form.password === 'admin123') {
      localStorage.setItem('admin_username', form.username)
      router.push('/dashboard')
      return
    }
    // 否则尝试后端登录
    await loginApi({ username: form.username, password: form.password })
    localStorage.setItem('admin_username', form.username)
    router.push('/dashboard')
  } catch {
    // ElMessage 已由 request 拦截器弹出
  } finally {
    loading.value = false
  }
}
</script>
