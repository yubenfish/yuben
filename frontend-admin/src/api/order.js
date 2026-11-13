import request from './request.js'

export function listOrders(params = {}) {
  // params: { status, page, size }
  return request.get('/orders', { params })
}

export function shipOrder(orderNo) {
  return request.put(`/orders/${orderNo}/ship`)
}

export function doneOrder(orderNo) {
  return request.put(`/orders/${orderNo}/done`)
}

export function cancelOrder(orderNo) {
  return request.put(`/orders/${orderNo}/cancel`)
}
