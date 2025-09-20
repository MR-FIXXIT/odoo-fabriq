import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchWorkOrder } from '../api/workOrders'

export default function WOControl({ wo }){
  const qc = useQueryClient()
  const mutation = useMutation((p) => patchWorkOrder(wo.id, p), { onSuccess: () => qc.invalidateQueries(['orders','workorders']) })

  return (
    <div className="flex items-center gap-2">
      {wo.state !== 'started' && <button onClick={() => mutation.mutate({ state: 'started' })} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Start</button>}
      {wo.state === 'started' && <button onClick={() => mutation.mutate({ state: 'paused' })} className="px-2 py-1 bg-yellow-500 text-black rounded text-sm">Pause</button>}
      {wo.state !== 'done' && <button onClick={() => mutation.mutate({ state: 'done' })} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Complete</button>}
    </div>
  )
}