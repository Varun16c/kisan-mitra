import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { UserProvider, useUser } from './context/UserContext'
import { LanguageProvider } from './context/LanguageContext'
import { isAdminLoggedIn } from './pages/AdminLogin'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import AdminLogin from './pages/AdminLogin'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Schemes from './pages/Schemes'
import Chat from './pages/Chat'
import Documents from './pages/Documents'
import ActionPlan from './pages/ActionPlan'
import BenefitCalc from './pages/BenefitCalc'
import ProfileEdit from './pages/ProfileEdit'
import Bookmarks from './pages/Bookmarks'
import Admin from './pages/Admin'
import './index.css'

/** Redirect to /login if not authenticated */
function ProtectedRoute({ children }) {
  const { user, profile, loading } = useUser()
  const { pathname } = useLocation()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: '#16a34a', fontWeight: 700 }}>Loading Kisan Mitra...</div>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: pathname }} replace />
  if (user && !profile?.name && pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return children
}

/** Redirect to /admin-login if admin not authenticated */
function AdminRoute({ children }) {
  if (!isAdminLoggedIn()) return <Navigate to="/admin-login" replace />
  return children
}

function AppRoutes() {
  const { user, profile } = useUser()

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={
        // If already logged in and has profile, skip to dashboard
        user && profile?.name ? <Navigate to="/dashboard" replace /> : <AuthPage />
      } />
      <Route path="/admin-login" element={
        isAdminLoggedIn() ? <Navigate to="/admin" replace /> : <AdminLogin />
      } />

      {/* Onboarding — auth required but no profile yet */}
      <Route path="/onboarding" element={
        !user
          ? <Navigate to="/login" replace />
          : <Onboarding />
      } />

      {/* Protected user routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/action-plan" element={<ProtectedRoute><ActionPlan /></ProtectedRoute>} />
      <Route path="/simulator" element={<ProtectedRoute><BenefitCalc /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { fontFamily: 'Inter, sans-serif', borderRadius: '10px', fontSize: '.88rem' },
              success: { iconTheme: { primary: '#16a34a', secondary: 'white' } },
            }}
          />
        </BrowserRouter>
      </UserProvider>
    </LanguageProvider>
  )
}
