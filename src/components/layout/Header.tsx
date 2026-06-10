import { Menu, Moon, Sun, Bell } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  sales: 'نقطة البيع',
  products: 'إدارة المنتجات',
  reports: 'تقارير الأرباح',
  expenses: 'المصروفات',
  inventory: 'المخزون',
  settings: 'الإعدادات',
}

export default function Header() {
  const { currentPage, setSidebarOpen, settings, updateSettings, products } = useApp()

  const lowStockCount = products.filter(p =>
    p.quantity > 0 && p.quantity <= settings.lowStockThreshold
  ).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length
  const alertCount = lowStockCount + outOfStockCount

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {PAGE_TITLES[currentPage]}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <div className="relative">
              <button
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={`${alertCount} تنبيه مخزون`}
              >
                <Bell className="w-5 h-5 text-amber-500" />
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {alertCount}
                </span>
              </button>
            </div>
          )}

          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {settings.darkMode
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5 text-gray-600" />
            }
          </button>
        </div>
      </div>
    </header>
  )
}
