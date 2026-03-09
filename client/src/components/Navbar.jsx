import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
    const { user, logout } = useAuth()
    const location = useLocation()

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span>Go Quest</span>
                </Link>

                <ul className="navbar-nav">
                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <li>
                                    <Link
                                        to="/admin"
                                        className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                                    >
                                        Quản lý
                                    </Link>
                                </li>
                            )}
                            {user.role === 'user' && (
                                <li>
                                    <Link
                                        to="/dashboard"
                                        className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                                    >
                                        Nhiệm vụ
                                    </Link>
                                </li>
                            )}
                            <li>
                                <span className="navbar-link" style={{ color: 'var(--color-accent-primary)' }}>
                                    Xin chào, {user.displayName || user.username}!
                                </span>
                            </li>
                            <li>
                                <button
                                    onClick={logout}
                                    className="btn btn-secondary"
                                    style={{ padding: 'var(--space-sm) var(--space-md)' }}
                                >
                                    Đăng xuất
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link
                                    to="/login"
                                    className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`}
                                >
                                    Đăng nhập
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="btn btn-primary" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                                    Đăng ký
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    )
}

export default Navbar
