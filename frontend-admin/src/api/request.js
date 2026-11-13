import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',        // vite proxy 转发到 http://localhost:8081/api
  timeout: 10000
})

// 响应拦截：统一处理后端 {code, message, data} 格式
request.interceptors.response.use(
  res => {
    const body = res.data
    if (body && body.code !== undefined) {
      if (body.code === 0) return body.data          // 业务成功，直接返回 data
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message))
    }
    return body                                     // 非标准响应（如直接返回数组）
  },
  err => {
    ElMessage.error(err.response?.data?.message || err.message || '网络错误')
    return Promise.reject(err)
  }
)

export default request
