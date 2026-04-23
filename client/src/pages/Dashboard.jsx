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
            const userId = user?.id || 'guest'
            const saved = localStorage.getItem(`journeyTasks_${userId}`)
            return saved ? JSON.parse(saved) : []
        } catch (e) {
            return []
        }
    })
    const [toastMsg, setToastMsg] = useState(null)
    const [toastType, setToastType] = useState('success')
    const [verifyCodes, setVerifyCodes] = useState({})
    const [gifts, setGifts] = useState([])
    const [pointsSpent, setPointsSpent] = useState(0)
    const [redeemModal, setRedeemModal] = useState(null) // { gift, code }
    const watchRef = useRef(null)
    const lastPosRef = useRef(null)
    const lastSavedDistanceRef = useRef(distance)
    const distanceRef = useRef(distance)

    function getRank(pts) {
        if (pts >= 1000) return { name: t('dashboard.rank.gold'), icon: '🏆', next: null, need: 0, nextThreshold: 1000 }
        if (pts >= 500) return { name: t('dashboard.rank.silver'), icon: '🥈', next: t('dashboard.rank.gold'), need: 1000 - pts, nextThreshold: 1000 }
        return { name: t('dashboard.rank.bronze'), icon: '🥉', next: t('dashboard.rank.silver'), need: 500 - pts, nextThreshold: 500 }
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
                const allTasks = response.data.tasks || []
                setTasks(allTasks)
                
                const done = allTasks.filter(t => t.isCompleted).map(t => t.id) || []
                setCompletedIds(done)
                if (response.data.longTermProgress) {
                    setDistance(response.data.longTermProgress.distance || 0)
                    lastSavedDistanceRef.current = response.data.longTermProgress.distance || 0
                    setPlasticCommit(response.data.longTermProgress.usingPersonalBottle || false)
                }
                if (response.data.pointsSpent !== undefined) {
                    setPointsSpent(response.data.pointsSpent)
                }
            } catch (err) {
                console.error('Failed to fetch tasks:', err)
            }
        }
        fetchData()
    }, [])

    /* Sync journey tasks with rich data from server whenever tasks update */
    useEffect(() => {
        if (tasks.length > 0 && journeyTasks.length > 0) {
            const updatedJourney = journeyTasks.map(jt => {
                const richTask = tasks.find(t => t.id === jt.id);
                return richTask ? { ...jt, ...richTask } : jt;
            });

            if (JSON.stringify(updatedJourney) !== JSON.stringify(journeyTasks)) {
                setJourneyTasks(updatedJourney);
                const userId = user?.id || 'guest'
                localStorage.setItem(`journeyTasks_${userId}`, JSON.stringify(updatedJourney));
                console.log('Journey tasks updated with rich data');
            }
        }
    }, [tasks]);

    /* fetch gifts */
    useEffect(() => {
        api.get('/gifts').then(res => setGifts(res.data)).catch(() => {})
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

    const triggerConfetti = (isGrand = false) => {
        if (isGrand) {
            const duration = 3000;
            const end = Date.now() + duration;
            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#2c5926', '#f59e0b', '#ffffff']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#2c5926', '#f59e0b', '#ffffff']
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        } else {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#2c5926', '#10b981', '#f59e0b']
            });
        }
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
                triggerConfetti(true);
            } else {
                triggerConfetti(false);
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
        const userId = user?.id || 'guest'
        localStorage.setItem(`journeyTasks_${userId}`, JSON.stringify(selected))
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
    const basePts = tasks.filter(t => completedIds.includes(t.id)).reduce((s, t) => s + (t.points || 0), 0)
    const JOURNEY_GOAL = 2000;
    const distanceReward = distance >= JOURNEY_GOAL ? 200 : 0
    const totalPts = basePts + (plasticCommit ? 50 : 0) + distanceReward - pointsSpent
    const pct = tasks.length > 0 ? Math.min(Math.round((completedIds.length / REQUIRED_TASKS) * 100), 100) : 0
    const barPct = Math.min((totalPts / 1000) * 100, 100)
    const journeyPct = Math.min((distance / JOURNEY_GOAL) * 100, 100)
    const rank = getRank(totalPts)

    const filteredTasks = tasks.filter(t =>
        (t.title || '').toLowerCase().includes(searchVal.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchVal.toLowerCase())
    )

    /* recent activity — show completed tasks */
    const recentDone = tasks.filter(t => completedIds.includes(t.id)).slice(-3).reverse()
    const activities = recentDone.map(t_item => ({
        emoji: t_item.icon || '✅',
        label: t('dashboard.recent_activity.completed_text', { title: t_item.title }),
        time: t('dashboard.recent_activity.points_time', { points: t_item.points })
    }))

    const navItems = [
        { key: 'journey', icon: '🗺️', label: t('dashboard.nav.journey') },
        { key: 'tasks', icon: '📋', label: t('dashboard.nav.tasks') },
        { key: 'rewards', icon: '🎁', label: 'Quà tặng' },
    ]

    const renderTaskCard = (task, isJourneyMode = false) => {
        const tData = tasks.find(t => t.id === task.id) || task;
        const done = tData.isCompleted;
        const celebrating = celebrateId === tData.id;
        const isStarted = tData.missionStatus === 'started';
        const isExpired = tData.missionStatus === 'expired' || (tData.expiresAt && new Date(tData.expiresAt) <= new Date());
        
        return (
            <article key={tData.id} className={`dsh-task-card ${done ? 'dsh-task-card--done' : ''} ${celebrating ? 'dsh-task-card--celebrate' : ''}`}>
                <div className="dsh-task-img-wrap">
                    {tData.img ? (
                        <img src={tData.img} alt={tData.title} className="dsh-task-img" loading="lazy" />
                    ) : (
                        <div className="dsh-task-img" style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '4.5rem', background: 'linear-gradient(135deg, #f0f7f1 0%, #e1ebe2 100%)',
                            color: '#2c5926', filter: done ? 'grayscale(0.8)' : 'none'
                        }}>
                            {tData.icon || '🎯'}
                        </div>
                    )}
                    <div className={`dsh-pts-badge ${done ? 'dsh-pts-badge--done' : ''}`}>
                        {done ? t('dashboard.journey_tasks.completed_badge') : t('dashboard.journey_tasks.points_badge', { points: tData.points })}
                    </div>
                    {isJourneyMode && isStarted && !isExpired && !done && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                            <CountdownTimer expiresAt={tData.expiresAt} onExpire={() => {
                                api.get('/tasks/progress').then(res => setTasks(res.data.tasks || []));
                            }} />
                        </div>
                    )}
                </div>
                <div className={`dsh-task-body ${done ? 'dsh-task-body--done' : ''}`}>
                    <h3 className="dsh-task-name">{t(`task_data.${tData.title}.title`, tData.title)}</h3>
                    <p className="dsh-task-desc">{t(`task_data.${tData.title}.desc`, tData.description)}</p>
                    
                    {isJourneyMode ? (
                        <div style={{ marginTop: 'auto' }}>
                            {done ? (
                                <button className="dsh-task-btn dsh-task-btn--done" disabled>
                                    {t('dashboard.journey_tasks.reward_btn')}
                                </button>
                            ) : isStarted && !isExpired ? (
                                <>
                                    <input 
                                        type="text" 
                                        placeholder="Mã xác nhận / Code" 
                                        value={verifyCodes[tData.id] || ''}
                                        onChange={(e) => setVerifyCodes(prev => ({ ...prev, [tData.id]: e.target.value }))}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '8px', fontSize: '14px' }}
                                    />
                                    <button className="dsh-task-btn" onClick={() => handleComplete(tData.id, verifyCodes[tData.id])}>
                                        {t('dashboard.journey_tasks.confirm_btn', 'Xác nhận hoàn thành')}
                                    </button>
                                </>
                            ) : isExpired ? (
                                <button className="dsh-task-btn" style={{ background: '#ef4444' }} onClick={() => handlePayment(tData.id)}>
                                    {t('dashboard.journey_tasks.retry_btn')}
                                </button>
                            ) : (
                                <button className="dsh-task-btn" onClick={() => handleStartMission(tData.id)}>
                                    {t('dashboard.journey_tasks.start_btn')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                            {done ? (
                                <span style={{ background: '#10b981', color: 'white', padding: '6px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>
                                    ✓ {t('dashboard.journey_tasks.completed_badge')}
                                </span>
                            ) : (
                                <span style={{ background: 'rgba(44,89,38,0.08)', color: '#2c5926', padding: '6px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                                    +{tData.points} PTS
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </article>
        );
    }

    /* ─── Render ─── */
    return (
        <div className="dsh-root">

            {/* ══════════ HEADER ══════════ */}
            <header className="dsh-header">
                <div className="dsh-header-left">
                    <Link to="/" className="dsh-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png" alt="Go Quest Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                        <span className="dsh-logo-name" style={{ margin: 0, color: 'var(--color-accent-primary)' }}>Go Quest</span>
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
                        {/* Avatar + name + rank in one compact row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{ 
                                    width: '52px', height: '52px', borderRadius: '14px', background: '#2c5926', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900,
                                    boxShadow: '0 6px 14px rgba(44,89,38,0.22)'
                                }}>
                                    {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
                                </div>
                                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'white', width: '22px', height: '22px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                                    {rank.icon}
                                </div>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1a3a1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user?.displayName || user?.username}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#5a7a5f', fontWeight: 600, marginTop: '2px' }}>{rank.name}</div>
                            </div>
                        </div>

                        {/* Rank progress */}
                        <div style={{ background: '#f4f7f4', borderRadius: '14px', padding: '12px 14px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2c5926' }}>TÍCH LŨY</span>
                                <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600 }}>{totalPts} PTS</span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8e2', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${barPct}%`, background: 'linear-gradient(90deg, #2c5926, #52b069)', borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '0.85rem' }}>
                            <div style={{ background: '#f4f7f4', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#5a7a5f', fontWeight: 700 }}>ĐIỂM SỐ</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2c5926' }}>{totalPts}</div>
                            </div>
                            <div style={{ background: '#f4f7f4', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#5a7a5f', fontWeight: 700 }}>NHIỆM VỤ</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2c5926' }}>{completedIds.length}</div>
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
                                <span>🚪</span> {t('dashboard.logout')}
                            </button>
                        </nav>
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
                                    {journeyTasks.length < 5 && (
                                        <button className="dsh-see-all" style={{ background: '#2c5926', color: '#fff', padding: '6px 14px', borderRadius: '8px' }} onClick={handleReceiveTasks}>
                                            {t('dashboard.journey_tasks.get_tasks')}
                                        </button>
                                    )}
                                </div>
                                <div className="dsh-task-grid">
                                    {journeyTasks.length > 0 ? (
                                        journeyTasks.map(task => renderTaskCard(task, true))
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
                                {tasks.filter(t => (t.title || '').toLowerCase().includes(searchVal.toLowerCase())).map(task => renderTaskCard(task))}
                            </div>
                        </section>
                    )}




                    {activeNav === 'rewards' && (
                        <section className="dsh-rewards-section">
                            <div className="dsh-section-head">
                                <h2 className="dsh-section-title">Danh sách quà tặng</h2>
                                <div style={{ background: 'var(--color-accent-primary)', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
                                    {totalPts} Điểm hiện có
                                </div>
                            </div>

                            {gifts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(44,89,38,0.04)', borderRadius: '20px', border: '1px dashed rgba(44,89,38,0.2)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
                                    <p style={{ color: '#5a7a5f', fontWeight: 600 }}>Chưa có quà tặng nào. Admin đang cập nhật!</p>
                                </div>
                            ) : (
                                <div className="dsh-task-grid">
                                    {gifts.map(gift => (
                                        <article key={gift.id} className="dsh-task-card" style={{ 
                                            opacity: totalPts >= gift.pointsRequired ? 1 : 0.8,
                                            border: 'none',
                                            background: 'white',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                            borderRadius: '24px',
                                            overflow: 'hidden'
                                        }}>
                                            <div className="dsh-task-img-wrap" style={{ height: '180px', background: '#f0f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                {gift.img ? (
                                                    <img src={gift.img} alt={gift.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: totalPts >= gift.pointsRequired ? 'none' : 'grayscale(60%)' }} />
                                                ) : (
                                                    <div style={{ fontSize: '60px', filter: totalPts >= gift.pointsRequired ? 'none' : 'grayscale(100%) brightness(1.2)' }}>
                                                        {gift.icon || '🎁'}
                                                    </div>
                                                )}
                                                <div style={{ 
                                                    position: 'absolute', bottom: '15px', left: '15px', 
                                                    background: 'rgba(255,255,255,0.9)', padding: '5px 12px', 
                                                    borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, color: '#2c5926',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                                }}>
                                                    {gift.pointsRequired} PTS
                                                </div>
                                                {gift.stock === 0 && (
                                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        Hết hàng
                                                    </div>
                                                )}
                                            </div>
                                            <div className="dsh-task-body" style={{ padding: '1.5rem' }}>
                                                <h3 className="dsh-task-name" style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '8px', color: '#1a3a1f' }}>{gift.title}</h3>
                                                <p className="dsh-task-desc" style={{ fontSize: '0.9rem', color: '#5a7a5f', marginBottom: '20px', minHeight: '40px' }}>{gift.description}</p>
                                                <button 
                                                    className="dsh-task-btn" 
                                                    disabled={totalPts < gift.pointsRequired || gift.stock === 0}
                                                    onClick={() => setRedeemModal({ gift, code: '' })}
                                                    style={{ 
                                                        background: totalPts >= gift.pointsRequired && gift.stock !== 0 ? 'linear-gradient(90deg, #2c5926, #4a8c42)' : '#e5e7eb', 
                                                        color: totalPts >= gift.pointsRequired && gift.stock !== 0 ? 'white' : '#9ca3af',
                                                        fontWeight: 800,
                                                        borderRadius: '14px',
                                                        padding: '12px',
                                                        boxShadow: totalPts >= gift.pointsRequired ? '0 10px 20px rgba(44, 89, 38, 0.2)' : 'none'
                                                    }}
                                                >
                                                    {gift.stock === 0 ? 'Hết hàng' : totalPts >= gift.pointsRequired ? '🎁 Đổi quà ngay' : `Cần thêm ${gift.pointsRequired - totalPts} điểm`}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeNav === 'journey' && (
                        <div className="dsh-gps-card" style={{
                            background: 'linear-gradient(135deg, #f0f7f1 0%, #ffffff 100%)',
                            border: isTracking ? '2px solid var(--color-success)' : '1px solid rgba(44, 89, 38, 0.15)',
                            boxShadow: isTracking ? '0 12px 40px rgba(16,185,129,0.15)' : '0 8px 24px rgba(44, 89, 38, 0.08)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: '1.8rem',
                            marginTop: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            borderRadius: '24px'
                        }}>
                            {isTracking && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                                    background: 'linear-gradient(90deg, transparent, var(--color-success), transparent)',
                                    animation: 'pulse 2s infinite'
                                }} />
                            )}
                            {/* Header: Logo + Title */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        background: isTracking ? 'rgba(16,185,129,0.15)' : 'rgba(255, 255, 255, 0.9)',
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.3s', overflow: 'hidden', padding: '6px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}>
                                        <img src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1a3a1f', letterSpacing: '-0.02em' }}>
                                            {t('dashboard.gps.title')}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: isTracking ? 'var(--color-success)' : '#5a7a5f', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {isTracking ? (
                                                <>
                                                    <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                                                    Ghi nhận hành trình...
                                                </>
                                            ) : 'Sẵn sàng khám phá'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Distance Display */}
                            <div style={{ margin: '1rem 0', textAlign: 'center', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', padding: '1.5rem 1rem', border: '1px solid rgba(255,255,255,0.6)' }}>
                                <div style={{ fontSize: '0.9rem', color: '#5a7a5f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Quãng đường đã đi</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '4rem', fontWeight: 900, color: '#1a3a1f', lineHeight: 1, letterSpacing: '-0.05em' }}>{Math.round(distance)}</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#5a7a5f' }}>/ {JOURNEY_GOAL} m</span>
                                </div>
                            </div>

                            {/* Bottom: Progress Bar + Button Row */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1, height: '20px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
                                        <div style={{ 
                                            height: '100%', 
                                            width: `${Math.min(journeyPct, 100)}%`, 
                                            background: distance >= JOURNEY_GOAL ? 'var(--color-success)' : 'linear-gradient(90deg, #52b069, #2c5926)',
                                            transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            borderRadius: '10px',
                                            position: 'relative'
                                        }}>
                                            {distance > 0 && (
                                                <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px rgba(255,255,255,0.8)' }}></div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        className={`dsh-gps-btn ${isTracking ? 'dsh-gps-btn--stop' : ''}`}
                                        onClick={() => setIsTracking(t_state => !t_state)}
                                        style={{
                                            padding: '12px 32px', borderRadius: '14px',
                                            background: isTracking ? '#ff4d4f' : '#2c5926',
                                            color: '#ffffff',
                                            border: 'none', fontWeight: 800, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer',
                                            fontSize: '1.1rem',
                                            boxShadow: isTracking ? '0 4px 12px rgba(255,77,79,0.3)' : '0 8px 24px rgba(44, 89, 38, 0.25)',
                                            whiteSpace: 'nowrap',
                                            transform: 'translateY(-2px)'
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    >
                                        {isTracking ? t('dashboard.gps.stop') : t('dashboard.gps.start')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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

                    {/* Plastic Commitment Card */}
                    <div className="dsh-sidebar-card" style={{ 
                        background: 'linear-gradient(135deg, #1e3a24 0%, #2c5926 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '24px',
                        marginBottom: '1.5rem',
                        boxShadow: '0 12px 24px rgba(44, 89, 38, 0.15)'
                    }}>
                        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                                <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🌿</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>{t('dashboard.weekly_challenge.name')}</h3>
                                    <p style={{ margin: 0, opacity: 0.7, fontSize: '0.75rem' }}>Đồng ý cam kết để nhận 50 điểm</p>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>Cam kết của tôi</h4>
                                <label style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: plasticCommit ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                                    border: plasticCommit ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ 
                                            width: '20px', 
                                            height: '20px', 
                                            borderRadius: '5px', 
                                            border: '2px solid #fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: plasticCommit ? '#fff' : 'transparent',
                                            transition: 'all 0.3s'
                                        }}>
                                            {plasticCommit && <span style={{ color: '#065f46', fontWeight: 900, fontSize: '12px' }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
                                            {plasticCommit ? 'Đã cam kết' : 'Đồng ý cam kết'}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={plasticCommit}
                                        onChange={handlePlasticCommit}
                                        style={{ display: 'none' }}
                                    />
                                    {!plasticCommit && (
                                        <div style={{ 
                                            fontSize: '0.65rem', 
                                            background: '#f59e0b', 
                                            color: '#000', 
                                            padding: '2px 8px', 
                                            borderRadius: '12px',
                                            fontWeight: 800
                                        }}>+50 PTS</div>
                                    )}
                                </label>
                                <p style={{ marginTop: '10px', fontSize: '0.7rem', opacity: 0.6, fontStyle: 'italic', lineHeight: 1.4, color: 'white' }}>
                                    * Việc mang theo bình nước cá nhân giúp giảm thiểu rác thải nhựa tại Cồn Sơn. Cảm ơn bạn!
                                </p>
                            </div>
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



            {/* Gift Redeem Modal */}
            {redeemModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9000,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(6px)', padding: '1rem',
                    animation: 'fadeIn 0.2s ease'
                }} onClick={(e) => { if (e.target === e.currentTarget) setRedeemModal(null) }}>
                    <div style={{
                        background: 'white', borderRadius: '28px', padding: '2rem',
                        width: '100%', maxWidth: '420px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                                {redeemModal.gift.icon || '🎁'}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#1a3a1f' }}>
                                Đổi quà: {redeemModal.gift.title}
                            </h2>
                            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#5a7a5f' }}>
                                Sẽ dùng <strong style={{ color: '#2c5926' }}>{redeemModal.gift.pointsRequired} điểm</strong> → còn lại <strong style={{ color: '#2c5926' }}>{totalPts - redeemModal.gift.pointsRequired} điểm</strong>
                            </p>
                        </div>

                        {/* Code input */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1a3a1f', marginBottom: '8px' }}>
                                💬 Mã xác nhận từ nhân viên
                            </label>
                            <input
                                type="text"
                                placeholder="Nhập mã xác nhận..."
                                value={redeemModal.code}
                                onChange={(e) => setRedeemModal(prev => ({ ...prev, code: e.target.value }))}
                                style={{
                                    width: '100%', padding: '14px 16px',
                                    border: '2px solid rgba(44,89,38,0.2)',
                                    borderRadius: '14px', fontSize: '1rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'border 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2c5926'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(44,89,38,0.2)'}
                                autoFocus
                            />
                            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                ℹ️ Liên hệ nhân viên tại quầy đổi quà để nhận mã
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setRedeemModal(null)}
                                style={{
                                    flex: 1, padding: '13px',
                                    border: '2px solid rgba(44,89,38,0.15)',
                                    borderRadius: '14px', background: 'transparent',
                                    fontWeight: 700, fontSize: '0.95rem',
                                    cursor: 'pointer', color: '#5a7a5f',
                                    fontFamily: 'var(--font-family)'
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={async () => {
                                    if (!redeemModal.code.trim()) {
                                        showToast('Vui lòng nhập mã xác nhận', 'error');
                                        return;
                                    }
                                    try {
                                        const res = await api.post(`/gifts/${redeemModal.gift._id}/redeem`, { code: redeemModal.code });
                                        showToast(res.data.message);
                                        setPointsSpent(prev => prev + redeemModal.gift.pointsRequired);
                                        setRedeemModal(null);
                                        // Refresh gifts to update stock
                                        api.get('/gifts').then(r => setGifts(r.data)).catch(() => {});
                                    } catch (err) {
                                        showToast(err.response?.data?.message || 'Lỗi đổi quà', 'error');
                                    }
                                }}
                                style={{
                                    flex: 2, padding: '13px',
                                    border: 'none',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(90deg, #2c5926, #4a8c42)',
                                    color: 'white', fontWeight: 800, fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-family)',
                                    boxShadow: '0 8px 20px rgba(44,89,38,0.25)'
                                }}
                            >
                                ✓ Xác nhận đổi quà
                            </button>
                        </div>
                    </div>
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
