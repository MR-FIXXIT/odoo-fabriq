import React from 'react'
import NavItem from './NavItem'
import { useAuth } from '../contexts/AuthContext'

export default function AppShell({ children }){
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-900">
      <aside className="w-72 bg-white border-r p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center">{user?.username?.[0] || 'U'}</div>
          <div>
            <div className="font-semibold">{user?.username || 'Guest'}</div>
            <div className="text-xs text-gray-500">Manufacturing</div>
          </div>
        </div>
        <nav className="space-y-1">
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/orders" label="Manufacturing Orders" />
          <NavItem to="/workorders" label="Work Orders" />
          <NavItem to="/boms" label="Bills of Materials" />
          <NavItem to="/stock" label="Stock Ledger" />
        </nav>
        <div className="mt-6">
          <button onClick={logout} className="text-sm text-red-600">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>

      <aside className="w-72 bg-white border-l p-4">
        <h3 className="font-semibold mb-3">Master Menu</h3>
        <div className="text-sm text-gray-600">Quick Filters</div>
      </aside>
    </div>
  )
}