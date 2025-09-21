import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchBOMs } from '../api/boms'

export default function BOMsPage(){
  const { data: boms = [] } = useQuery(['boms'], fetchBOMs)
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Bills of Materials</h2>
      <div className="grid gap-3">

        {boms.map(b => (
          <div key={b.id} className="bg-white p-3 rounded shadow">
            <div className="font-medium">{b.name}</div>
            <div className="text-sm text-gray-500">Components: {b.components?.length || 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}