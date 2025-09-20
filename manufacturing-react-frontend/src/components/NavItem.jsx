import React from 'react'
import { Link, useMatch } from 'react-router-dom'
export default function NavItem({ to, label }){
  const match = useMatch({ path: to, end: to === '/' })
  return (
    <Link to={to} className={`flex items-center gap-3 p-2 rounded ${match? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
      <span className="text-sm">{label}</span>
    </Link>
  )
}