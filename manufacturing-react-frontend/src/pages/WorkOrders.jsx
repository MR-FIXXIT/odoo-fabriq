import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchWorkOrders } from '../api/workOrders'
import WOControl from '../components/WOControl'

export default function WorkOrdersPage(){
  const { data: wos = [] } = useQuery(['workorders'], fetchWorkOrders)
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Work Orders</h2>
      <div className="grid gap-3">
        {wos.map(wo => (
          <div key={wo.id} className="bg-white p-3 rounded shadow flex justify-between">
            <div>
              <div className="font-medium">{wo.operation_name} — {wo.product_name || ''}</div>
              <div className="text-xs text-gray-500">{wo.work_center} • {wo.estimated_minutes} mins</div>
            </div>
            <WOControl wo={wo} />
          </div>
        ))}
      </div>
    </div>
  )
}