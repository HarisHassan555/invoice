import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import CreateInvoicePage from './pages/CreateInvoicePage'
import EditInvoicePage from './pages/EditInvoicePage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import InvoiceListPage from './pages/InvoiceListPage'
import MasterCompanyPage from './pages/MasterCompanyPage'
import MasterCustomerPage from './pages/MasterCustomerPage'
import MasterProductPage from './pages/MasterProductPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/invoices" replace />} />
          <Route path="master/company" element={<MasterCompanyPage />} />
          <Route path="master/customer" element={<MasterCustomerPage />} />
          <Route path="master/product" element={<MasterProductPage />} />
          <Route path="invoices" element={<InvoiceListPage />} />
          <Route path="invoices/new" element={<CreateInvoicePage />} />
          <Route path="invoices/:id/edit" element={<EditInvoicePage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/invoices" replace />} />
    </Routes>
  )
}
