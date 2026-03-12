import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

function Navbar() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const { t, i18n } = useTranslation()

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng)
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span>Go Quest</span>
                </Link>

                <ul className="navbar-nav">
                    <li className="lang-switcher" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '24px', marginRight: 'var(--space-sm)' }}>
                        <button
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', border: 'none', background: i18n.language === 'vi' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'vi' ? '#fff' : 'inherit', cursor: 'pointer', transition: 'all 0.3s' }}
                            onClick={() => changeLanguage('vi')}
                            title="Tiếng Việt"
                        >
                            <img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN Flag" style={{ borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>VI</span>
                        </button>
                        <button
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', border: 'none', background: i18n.language === 'en' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'en' ? '#fff' : 'inherit', cursor: 'pointer', transition: 'all 0.3s' }}
                            onClick={() => changeLanguage('en')}
                            title="English"
                        >
                            <img src="https://flagcdn.com/w20/gb.png" srcSet="https://flagcdn.com/w40/gb.png 2x" width="20" alt="UK Flag" style={{ borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>EN</span>
                        </button>
                    </li>

                    {user ? (
                        <>
                            {user.role === 'admin' && (
                                <li>
                                    <Link
                                        to="/admin"
                                        className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                                    >
                                        {t('navbar.admin')}
                                    </Link>
                                </li>
                            )}
                            {user.role === 'user' && (
                                <li>
                                    <Link
                                        to="/dashboard"
                                        className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                                    >
                                        {t('navbar.dashboard')}
                                    </Link>
                                </li>
                            )}
                            <li>
                                <span className="navbar-link" style={{ color: 'var(--color-accent-primary)' }}>
                                    {t('navbar.hello')}, {user.displayName || user.username}!
                                </span>
                            </li>
                            <li>
                                <button
                                    onClick={logout}
                                    className="btn btn-secondary"
                                    style={{ padding: 'var(--space-sm) var(--space-md)' }}
                                >
                                    {t('navbar.logout')}
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
                                    {t('navbar.login')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="btn btn-primary" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                                    {t('navbar.register')}
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
