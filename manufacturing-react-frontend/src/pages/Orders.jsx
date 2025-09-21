import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchOrders } from '../api/orders'
import CreateMOModal from './_partials/CreateMOModal'
import { Link } from 'react-router-dom'

export default function OrdersPage(){
  const [filter, setFilter] = useState('all')
  const qc = useQueryClient()
  const { data: orders = [] } = useQuery(['orders', filter], fetchOrders)
  const [open, setOpen] = React.useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Manufacturing Orders</h2>
        <div className="flex gap-2">
          <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="border p-2 rounded">
            <option value="all">All</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
          <button onClick={()=>setOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Create MO</button>
        </div>
      </div>

      <div className="grid gap-3">
        {orders.map(o => (
          <div key={o.id} className="bg-white p-3 rounded shadow flex justify-between">
            <div>
              <div className="font-medium">{o.product_name} × {o.quantity}</div>
              <div className="text-xs text-gray-500">{o.state} • {o.assignee || 'Unassigned'}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link to={`/orders/${o.id}`} className="text-indigo-600">Open</Link>
            </div>
          </div>
        ))}
      </div>

      {open && <CreateMOModal onClose={()=>{ setOpen(false); qc.invalidateQueries(['orders']) }} />}
    </div>
  )
}