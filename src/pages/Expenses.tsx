import React, { useState, useMemo } from 'react'
import {
  Plus, Trash2, Edit2, Wallet, TrendingDown, X, Save, Calendar, DollarSign
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Expense } from '../types'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const EXPENSE_CATEGORIES = ['إيجار', 'كهرباء', 'إنترنت', 'رواتب', 'مواصلات', 'صيانة', 'تسويق', 'أخرى']
const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function ExpenseModal({
  expense,
  onSave,
  onClose
}: {
  expense?: Expense
  onSave: (e: Expense) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: expense?.title ?? '',
    amount: expense?.amount?.toString() ?? '',
    category: expense?.category ?? 'أخرى',
    notes: expense?.notes ?? '',
    created_at: expense?.created_at?.slice(0, 10) ?? format(new Date(), 'yyyy-MM-dd'),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'العنوان مطلوب'
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'المبلغ غير صحيح'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      id: expense?.id ?? `exp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: form.title.trim(),
      amount: +form.amount,
      category: form.category,
      notes: form.notes.trim(),
      created_at: form.created_at + 'T00:00:00.000Z',
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {expense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان المصروف *</label>
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="مثال: إيجار المحل" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المبلغ *</label>
              <input type="number" className="input-field" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" min="0" />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">التصنيف</label>
              <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">التاريخ</label>
            <input type="date" className="input-field" value={form.created_at} onChange={e => set('created_at', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ملاحظات</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Save className="w-4 h-4" />
              {expense ? 'حفظ التعديلات' : 'إضافة المصروف'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Expenses() {
  const { expenses, sales, addExpense, updateExpense, removeExpense, formatCurrency } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('month')

  const today = format(new Date(), 'yyyy-MM-dd')
  const thisWeekStart = format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), 'yyyy-MM-dd')
  const thisMonthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.created_at.slice(0, 10)
      switch (filter) {
        case 'today': return d === today
        case 'week': return d >= thisWeekStart
        case 'month': return d >= thisMonthStart
        default: return true
      }
    })
  }, [expenses, filter, today, thisWeekStart, thisMonthStart])

  const filteredSalesProfit = useMemo(() => {
    return sales.filter(s => {
      const d = s.sold_at.slice(0, 10)
      switch (filter) {
        case 'today': return d === today
        case 'week': return d >= thisWeekStart
        case 'month': return d >= thisMonthStart
        default: return true
      }
    }).reduce((s, x) => s + x.profit, 0)
  }, [sales, filter, today, thisWeekStart, thisMonthStart])

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = filteredSalesProfit - totalExpenses

  // Category breakdown for chart
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>()
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount)
    })
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses])

  const handleSave = async (expense: Expense) => {
    if (editExpense) {
      await updateExpense(expense)
    } else {
      await addExpense(expense)
    }
    setShowModal(false)
    setEditExpense(undefined)
  }

  const filterLabels = { today: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر', all: 'الكل' }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditExpense(undefined); setShowModal(true) }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          مصروف جديد
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl">
              <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي المصروفات</p>
              <p className="font-bold text-red-500 text-base">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الأرباح</p>
              <p className="font-bold text-blue-600 dark:text-blue-400 text-base">{formatCurrency(filteredSalesProfit)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className={`${netProfit >= 0 ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-red-50 dark:bg-red-900/20'} p-2.5 rounded-xl`}>
              <DollarSign className={`w-5 h-5 ${netProfit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-500'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">صافي الربح</p>
              <p className={`font-bold text-base ${netProfit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-500'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        {categoryTotals.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">توزيع المصروفات</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryTotals} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryTotals.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontFamily: 'Cairo', fontSize: '12px', borderRadius: '8px' }}
                    formatter={(v: unknown) => [Number(v).toLocaleString('ar'), '']}
                  />
                  <Legend formatter={v => <span style={{ fontFamily: 'Cairo', fontSize: '11px' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className={`card p-0 overflow-hidden ${categoryTotals.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">قائمة المصروفات</h3>
            <span className="badge badge-red">{filteredExpenses.length}</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500 text-sm">لا توجد مصروفات في هذه الفترة</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>التصنيف</th>
                    <th>المبلغ</th>
                    <th>التاريخ</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id}>
                      <td>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{expense.title}</div>
                        {expense.notes && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-32">{expense.notes}</div>}
                      </td>
                      <td><span className="badge badge-yellow">{expense.category}</span></td>
                      <td className="font-bold text-red-500">{formatCurrency(expense.amount)}</td>
                      <td className="text-gray-400 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {expense.created_at.slice(0, 10)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditExpense(expense); setShowModal(true) }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 text-gray-400 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-gray-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ExpenseModal
          expense={editExpense}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditExpense(undefined) }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xs p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">حذف المصروف</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">هل أنت متأكد؟</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { removeExpense(deleteConfirm); setDeleteConfirm(null) }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors">
                حذف
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
