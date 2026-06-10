export interface Product {
  id: string
  name: string
  barcode: string
  purchase_price: number
  sale_price: number
  quantity: number
  category: string
  created_at: string
}

export interface Sale {
  id: string
  product_id: string
  product_name: string
  quantity: number
  purchase_price_at_sale: number
  sale_price_at_sale: number
  total_purchase_cost: number
  total_sale_value: number
  profit: number
  sold_at: string
}

export interface SaleItem {
  product: Product
  quantity: number
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: string
  notes: string
  created_at: string
}

export interface AppSettings {
  darkMode: boolean
  currency: string
  lowStockThreshold: number
  storeName: string
}

export type Page =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'reports'
  | 'expenses'
  | 'inventory'
  | 'settings'

export interface DashboardStats {
  todaySales: number
  todayProfit: number
  todayOrders: number
  inventoryValue: number
  netProfit: number
}
