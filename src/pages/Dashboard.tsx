import { useMemo } from 'react'
import {
  TrendingUp, ShoppingBag, DollarSign, Package, Clock, BarChart2
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { format, subDays } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function Dashboard() {
  const { sales, products, expenses, formatCurrency } = useApp()

  const today = new Date().toISOString().slice(0, 10)

  const todaySales = useMemo(() =>
    sales.filter(s => s.sold_at.startsWith(today)),
    [sales, today]
  )

  const stats = useMemo(() => {
    const totalSalesValue = todaySales.reduce((s, x) => s + x.total_sale_value, 0)
    const totalProfit = todaySales.reduce((s, x) => s + x.profit, 0)
    const inventoryValue = products.reduce((s, p) => s + p.purchase_price * p.quantity, 0)

    const todayExpenses = expenses
      .filter(e => e.created_at.startsWith(today))
      .reduce((s, e) => s + e.amount, 0)

    const netProfit = totalProfit - todayExpenses

    return {
      totalSalesValue,
      totalProfit,
      inventoryValue,
      netProfit,
      ordersCount: todaySales.length,
    }
  }, [todaySales, products, expenses, today])

  // Last 7 days chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const daySales = sales.filter(s => s.sold_at.startsWith(dateStr))
      return {
        date: format(date, 'EEE', { locale: ar }),
        مبيعات: daySales.reduce((s, x) => s + x.total_sale_value, 0),
        أرباح: daySales.reduce((s, x) => s + x.profit, 0),
      }
    })
  }, [sales])


  const statCards = [
    {
      label: 'مبيعات اليوم',
      value: formatCurrency(stats.totalSalesValue),
      icon: ShoppingBag,
      color: 'bg-emerald-500',
      light: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'ربح اليوم',
      value: formatCurrency(stats.totalProfit),
      icon: TrendingUp,
      color: 'bg-blue-500',
      light: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'صافي الربح',
      value: formatCurrency(stats.netProfit),
      icon: DollarSign,
      color: stats.netProfit >= 0 ? 'bg-violet-500' : 'bg-red-500',
      light: stats.netProfit >= 0 ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-red-50 dark:bg-red-900/20',
      textColor: stats.netProfit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400'
    },
    {
      label: 'قيمة المخزون',
      value: formatCurrency(stats.inventoryValue),
      icon: Package,
      color: 'bg-amber-500',
      light: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: 'طلبات اليوم',
      value: stats.ordersCount.toString(),
      icon: BarChart2,
      color: 'bg-rose-500',
      light: 'bg-rose-50 dark:bg-rose-900/20',
      textColor: 'text-rose-600 dark:text-rose-400'
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 truncate">{card.label}</p>
                  <p className={`text-lg font-bold ${card.textColor} leading-tight`}>{card.value}</p>
                </div>
                <div className={`${card.light} p-2 rounded-xl flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${card.textColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">مبيعات آخر 7 أيام</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Cairo', fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v: unknown) => [`${Number(v).toLocaleString('ar')}`, '']}
                />
                <Area type="monotone" dataKey="مبيعات" stroke="#059669" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">أرباح آخر 7 أيام</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'Cairo', fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v: unknown) => [`${Number(v).toLocaleString('ar')}`, '']}
                />
                <Bar dataKey="أرباح" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Today's Sales Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">مبيعات اليوم</h3>
          <span className="badge badge-green">{todaySales.length} عملية</span>
        </div>

        {todaySales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">لا توجد مبيعات اليوم</p>
          </div>
        ) : (
          <div className="table-container -mx-6 px-0">
            <table className="w-full">
              <thead>
                <tr>
                  <th>اسم المنتج</th>
                  <th>الكمية</th>
                  <th>سعر البيع</th>
                  <th>الإجمالي</th>
                  <th>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {todaySales.slice(0, 10).map((sale) => (
                  <tr key={sale.id} className="group">
                    <td className="font-medium text-gray-900 dark:text-white">{sale.product_name}</td>
                    <td>
                      <span className="badge badge-blue">{sale.quantity}</span>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">{formatCurrency(sale.sale_price_at_sale)}</td>
                    <td className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(sale.total_sale_value)}</td>
                    <td className="text-gray-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(sale.sold_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
