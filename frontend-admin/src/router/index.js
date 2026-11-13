import { createRouter, createWebHashHistory } from 'vue-router'

// 登录状态：localStorage 存 admin_username 即视为已登录
function isLoggedIn() {
  return !!localStorage.getItem('admin_username')
}

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'products',  name: 'Products',  component: () => import('@/views/ProductList.vue'), meta: { title: '商品管理' } },
      { path: 'orders',    name: 'Orders',    component: () => import('@/views/OrderList.vue'),   meta: { title: '订单管理' } },
      { path: 'users',     name: 'Users',     component: () => import('@/views/UserList.vue'),    meta: { title: '用户管理' } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.public || isLoggedIn()) next()
  else next('/login')
})

export default router
