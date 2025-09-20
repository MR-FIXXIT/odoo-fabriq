import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchOrder } from '../api/orders'
import WOControl from '../components/WOControl'

export default function OrderDetailPage(){
  const { id } = useParams()
  const { data: order } = useQuery(['order', id], () => fetchOrder(id))
  if(!order) return <div>Loading...</div>

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold">Order #{order.id} — {order.product_name}</h2>
      <div className="mt-3 text-sm text-gray-600">Quantity: {order.quantity}</div>
      <div className="mt-3">
        <h4 className="font-medium">Work Orders</h4>
        <ul className="mt-2">
          {(order.work_orders || []).map(wo => (
            <li key={wo.id} className="border p-2 my-2 rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{wo.operation_name}</div>
                <div className="text-xs text-gray-500">{wo.work_center} • {wo.estimated_minutes} mins</div>
              </div>
              <WOControl wo={wo} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}