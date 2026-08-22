import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EmployeeRecordPage from './pages/EmployeeRecordPage'
import ArchivePage from './pages/ArchivePage'
import AccountsPage from './pages/AccountsPage'
import EmployeeForm from './components/employee/EmployeeForm'
import { useAuthStore } from './store/auth.store'
import { useNavigate } from 'react-router-dom'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function NewEmployeePage() {
  const navigate = useNavigate()
  return <EmployeeForm onCancel={() => navigate('/')} onSuccess={() => navigate('/')} />
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees/new" element={<NewEmployeePage />} />
            <Route path="/employees/:id" element={<EmployeeRecordPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/accounts" element={
              <SuperAdminRoute><AccountsPage /></SuperAdminRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
