import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

function Register() {
    const { t } = useTranslation()
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        displayName: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { register } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.register.error_mismatch'))
            return
        }

        if (formData.password.length < 6) {
            setError(t('auth.register.error_length'))
            return
        }

        setLoading(true)

        try {
            await register(
                formData.username,
                formData.email,
                formData.password,
                formData.displayName || formData.username
            )
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || t('auth.register.error_fallback'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="card auth-card animate-fade-in">
                <div className="auth-header">
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}></div>
                    <h1 className="auth-title">{t('auth.register.title')}</h1>
                    <p className="auth-subtitle">{t('auth.register.subtitle')}</p>
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
                        <label className="form-label" htmlFor="displayName">{t('auth.register.display_name')}</label>
                        <input
                            id="displayName"
                            name="displayName"
                            type="text"
                            className="form-input"
                            placeholder={t('auth.register.display_name_placeholder')}
                            value={formData.displayName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="username">{t('auth.register.username')}</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className="form-input"
                            placeholder={t('auth.register.username_placeholder')}
                            value={formData.username}
                            onChange={handleChange}
                            required
                            minLength={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">{t('auth.register.email')}</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">{t('auth.register.password')}</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder={t('auth.register.password_placeholder')}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">{t('auth.register.confirm_password')}</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className="form-input"
                            placeholder={t('auth.register.confirm_password_placeholder')}
                            value={formData.confirmPassword}
                            onChange={handleChange}
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
                                {t('auth.register.submitting')}
                            </>
                        ) : (
                            t('auth.register.submit')
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    {t('auth.register.have_account')} <Link to="/login">{t('auth.register.login_now')}</Link>
                </div>
            </div>
        </div>
    )
}

export default Register
