import request from './request.js'

export function login(body) {
  return request.post('/user/login', body)
}

export function register(body) {
  return request.post('/user/register', body)
}

export function listUsers(params = {}) {
  // params: { page, size }
  return request.get('/user/list', { params })
}
