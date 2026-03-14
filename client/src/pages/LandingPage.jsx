import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

// ===== Animated Counter Component =====
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const hasStarted = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted.current) {
                    hasStarted.current = true
                    const start = 0
                    const end = parseFloat(target.replace(/[^0-9.]/g, ''))
                    const steps = 60
                    let step = 0
                    const timer = setInterval(() => {
                        step++
                        setCount(Math.floor((end * step) / steps))
                        if (step >= steps) {
                            setCount(end)
                            clearInterval(timer)
                        }
                    }, duration / steps)
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target, duration])

    return <span ref={ref}>{count}{suffix}</span>
}

// ===== Progress Bar Component =====
function ProgressBar({ label, percent }) {
    const ref = useRef(null)
    const [width, setWidth] = useState(0)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setWidth(percent)
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [percent])

    return (
        <div className="lp-progress-item" ref={ref}>
            <div className="lp-progress-label">
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className="lp-progress-track">
                <div
                    className="lp-progress-fill"
                    style={{ width: `${width}%`, transition: 'width 1.2s ease' }}
                />
            </div>
        </div>
    )
}

// ===== Experience Card Component =====
// ===== Experience Accordion Component =====
function ExperienceAccordion({ experiences }) {
    const [activeIndex, setActiveIndex] = useState(0)

    return (
        <div className="lp-exp-accordion" onMouseLeave={() => setActiveIndex(0)}>
            {experiences.map((exp, index) => {
                const isActive = activeIndex === index
                return (
                    <div
                        key={index}
                        className={`lp-exp-item ${isActive ? 'active' : ''}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        style={{ backgroundImage: `url(${exp.image})` }}
                    >
                        <div className="lp-exp-overlay"></div>

                        <div className="lp-exp-content">
                            <div className="lp-exp-details">
                                <h3 className="lp-exp-title">{exp.badgeText}</h3>
                                <p className="lp-exp-desc">{exp.description}</p>
                            </div>

                            <div className="lp-exp-number-wrapper">
                                <div className="lp-exp-number">{index + 1}</div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ===== Main Landing Page =====
function LandingPage() {
    const { user } = useAuth()
    const { t, i18n } = useTranslation()
    const [email, setEmail] = useState('')
    const [emailSent, setEmailSent] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleEmailSubmit = (e) => {
        e.preventDefault()
        if (email.trim()) {
            setEmailSent(true)
            setEmail('')
        }
    }

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng)
    }

    const experiences = [
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_1_cusjwd.png',
            badgeText: t('experiences.items.culinary.badge'),
            title: t('experiences.items.culinary.title'),
            description: t('experiences.items.culinary.desc')
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_2_r0lqnq.png',
            badgeText: t('experiences.items.art.badge'),
            title: t('experiences.items.art.title'),
            description: t('experiences.items.art.desc')
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_3_vi6m2k.png',
            badgeText: t('experiences.items.community.badge'),
            title: t('experiences.items.community.title'),
            description: t('experiences.items.community.desc')
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773458538/kham-pha-2khudulich-con-noi-tieng-ocantho-06-7-2018-6_ywyh6f.jpg',
            badgeText: t('experiences.items.explore.badge'),
            title: t('experiences.items.explore.title'),
            description: t('experiences.items.explore.desc')
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_5_avm8sd.png',
            badgeText: t('experiences.items.folk_art.badge'),
            title: t('experiences.items.folk_art.title'),
            description: t('experiences.items.folk_art.desc')
        }
    ]

    return (
        <div className="lp-wrapper">
            {/* ===== LANDING NAVBAR ===== */}
            <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <div className="lp-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png" alt="Go Quest Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                        <span className="lp-nav-name" style={{ color: scrolled ? 'var(--color-text-primary)' : 'white' }}>Go Quest</span>
                    </div>

                    <div className="lp-nav-links">
                        <button onClick={() => scrollToSection('lp-mission')} className="lp-nav-link">{t('nav.mission')}</button>
                        <button onClick={() => scrollToSection('lp-experiences')} className="lp-nav-link">{t('nav.experiences')}</button>
                        <button onClick={() => scrollToSection('lp-impact')} className="lp-nav-link">{t('nav.impact')}</button>
                    </div>

                    <div className="lp-nav-actions">
                        <div className="lang-switcher" style={{ display: 'flex', background: scrolled ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '24px', marginRight: 'var(--space-md)' }}>
                            <button
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: 'none', background: i18n.language === 'vi' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'vi' ? '#fff' : (scrolled ? 'var(--color-text-primary)' : 'inherit'), cursor: 'pointer', transition: 'all 0.3s' }}
                                onClick={() => changeLanguage('vi')}
                                title="Tiếng Việt"
                            >
                                <img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN Flag" style={{ borderRadius: '2px' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>VI</span>
                            </button>
                            <button
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: 'none', background: i18n.language === 'en' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'en' ? '#fff' : (scrolled ? 'var(--color-text-primary)' : 'inherit'), cursor: 'pointer', transition: 'all 0.3s' }}
                                onClick={() => changeLanguage('en')}
                                title="English"
                            >
                                <img src="https://flagcdn.com/w20/gb.png" srcSet="https://flagcdn.com/w40/gb.png 2x" width="20" alt="UK Flag" style={{ borderRadius: '2px' }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>EN</span>
                            </button>
                        </div>

                        {user ? (
                            <Link
                                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                className="btn btn-primary"
                                style={{ padding: 'var(--space-sm) var(--space-xl)' }}
                            >
                                {t('nav.dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    className="btn" 
                                    style={{ 
                                        padding: 'var(--space-sm) var(--space-xl)', 
                                        background: scrolled ? 'rgba(45, 122, 58, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                                        color: scrolled ? 'var(--color-accent-primary)' : 'white',
                                        fontSize: 'var(--font-size-sm)',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 600
                                    }}
                                >
                                    {t('nav.login')}
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="btn btn-primary" 
                                    style={{ 
                                        padding: 'var(--space-sm) var(--space-xl)',
                                        fontSize: 'var(--font-size-sm)',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                >
                                    {t('nav.register')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ===== HERO TEXT SECTION ===== */}
            <section className="lp-hero-text">
                <div className="lp-hero-content animate-fade-in">
                    <div className="lp-hero-badge">
                        <span></span>
                        <span>{t('hero.badge')}</span>
                    </div>

                    <h1 className="lp-hero-title">
                        <em>{t('hero.title')}</em>
                    </h1>

                    <p className="lp-hero-subtitle">
                        {t('hero.subtitle')}
                    </p>

                    <div className="lp-hero-cta">
                        <Link to="/register" className="btn btn-primary lp-btn-large">
                            {t('hero.cta_start')}
                        </Link>
                        <button
                            onClick={() => scrollToSection('lp-experiences')}
                            className="btn btn-secondary lp-btn-large"
                        >
                            {t('hero.cta_explore')}
                        </button>
                    </div>
                </div>
            </section>

            {/* ===== HERO IMAGE SECTION ===== */}
            <section className="lp-hero-image">
                <div className="lp-hero-bg" />
            </section>

            {/* ===== STATS STRIP ===== */}
            <div className="lp-stats-strip">
                <div className="lp-stats-grid">
                    <div className="lp-stat">
                        <div className="lp-stat-number">
                            <AnimatedCounter target="200" suffix="+" />
                        </div>
                        <div className="lp-stat-label">{t('stats.visitors')}</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-number">
                            <AnimatedCounter target="10" suffix="+" />
                        </div>
                        <div className="lp-stat-label">{t('stats.missions')}</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-number">
                            <AnimatedCounter target="30" suffix="+" />
                        </div>
                        <div className="lp-stat-label">{t('stats.households')}</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-number">
                            <AnimatedCounter target="60" suffix="%" />
                        </div>
                        <div className="lp-stat-label">{t('stats.green_behavior')}</div>
                    </div>
                </div>
            </div>

            {/* ===== MISSION SECTION ===== */}
            <section className="lp-section" id="lp-mission">
                <div className="container">
                    <div className="lp-mission-grid">
                        <div className="lp-mission-visual">
                            <div className="lp-mission-img">
                                <img
                                    src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1772892889/Anh1_wiw5fq.png"
                                    alt="Sứ mệnh Cồn Sơn"
                                    className="lp-mission-image"
                                />
                            </div>
                        </div>

                        <div className="lp-mission-content">
                            <span className="lp-section-label">{t('mission.label')}</span>
                            <h2 className="lp-section-title">
                                {t('mission.title')}
                            </h2>
                            <p className="lp-section-text">
                                {t('mission.text')}
                            </p>

                            <div className="lp-feature-list">
                                <div className="lp-feature-item">
                                    <div className="lp-feature-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-primary)' }}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="lp-feature-title">{t('mission.green_tourism.title')}</h4>
                                        <p className="lp-feature-desc">{t('mission.green_tourism.desc')}</p>
                                    </div>
                                </div>
                                <div className="lp-feature-item">
                                    <div className="lp-feature-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-primary)' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="lp-feature-title">{t('mission.community_support.title')}</h4>
                                        <p className="lp-feature-desc">{t('mission.community_support.desc')}</p>
                                    </div>
                                </div>
                                <div className="lp-feature-item">
                                    <div className="lp-feature-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-primary)' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="lp-feature-title">{t('mission.gamification.title')}</h4>
                                        <p className="lp-feature-desc">{t('mission.gamification.desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== EXPERIENCES SECTION ===== */}
            <section className="lp-section lp-section--alt" id="lp-experiences">
                <div className="container">
                    <div className="lp-section-header">
                        <span className="lp-section-label">{t('experiences.label')}</span>
                        <h2 className="lp-section-title">{t('experiences.title')}</h2>
                        <p className="lp-section-text" style={{ maxWidth: '560px', margin: '0 auto' }}>
                            {t('experiences.subtitle')}
                        </p>
                    </div>

                    <div className="lp-experience-container">
                        <ExperienceAccordion experiences={experiences} />
                    </div>

                    <div className="lp-experiences-cta">
                        <Link to="/register" className="btn btn-primary lp-btn-large">
                            {t('experiences.cta')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== IMPACT SECTION ===== */}
            <section className="lp-section lp-section--impact" id="lp-impact">
                <div className="container">
                    <div className="lp-impact-grid">
                        <div className="lp-impact-content">
                            <span className="lp-section-label lp-section-label--light">{t('impact.label')}</span>
                            <h2 className="lp-section-title lp-section-title--light">{t('impact.title')}</h2>
                            <p className="lp-impact-text">
                                {t('impact.text')}
                            </p>

                            <Link to="/register" className="btn lp-btn-white lp-btn-large" style={{ marginTop: 'var(--space-xl)' }}>
                                {t('impact.cta')}
                            </Link>
                        </div>

                        <div className="lp-impact-progress">
                            <div className="lp-mission-visual" style={{ marginBottom: 'var(--space-xl)' }}>
                                <div className="lp-mission-img" style={{ aspectRatio: '16/9' }}>
                                    <img
                                        src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1772875069/RacThaiNhua_dqmybp.png"
                                        alt="Tác động rác thải nhựa"
                                        className="lp-mission-image"
                                    />
                                </div>
                            </div>
                            <div className="card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <h3 style={{ marginBottom: 'var(--space-xl)', fontSize: 'var(--font-size-lg)' }}>
                                    {t('impact.goals_title')}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                    <ProgressBar label={t('impact.goal_mission')} percent={80} />
                                    <ProgressBar label={t('impact.goal_green')} percent={70} />
                                    <ProgressBar label={t('impact.goal_journey')} percent={75} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="lp-section">
                <div className="container">
                    <div className="lp-section-header">
                        <span className="lp-section-label">{t('how_it_works.label')}</span>
                        <h2 className="lp-section-title">{t('how_it_works.title')}</h2>
                    </div>
                    <div className="lp-steps-grid">
                        <div className="lp-step">
                            <div className="lp-step-number">01</div>
                            <div className="lp-step-icon">📱</div>
                            <h3 className="lp-step-title">{t('how_it_works.step1.title')}</h3>
                            <p className="lp-step-desc">{t('how_it_works.step1.desc')}</p>
                        </div>
                        <div className="lp-step-arrow">→</div>
                        <div className="lp-step">
                            <div className="lp-step-number">02</div>
                            <div className="lp-step-icon">🗺️</div>
                            <h3 className="lp-step-title">{t('how_it_works.step2.title')}</h3>
                            <p className="lp-step-desc">{t('how_it_works.step2.desc')}</p>
                        </div>
                        <div className="lp-step-arrow">→</div>
                        <div className="lp-step">
                            <div className="lp-step-number">03</div>
                            <div className="lp-step-icon">🏆</div>
                            <h3 className="lp-step-title">{t('how_it_works.step3.title')}</h3>
                            <p className="lp-step-desc">{t('how_it_works.step3.desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="lp-cta-section" id="lp-join">
                <div className="container">
                    <div className="lp-cta-card">
                        <div className="lp-cta-glow" />
                        <h2 className="lp-cta-title">{t('cta_section.title')}</h2>
                        <p className="lp-cta-subtitle">
                            {t('cta_section.subtitle')}
                        </p>

                        {emailSent ? (
                            <div className="lp-cta-success">
                                <span></span> {t('cta_section.success')}
                            </div>
                        ) : (
                            <form className="lp-cta-form" onSubmit={handleEmailSubmit}>
                                <input
                                    type="email"
                                    className="form-input lp-cta-input"
                                    placeholder={t('cta_section.email_placeholder')}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn btn-primary">{t('cta_section.submit')}</button>
                            </form>
                        )}

                        <div className="lp-cta-or">
                            <span>{t('cta_section.or')}</span>
                        </div>
                        <Link to="/register" className="btn btn-secondary lp-btn-large">
                            {t('cta_section.register')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="lp-footer">
                <div className="container">
                    <div className="lp-footer-grid">
                        <div className="lp-footer-brand">
                            <div className="navbar-brand" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png" alt="Go Quest Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'white' }}>Go Quest</span>
                            </div>
                            <p className="lp-footer-desc">
                                {t('footer.desc')}
                            </p>
                        </div>

                        <div>
                            <h5 className="lp-footer-heading">{t('footer.explore')}</h5>
                            <ul className="lp-footer-links">
                                <li><button onClick={() => scrollToSection('lp-experiences')} className="lp-footer-link">{t('nav.experiences')}</button></li>
                                <li><button onClick={() => scrollToSection('lp-impact')} className="lp-footer-link">{t('nav.impact')}</button></li>
                                <li><Link to="/register" className="lp-footer-link">{t('nav.register')}</Link></li>
                                <li><Link to="/login" className="lp-footer-link">{t('nav.login')}</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="lp-footer-heading">{t('footer.contact')}</h5>
                            <ul className="lp-footer-links">
                                <li>📍 Cồn Sơn, Bình Thủy, Cần Thơ</li>
                                <li>✉️ ConSonGoQuest@gmail.com</li>
                                <li>📞 +84 (0) 942 004 995</li>
                            </ul>
                        </div>
                    </div>

                    <div className="lp-footer-bottom">
                        <p>{t('footer.copyright')}</p>
                        <div className="lp-footer-socials">
                            <a href="#" className="lp-footer-link">Facebook</a>
                            <a href="#" className="lp-footer-link">Instagram</a>
                            <a href="#" className="lp-footer-link">YouTube</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
