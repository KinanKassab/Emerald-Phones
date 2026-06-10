import { useState, useMemo } from 'react'
import {
  TrendingUp, DollarSign, ShoppingBag, Calendar, BarChart3
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { format, startOfWeek, startOfMonth } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

type FilterType = 'today' | 'week' | 'month' | 'custom'

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function Reports() {
  const { sales, expenses, formatCurrency } = useApp()
  const [filter, setFilter] = useState<FilterType>('today')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const dateRange = useMemo(() => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    switch (filter) {
      case 'today': return { start: todayStr, end: todayStr }
      case 'week': return {
        start: format(startOfWeek(today, { weekStartsOn: 6 }), 'yyyy-MM-dd'),
        end: todayStr
      }
      case 'month': return {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: todayStr
      }
      case 'custom': return { start: startDate, end: endDate }
    }
  }, [filter, startDate, endDate])

  const filteredSales = useMemo(() =>
    sales.filter(s => {
      const d = s.sold_at.slice(0, 10)
      return d >= dateRange.start && d <= dateRange.end
    }),
    [sales, dateRange]
  )

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = e.created_at.slice(0, 10)
      return d >= dateRange.start && d <= dateRange.end
    }),
    [expenses, dateRange]
  )

  // Aggregate by product
  const productStats = useMemo(() => {
    const map = new Map<string, {
      name: string
      quantitySold: number
      purchaseCost: number
      saleValue: number
      profit: number
    }>()
    filteredSales.forEach(s => {
      const existing = map.get(s.product_name)
      if (existing) {
        existing.quantitySold += s.quantity
        existing.purchaseCost += s.total_purchase_cost
        existing.saleValue += s.total_sale_value
        existing.profit += s.profit
      } else {
        map.set(s.product_name, {
          name: s.product_name,
          quantitySold: s.quantity,
          purchaseCost: s.total_purchase_cost,
          saleValue: s.total_sale_value,
          profit: s.profit
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit)
  }, [filteredSales])

  const totals = useMemo(() => ({
    purchaseCost: filteredSales.reduce((s, x) => s + x.total_purchase_cost, 0),
    saleValue: filteredSales.reduce((s, x) => s + x.total_sale_value, 0),
    profit: filteredSales.reduce((s, x) => s + x.profit, 0),
    expenses: filteredExpenses.reduce((s, e) => s + e.amount, 0),
  }), [filteredSales, filteredExpenses])

  const netProfit = totals.profit - totals.expenses

  // Chart data
  const topProductsChart = productStats.slice(0, 8).map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
    ربح: Math.round(p.profit),
    مبيعات: Math.round(p.saleValue)
  }))

  const pieData = productStats.slice(0, 6).map((p, i) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '...' : p.name,
    value: Math.round(p.saleValue),
    color: COLORS[i % COLORS.length]
  }))

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'هذا الأسبوع' },
    { key: 'month', label: 'هذا الشهر' },
    { key: 'custom', label: 'تاريخ مخصص' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                filter === btn.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {btn.label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">من:</label>
              <input type="date" className="input-field w-auto" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">إلى:</label>
              <input type="date" className="input-field w-auto" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'تكلفة الشراء', value: totals.purchaseCost, icon: ShoppingBag, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
          { label: 'قيمة المبيعات', value: totals.saleValue, icon: BarChart3, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'الربح الإجمالي', value: totals.profit, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'صافي الربح', value: netProfit, icon: DollarSign, color: netProfit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600', bg: netProfit >= 0 ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-red-50 dark:bg-red-900/20' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-4">
              <div className={`${card.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
              <p className={`text-base font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      {productStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">أفضل المنتجات مبيعاً</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsChart} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: 'Cairo' }} width={80} />
                  <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: '12px', borderRadius: '8px' }} />
                  <Bar dataKey="ربح" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">توزيع المبيعات</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontFamily: 'Cairo', fontSize: '12px', borderRadius: '8px' }}
                    formatter={(v: unknown) => [Number(v).toLocaleString('ar'), 'المبيعات']}
                  />
                  <Legend
                    formatter={(value) => <span style={{ fontFamily: 'Cairo', fontSize: '11px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">تفصيل الأرباح</h3>
          <span className="badge badge-green">{productStats.length} منتج</span>
        </div>

        {productStats.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">لا توجد مبيعات في هذه الفترة</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم المنتج</th>
                  <th>الكمية المباعة</th>
                  <th>تكلفة الشراء</th>
                  <th>قيمة البيع</th>
                  <th>الربح</th>
                  <th>هامش الربح</th>
                </tr>
              </thead>
              <tbody>
                {productStats.map((stat, i) => {
                  const margin = stat.saleValue > 0
                    ? ((stat.profit / stat.saleValue) * 100).toFixed(1)
                    : '0'
                  return (
                    <tr key={stat.name}>
                      <td className="text-gray-400 text-xs">{i + 1}</td>
                      <td className="font-semibold text-gray-900 dark:text-white">{stat.name}</td>
                      <td>
                        <span className="badge badge-blue">{stat.quantitySold}</span>
                      </td>
                      <td className="text-gray-500 dark:text-gray-400">{formatCurrency(stat.purchaseCost)}</td>
                      <td className="text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(stat.saleValue)}</td>
                      <td className={`font-bold ${stat.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {formatCurrency(stat.profit)}
                      </td>
                      <td>
                        <span className={`badge ${+margin >= 20 ? 'badge-green' : +margin >= 10 ? 'badge-yellow' : 'badge-red'}`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                  <td colSpan={2} className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">الإجمالي</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-blue">
                      {productStats.reduce((s, p) => s + p.quantitySold, 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{formatCurrency(totals.purchaseCost)}</td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(totals.saleValue)}</td>
                  <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(totals.profit)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
