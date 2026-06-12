import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Camera,
  CameraOff, Check, X, AlertCircle, Package
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Product } from '../types'

interface CartItem {
  product: Product
  quantity: number
}

export default function Sales() {
  const { products, completeSale, formatCurrency } = useApp()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'scanner'>('manual')
  const scannerRef = useRef<HTMLDivElement>(null)
  const scannerInstance = useRef<unknown>(null)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  )

  const addToCart = useCallback((product: Product) => {
    if (product.quantity === 0) return
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) return prev
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setSearch('')
  }, [])

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.product.id === productId)
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) return prev.filter(i => i.product.id !== productId)
      if (newQty > item.product.quantity) return prev
      return prev.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i)
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  const totalAmount = cart.reduce((s, i) => s + i.product.sale_price * i.quantity, 0)
  const totalProfit = cart.reduce((s, i) => s + (i.product.sale_price - i.product.purchase_price) * i.quantity, 0)

  const handleCompleteSale = async () => {
    if (cart.length === 0) return
    await completeSale(cart)
    setCart([])
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  // Barcode scanner
  const startScanner = async () => {
    setScannerError('')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      if (scannerInstance.current) {
        await (scannerInstance.current as { stop: () => Promise<void> }).stop()
      }
      const scanner = new Html5Qrcode('qr-reader')
      scannerInstance.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText: string) => {
          const product = products.find(p => p.barcode === decodedText)
          if (product) {
            addToCart(product)
            stopScanner()
            setActiveTab('manual')
          } else {
            setScannerError(`لم يتم العثور على المنتج: ${decodedText}`)
          }
        },
        () => {}
      )
      setScannerActive(true)
    } catch {
      setScannerError('لا يمكن الوصول إلى الكاميرا')
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerInstance.current) {
        await (scannerInstance.current as { stop: () => Promise<void> }).stop()
        scannerInstance.current = null
      }
    } catch { /* ignore */ }
    setScannerActive(false)
  }

  useEffect(() => {
    if (activeTab === 'scanner') {
      startScanner()
    } else {
      stopScanner()
    }
    return () => { stopScanner() }
  }, [activeTab])

  return (
    <div className="max-w-7xl mx-auto">
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 fade-in">
          <Check className="w-5 h-5" />
          تم إتمام البيع بنجاح!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Product Selection - 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Search className="w-4 h-4" />
              بحث يدوي
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Camera className="w-4 h-4" />
              ماسح الباركود
            </button>
          </div>

          {activeTab === 'manual' && (
            <div className="card space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن منتج بالاسم أو الباركود..."
                  className="input-field pr-10"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    لا توجد منتجات
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.quantity === 0}
                      className={`text-right p-3 rounded-xl border transition-all ${
                        product.quantity === 0
                          ? 'opacity-50 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-100 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{product.category}</p>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(product.sale_price)}</p>
                          <span className={`badge text-[10px] mt-1 ${product.quantity === 0 ? 'badge-red' : product.quantity <= 5 ? 'badge-yellow' : 'badge-green'}`}>
                            {product.quantity === 0 ? 'نفد' : `${product.quantity} متبقي`}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'scanner' && (
            <div className="card">
              <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden bg-black min-h-48" />
              {scannerError && (
                <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {scannerError}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {scannerActive ? (
                  <button onClick={stopScanner} className="btn-secondary flex-1 justify-center">
                    <CameraOff className="w-4 h-4" />
                    إيقاف الماسح
                  </button>
                ) : (
                  <button onClick={startScanner} className="btn-primary flex-1 justify-center">
                    <Camera className="w-4 h-4" />
                    تشغيل الكاميرا
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cart - 2 cols */}
        <div className="lg:col-span-2">
          <div className="card sticky top-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                سلة المشتريات
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                  مسح الكل
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">السلة فارغة</p>
                <p className="text-xs mt-1">ابحث أو امسح منتجاً للإضافة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">{item.product.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(item.product.sale_price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-500 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors mr-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">الإجمالي</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">الربح المتوقع</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalProfit)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCompleteSale}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  <Check className="w-5 h-5" />
                  إتمام البيع
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
