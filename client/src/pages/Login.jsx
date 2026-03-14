import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

function Login() {
    const { t } = useTranslation()
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const userData = await login(identifier, password)
            if (userData.role === 'admin') {
                navigate('/admin')
            } else if (userData.role === 'staff') {
                navigate('/staff')
            } else {
                navigate('/dashboard')
            }
        } catch (err) {
            setError(err.response?.data?.message || t('auth.login.error_fallback'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="card auth-card animate-fade-in">
                <div className="auth-header">
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}></div>
                    <h1 className="auth-title">{t('auth.login.welcome')}</h1>
                    <p className="auth-subtitle">{t('auth.login.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--color-error)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-error)',
                            marginBottom: 'var(--space-lg)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="identifier">{t('auth.login.identifier')}</label>
                        <input
                            id="identifier"
                            type="text"
                            className="form-input"
                            placeholder={t('auth.login.identifier_placeholder')}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">{t('auth.login.password')}</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder={t('auth.login.password_placeholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                {t('auth.login.submitting')}
                            </>
                        ) : (
                            t('auth.login.submit')
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    {t('auth.login.no_account')} <Link to="/register">{t('auth.login.register_now')}</Link>
                </div>
            </div>
        </div>
    )
}

export default Login
