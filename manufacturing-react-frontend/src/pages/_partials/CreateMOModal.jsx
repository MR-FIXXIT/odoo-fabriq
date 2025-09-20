import React from 'react'
import { useForm } from 'react-hook-form'
import { createOrder } from '../../api/orders'
import { useMutation } from '@tanstack/react-query'

export default function CreateMOModal({ onClose }){
  const { register, handleSubmit } = useForm({ defaultValues: { quantity: 1 } })
  const mutation = useMutation((d)=> createOrder(d), { onSuccess: onClose })

  const onSubmit = (data) => {
    mutation.mutate({ product_name: data.product, quantity: Number(data.quantity), scheduled_start: data.scheduled_start })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-96">
        <h3 className="font-semibold mb-4">Create Manufacturing Order</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600">Product</label>
            <input {...register('product')} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Quantity</label>
            <input type="number" {...register('quantity')} className="w-full border p-2 rounded" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1">Cancel</button>
            <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}