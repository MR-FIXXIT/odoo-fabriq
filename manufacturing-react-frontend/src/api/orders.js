import * as mock from '../lib/mockServer'

export async function fetchOrders(){
  mock.seedDemo()
  return mock.getOrders()
}
export async function fetchOrder(id){
  return mock.getOrderById(id)
}
export async function createOrder(payload){
  return mock.createOrder(payload)
}