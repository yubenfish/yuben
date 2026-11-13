import request from './request.js'

export function listProducts(params = {}) {
  // params: { cat, keyword, page, size }
  return request.get('/products', { params })
}

export function getProduct(id) {
  return request.get(`/products/${id}`)
}

export function createProduct(data) {
  return request.post('/products', data)
}

export function updateProduct(id, data) {
  return request.put(`/products/${id}`, data)
}

export function removeProduct(id) {
  return request.delete(`/products/${id}`)
}
