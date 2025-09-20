// Minimal in-memory mock server for frontend-only development
let COUNTERS = { order: 1, wo: 1, bom: 1, ledger: 1 }
const db = { orders: [], workOrders: [], boms: [], ledger: [] }

export function seedDemo(){
  if(db.boms.length) return
  const bom = {
    id: COUNTERS.bom++, name: 'Wooden Table', product_code: 'TABLE-001', components: [
      { name: 'Wooden Leg', sku: 'LEG-01', qty: 4 },
      { name: 'Wooden Top', sku: 'TOP-01', qty: 1 },
      { name: 'Screw', sku: 'SCR-01', qty: 12 },
      { name: 'Varnish', sku: 'VAR-01', qty: 1 }
    ], operations: [
      { name: 'Assembly', minutes: 60 },
      { name: 'Painting', minutes: 30 },
      { name: 'Packing', minutes: 20 }
    ]
  }
  db.boms.push(bom)

  const order = {
    id: COUNTERS.order++, product_name: 'Wooden Table', product_code: bom.product_code, quantity: 10,
    scheduled_start: new Date().toISOString(), state: 'planned', assignee: null, bom_id: bom.id
  }
  db.orders.push(order)

  bom.operations.forEach((op, idx) => {
    db.workOrders.push({ id: COUNTERS.wo++, order_id: order.id, product_name: order.product_name, operation_name: op.name, work_center: idx===0? 'Assembly Line' : idx===1 ? 'Paint Floor' : 'Packing', estimated_minutes: op.minutes, state: 'pending' })
  })

  db.ledger.push({ id: COUNTERS.ledger++, product_name: 'Wooden Leg', quantity_change: -40, balance: 960, date: new Date().toISOString() })
}

export function getOrders(){ return db.orders }
export function getOrderById(id){
  const o = db.orders.find(o => o.id === Number(id))
  if(!o) return null
  // attach work orders for convenience
  const work_orders = db.workOrders.filter(w => w.order_id === o.id)
  return { ...o, work_orders }
}
export function getWorkOrders(){ return db.workOrders }
export function getBOMs(){ return db.boms }
export function getLedger(){ return db.ledger }
export function updateWO(id, patch){
  const wo = db.workOrders.find(w => w.id === Number(id))
  if(!wo) throw new Error('WO not found')
  Object.assign(wo, patch)
  return wo
}
export function createOrder(payload){
  const id = COUNTERS.order++
  const newOrder = { id, ...payload, state: 'planned', scheduled_start: payload.scheduled_start || new Date().toISOString() }
  db.orders.unshift(newOrder)
  return newOrder
}