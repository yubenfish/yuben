<template>
  <div v-loading="loading">
    <!-- 工具栏 -->
    <el-card class="table-card" shadow="never" style="margin-bottom:18px;">
      <el-form inline>
        <el-form-item label="搜索">
          <el-input v-model="keyword" placeholder="商品名关键词" clearable style="width:240px;" @clear="load" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="cat" placeholder="全部分类" clearable style="width:160px;" @change="resetAndLoad">
            <el-option v-for="(v, k) in catMap" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="resetAndLoad">搜索</el-button>
          <el-button type="success" :icon="Plus" @click="openForm()">+ 新增商品</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 + 分页 -->
    <el-card class="table-card" shadow="never" style="padding:0;">
      <el-table :data="page.items" style="width:100%;" stripe empty-text="暂无商品">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <span style="font-size:24px;">{{ row.emoji || '📦' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">{{ catMap[row.cat] || row.cat || '-' }}</template>
        </el-table-column>
        <el-table-column label="价格" width="110">
          <template #default="{ row }"><b>¥{{ row.price }}</b></template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column label="销量" width="80">
          <template #default="{ row }">{{ row.sales || 0 }}</template>
        </el-table-column>
        <el-table-column label="评分" width="110">
          <template #default="{ row }">⭐ {{ row.rating || 4.8 }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openForm(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新增商品'" width="520px" destroy-on-close>
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="90px">
        <el-form-item label="商品名" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%;" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="form.oldPrice" :min="0" :precision="2" :allow-null="true" style="width:100%;" />
        </el-form-item>
        <el-form-item label="Emoji">
          <el-input v-model="form.emoji" placeholder="📦" />
        </el-form-item>
        <el-form-item label="分类" prop="cat">
          <el-select v-model="form.cat" style="width:100%;">
            <el-option v-for="(v, k) in catMap" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" style="width:100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { listProducts, createProduct, updateProduct, removeProduct } from '@/api/product.js'

const catMap = { digital: '数码', fashion: '服饰', home: '家居', beauty: '美妆', food: '生鲜', sport: '运动', book: '图书', baby: '母婴' }

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const keyword = ref('')
const cat = ref('')
const formRef = ref()

/** 🆕 分页状态 */
const page = reactive({
  items: [], total: 0, page: 1, size: 10, pages: 0
})

const form = reactive({
  id: null, name: '', price: 0, oldPrice: null,
  emoji: '📦', cat: 'digital', stock: 999, description: ''
})
const formRules = {
  name:  [{ required: true, message: '请输入商品名', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  cat:   [{ required: true, message: '请选择分类', trigger: 'change' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

async function load() {
  loading.value = true
  try {
    const data = await listProducts({ keyword: keyword.value, cat: cat.value, page: page.page, size: page.size })
    Object.assign(page, data)
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  page.page = 1
  load()
}

function openForm(row) {
  if (row) Object.assign(form, row)
  else Object.assign(form, { id: null, name: '', price: 0, oldPrice: null, emoji: '📦', cat: 'digital', stock: 999, description: '' })
  dialogVisible.value = true
}

async function handleSubmit() {
  try { await formRef.value.validate() } catch { return }
  submitting.value = true
  try {
    if (form.id) { await updateProduct(form.id, { ...form }); ElMessage.success('更新成功') }
    else { await createProduct({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false
    await load()
  } finally { submitting.value = false }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除商品 "${row.name}"？`, '提示', { type: 'warning' })
    await removeProduct(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (e) { if (e !== 'cancel') ElMessage.error(e.message || '删除失败') }
}

onMounted(load)
defineExpose({ refresh: load })
</script>
