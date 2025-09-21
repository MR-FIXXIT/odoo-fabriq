import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLedger } from '../api/stock'

export default function StockPage(){
  const { data: ledger = [] } = useQuery(['ledger'], fetchLedger)
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Stock Ledger</h2>
      <div className="bg-white p-4 rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th>Product</th><th>Change</th><th>Balance</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map(row => (
              <tr key={row.id} className="border-t">
                <td>{row.product_name}</td>
                <td>{row.quantity_change}</td>
                <td>{row.balance}</td>
                <td className="text-xs text-gray-500">{new Date(row.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}