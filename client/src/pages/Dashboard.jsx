import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { calculateDistance } from '../utils/geo'
import toast from 'react-hot-toast'
import InteractiveMap from '../components/InteractiveMap'

import confetti from 'canvas-confetti'
import CountdownTimer from '../components/CountdownTimer'

/* ─── Địa điểm nổi bật tại Cồn Sơn ────────────────────────────── */
const CON_SON_MARKERS = [
    { lat: 10.08453, lng: 105.75048, title: '🌿 Trung tâm Cồn Sơn' },
    { lat: 10.0841,  lng: 105.7512,  title: '🍜 Ẩm thực dân gian (Thực đơn bay)' },
    { lat: 10.0850,  lng: 105.7498,  title: '🎨 Làng nghề bánh dân gian' },
    { lat: 10.0862,  lng: 105.7510,  title: '🐟 Xem cá lóc bay' },
    { lat: 10.0803,  lng: 105.7444,  title: '🚢 Bến đò Cô Bắc (xuất phát)' },
]

/* Tọa độ chỉ đường đến bến đò (du khách đi xuỳng đ liên tại bến, sau đó đi thuyền vào Cồn Sơn) */
const DIRECTIONS_TARGET = '10.0803,105.7444' // Bến đò Cô Bắc

/* ─── Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()

    const [tasks, setTasks] = useState([])
    const [activeNav, setActiveNav] = useState('journey')
    const [searchVal, setSearchVal] = useState('')
    const [celebrateId, setCelebrateId] = useState(null)
    const [isTracking, setIsTracking] = useState(false)
    const [distance, setDistance] = useState(user?.longTermProgress?.distance || 0)
    const [plasticCommit, setPlasticCommit] = useState(user?.longTermProgress?.usingPersonalBottle || false)
    const [completedIds, setCompletedIds] = useState([])
    const [currentPos, setCurrentPos] = useState(null)
    const [isMapExpanded, setIsMapExpanded] = useState(false)
    const [journeyTasks, setJourneyTasks] = useState(() => {
        try {
            const saved = localStorage.getItem('journeyTasks')
            return saved ? JSON.parse(saved) : []
        } catch (e) {
            return []
        }
    })
    const [toastMsg, setToastMsg] = useState(null)
    const [toastType, setToastType] = useState('success')
    const [verifyCodes, setVerifyCodes] = useState({})
    const watchRef = useRef(null)
    const lastPosRef = useRef(null)
    const lastSavedDistanceRef = useRef(distance)
    const distanceRef = useRef(distance)

    function getRank(pts) {
        if (pts >= 1000) return { name: t('dashboard.rank.gold'), icon: '🏆', next: null, need: 0 }
        if (pts >= 500) return { name: t('dashboard.rank.silver'), icon: '🥈', next: t('dashboard.rank.gold'), need: 1000 - pts }
        return { name: t('dashboard.rank.bronze'), icon: '🥉', next: t('dashboard.rank.silver'), need: 500 - pts }
    }

    // Keep distanceRef in sync with distance state
    useEffect(() => {
        distanceRef.current = distance
    }, [distance])

    /* fetch tasks and progress */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/tasks/progress')
                setTasks(response.data.tasks || [])
                const done = response.data.tasks?.filter(t => t.isCompleted).map(t => t._id) || []
                setCompletedIds(done)
                if (response.data.longTermProgress) {
                    setDistance(response.data.longTermProgress.distance || 0)
                    lastSavedDistanceRef.current = response.data.longTermProgress.distance || 0
                    setPlasticCommit(response.data.longTermProgress.usingPersonalBottle || false)
                }
            } catch (err) {
                console.error('Failed to fetch tasks:', err)
            }
        }
        fetchData()
    }, [])

    /* Tự động lấy vị trí ngay khi Dashboard load */
    useEffect(() => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords
                setCurrentPos({ lat, lng })
            },
            (err) => {
                console.warn('Không thể lấy vị trí ban đầu:', err.message)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        )
    }, [])

    /* GPS tracking (real-time khi bật) */
    useEffect(() => {
        if (isTracking) {
            if (!navigator.geolocation) { showToast(t('dashboard.toasts.gps_unsupported'), 'error'); return }
            watchRef.current = navigator.geolocation.watchPosition(pos => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords

                // Loosen accuracy check for indoor/laptop development
                if (accuracy > 500) return;

                // Cập nhật vị trí hiện tại cho bản đồ
                setCurrentPos({ lat, lng })

                if (lastPosRef.current) {
                    const d = calculateDistance(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng)

                    // Update if moved at all (> 0.5 meters)
                    if (d > 0.5) {
                        // Avoid adding massive jumps (e.g. > 1000m) which might be GPS glitches
                        if (d < 1000) {
                            setDistance(prev => prev + d)
                        }
                        lastPosRef.current = { lat, lng }
                    }
                } else {
                    lastPosRef.current = { lat, lng } // First point after starting
                }
            }, (err) => {
                console.error('GPS Error:', err)
                // Don't spam toast on every error, just log it
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 })
        } else {
            if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
            lastPosRef.current = null // Reset để tránh nhảy vị trí khi khởi động lại
            // Giữ nguyên currentPos để marker vẫn hiển thị trên bản đồ
        }
        return () => {
            if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
        }
    }, [isTracking])

    /* Sync distance to backend periodically */
    useEffect(() => {
        const syncInterval = setInterval(async () => {
            const currentDist = distanceRef.current
            if (Math.abs(currentDist - lastSavedDistanceRef.current) > 10) { // Sync if moved > 10m
                try {
                    await api.patch('/tasks/long-term', { distance: currentDist })
                    lastSavedDistanceRef.current = currentDist
                    console.log('Distance synced:', currentDist)
                } catch (err) {
                    console.error('Failed to sync distance:', err)
                }
            }
        }, 10000) // Every 10 seconds

        return () => clearInterval(syncInterval)
    }, [])

    /* Đóng fullscreen map bằng phím Escape */
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsMapExpanded(false)
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [])

    const showToast = (msg, type = 'success') => {
        setToastMsg(msg)
        setToastType(type)
        if (type === 'success') toast.success(msg)
        else toast.error(msg)
        setTimeout(() => setToastMsg(null), 3000)
    }

    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const handleStartMission = async (taskId) => {
        try {
            const res = await api.post(`/tasks/start/${taskId}`);
            // Force refresh tasks and progress
            const progressRes = await api.get('/tasks/progress');
            setTasks(progressRes.data.tasks || []);
            showToast(res.data.message);
        } catch (err) {
            if (err.response?.status === 400 && err.response.data.message.includes('hết hạn')) {
                // Trigger PayOS payment
                handlePayment(taskId);
            } else {
                showToast(err.response?.data?.message || 'Lỗi bắt đầu nhiệm vụ', 'error');
            }
        }
    }

    const handlePayment = async (taskId) => {
        try {
            const res = await api.post('/payment/create-payment-link', { taskId });
            window.location.href = res.data.checkoutUrl;
        } catch (err) {
            showToast('Lỗi tạo link thanh toán', 'error');
        }
    }

    const handleComplete = async (taskId, code) => {
        if (completedIds.includes(taskId)) return
        if (!code) {
            showToast('Vui lòng nhập mã xác nhận từ nhân viên', 'error');
            return;
        }
        try {
            await api.post(`/tasks/complete/${taskId}`, { code })
            const newCompleted = [...completedIds, taskId];
            setCompletedIds(newCompleted)
            setCelebrateId(taskId)
            
            if (newCompleted.length === 5) {
                triggerConfetti();
            }

            setTimeout(() => setCelebrateId(null), 800)
            showToast(t('dashboard.toasts.complete_success'))
            
            // Refresh tasks
            const response = await api.get('/tasks/progress')
            setTasks(response.data.tasks || [])
        } catch (err) {
            showToast(err.response?.data?.message || t('dashboard.toasts.complete_error'), 'error')
        }
    }

    const handleReceiveTasks = () => {
        if (!tasks || tasks.length === 0) {
            showToast(t('dashboard.toasts.load_error'), 'error')
            return
        }
        // Filter out completed tasks first? Or just any 5?
        // User said "random nhiệm vụ", usually means from all available.
        const shuffled = [...tasks].sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, 5)
        setJourneyTasks(selected)
        localStorage.setItem('journeyTasks', JSON.stringify(selected))
        showToast(t('dashboard.toasts.refresh_tasks'))
    }

    const handleLogout = () => { logout(); navigate('/') }

    const handlePlasticCommit = async (e) => {
        const checked = e.target.checked
        setPlasticCommit(checked)
        try {
            await api.patch('/tasks/long-term', { usingPersonalBottle: checked })
            if (checked) {
                showToast(t('dashboard.toasts.complete_success'))
            }
        } catch (err) {
            console.error('Error committing', err)
            setPlasticCommit(!checked)
            showToast(t('dashboard.toasts.complete_error'), 'error')
        }
    }

    /* computed */
    const REQUIRED_TASKS = 5;
    const basePts = tasks.filter(t => completedIds.includes(t._id)).reduce((s, t) => s + (t.points || 0), 0)
    const totalPts = basePts + (plasticCommit ? 200 : 0)
    const pct = tasks.length > 0 ? Math.min(Math.round((completedIds.length / REQUIRED_TASKS) * 100), 100) : 0
    const barPct = Math.min((totalPts / 1000) * 100, 100)
    const rank = getRank(totalPts)

    const filteredTasks = tasks.filter(t =>
        (t.title || '').toLowerCase().includes(searchVal.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchVal.toLowerCase())
    )

    /* recent activity — show completed tasks */
    const recentDone = tasks.filter(t => completedIds.includes(t._id)).slice(-3).reverse()
    const activities = recentDone.map(t_item => ({
        emoji: t_item.icon || '✅',
        label: t('dashboard.recent_activity.completed_text', { title: t_item.title }),
        time: t('dashboard.recent_activity.points_time', { points: t_item.points })
    }))

    const navItems = [
        { key: 'journey', icon: '🗺️', label: t('dashboard.nav.journey') },
        { key: 'tasks', icon: '📋', label: t('dashboard.nav.tasks') },
        { key: 'rank', icon: '🏆', label: t('dashboard.nav.rank') },
        { key: 'challenges', icon: '✨', label: t('dashboard.nav.challenges') },
    ]

    /* ─── Render ─── */
    return (
        <div className="dsh-root">

            {/* ══════════ HEADER ══════════ */}
            <header className="dsh-header">
                <div className="dsh-header-left">
                    <Link to="/" className="dsh-logo">
                        <span className="dsh-logo-icon"></span>
                        <span className="dsh-logo-name">Go Quest</span>
                    </Link>
                    <nav className="dsh-top-nav">
                        <Link className="dsh-top-link" to="/">{t('dashboard.nav.intro')}</Link>
                        <button
                            className={`dsh-top-link ${activeNav === 'journey' ? 'dsh-top-link--active' : ''}`}
                            onClick={() => setActiveNav('journey')}
                        >
                            {t('dashboard.nav.journey')}
                        </button>
                        <button
                            className={`dsh-top-link ${activeNav === 'tasks' ? 'dsh-top-link--active' : ''}`}
                            onClick={() => setActiveNav('tasks')}
                        >
                            {t('dashboard.nav.tasks')}
                        </button>
                        <a className="dsh-top-link" href="#">{t('dashboard.nav.community')}</a>
                    </nav>
                </div>
                <div className="dsh-header-right" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div className="lang-switcher" style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '24px' }}>
                        <button
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', border: 'none', background: i18n.language === 'vi' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'vi' ? '#fff' : 'inherit', cursor: 'pointer', transition: 'all 0.3s' }}
                            onClick={() => i18n.changeLanguage('vi')}
                            title="Tiếng Việt"
                        >
                            <img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN Flag" style={{ borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>VI</span>
                        </button>
                        <button
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', border: 'none', background: i18n.language === 'en' ? 'var(--color-accent-primary)' : 'transparent', color: i18n.language === 'en' ? '#fff' : 'inherit', cursor: 'pointer', transition: 'all 0.3s' }}
                            onClick={() => i18n.changeLanguage('en')}
                            title="English"
                        >
                            <img src="https://flagcdn.com/w20/gb.png" srcSet="https://flagcdn.com/w40/gb.png 2x" width="20" alt="UK Flag" style={{ borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>EN</span>
                        </button>
                    </div>
                    <div className="dsh-search-box">
                        <span className="dsh-search-icon">🔍</span>
                        <input
                            className="dsh-search-input"
                            placeholder={t('dashboard.search')}
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* ══════════ BODY ══════════ */}
            <div className="dsh-body">

                {/* ── LEFT SIDEBAR ── */}
                <aside className="dsh-sidebar">
                    <div className="dsh-sidebar-card">
                        <div className="dsh-user-row">
                            <div className="dsh-user-avatar">
                                {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="dsh-user-name">{user?.displayName || user?.username}</div>
                                <div className="dsh-user-sub">{t('dashboard.user.subtitle')}</div>
                            </div>
                        </div>
                        <nav className="dsh-side-nav">
                            {navItems.map(item => (
                                <button
                                    key={item.key}
                                    className={`dsh-side-link ${activeNav === item.key ? 'dsh-side-link--active' : ''}`}
                                    onClick={() => setActiveNav(item.key)}
                                >
                                    <span>{item.icon}</span> {item.label}
                                </button>
                            ))}
                            <button className="dsh-side-link dsh-side-link--logout" onClick={handleLogout}>
                                <span></span> {t('dashboard.logout')}
                            </button>
                        </nav>
                    </div>

                    {/* Weekly Challenge */}
                    <div className="dsh-challenge-card">
                        <div className="dsh-challenge-title">{t('dashboard.weekly_challenge.title')}</div>
                        <div className="dsh-challenge-row">
                            <span className="dsh-challenge-icon">🌿</span>
                            <div>
                                <div className="dsh-challenge-name">{t('dashboard.weekly_challenge.name')}</div>
                                <div className="dsh-challenge-sub" style={{ fontSize: '0.85rem' }}>{t('dashboard.weekly_challenge.sub')}</div>
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 4px', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '12px', transition: 'all 0.3s' }}>
                            <input
                                type="checkbox"
                                checked={plasticCommit}
                                onChange={handlePlasticCommit}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--color-success)', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.95rem', color: plasticCommit ? 'var(--color-success)' : 'inherit', fontWeight: plasticCommit ? 600 : 400 }}>
                                {plasticCommit ? t('dashboard.weekly_challenge.committed') : t('dashboard.weekly_challenge.uncommitted')}
                            </span>
                        </label>
                    </div>
                </aside>

                {/* ── MAIN ── */}
                <main className="dsh-main">
                    {activeNav === 'journey' && (
                        <>
                            {/* Hero */}
                            <section className="dsh-hero-card">
                                <div className="dsh-hero-info">
                                    <h1 className="dsh-hero-title">{t('dashboard.hero.title')}</h1>
                                    <p className="dsh-hero-sub">
                                        {t('dashboard.hero.subtitle')}
                                    </p>
                                </div>
                                <div className="dsh-hero-stats">
                                    <div className="dsh-stat">
                                        <span className="dsh-stat-num">{pct}%</span>
                                        <span className="dsh-stat-lbl">{t('dashboard.hero.completed')}</span>
                                    </div>
                                    <div className="dsh-stat-sep" />
                                    <div className="dsh-stat">
                                        <span className="dsh-stat-num dsh-stat-num--dark">{totalPts}</span>
                                        <span className="dsh-stat-lbl">{t('dashboard.hero.points')}</span>
                                    </div>
                                </div>
                                <div className="dsh-hero-bar-wrap">
                                    <div className="dsh-hero-bar-labels">
                                        <span>{t('dashboard.hero.current_progress')}</span>
                                        <span>{t('dashboard.hero.target')}</span>
                                    </div>
                                    <div className="dsh-hero-bar-track">
                                        <div className="dsh-hero-bar-fill" style={{ width: `${barPct}%` }} />
                                    </div>
                                </div>
                            </section>

                            {/* Featured Task Selection */}
                            <section>
                                <div className="dsh-section-head">
                                    <h2 className="dsh-section-title">{t('dashboard.journey_tasks.title')}</h2>
                                    <button className="dsh-see-all" style={{ background: '#2c5926', color: '#fff', padding: '6px 14px', borderRadius: '8px' }} onClick={handleReceiveTasks}>
                                        {t('dashboard.journey_tasks.get_tasks')}
                                    </button>
                                </div>
                                <div className="dsh-task-grid">
                                    {journeyTasks.length > 0 ? (
                                        journeyTasks.map(task => {
                                            // Sync with the latest task data from the main tasks state
                                            const tData = tasks.find(t => t._id === task._id) || task;
                                            const done = tData.isCompleted;
                                            const celebrating = celebrateId === tData._id;
                                            const isStarted = tData.missionStatus === 'started';
                                            const isExpired = tData.missionStatus === 'expired' || (tData.expiresAt && new Date(tData.expiresAt) <= new Date());
                                            
                                            return (
                                                <article key={tData._id} className={`dsh-task-card ${done ? 'dsh-task-card--done' : ''} ${celebrating ? 'dsh-task-card--celebrate' : ''}`}>
                                                    <div className="dsh-task-img-wrap">
                                                        <img src={tData.img} alt={tData.title} className="dsh-task-img" loading="lazy" />
                                                        <div className={`dsh-pts-badge ${done ? 'dsh-pts-badge--done' : ''}`}>
                                                            {done ? t('dashboard.journey_tasks.completed_badge') : t('dashboard.journey_tasks.points_badge', { points: tData.points })}
                                                        </div>
                                                        {isStarted && !isExpired && !done && (
                                                            <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                                                <CountdownTimer expiresAt={tData.expiresAt} onExpire={() => {
                                                                    const progressRes = api.get('/tasks/progress');
                                                                    setTasks(progressRes.data.tasks || []);
                                                                }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`dsh-task-body ${done ? 'dsh-task-body--done' : ''}`}>
                                                        <h3 className="dsh-task-name">{tData.title}</h3>
                                                        <p className="dsh-task-desc">{tData.description}</p>
                                                        
                                                        <div style={{ marginTop: 'auto' }}>
                                                            {done ? (
                                                                <button className="dsh-task-btn dsh-task-btn--done" disabled>
                                                                    {t('dashboard.journey_tasks.reward_btn')}
                                                                </button>
                                                            ) : isStarted && !isExpired ? (
                                                                <>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Nhập mã xác nhận" 
                                                                        value={verifyCodes[tData._id] || ''}
                                                                        onChange={(e) => setVerifyCodes(prev => ({ ...prev, [tData._id]: e.target.value }))}
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '8px', fontSize: '14px' }}
                                                                    />
                                                                    <button className="dsh-task-btn" onClick={() => handleComplete(tData._id, verifyCodes[tData._id])}>
                                                                        Xác nhận hoàn thành
                                                                    </button>
                                                                </>
                                                            ) : isExpired ? (
                                                                <button className="dsh-task-btn" style={{ background: '#ef4444' }} onClick={() => handlePayment(tData._id)}>
                                                                    Hết hạn - Làm lại (5.000đ)
                                                                </button>
                                                            ) : (
                                                                <button className="dsh-task-btn" onClick={() => handleStartMission(tData._id)}>
                                                                    {t('dashboard.journey_tasks.start_btn')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            )
                                        })
                                    ) : (
                                        <div style={{ width: '100%', textAlign: 'center', padding: '2rem', background: 'rgba(44, 89, 38, 0.05)', borderRadius: '1rem', border: '1px dashed rgba(44, 89, 38, 0.2)' }}>
                                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{t('dashboard.journey_tasks.empty_text')}</p>
                                            <button className="dsh-task-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={handleReceiveTasks}>{t('dashboard.journey_tasks.empty_btn')}</button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}

                    {activeNav === 'tasks' && (
                        <section>
                            <div className="dsh-section-head">
                                <h2 className="dsh-section-title">{t('dashboard.all_tasks.title')}</h2>
                                <div className="dsh-task-count">{t('dashboard.all_tasks.count', { count: tasks.length })}</div>
                            </div>
                            <div className="dsh-task-grid">
                                {filteredTasks.map(task => {
                                    const done = task.isCompleted
                                    const celebrating = celebrateId === task._id
                                    const isStarted = task.missionStatus === 'started'
                                    const isExpired = task.missionStatus === 'expired' || (task.expiresAt && new Date(task.expiresAt) <= new Date())

                                    return (
                                        <article key={task._id} className={`dsh-task-card ${done ? 'dsh-task-card--done' : ''} ${celebrating ? 'dsh-task-card--celebrate' : ''}`}>
                                            <div className="dsh-task-img-wrap">
                                                <img src={task.img} alt={task.title} className="dsh-task-img" loading="lazy" />
                                                <div className={`dsh-pts-badge ${done ? 'dsh-pts-badge--done' : ''}`}>
                                                    {done ? t('dashboard.journey_tasks.completed_badge') : t('dashboard.journey_tasks.points_badge', { points: task.points })}
                                                </div>
                                                {isStarted && !isExpired && !done && (
                                                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                                        <CountdownTimer expiresAt={task.expiresAt} onExpire={() => {
                                                            const progressRes = api.get('/tasks/progress');
                                                            setTasks(progressRes.data.tasks || []);
                                                        }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`dsh-task-body ${done ? 'dsh-task-body--done' : ''}`}>
                                                <h3 className="dsh-task-name">{task.title}</h3>
                                                <p className="dsh-task-desc">{task.description}</p>
                                                
                                                    <div style={{ marginTop: 'auto' }}>
                                                        {done ? (
                                                            <button className="dsh-task-btn dsh-task-btn--done" disabled>
                                                                {t('dashboard.journey_tasks.reward_btn')}
                                                            </button>
                                                        ) : isStarted && !isExpired ? (
                                                            <>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Nhập mã xác nhận" 
                                                                    value={verifyCodes[task._id] || ''}
                                                                    onChange={(e) => setVerifyCodes(prev => ({ ...prev, [task._id]: e.target.value }))}
                                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '8px', fontSize: '14px' }}
                                                                />
                                                                <button className="dsh-task-btn" onClick={() => handleComplete(task._id, verifyCodes[task._id])}>
                                                                    Xác nhận hoàn thành
                                                                </button>
                                                            </>
                                                        ) : isExpired ? (
                                                            <button className="dsh-task-btn" style={{ background: '#ef4444' }} onClick={() => handlePayment(task._id)}>
                                                                Hết hạn - Làm lại (5.000đ)
                                                            </button>
                                                        ) : (
                                                            <button className="dsh-task-btn" onClick={() => handleStartMission(task._id)}>
                                                                {t('dashboard.journey_tasks.start_btn')}
                                                            </button>
                                                        )}
                                                    </div>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {activeNav === 'rank' && (
                        <section className="dsh-rank-section">
                            <h2 className="dsh-section-title">{t('dashboard.rank.title')}</h2>
                            <div className="card">
                                <h3>{rank.name}</h3>
                                <p>{t('dashboard.rank.current')} {rank.name} {rank.icon}</p>
                            </div>
                        </section>
                    )}

                    {activeNav === 'challenges' && (
                        <section className="dsh-challenge-section">
                            <h2 className="dsh-section-title">{t('dashboard.challenges.title')}</h2>
                            <div className="card">
                                <h3>{t('dashboard.weekly_challenge.name')}</h3>
                                <p>{t('dashboard.weekly_challenge.sub')}</p>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px', width: 'fit-content', border: plasticCommit ? '1px solid var(--color-success)' : '1px solid transparent', transition: 'all 0.3s' }}>
                                    <input
                                        type="checkbox"
                                        checked={plasticCommit}
                                        onChange={handlePlasticCommit}
                                        style={{ width: '22px', height: '22px', accentColor: 'var(--color-success)', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '1.05rem', color: plasticCommit ? 'var(--color-success)' : 'inherit', fontWeight: plasticCommit ? 'bold' : 'normal' }}>
                                        {plasticCommit ? t('dashboard.weekly_challenge.committed') : t('dashboard.weekly_challenge.uncommitted')}
                                    </span>
                                </label>
                            </div>
                        </section>
                    )}

                    {/* GPS Tracking card - Always visible at bottom */}
                    <div className="dsh-gps-card" style={{
                        background: isTracking ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' : 'var(--bg-glass)',
                        border: isTracking ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.05)',
                        boxShadow: isTracking ? '0 8px 32px rgba(16,185,129,0.12)' : 'none',
                        transition: 'all 0.4s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        padding: '1.25rem',
                        marginTop: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: '16px'
                    }}>
                        {isTracking && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                                background: 'linear-gradient(90deg, transparent, var(--color-success), transparent)',
                                animation: 'pulse 2s infinite'
                            }} />
                        )}
                        <div className="dsh-gps-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="dsh-gps-icon" style={{
                                background: isTracking ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                                color: isTracking ? 'var(--color-success)' : 'inherit',
                                width: '56px', height: '56px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', transition: 'all 0.3s',
                                border: isTracking ? '2px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                boxSizing: 'border-box'
                            }}>
                                {isTracking ? '👣' : '📍'}
                            </div>
                            <div>
                                <div className="dsh-gps-title" style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: '4px' }}>
                                    {t('dashboard.gps.title')}
                                </div>
                                <div className="dsh-gps-dist" style={{
                                    fontSize: '0.95rem',
                                    color: isTracking ? 'var(--color-success)' : 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.5px' }}>{Math.round(distance)}</span> m
                                    {isTracking && <span style={{ fontSize: '0.8rem', opacity: 0.8, background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '12px', marginLeft: '4px' }}>Đang ghi vị trí...</span>}
                                </div>
                            </div>
                        </div>
                        <button
                            className={`dsh-gps-btn ${isTracking ? 'dsh-gps-btn--stop' : ''}`}
                            onClick={() => setIsTracking(t_state => !t_state)}
                            style={{
                                padding: '12px 28px', borderRadius: '30px',
                                background: isTracking ? 'rgba(239,68,68,0.1)' : 'var(--color-accent-primary)',
                                color: isTracking ? 'var(--color-error)' : '#fff',
                                border: isTracking ? '1px solid rgba(239,68,68,0.3)' : 'none',
                                fontWeight: 600, transition: 'all 0.3s', cursor: 'pointer',
                                fontSize: '1rem',
                                boxShadow: isTracking ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)'
                            }}
                        >
                            {isTracking ? t('dashboard.gps.stop') : t('dashboard.gps.start')}
                        </button>
                    </div>
                </main>

                {/* ── RIGHT SIDEBAR ── */}
                <aside className="dsh-aside">
                    {/* Map - Leaflet thật (Moved to top for mobile visibility) */}
                    <div className="dsh-map-card">
                        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p className="dsh-map-title" style={{ margin: 0 }}>{t('dashboard.map.title')}</p>
                                <p className="dsh-map-sub" style={{ margin: '2px 0 0' }}>
                                    {currentPos
                                        ? `🟢 Đã xác định vị trí của bạn`
                                        : t('dashboard.map.subtitle')
                                    }
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {/* Nút chỉ đường */}
                                <button
                                    onClick={() => {
                                        const origin = currentPos
                                            ? `${currentPos.lat},${currentPos.lng}`
                                            : ''
                                        const url = origin
                                            ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${DIRECTIONS_TARGET}&travelmode=driving`
                                            : `https://www.google.com/maps/dir/?api=1&destination=${DIRECTIONS_TARGET}&travelmode=driving`
                                        window.open(url, '_blank')
                                    }}
                                    title="Chỉ đường đến Cồn Sơn"
                                    style={{
                                        background: '#2d7a3a', color: '#fff',
                                        border: 'none', borderRadius: '8px',
                                        padding: '6px 10px', fontSize: '0.78rem',
                                        fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontFamily: 'var(--font-family)',
                                        transition: 'opacity 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                                    onMouseOut={e => e.currentTarget.style.opacity = '1'}
                                >
                                    🗯️ Chỉ đường
                                </button>
                                {/* Nút phóng to */}
                                <button
                                    onClick={() => setIsMapExpanded(true)}
                                    title="Phóng to bản đồ"
                                    style={{
                                        background: 'rgba(44,89,38,0.08)',
                                        border: '1px solid rgba(44,89,38,0.2)',
                                        borderRadius: '8px', padding: '6px 8px',
                                        fontSize: '1rem', cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        lineHeight: 1
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(44,89,38,0.16)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(44,89,38,0.08)'}
                                >
                                    ⛶
                                </button>
                            </div>
                        </div>
                        <div style={{ height: '240px', width: '100%', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                            <InteractiveMap
                                currentPos={currentPos}
                                markers={CON_SON_MARKERS}
                                scrollWheelZoom={false}
                            />
                        </div>
                    </div>

                    {/* Rank Card */}
                    <div className="dsh-rank-card">
                        <div className="dsh-rank-bg"></div>
                        <div className="dsh-rank-content">
                            <span className="dsh-rank-badge">{t('dashboard.rank.current')}</span>
                            <h2 className="dsh-rank-name">{rank.name}</h2>
                            {rank.next
                                ? <p className="dsh-rank-desc">{t('dashboard.rank.next_rank', { points: rank.need, rank: rank.next })}</p>
                                : <p className="dsh-rank-desc">{t('dashboard.rank.max_rank')}</p>
                            }
                            <div className="dsh-rank-icon-row">
                                <span style={{ fontSize: '3.2rem' }}>{rank.icon}</span>
                                <div>
                                    <div className="dsh-rank-pts-lbl">{t('dashboard.rank.next_points_label')}</div>
                                    <div className="dsh-rank-pts">{rank.next ? (rank.next === t('dashboard.rank.silver') ? 500 : 1000) : '—'} Pts</div>
                                </div>
                            </div>
                            <button className="dsh-rank-btn">{t('dashboard.rank.view_privileges')}</button>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="dsh-sidebar-card">
                        <h3 className="dsh-activities-title">{t('dashboard.recent_activity.title')}</h3>
                        <ul className="dsh-activities">
                            {activities.length > 0 ? (
                                activities.map((a, i) => (
                                    <li key={i} className="dsh-activity-row">
                                        <div className="dsh-activity-icon">{a.emoji}</div>
                                        <div>
                                            <div className="dsh-activity-lbl">{a.label}</div>
                                            <div className="dsh-activity-time">{a.time}</div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="dsh-activity-row" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', justifyContent: 'center' }}>
                                    {t('dashboard.recent_activity.empty', 'Chưa có hoạt động nào')}
                                </li>
                            )}
                        </ul>
                    </div>
                </aside>
            </div>

            {/* Footer */}
            <footer className="dsh-footer">
                <div className="dsh-footer-inner">
                    <div className="dsh-footer-brand">
                        <span></span>
                        <span>{t('dashboard.footer.copyright')}</span>
                    </div>
                    <div className="dsh-footer-links">
                        <a href="#">{t('dashboard.footer.terms')}</a>
                        <a href="#">{t('dashboard.footer.privacy')}</a>
                        <a href="#">{t('dashboard.footer.support')}</a>
                    </div>
                </div>
            </footer>

            {/* Toast */}
            {toastMsg && (
                <div className={`dsh-toast ${toastType === 'error' ? 'dsh-toast--error' : ''}`}>
                    {toastMsg}
                </div>
            )}

            {/* Fullscreen Map Modal */}
            {isMapExpanded && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.75)',
                        display: 'flex', flexDirection: 'column',
                        animation: 'fadeIn 0.2s ease'
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setIsMapExpanded(false) }}
                >
                    {/* Header modal */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 20px',
                        background: '#fff',
                        borderBottom: '1px solid rgba(44,89,38,0.1)',
                        flexShrink: 0
                    }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a2e1c' }}>
                                🗺️ {t('dashboard.map.title')}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                OpenStreetMap · {currentPos ? `🟢 Đã lấy được vị trí của bạn` : 'Hiển thị khu vực Cồn Sơn'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {/* Nút Chỉ đường */}
                            <button
                                onClick={() => {
                                    const origin = currentPos ? `${currentPos.lat},${currentPos.lng}` : ''
                                    const url = origin
                                        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${DIRECTIONS_TARGET}&travelmode=driving`
                                        : `https://www.google.com/maps/dir/?api=1&destination=${DIRECTIONS_TARGET}&travelmode=driving`
                                    window.open(url, '_blank')
                                }}
                                style={{
                                    background: '#2d7a3a', color: '#fff',
                                    border: 'none', borderRadius: '10px',
                                    padding: '8px 16px', fontSize: '0.87rem',
                                    fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontFamily: 'var(--font-family)'
                                }}
                            >
                                🗯️ Chỉ đường đến Cồn Sơn
                            </button>
                            {/* Nút đóng */}
                            <button
                                onClick={() => setIsMapExpanded(false)}
                                style={{
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: '10px', padding: '8px 14px',
                                    fontSize: '1rem', cursor: 'pointer',
                                    fontWeight: 700, color: '#ef4444',
                                    fontFamily: 'var(--font-family)', lineHeight: 1
                                }}
                                title="Đóng"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Map full */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <InteractiveMap
                            currentPos={currentPos}
                            markers={CON_SON_MARKERS}
                            scrollWheelZoom={true}
                        />
                    </div>

                    {/* Footer info */}
                    <div style={{
                        background: '#fff', padding: '10px 20px',
                        borderTop: '1px solid rgba(44,89,38,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: '0.78rem', color: 'var(--color-text-muted)', flexShrink: 0
                    }}>
                        <span>© OpenStreetMap contributors · Dữ liệu đường đi trên Google Maps</span>
                        <span style={{ color: '#2d7a3a', fontWeight: 600 }}>
                            Cồn Sơn, Bình Thủy, Cần Thơ
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
