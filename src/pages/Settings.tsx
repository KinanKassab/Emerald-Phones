import React, { useState, useRef } from 'react'
import {
  Moon, Sun, Download, Upload, Trash2, Store, DollarSign,
  AlertTriangle, Check, X, Info, Package
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { exportAllData, importAllData, clearAllData } from '../db/database'

const CURRENCIES = [
  { value: 'ل.س', label: 'ليرة سورية (ل.س)' },
  { value: 'ريال', label: 'ريال سعودي (ريال)' },
  { value: 'درهم', label: 'درهم إماراتي (درهم)' },
  { value: 'دينار', label: 'دينار كويتي (دينار)' },
  { value: 'جنيه', label: 'جنيه مصري (جنيه)' },
  { value: 'دولار', label: 'دولار أمريكي ($)' },
  { value: 'يورو', label: 'يورو (€)' },
]

export default function Settings() {
  const { settings, updateSettings, products, sales, expenses, refreshProducts, refreshSales, refreshExpenses } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleExport = async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `emerald-phones-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('success', 'تم تصدير البيانات بنجاح')
    } catch {
      showToast('error', 'فشل تصدير البيانات')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      await Promise.all([refreshProducts(), refreshSales(), refreshExpenses()])
      showToast('success', 'تم استيراد البيانات بنجاح')
    } catch {
      showToast('error', 'فشل استيراد البيانات - الملف غير صحيح')
    }
    e.target.value = ''
  }

  const handleReset = async () => {
    try {
      await clearAllData()
      await Promise.all([refreshProducts(), refreshSales(), refreshExpenses()])
      updateSettings({
        darkMode: false,
        currency: 'ل.س',
        lowStockThreshold: 5,
        storeName: 'Emerald Phones'
      })
      setConfirmReset(false)
      showToast('success', 'تم إعادة تعيين التطبيق')
    } catch {
      showToast('error', 'فشل إعادة التعيين')
    }
  }

  const stats = {
    products: products.length,
    sales: sales.length,
    expenses: expenses.length,
    storageSize: JSON.stringify({ products, sales, expenses }).length
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-white fade-in text-sm ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Store Info */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-gray-900 dark:text-white">معلومات المتجر</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم المتجر</label>
          <input
            className="input-field"
            value={settings.storeName}
            onChange={e => updateSettings({ storeName: e.target.value })}
            placeholder="اسم متجرك"
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sun className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-gray-900 dark:text-white">المظهر</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-3">
            {settings.darkMode ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {settings.darkMode ? 'الوضع الداكن' : 'الوضع الفاتح'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">تبديل مظهر التطبيق</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-emerald-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Currency */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-gray-900 dark:text-white">العملة والمخزون</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">العملة</label>
          <select
            className="input-field"
            value={settings.currency}
            onChange={e => updateSettings({ currency: e.target.value })}
          >
            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            حد تنبيه المخزون المنخفض
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              className="input-field flex-1"
              value={settings.lowStockThreshold}
              onChange={e => updateSettings({ lowStockThreshold: +e.target.value })}
              min="1"
              max="50"
              placeholder="5"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">قطعة</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
            <Info className="w-3 h-3" />
            سيظهر تنبيه عند انخفاض الكمية عن هذا الحد
          </p>
        </div>
      </div>

      {/* Data Stats */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-gray-900 dark:text-white">إحصائيات البيانات</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'المنتجات', value: stats.products },
            { label: 'المبيعات', value: stats.sales },
            { label: 'المصروفات', value: stats.expenses },
            { label: 'حجم البيانات', value: formatSize(stats.storageSize) },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-gray-900 dark:text-white">النسخ الاحتياطية</h2>
        </div>

        <button onClick={handleExport} className="btn-primary w-full justify-center py-3">
          <Download className="w-4 h-4" />
          تصدير البيانات (JSON)
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary w-full justify-center py-3"
        >
          <Upload className="w-4 h-4" />
          استيراد البيانات من ملف
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-xl">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            البيانات محفوظة على جهازك فقط. ننصح بأخذ نسخة احتياطية بشكل دوري.
          </p>
        </div>
      </div>

      {/* Reset */}
      <div className="card border-red-100 dark:border-red-900/50 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="font-bold text-red-600 dark:text-red-400">منطقة الخطر</h2>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-xl">
          <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            سيؤدي إعادة التعيين إلى حذف جميع البيانات بشكل دائم ولا يمكن التراجع عنه.
          </p>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="btn-danger w-full justify-center py-3"
        >
          <Trash2 className="w-4 h-4" />
          إعادة تعيين التطبيق
        </button>
      </div>

      {/* Reset Confirm Modal */}
      {confirmReset && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تأكيد إعادة التعيين</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ستُحذف جميع البيانات بشكل نهائي: المنتجات، المبيعات، والمصروفات.
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                نعم، احذف كل شيء
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="btn-secondary flex-1 justify-center"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
