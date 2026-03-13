import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import LandingPage from './pages/LandingPage'
import PaymentSuccess from './pages/PaymentSuccess'
import { Toaster } from 'react-hot-toast'


// Protected Route component
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />
    }

    return children
}

// Admin Route component
function AdminRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

// Staff Route component
function StaffRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

// Public Route (redirect to dashboard if logged in)
function PublicRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (user) {
        if (user.role === 'admin') return <Navigate to="/admin" replace />
        if (user.role === 'staff') return <Navigate to="/staff" replace />
        return <Navigate to="/dashboard" replace />
    }

    return children
}

// Hide global Navbar on pages with their own embedded header
function NavbarWrapper() {
    const location = useLocation()
    const noNavbar = ['/', '/dashboard', '/staff', '/admin']
    if (noNavbar.includes(location.pathname)) return null
    return <Navbar />
}

function AppContent() {
    return (
        <Router>
            <NavbarWrapper />
            <Routes>
                {/* Landing Page - public, no redirect */}
                <Route path="/" element={<LandingPage />} />

                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/staff"
                    element={
                        <StaffRoute>
                            <StaffDashboard />
                        </StaffRoute>
                    }
                />
                <Route
                    path="/payment-success"
                    element={
                        <ProtectedRoute>
                            <PaymentSuccess />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    )
}

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <AppContent />
        </AuthProvider>
    )
}

export default App
