import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOrders } from '../../api/orders'
import { Link } from 'react-router-dom'

export default function OrderListCompact(){
  const { data: orders = [] } = useQuery(['orders'], fetchOrders)
  return (
    <ul className="space-y-2">
      {orders.slice(0,6).map(o => (
        <li key={o.id} className="border p-2 rounded flex justify-between items-center">
          <div>
            <div className="font-medium">{o.product_name} × {o.quantity}</div>
            <div className="text-xs text-gray-500">{o.state} • {new Date(o.scheduled_start).toLocaleDateString()}</div>
          </div>
          <Link to={`/orders/${o.id}`} className="text-indigo-600">Open</Link>
        </li>
      ))}
      {orders.length === 0 && <li className="text-sm text-gray-500">No orders found</li>}
    </ul>
  )
}