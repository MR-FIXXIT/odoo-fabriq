import * as mock from '../lib/mockServer'
export async function fetchWorkOrders(){ mock.seedDemo(); return mock.getWorkOrders() }
export async function patchWorkOrder(id, payload){ return mock.updateWO(id, payload) }