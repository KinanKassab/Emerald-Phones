import { openDB, type IDBPDatabase } from 'idb'
import type { Product, Sale, Expense } from '../types'

const DB_NAME = 'emerald-phones-db'
const DB_VERSION = 1

let db: IDBPDatabase | null = null

export async function getDB(): Promise<IDBPDatabase> {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('products')) {
        const productStore = database.createObjectStore('products', { keyPath: 'id' })
        productStore.createIndex('barcode', 'barcode', { unique: false })
        productStore.createIndex('category', 'category', { unique: false })
        productStore.createIndex('name', 'name', { unique: false })
      }

      if (!database.objectStoreNames.contains('sales')) {
        const salesStore = database.createObjectStore('sales', { keyPath: 'id' })
        salesStore.createIndex('sold_at', 'sold_at', { unique: false })
        salesStore.createIndex('product_id', 'product_id', { unique: false })
      }

      if (!database.objectStoreNames.contains('expenses')) {
        const expenseStore = database.createObjectStore('expenses', { keyPath: 'id' })
        expenseStore.createIndex('created_at', 'created_at', { unique: false })
        expenseStore.createIndex('category', 'category', { unique: false })
      }
    }
  })

  return db
}

// Products
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB()
  return db.getAll('products')
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const db = await getDB()
  return db.get('products', id)
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const db = await getDB()
  const index = db.transaction('products').store.index('barcode')
  return index.get(barcode)
}

export async function saveProduct(product: Product): Promise<void> {
  const db = await getDB()
  await db.put('products', product)
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('products', id)
}

export async function updateProductQuantity(id: string, quantityChange: number): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('products', 'readwrite')
  const product = await tx.store.get(id)
  if (product) {
    product.quantity = Math.max(0, product.quantity + quantityChange)
    await tx.store.put(product)
  }
  await tx.done
}

// Sales
export async function getAllSales(): Promise<Sale[]> {
  const db = await getDB()
  return db.getAll('sales')
}

export async function saveSale(sale: Sale): Promise<void> {
  const db = await getDB()
  await db.put('sales', sale)
}

export async function deleteSale(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('sales', id)
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const db = await getDB()
  const all = await db.getAll('sales')
  return all.filter(sale => {
    const saleDate = sale.sold_at.substring(0, 10)
    return saleDate >= startDate && saleDate <= endDate
  })
}

// Expenses
export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDB()
  return db.getAll('expenses')
}

export async function saveExpense(expense: Expense): Promise<void> {
  const db = await getDB()
  await db.put('expenses', expense)
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('expenses', id)
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  const db = await getDB()
  const all = await db.getAll('expenses')
  return all.filter(expense => {
    const expDate = expense.created_at.substring(0, 10)
    return expDate >= startDate && expDate <= endDate
  })
}

// Backup & Restore
export async function exportAllData() {
  const db = await getDB()
  const products = await db.getAll('products')
  const sales = await db.getAll('sales')
  const expenses = await db.getAll('expenses')
  const settings = localStorage.getItem('app-settings') || '{}'

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    sales,
    expenses,
    settings: JSON.parse(settings)
  }
}

export async function importAllData(data: {
  products?: Product[]
  sales?: Sale[]
  expenses?: Expense[]
  settings?: object
}): Promise<void> {
  const db = await getDB()

  if (data.products) {
    const tx = db.transaction('products', 'readwrite')
    await tx.store.clear()
    for (const product of data.products) {
      await tx.store.put(product)
    }
    await tx.done
  }

  if (data.sales) {
    const tx = db.transaction('sales', 'readwrite')
    await tx.store.clear()
    for (const sale of data.sales) {
      await tx.store.put(sale)
    }
    await tx.done
  }

  if (data.expenses) {
    const tx = db.transaction('expenses', 'readwrite')
    await tx.store.clear()
    for (const expense of data.expenses) {
      await tx.store.put(expense)
    }
    await tx.done
  }

  if (data.settings) {
    localStorage.setItem('app-settings', JSON.stringify(data.settings))
  }
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('products')
  await db.clear('sales')
  await db.clear('expenses')
  localStorage.removeItem('app-settings')
}
