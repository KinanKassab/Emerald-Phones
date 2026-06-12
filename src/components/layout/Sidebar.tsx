import React from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  Wallet, Archive, Settings, X, Smartphone
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { Page } from '../../types'

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { page: 'sales', label: 'المبيعات', icon: ShoppingCart },
  { page: 'products', label: 'المنتجات', icon: Package },
  { page: 'reports', label: 'تقارير الأرباح', icon: BarChart3 },
  { page: 'expenses', label: 'المصروفات', icon: Wallet },
  { page: 'inventory', label: 'المخزون', icon: Archive },
  { page: 'settings', label: 'الإعدادات', icon: Settings },
]

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, settings } = useApp()

  const handleNav = (page: Page) => {
    setCurrentPage(page)
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-64 z-50 flex flex-col
        bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800
        shadow-xl lg:shadow-none
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:static lg:h-screen
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{settings.storeName}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">نظام المبيعات</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => handleNav(page)}
              className={`sidebar-item w-full text-right ${currentPage === page ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-500 dark:text-gray-400">يعمل بدون إنترنت</span>
          </div>
        </div>
      </aside>
    </>
  )
}
