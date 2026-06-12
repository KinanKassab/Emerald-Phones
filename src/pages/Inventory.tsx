import { useMemo } from 'react'
import { AlertTriangle, XCircle, Package, TrendingDown, DollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

export default function Inventory() {
  const { products, settings, formatCurrency } = useApp()

  const stats = useMemo(() => {
    const totalValue = products.reduce((s, p) => s + p.purchase_price * p.quantity, 0)
    const saleValue = products.reduce((s, p) => s + p.sale_price * p.quantity, 0)
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= settings.lowStockThreshold)
    const outOfStock = products.filter(p => p.quantity === 0)
    const inStock = products.filter(p => p.quantity > settings.lowStockThreshold)
    return { totalValue, saleValue, lowStock, outOfStock, inStock }
  }, [products, settings.lowStockThreshold])

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; value: number; qty: number }>()
    products.forEach(p => {
      const existing = map.get(p.category)
      if (existing) {
        existing.count++
        existing.value += p.purchase_price * p.quantity
        existing.qty += p.quantity
      } else {
        map.set(p.category, { count: 1, value: p.purchase_price * p.quantity, qty: p.quantity })
      }
    })
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
  }, [products])

  const chartData = categoryBreakdown.map(c => ({
    name: c.name.length > 8 ? c.name.slice(0, 8) + '...' : c.name,
    قيمة: Math.round(c.value),
    كمية: c.qty
  }))

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'نفد', class: 'badge-red', icon: XCircle, color: '#ef4444' }
    if (qty <= settings.lowStockThreshold) return { label: 'منخفض', class: 'badge-yellow', icon: AlertTriangle, color: '#f59e0b' }
    return { label: 'متوفر', class: 'badge-green', icon: Package, color: '#059669' }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'قيمة الشراء', value: formatCurrency(stats.totalValue), icon: DollarSign, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-gray-800' },
          { label: 'قيمة البيع', value: formatCurrency(stats.saleValue), icon: TrendingDown, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'مخزون منخفض', value: stats.lowStock.length.toString() + ' منتج', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'نفد المخزون', value: stats.outOfStock.length.toString() + ' منتج', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-4">
              <div className={`${card.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
              <p className={`font-bold text-base ${card.color}`}>{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              تحذير: {stats.lowStock.length} منتجات قاربت على النفاد
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-white dark:bg-amber-900/30 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700">
                <span className="text-xs font-medium text-amber-800 dark:text-amber-300">{p.name}</span>
                <span className="badge badge-yellow text-[10px]">{p.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Out of Stock Alert */}
      {stats.outOfStock.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-bold text-red-800 dark:text-red-300 text-sm">
              منتجات نفد مخزونها ({stats.outOfStock.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.outOfStock.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-white dark:bg-red-900/30 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-700">
                <span className="text-xs font-medium text-red-700 dark:text-red-300">{p.name}</span>
                <span className="badge badge-red text-[10px]">0</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts and category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">قيمة المخزون حسب الفئة</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="قيمة" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">ملخص حسب الفئة</h3>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {categoryBreakdown.map((cat, i) => {
              const percent = stats.totalValue > 0 ? (cat.value / stats.totalValue * 100).toFixed(0) : '0'
              const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500', 'bg-pink-500']
              return (
                <div key={cat.name}>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                    <span className="text-gray-400">{cat.qty} قطعة • {formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[i % colors.length]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Full Inventory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">جرد كامل المخزون</h3>
          <span className="badge badge-blue">{products.length} منتج</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الفئة</th>
                <th>الكمية</th>
                <th>سعر الشراء</th>
                <th>قيمة المخزون</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {products
                .sort((a, b) => a.quantity - b.quantity)
                .map(product => {
                  const status = getStockStatus(product.quantity)
                  return (
                    <tr key={product.id}>
                      <td className="font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td><span className="badge badge-gray">{product.category}</span></td>
                      <td className="font-bold text-gray-900 dark:text-white">{product.quantity}</td>
                      <td className="text-gray-500 dark:text-gray-400">{formatCurrency(product.purchase_price)}</td>
                      <td className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(product.purchase_price * product.quantity)}
                      </td>
                      <td>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
