import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Product, Sale, Expense, AppSettings, Page } from '../types'
import {
  getAllProducts, getAllSales, getAllExpenses,
  saveProduct, saveSale, saveExpense,
  deleteProduct, deleteExpense,
  updateProductQuantity
} from '../db/database'

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  currency: 'ل.س',
  lowStockThreshold: 5,
  storeName: 'Emerald Phones'
}

interface AppContextType {
  // Navigation
  currentPage: Page
  setCurrentPage: (page: Page) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Data
  products: Product[]
  sales: Sale[]
  expenses: Expense[]
  settings: AppSettings

  // Loading
  loading: boolean

  // Actions
  refreshProducts: () => Promise<void>
  refreshSales: () => Promise<void>
  refreshExpenses: () => Promise<void>
  addProduct: (product: Product) => Promise<void>
  updateProduct: (product: Product) => Promise<void>
  removeProduct: (id: string) => Promise<void>
  adjustStock: (id: string, change: number) => Promise<void>
  completeSale: (items: { product: Product; quantity: number }[]) => Promise<void>
  addExpense: (expense: Expense) => Promise<void>
  updateExpense: (expense: Expense) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => void

  // Helpers
  formatCurrency: (amount: number) => string
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('app-settings')
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

  const refreshProducts = useCallback(async () => {
    const data = await getAllProducts()
    setProducts(data.sort((a, b) => a.name.localeCompare(b.name, 'ar')))
  }, [])

  const refreshSales = useCallback(async () => {
    const data = await getAllSales()
    setSales(data.sort((a, b) => b.sold_at.localeCompare(a.sold_at)))
  }, [])

  const refreshExpenses = useCallback(async () => {
    const data = await getAllExpenses()
    setExpenses(data.sort((a, b) => b.created_at.localeCompare(a.created_at)))
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([refreshProducts(), refreshSales(), refreshExpenses()])
      setLoading(false)
    }
    init()
  }, [refreshProducts, refreshSales, refreshExpenses])

  const addProduct = useCallback(async (product: Product) => {
    await saveProduct(product)
    await refreshProducts()
  }, [refreshProducts])

  const updateProduct = useCallback(async (product: Product) => {
    await saveProduct(product)
    await refreshProducts()
  }, [refreshProducts])

  const removeProduct = useCallback(async (id: string) => {
    await deleteProduct(id)
    await refreshProducts()
  }, [refreshProducts])

  const adjustStock = useCallback(async (id: string, change: number) => {
    await updateProductQuantity(id, change)
    await refreshProducts()
  }, [refreshProducts])

  const completeSale = useCallback(async (items: { product: Product; quantity: number }[]) => {
    const now = new Date().toISOString()
    for (const item of items) {
      const sale: Sale = {
        id: `sale_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        purchase_price_at_sale: item.product.purchase_price,
        sale_price_at_sale: item.product.sale_price,
        total_purchase_cost: item.product.purchase_price * item.quantity,
        total_sale_value: item.product.sale_price * item.quantity,
        profit: (item.product.sale_price - item.product.purchase_price) * item.quantity,
        sold_at: now
      }
      await saveSale(sale)
      await updateProductQuantity(item.product.id, -item.quantity)
    }
    await refreshSales()
    await refreshProducts()
  }, [refreshSales, refreshProducts])

  const addExpense = useCallback(async (expense: Expense) => {
    await saveExpense(expense)
    await refreshExpenses()
  }, [refreshExpenses])

  const updateExpense = useCallback(async (expense: Expense) => {
    await saveExpense(expense)
    await refreshExpenses()
  }, [refreshExpenses])

  const removeExpense = useCallback(async (id: string) => {
    await deleteExpense(id)
    await refreshExpenses()
  }, [refreshExpenses])

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      localStorage.setItem('app-settings', JSON.stringify(updated))
      return updated
    })
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    return `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${settings.currency}`
  }, [settings.currency])

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      sidebarOpen, setSidebarOpen,
      products, sales, expenses, settings,
      loading,
      refreshProducts, refreshSales, refreshExpenses,
      addProduct, updateProduct, removeProduct, adjustStock,
      completeSale,
      addExpense, updateExpense, removeExpense,
      updateSettings,
      formatCurrency
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
