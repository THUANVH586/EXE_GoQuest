import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

    const experiences = [
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_1_cusjwd.png',
            badgeText: 'Ẩm thực',
            title: 'Làm Bánh Dân Gian',
            description: 'Tự tay nhào bột, nắn bánh và hấp những chiếc bánh truyền thống thơm lừng theo công thức trăm năm.'
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_2_r0lqnq.png',
            badgeText: 'Nghệ thuật',
            title: 'Vẽ Nón Lá Nghệ Thuật',
            description: 'Sáng tạo họa tiết phong cảnh Cồn Sơn trên nền nón lá trắng, tạo nên món quà lưu niệm độc bản mang dấu ấn.'
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_3_vi6m2k.png',
            badgeText: 'Cộng đồng',
            title: 'Trải Nghiệm Bán Hàng',
            description: 'Đứng quầy bán bánh tráng trộn cùng người dân địa phương, cảm nhận nhịp sống bình dị và chân thực của Cồn Sơn.'
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_4_ommyyg.png',
            badgeText: 'Khám phá',
            title: 'Hành Trình Khám Phá',
            description: 'Di chuyển và khám phá toàn bộ Cồn Sơn bằng cách tích lũy ít nhất 2000m, trải nghiệm hòn đảo xanh mát từng góc nhỏ.'
        },
        {
            image: 'https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773065757/exp_5_avm8sd.png',
            badgeText: 'Nghệ thuật cổ truyền',
            title: 'Hát Đờn Ca Tài Tử',
            description: 'Thưởng thức không gian âm nhạc di sản thấm đẫm tình đất, tình người Nam Bộ qua những giai điệu mộc mạc.'
        }
    ]

    return (
        <div className="lp-wrapper">
            {/* ===== LANDING NAVBAR ===== */}
            <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <div className="lp-nav-brand">
                        <span className="lp-nav-logo"></span>
                        <span className="lp-nav-name">Cồn Sơn Explorer</span>
                    </div>

                    <div className="lp-nav-links">
                        <button onClick={() => scrollToSection('lp-mission')} className="lp-nav-link">Sứ mệnh</button>
                        <button onClick={() => scrollToSection('lp-experiences')} className="lp-nav-link">Trải nghiệm</button>
                        <button onClick={() => scrollToSection('lp-impact')} className="lp-nav-link">Tác động</button>
                    </div>

                    <div className="lp-nav-actions">
                        {user ? (
                            <Link
                                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                className="btn btn-primary"
                                style={{ padding: 'var(--space-sm) var(--space-xl)' }}
                            >
                                Vào Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="lp-nav-link">Đăng nhập</Link>
                                <Link to="/register" className="btn btn-primary" style={{ padding: 'var(--space-sm) var(--space-xl)' }}>
                                    Đăng ký ngay
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
                        <span>Du lịch bền vững tại Cần Thơ</span>
                    </div>

                    <h1 className="lp-hero-title">
                        <em>Trải Nghiệm Du Lịch Cồn Sơn</em>
                    </h1>

                    <p className="lp-hero-subtitle">
                        Sống cùng miền sông nước – Trải nghiệm thật, giá trị thật.
                    </p>

                    <div className="lp-hero-cta">
                        <Link to="/register" className="btn btn-primary lp-btn-large">
                            Bắt đầu hành trình
                        </Link>
                        <button
                            onClick={() => scrollToSection('lp-experiences')}
                            className="btn btn-secondary lp-btn-large"
                        >
                            Khám phá ngay
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
                            <AnimatedCounter target="5200" suffix="+" />
                        </div>
                        <div className="lp-stat-label">Cây ăn trái đã trồng</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-number">
                            <AnimatedCounter target="150" suffix="+" />
                        </div>
                        <div className="lp-stat-label">Hộ dân được hỗ trợ</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-number">
                            <AnimatedCounter target="12" suffix=".5T" />
                        </div>
                        <div className="lp-stat-label">Nhựa được cắt giảm</div>
                    </div>
                    <div className="lp-stat">
                        <div className="lp-stat-number">
                            <AnimatedCounter target="100" suffix="%" />
                        </div>
                        <div className="lp-stat-label">Nguyên liệu hữu cơ</div>
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
                            <span className="lp-section-label">Về chúng tôi</span>
                            <h2 className="lp-section-title">
                                Sứ mệnh gìn giữ <br />hồn cốt Miền Tây
                            </h2>
                            <p className="lp-section-text">
                                Chúng tôi không chỉ làm du lịch. Chúng tôi xây dựng một hệ sinh thái cộng đồng nơi
                                mỗi du khách ghé thăm đều đóng góp trực tiếp vào việc bảo tồn vườn cây ăn trái,
                                phục dựng các làng nghề truyền thống và nâng cao đời sống của người dân bản địa.
                            </p>

                            <div className="lp-feature-list">
                                <div className="lp-feature-item">
                                    <div className="lp-feature-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-primary)' }}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="lp-feature-title">Du lịch Xanh</h4>
                                        <p className="lp-feature-desc">Giảm thiểu rác thải nhựa và ưu tiên sử dụng các nguyên liệu từ thiên nhiên trong mọi trải nghiệm.</p>
                                    </div>
                                </div>
                                <div className="lp-feature-item">
                                    <div className="lp-feature-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-primary)' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="lp-feature-title">Hỗ trợ Cộng đồng</h4>
                                        <p className="lp-feature-desc">100% hướng dẫn viên là người dân địa phương, mang đến câu chuyện chân thực nhất từ chính quê hương họ.</p>
                                    </div>
                                </div>
                                <div className="lp-feature-item">
                                    <div className="lp-feature-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent-primary)' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="lp-feature-title">Gamification</h4>
                                        <p className="lp-feature-desc">Tích điểm, hoàn thành nhiệm vụ và khám phá Cồn Sơn theo cách thú vị, tương tác và đầy ý nghĩa.</p>
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
                        <span className="lp-section-label">Hoạt động</span>
                        <h2 className="lp-section-title">Trải nghiệm Tương tác</h2>
                        <p className="lp-section-text" style={{ maxWidth: '560px', margin: '0 auto' }}>
                            Chạm vào văn hóa thông qua đôi bàn tay và cảm nhận hương vị bản địa qua từng hoạt động thực tế.
                        </p>
                    </div>

                    <div className="lp-experience-container">
                        <ExperienceAccordion experiences={experiences} />
                    </div>

                    <div className="lp-experiences-cta">
                        <Link to="/register" className="btn btn-primary lp-btn-large">
                            Tham gia ngay &amp; nhận nhiệm vụ
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== IMPACT SECTION ===== */}
            <section className="lp-section lp-section--impact" id="lp-impact">
                <div className="container">
                    <div className="lp-impact-grid">
                        <div className="lp-impact-content">
                            <span className="lp-section-label lp-section-label--light">Tác động</span>
                            <h2 className="lp-section-title lp-section-title--light">Tác động Bền vững</h2>
                            <p className="lp-impact-text">
                                Mỗi bước chân của bạn đều để lại những giá trị tích cực. Chúng tôi minh bạch hóa
                                các nỗ lực bảo vệ môi trường thông qua các con số thực tế.
                            </p>

                            <Link to="/register" className="btn lp-btn-white lp-btn-large" style={{ marginTop: 'var(--space-xl)' }}>
                                Trở thành người đồng hành
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
                                    Tầm nhìn 2025
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                    <ProgressBar label="Hoàn thiện hệ thống lọc nước sạch" percent={85} />
                                    <ProgressBar label="Chuyển đổi năng lượng mặt trời" percent={60} />
                                    <ProgressBar label="Bảo tồn cá hô, cá tra dầu" percent={90} />
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
                        <span className="lp-section-label">Cách thức</span>
                        <h2 className="lp-section-title">Cách hoạt động</h2>
                    </div>
                    <div className="lp-steps-grid">
                        <div className="lp-step">
                            <div className="lp-step-number">01</div>
                            <div className="lp-step-icon">📱</div>
                            <h3 className="lp-step-title">Đăng ký tài khoản</h3>
                            <p className="lp-step-desc">Tạo tài khoản miễn phí và bắt đầu hành trình khám phá Cồn Sơn của bạn.</p>
                        </div>
                        <div className="lp-step-arrow">→</div>
                        <div className="lp-step">
                            <div className="lp-step-number">02</div>
                            <div className="lp-step-icon">🗺️</div>
                            <h3 className="lp-step-title">Nhận nhiệm vụ</h3>
                            <p className="lp-step-desc">Chọn các nhiệm vụ ẩm thực, nghệ thuật, cộng đồng và hoàn thành tại điểm đến.</p>
                        </div>
                        <div className="lp-step-arrow">→</div>
                        <div className="lp-step">
                            <div className="lp-step-number">03</div>
                            <div className="lp-step-icon">🏆</div>
                            <h3 className="lp-step-title">Tích điểm &amp; Phần thưởng</h3>
                            <p className="lp-step-desc">Hoàn thành nhiệm vụ, tích lũy điểm và mang về những kỷ niệm khó quên.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="lp-cta-section" id="lp-join">
                <div className="container">
                    <div className="lp-cta-card">
                        <div className="lp-cta-glow" />
                        <h2 className="lp-cta-title">Sẵn sàng để hòa mình với thiên nhiên?</h2>
                        <p className="lp-cta-subtitle">
                            Đăng ký ngay để nhận cẩm nang du lịch Cồn Sơn miễn phí và bắt đầu hành trình gamification xanh.
                        </p>

                        {emailSent ? (
                            <div className="lp-cta-success">
                                <span></span> Cảm ơn! Chúng tôi sẽ liên lạc sớm nhất có thể.
                            </div>
                        ) : (
                            <form className="lp-cta-form" onSubmit={handleEmailSubmit}>
                                <input
                                    type="email"
                                    className="form-input lp-cta-input"
                                    placeholder="Email của bạn"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn btn-primary">Gửi thông tin</button>
                            </form>
                        )}

                        <div className="lp-cta-or">
                            <span>hoặc</span>
                        </div>
                        <Link to="/register" className="btn btn-secondary lp-btn-large">
                            Tạo tài khoản ngay
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="lp-footer">
                <div className="container">
                    <div className="lp-footer-grid">
                        <div className="lp-footer-brand">
                            <div className="navbar-brand" style={{ marginBottom: 'var(--space-md)' }}>
                                <span>Cồn Sơn Explorer</span>
                            </div>
                            <p className="lp-footer-desc">
                                Ứng dụng du lịch trải nghiệm dựa vào cộng đồng, tiên phong trong mô hình du lịch bền vững
                                và bảo tồn bản sắc văn hóa tại miền Tây Nam Bộ, Việt Nam.
                            </p>
                        </div>

                        <div>
                            <h5 className="lp-footer-heading">Khám phá</h5>
                            <ul className="lp-footer-links">
                                <li><button onClick={() => scrollToSection('lp-experiences')} className="lp-footer-link">Trải nghiệm</button></li>
                                <li><button onClick={() => scrollToSection('lp-impact')} className="lp-footer-link">Tác động</button></li>
                                <li><Link to="/register" className="lp-footer-link">Đăng ký chơi</Link></li>
                                <li><Link to="/login" className="lp-footer-link">Đăng nhập</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="lp-footer-heading">Liên hệ</h5>
                            <ul className="lp-footer-links">
                                <li>📍 Cồn Sơn, Bình Thủy, Cần Thơ</li>
                                <li>✉️ hello@conson.travel</li>
                                <li>📞 +84 (0) 123 456 789</li>
                            </ul>
                        </div>
                    </div>

                    <div className="lp-footer-bottom">
                        <p>© 2025 Cồn Sơn Explorer. Phát triển vì cộng đồng địa phương.</p>
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
