import React, { useState, useMemo } from 'react'
import {
  Plus, Search, Edit2, Trash2, Package, ChevronUp, ChevronDown,
  X, Save, BarChart3
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Product } from '../types'

const CATEGORIES = ['هواتف', 'أجهزة لوحية', 'إكسسوارات', 'شواحن', 'سماعات', 'حافظات', 'شاشات', 'أخرى']

function ProductModal({
  product,
  onSave,
  onClose
}: {
  product?: Product
  onSave: (p: Product) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    barcode: product?.barcode ?? '',
    purchase_price: product?.purchase_price?.toString() ?? '',
    sale_price: product?.sale_price?.toString() ?? '',
    quantity: product?.quantity?.toString() ?? '0',
    category: product?.category ?? 'هواتف',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'الاسم مطلوب'
    if (!form.purchase_price || isNaN(+form.purchase_price)) e.purchase_price = 'سعر الشراء مطلوب'
    if (!form.sale_price || isNaN(+form.sale_price)) e.sale_price = 'سعر البيع مطلوب'
    if (+form.sale_price < +form.purchase_price) e.sale_price = 'سعر البيع يجب أن يكون أكبر من سعر الشراء'
    if (isNaN(+form.quantity) || +form.quantity < 0) e.quantity = 'الكمية غير صحيحة'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      id: product?.id ?? `prod_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      purchase_price: +form.purchase_price,
      sale_price: +form.sale_price,
      quantity: +form.quantity,
      category: form.category,
      created_at: product?.created_at ?? new Date().toISOString(),
    })
  }

  const profit = form.sale_price && form.purchase_price
    ? +form.sale_price - +form.purchase_price
    : null
  const profitPct = profit !== null && +form.purchase_price > 0
    ? ((profit / +form.purchase_price) * 100).toFixed(1)
    : null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم المنتج *</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: Samsung Galaxy A54" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الباركود</label>
            <input className="input-field" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="رمز الباركود (اختياري)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">سعر الشراء *</label>
              <input type="number" className="input-field" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} placeholder="0" min="0" />
              {errors.purchase_price && <p className="text-red-500 text-xs mt-1">{errors.purchase_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">سعر البيع *</label>
              <input type="number" className="input-field" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} placeholder="0" min="0" />
              {errors.sale_price && <p className="text-red-500 text-xs mt-1">{errors.sale_price}</p>}
            </div>
          </div>

          {profit !== null && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
              <BarChart3 className="w-4 h-4" />
              <span>الربح: <strong>{profit.toLocaleString('ar')}</strong></span>
              {profitPct && <span className="text-xs opacity-75">({profitPct}%)</span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الكمية</label>
              <input type="number" className="input-field" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" min="0" />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الفئة</label>
              <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center">
              <Save className="w-4 h-4" />
              {product ? 'حفظ التعديلات' : 'إضافة المنتج'}
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

function StockModal({
  product,
  onSave,
  onClose
}: {
  product: Product
  onSave: (id: string, change: number) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [amount, setAmount] = useState('1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const change = mode === 'add' ? +amount : -+amount
    if (mode === 'remove' && +amount > product.quantity) return
    onSave(product.id, change)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-xs">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">تعديل المخزون</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{product.name}</span>
            <span className="mx-2">•</span>
            المخزون الحالي: <span className="font-bold text-emerald-600">{product.quantity}</span>
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                mode === 'add' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <ChevronUp className="w-4 h-4 inline ml-1" />
              إضافة
            </button>
            <button
              onClick={() => setMode('remove')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                mode === 'remove' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <ChevronDown className="w-4 h-4 inline ml-1" />
              خصم
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="number"
              className="input-field"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              max={mode === 'remove' ? product.quantity : undefined}
              placeholder="الكمية"
            />
            <button type="submit" className={`w-full justify-center py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 transition-all ${mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
              تأكيد
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const { products, addProduct, updateProduct, removeProduct, adjustStock, formatCurrency } = useApp()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('الكل')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()
  const [stockProduct, setStockProduct] = useState<Product | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category))
    return ['الكل', ...Array.from(cats)]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
      const matchCategory = selectedCategory === 'الكل' || p.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [products, search, selectedCategory])

  const handleSave = async (product: Product) => {
    if (editProduct) {
      await updateProduct(product)
    } else {
      await addProduct(product)
    }
    setShowModal(false)
    setEditProduct(undefined)
  }

  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    await removeProduct(id)
    setDeleteConfirm(null)
  }

  const handleStockAdjust = async (id: string, change: number) => {
    await adjustStock(id, change)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الباركود..."
            className="input-field pr-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="input-field sm:w-40"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setEditProduct(undefined); setShowModal(true) }}
          className="btn-primary whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          منتج جديد
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">إجمالي المنتجات</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{filtered.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">نتائج البحث</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {products.filter(p => p.quantity === 0).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">نفد المخزون</p>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500">لا توجد منتجات</p>
            <button
              onClick={() => { setEditProduct(undefined); setShowModal(true) }}
              className="btn-primary mt-4 mx-auto"
            >
              <Plus className="w-4 h-4" />
              أضف منتجاً
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الباركود</th>
                  <th>سعر الشراء</th>
                  <th>سعر البيع</th>
                  <th>الكمية</th>
                  <th>الفئة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div className="font-semibold text-gray-900 dark:text-white">{product.name}</div>
                    </td>
                    <td className="text-gray-400 text-xs font-mono">{product.barcode || '—'}</td>
                    <td className="text-gray-600 dark:text-gray-400">{formatCurrency(product.purchase_price)}</td>
                    <td className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(product.sale_price)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${product.quantity === 0 ? 'badge-red' : product.quantity <= 5 ? 'badge-yellow' : 'badge-green'}`}>
                          {product.quantity}
                        </span>
                        <button
                          onClick={() => setStockProduct(product)}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="تعديل المخزون"
                        >
                          <ChevronUp className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{product.category}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 text-gray-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
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

      {/* Modals */}
      {showModal && (
        <ProductModal
          product={editProduct}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditProduct(undefined) }}
        />
      )}

      {stockProduct && (
        <StockModal
          product={stockProduct}
          onSave={handleStockAdjust}
          onClose={() => setStockProduct(undefined)}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xs p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">حذف المنتج</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors">
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
