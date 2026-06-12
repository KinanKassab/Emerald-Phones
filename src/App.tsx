import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Products from './pages/Products'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Inventory from './pages/Inventory'
import Settings from './pages/Settings'

function PageRouter() {
  const { currentPage, loading } = useApp()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 dark:text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  switch (currentPage) {
    case 'dashboard': return <Dashboard />
    case 'sales': return <Sales />
    case 'products': return <Products />
    case 'reports': return <Reports />
    case 'expenses': return <Expenses />
    case 'inventory': return <Inventory />
    case 'settings': return <Settings />
    default: return <Dashboard />
  }
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <PageRouter />
      </Layout>
    </AppProvider>
  )
}
