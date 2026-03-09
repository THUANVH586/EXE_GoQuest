import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { calculateDistance } from '../utils/geo'
import toast from 'react-hot-toast'

/* ─── Global Constants ─────────────────────────────────────────── */
const MAP_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrqeys7w8p3z_rdRnyMvr2LmXYwytkMD5WDPA4DKjQwLlT03ZYBAScnFdpfM6mxwUIJ9JDTNeGw-hjJ9PA8dtfn7jRx2OyrzJYxRSk60-a6TvPqolcMPRsAwiryDsczLTZ5bHPRSSiSDbN44Rtl3HpnnHdgeuzMak2DrmLkOMKj3HgP6gGLRypFmlFiXrymTuqPnI345DEo0BH6iB68uBmJzsKc3MWzuEqlOlyxGkwuVn53iHAEfztVWJDDl2ST0jblkqOabwR'

function getRank(pts) {
    if (pts >= 1000) return { name: 'Hạng Vàng', icon: '🏆', next: null, need: 0 }
    if (pts >= 500) return { name: 'Hạng Bạc', icon: '🥈', next: 'Hạng Vàng', need: 1000 - pts }
    return { name: 'Hạng Đồng', icon: '🥉', next: 'Hạng Bạc', need: 500 - pts }
}

/* ─── Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [activeNav, setActiveNav] = useState('journey')
    const [searchVal, setSearchVal] = useState('')
    const [celebrateId, setCelebrateId] = useState(null)
    const [isTracking, setIsTracking] = useState(false)
    const [distance, setDistance] = useState(user?.longTermProgress?.distance || 0)
    const [completedIds, setCompletedIds] = useState([])
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
    const watchRef = useRef(null)
    const lastPosRef = useRef(null)
    const lastSavedDistanceRef = useRef(distance)
    const distanceRef = useRef(distance)

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
                if (response.data.longTermProgress?.distance) {
                    setDistance(response.data.longTermProgress.distance)
                    lastSavedDistanceRef.current = response.data.longTermProgress.distance
                }
            } catch (err) {
                console.error('Failed to fetch tasks:', err)
            }
        }
        fetchData()
    }, [])

    /* GPS tracking */
    useEffect(() => {
        if (isTracking) {
            if (!navigator.geolocation) { showToast('Trình duyệt không hỗ trợ GPS', 'error'); return }
            watchRef.current = navigator.geolocation.watchPosition(pos => {
                const { latitude: lat, longitude: lng } = pos.coords
                if (lastPosRef.current) {
                    const d = calculateDistance(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng)
                    // Only update if moved more than 3 meters to avoid jitter
                    if (d > 3) setDistance(prev => prev + d)
                }
                lastPosRef.current = { lat, lng }
            }, (err) => {
                console.error('GPS Error:', err)
                showToast('Không thể lấy vị trí GPS', 'error')
            }, { enableHighAccuracy: true })
        } else {
            if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
        }
        return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }
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

    const showToast = (msg, type = 'success') => {
        setToastMsg(msg)
        setToastType(type)
        if (type === 'success') toast.success(msg)
        else toast.error(msg)
        setTimeout(() => setToastMsg(null), 3000)
    }

    const handleComplete = async (taskId) => {
        if (completedIds.includes(taskId)) return
        try {
            await api.post(`/tasks/complete/${taskId}`)
            setCompletedIds(p => [...p, taskId])
            setCelebrateId(taskId)
            setTimeout(() => setCelebrateId(null), 800)
            showToast('Chúc mừng! Bạn đã hoàn thành nhiệm vụ!')
        } catch (err) {
            showToast('Không thể cập nhật trạng thái nhiệm vụ', 'error')
        }
    }

    const handleReceiveTasks = () => {
        if (!tasks || tasks.length === 0) {
            showToast('Đang tải danh sách nhiệm vụ, vui lòng thử lại', 'error')
            return
        }
        // Filter out completed tasks first? Or just any 5?
        // User said "random nhiệm vụ", usually means from all available.
        const shuffled = [...tasks].sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, 5)
        setJourneyTasks(selected)
        localStorage.setItem('journeyTasks', JSON.stringify(selected))
        showToast('Đã làm mới 5 nhiệm vụ ngẫu nhiên cho hành trình!')
    }

    const handleLogout = () => { logout(); navigate('/') }

    /* computed */
    const REQUIRED_TASKS = 5;
    const totalPts = tasks.filter(t => completedIds.includes(t._id)).reduce((s, t) => s + (t.points || 0), 0)
    const pct = tasks.length > 0 ? Math.min(Math.round((completedIds.length / REQUIRED_TASKS) * 100), 100) : 0
    const barPct = Math.min((totalPts / 1000) * 100, 100)
    const rank = getRank(totalPts)

    const filteredTasks = tasks.filter(t =>
        (t.title || '').toLowerCase().includes(searchVal.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchVal.toLowerCase())
    )

    /* recent activity — show completed tasks */
    const recentDone = tasks.filter(t => completedIds.includes(t._id)).slice(-3).reverse()
    const staticActivities = [
        { emoji: '🚶', label: 'Đã hoàn thành 5000 bước', time: 'Mục tiêu hàng ngày' },
        { emoji: '🎁', label: 'Đổi quà: Nước mắm Cồn Sơn', time: 'Ghé quầy lưu niệm' },
        { emoji: '🍜', label: 'Nhận 50 điểm ẩm thực', time: 'Trải nghiệm buffet bánh' },
    ]
    const activities = recentDone.length
        ? recentDone.map(t => ({ emoji: t.icon || '✅', label: `Hoàn thành: ${t.title}`, time: `+${t.points} điểm · Vừa xong` }))
        : staticActivities

    const navItems = [
        { key: 'journey', icon: '🗺️', label: 'Hành trình' },
        { key: 'tasks', icon: '📋', label: 'Nhiệm vụ' },
        { key: 'rank', icon: '🏆', label: 'Hạng của bạn' },
        { key: 'challenges', icon: '✨', label: 'Thử thách' },
    ]

    /* ─── Render ─── */
    return (
        <div className="dsh-root">

            {/* ══════════ HEADER ══════════ */}
            <header className="dsh-header">
                <div className="dsh-header-left">
                    <Link to="/" className="dsh-logo">
                        <span className="dsh-logo-icon"></span>
                        <span className="dsh-logo-name">Con Son Travel</span>
                    </Link>
                    <nav className="dsh-top-nav">
                        <Link className="dsh-top-link" to="/">Giới thiệu</Link>
                        <button
                            className={`dsh-top-link ${activeNav === 'journey' ? 'dsh-top-link--active' : ''}`}
                            onClick={() => setActiveNav('journey')}
                        >
                            Hành trình
                        </button>
                        <button
                            className={`dsh-top-link ${activeNav === 'tasks' ? 'dsh-top-link--active' : ''}`}
                            onClick={() => setActiveNav('tasks')}
                        >
                            Nhiệm vụ
                        </button>
                        <a className="dsh-top-link" href="#">Cộng đồng</a>
                    </nav>
                </div>
                <div className="dsh-header-right">
                    <div className="dsh-search-box">
                        <span className="dsh-search-icon">🔍</span>
                        <input
                            className="dsh-search-input"
                            placeholder="Tìm kiếm hành trình..."
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                        />
                    </div>
                    <button className="dsh-icon-btn" title="Thông báo"></button>
                    <div className="dsh-avatar-btn" title={user?.displayName}>
                        {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
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
                                <div className="dsh-user-sub">Khám phá Cồn Sơn</div>
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
                                <span></span> Đăng xuất
                            </button>
                        </nav>
                    </div>

                    {/* Weekly Challenge */}
                    <div className="dsh-challenge-card">
                        <div className="dsh-challenge-title">Thử thách tuần này</div>
                        <div className="dsh-challenge-row">
                            <span className="dsh-challenge-icon"></span>
                            <div>
                                <div className="dsh-challenge-name">Không rác nhựa</div>
                                <div className="dsh-challenge-sub">Hoàn thành 3 ngày liên tục</div>
                            </div>
                        </div>
                        <div className="dsh-challenge-bar">
                            <div className="dsh-challenge-fill" style={{ width: '66%' }} />
                        </div>
                        <div className="dsh-challenge-count">2/3 Ngày</div>
                    </div>
                </aside>

                {/* ── MAIN ── */}
                <main className="dsh-main">
                    {activeNav === 'journey' && (
                        <>
                            {/* Hero */}
                            <section className="dsh-hero-card">
                                <div className="dsh-hero-info">
                                    <h1 className="dsh-hero-title">Hành trình của bạn</h1>
                                    <p className="dsh-hero-sub">
                                        Theo dõi tiến độ và hoàn thành các nhiệm vụ trải nghiệm đặc sắc tại Cồn Sơn để nhận quà hấp dẫn.
                                    </p>
                                </div>
                                <div className="dsh-hero-stats">
                                    <div className="dsh-stat">
                                        <span className="dsh-stat-num">{pct}%</span>
                                        <span className="dsh-stat-lbl">Hoàn thành</span>
                                    </div>
                                    <div className="dsh-stat-sep" />
                                    <div className="dsh-stat">
                                        <span className="dsh-stat-num dsh-stat-num--dark">{totalPts}</span>
                                        <span className="dsh-stat-lbl">Điểm tích lũy</span>
                                    </div>
                                </div>
                                <div className="dsh-hero-bar-wrap">
                                    <div className="dsh-hero-bar-labels">
                                        <span>Tiến độ hiện tại</span>
                                        <span>Mục tiêu: 1000 điểm</span>
                                    </div>
                                    <div className="dsh-hero-bar-track">
                                        <div className="dsh-hero-bar-fill" style={{ width: `${barPct}%` }} />
                                    </div>
                                </div>
                            </section>

                            {/* Featured Task Selection */}
                            <section>
                                <div className="dsh-section-head">
                                    <h2 className="dsh-section-title">Nhiệm vụ hành trình</h2>
                                    <button className="dsh-see-all" style={{ background: '#2c5926', color: '#fff', padding: '6px 14px', borderRadius: '8px' }} onClick={handleReceiveTasks}>
                                        Nhận nhiệm vụ
                                    </button>
                                </div>
                                <div className="dsh-task-grid">
                                    {journeyTasks.length > 0 ? (
                                        journeyTasks.map(task => {
                                            const done = completedIds.includes(task._id)
                                            const celebrating = celebrateId === task._id
                                            return (
                                                <article key={task._id} className={`dsh-task-card ${done ? 'dsh-task-card--done' : ''} ${celebrating ? 'dsh-task-card--celebrate' : ''}`}>
                                                    <div className="dsh-task-img-wrap">
                                                        <img src={task.img} alt={task.title} className="dsh-task-img" loading="lazy" />
                                                        <div className={`dsh-pts-badge ${done ? 'dsh-pts-badge--done' : ''}`}>
                                                            {done ? '✓ Hoàn thành' : `⭐ +${task.points} Điểm`}
                                                        </div>
                                                    </div>
                                                    <div className={`dsh-task-body ${done ? 'dsh-task-body--done' : ''}`}>
                                                        <h3 className="dsh-task-name">{task.title}</h3>
                                                        <p className="dsh-task-desc">{task.description}</p>
                                                        <button className={`dsh-task-btn ${done ? 'dsh-task-btn--done' : ''}`} onClick={() => handleComplete(task._id)} disabled={done}>
                                                            {done ? 'Đã nhận thưởng' : 'Bắt đầu ngay'}
                                                        </button>
                                                    </div>
                                                </article>
                                            )
                                        })
                                    ) : (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', background: 'rgba(44, 89, 38, 0.05)', borderRadius: '1rem', border: '1px dashed rgba(44, 89, 38, 0.2)' }}>
                                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Bấm nút "Nhận nhiệm vụ" để bắt đầu hành trình của bạn!</p>
                                            <button className="dsh-task-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={handleReceiveTasks}>Nhận nhiệm vụ ngay</button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}

                    {activeNav === 'tasks' && (
                        <section>
                            <div className="dsh-section-head">
                                <h2 className="dsh-section-title">Tất cả nhiệm vụ</h2>
                                <div className="dsh-task-count">{tasks.length} nhiệm vụ khả dụng</div>
                            </div>
                            <div className="dsh-task-grid">
                                {filteredTasks.map(task => {
                                    const done = completedIds.includes(task._id)
                                    const celebrating = celebrateId === task._id
                                    return (
                                        <article key={task._id} className={`dsh-task-card ${done ? 'dsh-task-card--done' : ''} ${celebrating ? 'dsh-task-card--celebrate' : ''}`}>
                                            <div className="dsh-task-img-wrap">
                                                <img src={task.img} alt={task.title} className="dsh-task-img" loading="lazy" />
                                                <div className={`dsh-pts-badge ${done ? 'dsh-pts-badge--done' : ''}`}>
                                                    {done ? '✓ Hoàn thành' : `⭐ +${task.points} Điểm`}
                                                </div>
                                            </div>
                                            <div className={`dsh-task-body ${done ? 'dsh-task-body--done' : ''}`}>
                                                <h3 className="dsh-task-name">{task.title}</h3>
                                                <p className="dsh-task-desc">{task.description}</p>
                                                <button className={`dsh-task-btn ${done ? 'dsh-task-btn--done' : ''}`} onClick={() => handleComplete(task._id)} disabled={done}>
                                                    {done ? 'Đã nhận thưởng' : 'Bắt đầu ngay'}
                                                </button>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {activeNav === 'rank' && (
                        <section className="dsh-rank-section">
                            <h2 className="dsh-section-title">Hạng và Thành tích</h2>
                            {/* Copy rank info here if needed or keep existing sidebar visibility */}
                            <div className="card">
                                <h3>{rank.name}</h3>
                                <p>Bạn hiện đang ở cấp độ {rank.name} {rank.icon}</p>
                            </div>
                        </section>
                    )}

                    {activeNav === 'challenges' && (
                        <section className="dsh-challenge-section">
                            <h2 className="dsh-section-title">Thử thách hàng tuần</h2>
                            <div className="card">
                                <h3>Không rác thải nhựa</h3>
                                <p>Hoàn thành 3 ngày liên tục để nhận thưởng.</p>
                            </div>
                        </section>
                    )}

                    {/* GPS Tracking card - Always visible at bottom */}
                    <div className="dsh-gps-card">
                        <div className="dsh-gps-left">
                            <span className="dsh-gps-icon">📍</span>
                            <div>
                                <div className="dsh-gps-title">Hành trình khám phá</div>
                                <div className="dsh-gps-dist">{Math.round(distance)}m đã di chuyển</div>
                            </div>
                        </div>
                        <button className={`dsh-gps-btn ${isTracking ? 'dsh-gps-btn--stop' : ''}`} onClick={() => setIsTracking(t => !t)}>
                            {isTracking ? 'Dừng' : 'Bắt đầu'}
                        </button>
                    </div>
                </main>

                {/* ── RIGHT SIDEBAR ── */}
                <aside className="dsh-aside">

                    {/* Rank Card */}
                    <div className="dsh-rank-card">
                        <div className="dsh-rank-bg"></div>
                        <div className="dsh-rank-content">
                            <span className="dsh-rank-badge">Hạng hiện tại</span>
                            <h2 className="dsh-rank-name">{rank.name}</h2>
                            {rank.next
                                ? <p className="dsh-rank-desc">Cần {rank.need} điểm để lên {rank.next}</p>
                                : <p className="dsh-rank-desc">Bạn đã đạt hạng cao nhất!</p>
                            }
                            <div className="dsh-rank-icon-row">
                                <span style={{ fontSize: '3.2rem' }}>{rank.icon}</span>
                                <div>
                                    <div className="dsh-rank-pts-lbl">Điểm tiếp theo</div>
                                    <div className="dsh-rank-pts">{rank.next ? (rank.next === 'Hạng Bạc' ? 500 : 1000) : '—'} Pts</div>
                                </div>
                            </div>
                            <button className="dsh-rank-btn">Xem đặc quyền</button>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="dsh-sidebar-card">
                        <h3 className="dsh-activities-title">Hoạt động gần đây</h3>
                        <ul className="dsh-activities">
                            {activities.map((a, i) => (
                                <li key={i} className="dsh-activity-row">
                                    <div className="dsh-activity-icon">{a.emoji}</div>
                                    <div>
                                        <div className="dsh-activity-lbl">{a.label}</div>
                                        <div className="dsh-activity-time">{a.time}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Map */}
                    <div className="dsh-map-card">
                        <img src={MAP_IMG} alt="Bản đồ Cồn Sơn" className="dsh-map-img" />
                        <div className="dsh-map-overlay">
                            <p className="dsh-map-title">Bản đồ trải nghiệm Cồn Sơn</p>
                            <p className="dsh-map-sub">Nhấn để xem các địa điểm nhiệm vụ</p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Footer */}
            <footer className="dsh-footer">
                <div className="dsh-footer-inner">
                    <div className="dsh-footer-brand">
                        <span></span>
                        <span>© 2024 Con Son Travel. Tất cả quyền được bảo lưu.</span>
                    </div>
                    <div className="dsh-footer-links">
                        <a href="#">Điều khoản</a>
                        <a href="#">Bảo mật</a>
                        <a href="#">Hỗ trợ</a>
                    </div>
                </div>
            </footer>

            {/* Toast */}
            {toastMsg && (
                <div className={`dsh-toast ${toastType === 'error' ? 'dsh-toast--error' : ''}`}>
                    {toastMsg}
                </div>
            )}
        </div>
    )
}
