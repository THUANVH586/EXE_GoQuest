import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'

function AdminDashboard() {
    const { t, i18n } = useTranslation()
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, completed, in-progress, not-started
    const [roleFilter, setRoleFilter] = useState('all') // all, user, staff
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('leaderboard') // leaderboard, tasks, staff, gifts
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showStaffModal, setShowStaffModal] = useState(false)
    const [showGiftModal, setShowGiftModal] = useState(false)
    const [editingGift, setEditingGift] = useState(null)
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null })
    const [editingTask, setEditingTask] = useState(null)
    const [gifts, setGifts] = useState([])
    const [giftForm, setGiftForm] = useState({
        title: '',
        description: '',
        pointsRequired: 100,
        icon: '🎁',
        img: '',
        stock: -1
    })
    const [staffForm, setStaffForm] = useState({
        username: '',
        email: '',
        password: '',
        displayName: ''
    })
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        points: 0,
        type: 'craft',
        category: 'short-term',
        img: '',
        icon: '✨'
    })

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    useEffect(() => {
        fetchAllData()
        fetchGifts()
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            const [usersRes, tasksRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/tasks')
            ])
            setUsers(usersRes.data)
            setTasks(tasksRes.data)
        } catch (err) {
            setError(t('admin.errors.load'))
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchGifts = async () => {
        try {
            const res = await api.get('/gifts')
            setGifts(res.data)
        } catch (err) {
            console.error('Error fetching gifts:', err)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users')
            setUsers(response.data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks')
            setTasks(response.data)
        } catch (err) {
            console.error(err)
        }
    }

    const handleSaveTask = async (e) => {
        e.preventDefault()
        try {
            if (editingTask) {
                await api.put(`/admin/tasks/${editingTask._id}`, taskForm)
            } else {
                await api.post('/admin/tasks', taskForm)
            }
            setShowTaskModal(false)
            setEditingTask(null)
            fetchTasks()
            toast.success(t('admin.tasks.save_success', 'Đã lưu nhiệm vụ thành công'))
        } catch (err) {
            toast.error(t('admin.tasks.error_save'))
        }
    }

    const handleSaveGift = async (e) => {
        e.preventDefault()
        try {
            if (editingGift) {
                await api.put(`/gifts/${editingGift._id}`, giftForm)
                toast.success('Đã cập nhật quà tặng thành công!')
            } else {
                await api.post('/gifts', giftForm)
                toast.success('Đã thêm quà tặng mới!')
            }
            setShowGiftModal(false)
            setEditingGift(null)
            fetchGifts()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi lưu quà tặng')
        }
    }

    const handleDeleteGift = (id) => {
        setConfirmModal({
            show: true,
            message: 'Bạn có chắc chắn muốn xóa quà tặng này?',
            onConfirm: async () => {
                setConfirmModal({ show: false, message: '', onConfirm: null })
                try {
                    await api.delete(`/gifts/${id}`)
                    fetchGifts()
                    toast.success('Đã xóa quà tặng')
                } catch (err) {
                    toast.error('Lỗi khi xóa quà tặng')
                }
            }
        })
    }

    const openAddGiftModal = () => {
        setEditingGift(null)
        setGiftForm({ title: '', description: '', pointsRequired: 100, icon: '🎁', img: '', stock: -1 })
        setShowGiftModal(true)
    }

    const openEditGiftModal = (gift) => {
        setEditingGift(gift)
        setGiftForm({
            title: gift.title,
            description: gift.description,
            pointsRequired: gift.pointsRequired,
            icon: gift.icon || '🎁',
            img: gift.img || '',
            stock: gift.stock ?? -1
        })
        setShowGiftModal(true)
    }

    const handleSaveStaff = async (e) => {
        e.preventDefault()
        try {
            await api.post('/admin/staff', staffForm)
            setShowStaffModal(false)
            setStaffForm({ username: '', email: '', password: '', displayName: '' })
            fetchAllData()
            toast.success('Đã tạo tài khoản nhân viên thành công!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi tạo tài khoản nhân viên')
        }
    }

    const handleDeleteTask = (id) => {
        setConfirmModal({
            show: true,
            message: t('admin.tasks.confirm_delete', 'Bạn có chắc chắn muốn xóa nhiệm vụ này?'),
            onConfirm: async () => {
                setConfirmModal({ show: false, message: '', onConfirm: null })
                try {
                    await api.delete(`/admin/tasks/${id}`)
                    fetchTasks()
                    toast.success('Đã xóa nhiệm vụ')
                } catch (err) {
                    toast.error(t('admin.tasks.error_delete'))
                }
            }
        })
    }

    const handleDeleteUser = (id) => {
        setConfirmModal({
            show: true,
            message: 'Bạn có chắc chắn muốn xóa người dùng này?',
            onConfirm: async () => {
                setConfirmModal({ show: false, message: '', onConfirm: null })
                try {
                    await api.delete(`/admin/users/${id}`)
                    fetchUsers()
                    toast.success('Đã xóa người dùng thành công')
                } catch (err) {
                    toast.error('Lỗi khi xóa người dùng')
                }
            }
        })
    }

    const openEditModal = (task) => {
        setEditingTask(task)
        setTaskForm({
            title: task.title,
            description: task.description,
            points: task.points,
            type: task.type,
            category: task.category,
            img: task.img || '',
            icon: task.icon || '✨'
        })
        setShowTaskModal(true)
    }

    const openAddModal = () => {
        setEditingTask(null)
        setTaskForm({
            title: '',
            description: '',
            points: 100,
            type: 'craft',
            category: 'short-term',
            img: '',
            icon: '✨'
        })
        setShowTaskModal(true)
    }

    // Helper to normalize status for filtering
    const normalizeStatus = (status) => {
        if (status === 'Đã hoàn thành' || status === 'Completed') return 'completed'
        if (status === 'Đang thực hiện' || status === 'In Progress') return 'in-progress'
        if (status === 'Chưa bắt đầu' || status === 'Not Started') return 'not-started'
        return status
    }

    const filteredUsers = users.filter(u => {
        const matchesFilter = filter === 'all' ? true : normalizeStatus(u.status) === filter;
        const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (u.displayName || '').toLowerCase().includes(searchLower) || 
                              (u.username || '').toLowerCase().includes(searchLower) ||
                              (u.email || '').toLowerCase().includes(searchLower);
        return matchesFilter && matchesRole && matchesSearch;
    }).filter(u => u.role !== 'admin' || (u.role === 'admin' && filter === 'all' && roleFilter === 'all')) // Hide other admins if filtering

    const displayStatus = (status) => {
        const norm = normalizeStatus(status)
        if (norm === 'completed') return t('admin.leaderboard.filter_completed')
        if (norm === 'in-progress') return t('admin.leaderboard.filter_in_progress')
        return status
    }

    // Calculate stats
    const playerUsers = users.filter(u => u.role === 'user')
    const totalPlayers = playerUsers.length
    const completedPlayers = playerUsers.filter(u => normalizeStatus(u.status) === 'completed').length
    const avgPoints = totalPlayers > 0
        ? Math.round(playerUsers.reduce((sum, u) => sum + u.points, 0) / totalPlayers)
        : 0

    const getStatusColor = (status) => {
        const norm = normalizeStatus(status)
        switch (norm) {
            case 'completed': return 'var(--color-success)'
            case 'in-progress': return 'var(--color-accent-tertiary)'
            default: return 'var(--color-text-muted)'
        }
    }

    const formatTime = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US'
        return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) + ' ' +
            date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
                    <div className="card" style={{ borderColor: 'var(--color-error)' }}>
                        <h2 style={{ color: 'var(--color-error)' }}>{t('admin.errors.title')}</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page" style={{ paddingBottom: 'var(--space-2xl)' }}>
            <Toaster position="top-right" />
            <div className="container">
                {/* Header Section */}
                <div className="page-header" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    textAlign: 'left', 
                    padding: 'var(--space-xl) 0',
                    borderBottom: '1px solid rgba(45, 122, 58, 0.1)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                                <img src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png" alt="Go Quest Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>Go Quest</span>
                            </Link>
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 'var(--space-xs)',
                                background: 'rgba(45, 122, 58, 0.1)',
                                color: 'var(--color-accent-primary)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>
                                🛡️ HỆ THỐNG QUẢN TRỊ
                            </div>
                        </div>
                        <h1 className="page-title" style={{ margin: 0 }}>{t('admin.title')}</h1>
                        <p className="page-subtitle" style={{ marginTop: '4px' }}>{t('admin.subtitle')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                        <Link to="/staff" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', height: '100%' }}>
                            <span>📋</span> Giao diện Nhân viên
                        </Link>
                        <button 
                            className="btn btn-secondary" 
                            onClick={handleLogout} 
                            style={{ 
                                borderColor: 'var(--color-error)',
                                color: 'var(--color-error)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-xs)',
                                height: '100%'
                            }}
                        >
                            <span>🚪</span> {t('navbar.logout')}
                        </button>
                    </div>
                </div>

                {/* Tabs - Premium Look */}
                <div style={{ 
                    display: 'flex', 
                    gap: 'var(--space-lg)', 
                    marginBottom: 'var(--space-xl)', 
                    padding: '4px',
                    background: 'rgba(45, 122, 58, 0.05)',
                    borderRadius: '12px',
                    width: 'fit-content'
                }}>
                    {[
                        { key: 'leaderboard', label: t('admin.tabs.leaderboard'), icon: '📊' },
                        { key: 'tasks', label: t('admin.tabs.tasks'), icon: '🎯' },
                        { key: 'staff', label: 'Quản lý nhân viên', icon: '👤' },
                        { key: 'gifts', label: 'Quản lý quà tặng', icon: '🎁' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-xs)',
                                padding: '10px 20px',
                                background: activeTab === tab.key ? 'var(--color-bg-primary)' : 'transparent',
                                color: activeTab === tab.key ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(45, 122, 58, 0.1)' : 'none'
                            }}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'leaderboard' && (
                    <div className="animate-fade-in">
                        <div className="dashboard-stats" style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: 'var(--space-xl)',
                            marginBottom: 'var(--space-2xl)' 
                        }}>
                            <div className="card stat-card" style={{ borderBottom: '4px solid var(--color-accent-primary)' }}>
                                <div className="stat-value">{totalPlayers}</div>
                                <div className="stat-label">👥 {t('admin.stats.total_players')}</div>
                            </div>
                            <div className="card stat-card" style={{ borderBottom: '4px solid var(--color-success)' }}>
                                <div className="stat-value">{completedPlayers}</div>
                                <div className="stat-label">🏁 {t('admin.stats.completed')}</div>
                            </div>
                            <div className="card stat-card" style={{ borderBottom: '4px solid var(--color-warning)' }}>
                                <div className="stat-value">{avgPoints}</div>
                                <div className="stat-label">⭐️ {t('admin.stats.avg_points')}</div>
                            </div>
                        </div>

                        <div className="section-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                            <h2 className="section-title">
                                <span style={{ background: 'var(--color-accent-primary)', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏆</span>
                                {t('admin.leaderboard.title')}
                            </h2>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-secondary)', borderRadius: '10px', padding: '0 10px', border: '1px solid rgba(44, 89, 38, 0.1)' }}>
                                    <span>🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder="Tìm tên, username..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', padding: '8px', outline: 'none', width: '200px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '10px' }}>
                                    {['all', 'user', 'staff'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRoleFilter(r)}
                                            style={{ 
                                                padding: '6px 14px', 
                                                fontSize: '0.75rem', 
                                                borderRadius: '8px', 
                                                border: 'none',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: roleFilter === r ? '#2c5926' : 'transparent',
                                                color: roleFilter === r ? '#fff' : 'var(--color-text-muted)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {r === 'all' ? 'Tất cả' : r === 'user' ? 'Khách (User)' : 'Nhân viên (Staff)'}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '10px' }}>
                                    {['all', 'completed', 'in-progress'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            style={{ 
                                                padding: '6px 14px', 
                                                fontSize: '0.75rem', 
                                                borderRadius: '8px', 
                                                border: 'none',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: filter === f ? 'var(--color-accent-primary)' : 'transparent',
                                                color: filter === f ? '#fff' : 'var(--color-text-muted)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {f === 'all' ? t('admin.leaderboard.filter_all') :
                                                f === 'completed' ? t('admin.leaderboard.filter_completed') :
                                                    t('admin.leaderboard.filter_in_progress')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ overflowX: 'auto', padding: 0, border: '1px solid rgba(45, 122, 58, 0.1)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '2px solid rgba(45, 122, 58, 0.1)' }}>
                                        <th style={{ padding: 'var(--space-lg)', width: '60px', textAlign: 'center' }}>{t('admin.leaderboard.rank')}</th>
                                        <th style={{ padding: 'var(--space-lg)' }}>{t('admin.leaderboard.player')}</th>
                                        <th style={{ padding: 'var(--space-lg)' }}>{t('admin.leaderboard.status')}</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>{t('admin.leaderboard.missions')}</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>{t('admin.leaderboard.total_points')}</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>⏱️ Lần cuối</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, index) => {
                                        const isPlayer = u.role === 'user';
                                        const rankNumber = index + 1;
                                        return (
                                            <tr key={u._id || u.id} style={{ 
                                                borderBottom: '1px solid rgba(45, 122, 58, 0.05)', 
                                                transition: 'background 0.2s',
                                                verticalAlign: 'middle'
                                            }} className="table-row-hover">
                                                <td style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                                    {u.role === 'admin' ? '⚙️' : (
                                                        <span style={{ 
                                                            fontWeight: 900,
                                                            color: rankNumber === 1 ? 'var(--color-warning)' : 'inherit',
                                                            background: rankNumber <= 3 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                                            width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                                                        }}>
                                                            {rankNumber}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: 'var(--space-lg)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                        <div style={{ 
                                                            width: '32px', height: '32px', borderRadius: '50%', 
                                                            background: u.role === 'admin' ? 'var(--gradient-primary)' : u.role === 'staff' ? '#3b82f6' : 'rgba(45, 122, 58, 0.1)',
                                                            color: u.role === 'admin' || u.role === 'staff' ? '#fff' : 'var(--color-accent-primary)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem'
                                                        }}>
                                                            {(u.displayName || u.username)[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                {u.displayName}
                                                                {u.role === 'staff' && <span style={{ fontSize: '0.65rem', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>STAFF</span>}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>@{u.username}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--space-lg)' }}>
                                                    <span className={`task-badge ${normalizeStatus(u.status) === 'completed' ? 'health' : 'craft'}`} style={{ fontSize: '0.7rem' }}>
                                                        {displayStatus(u.status)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 800 }}>{u.completedCount}/{u.totalTasks}</div>
                                                    <div style={{ width: '60px', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', margin: '4px auto' }}>
                                                        <div style={{ width: `${(u.completedCount / u.totalTasks) * 100}%`, height: '100%', background: 'var(--color-accent-primary)', borderRadius: '2px' }}></div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--space-lg)', textAlign: 'center', fontWeight: 900, color: 'var(--color-accent-primary)', fontSize: '1.1rem' }}>
                                                    {u.points}
                                                </td>
                                                <td style={{ padding: 'var(--space-lg)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {formatTime(u.lastCompletedAt)}
                                                </td>
                                                <td style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                                    {u.role !== 'admin' && (
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} 
                                                            onClick={() => handleDeleteUser(u.id || u._id)}
                                                            title="Xóa người dùng"
                                                        >
                                                            🗑️ Xóa
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🧊</div>
                                    <p>{t('admin.leaderboard.empty')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="animate-fade-in">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span style={{ background: 'var(--color-accent-primary)', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👥</span>
                                Danh sách nhân viên
                            </h2>
                            <button className="btn btn-primary" onClick={() => setShowStaffModal(true)}>+ Thêm nhân viên</button>
                        </div>

                        <div className="card" style={{ padding: 0, border: '1px solid rgba(45, 122, 58, 0.1)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '2px solid rgba(45, 122, 58, 0.1)' }}>
                                        <th style={{ padding: 'var(--space-lg)' }}>Tên hiển thị</th>
                                        <th style={{ padding: 'var(--space-lg)' }}>Username</th>
                                        <th style={{ padding: 'var(--space-lg)' }}>Email</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>Phân quyền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.role === 'staff').map((staff) => (
                                        <tr key={staff._id || staff.id} style={{ borderBottom: '1px solid rgba(45, 122, 58, 0.05)' }}>
                                            <td style={{ padding: 'var(--space-lg)', fontWeight: 700 }}>{staff.displayName}</td>
                                            <td style={{ padding: 'var(--space-lg)', opacity: 0.7 }}>@{staff.username}</td>
                                            <td style={{ padding: 'var(--space-lg)', opacity: 0.7 }}>{staff.email}</td>
                                            <td style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                                <span className="task-badge craft" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                                                    {staff.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.filter(u => u.role === 'staff').length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon">👤</div>
                                    <p>Chưa có nhân viên nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="animate-fade-in">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span style={{ background: 'var(--color-accent-primary)', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎯</span>
                                {t('admin.tasks.title')}
                            </h2>
                            <button className="btn btn-primary" onClick={openAddModal}>{t('admin.tasks.add_btn')}</button>
                        </div>

                        <div className="card" style={{ padding: 0, border: '1px solid rgba(45, 122, 58, 0.1)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '2px solid rgba(45, 122, 58, 0.1)' }}>
                                        <th style={{ padding: 'var(--space-lg)' }}>{t('admin.tasks.task')}</th>
                                        <th style={{ padding: 'var(--space-lg)' }}>{t('admin.tasks.type')}</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>{t('admin.tasks.points')}</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>{t('admin.tasks.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr key={task._id} style={{ borderBottom: '1px solid rgba(45, 122, 58, 0.05)' }}>
                                            <td style={{ padding: 'var(--space-lg)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ fontSize: '1.5rem', background: 'rgba(45, 122, 58, 0.05)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                                                            {task.icon || '✨'}
                                                        </div>
                                                        {task.img && (
                                                            <img 
                                                                src={task.img} 
                                                                alt="" 
                                                                style={{ 
                                                                    position: 'absolute', top: '-4px', right: '-4px', width: '28px', height: '28px', 
                                                                    borderRadius: '6px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                                                                }} 
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{task.title}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {task.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--space-lg)' }}>
                                                <span className={`task-badge ${task.type}`} style={{ fontSize: '0.7rem' }}>
                                                    {task.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-lg)', textAlign: 'center', fontWeight: 900, color: 'var(--color-accent-primary)' }}>
                                                {task.points}
                                            </td>
                                            <td style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'center' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => openEditModal(task)}>✏️</button>
                                                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={() => handleDeleteTask(task._id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {tasks.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🌵</div>
                                    <p>{t('admin.tasks.empty')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'gifts' && (
                    <div className="animate-fade-in">
                        <div className="section-header">
                            <h2 className="section-title">
                                <span style={{ background: 'var(--color-accent-primary)', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎁</span>
                                Quản lý quà tặng
                            </h2>
                            <button className="btn btn-primary" onClick={openAddGiftModal}>+ Thêm quà tặng</button>
                        </div>

                        <div className="card" style={{ padding: 0, border: '1px solid rgba(45, 122, 58, 0.1)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '2px solid rgba(45, 122, 58, 0.1)' }}>
                                        <th style={{ padding: 'var(--space-lg)' }}>Quà tặng</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>Số điểm cần</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>Tồn kho</th>
                                        <th style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gifts.map((gift) => (
                                        <tr key={gift._id} style={{ borderBottom: '1px solid rgba(45, 122, 58, 0.05)' }}>
                                            <td style={{ padding: 'var(--space-lg)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ fontSize: '1.5rem', background: 'rgba(45, 122, 58, 0.05)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                                                            {gift.icon || '🎁'}
                                                        </div>
                                                        {gift.img && (
                                                            <img src={gift.img} alt="" style={{ position: 'absolute', top: '-4px', right: '-4px', width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{gift.title}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gift.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--space-lg)', textAlign: 'center', fontWeight: 900, color: 'var(--color-accent-primary)', fontSize: '1.1rem' }}>
                                                {gift.pointsRequired} điểm
                                            </td>
                                            <td style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                                <span style={{ fontWeight: 700, color: gift.stock === -1 ? 'var(--color-success)' : gift.stock === 0 ? 'var(--color-error)' : 'inherit' }}>
                                                    {gift.stock === -1 ? 'Vô hạn' : gift.stock === 0 ? 'Hết hàng' : gift.stock}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'center' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => openEditGiftModal(gift)}>✏️</button>
                                                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={() => handleDeleteGift(gift._id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {gifts.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon">🎁</div>
                                    <p>Chưa có quà tặng nào. Hãy thêm quà tặng đầu tiên!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modals - Fixed alignment */}
                {confirmModal.show && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2000, backdropFilter: 'blur(4px)', padding: 'var(--space-md)'
                    }}>
                        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
                            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1.2rem' }}>Xác nhận</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
                                {confirmModal.message}
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyItems: 'center', justifyContent: 'center' }}>
                                <button className="btn btn-secondary" onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}>Hủy bỏ</button>
                                <button className="btn btn-primary" style={{ background: 'var(--color-error)' }} onClick={confirmModal.onConfirm}>Xác nhận xóa</button>
                            </div>
                        </div>
                    </div>
                )}

                {(showTaskModal || showStaffModal || showGiftModal) && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(8px)', padding: 'var(--space-md)'
                    }}>
                        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                            {showGiftModal ? (
                                <>
                                    <h2 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editingGift ? '📝 Sửa quà tặng' : '🎁 Thêm quà tặng mới'}
                                    </h2>
                                    <form onSubmit={handleSaveGift}>
                                        <div className="form-group">
                                            <label className="form-label">Tên quà tặng</label>
                                            <input type="text" className="form-input" required value={giftForm.title} onChange={e => setGiftForm({ ...giftForm, title: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Mô tả</label>
                                            <textarea className="form-input" style={{ minHeight: '80px' }} required value={giftForm.description} onChange={e => setGiftForm({ ...giftForm, description: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Điểm cần để đổi</label>
                                                <input type="number" className="form-input" required min="1" value={giftForm.pointsRequired} onChange={e => setGiftForm({ ...giftForm, pointsRequired: parseInt(e.target.value) })} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Tồn kho (-1 = vô hạn)</label>
                                                <input type="number" className="form-input" min="-1" value={giftForm.stock} onChange={e => setGiftForm({ ...giftForm, stock: parseInt(e.target.value) })} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Icon (emoji)</label>
                                            <input type="text" className="form-input" value={giftForm.icon} onChange={e => setGiftForm({ ...giftForm, icon: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">URL Ảnh (Cloudinary)</label>
                                            <input type="text" className="form-input" placeholder="Dán link ảnh tại đây..." value={giftForm.img} onChange={e => setGiftForm({ ...giftForm, img: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowGiftModal(false)}>Hủy</button>
                                            <button type="submit" className="btn btn-primary">Lưu quà tặng</button>
                                        </div>
                                    </form>
                                </>
                            ) : showTaskModal ? (
                                <>
                                    <h2 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editingTask ? '📝 Sửa nhiệm vụ' : '✨ Thêm nhiệm vụ mới'}
                                    </h2>
                                    <form onSubmit={handleSaveTask}>
                                        <div className="form-group">
                                            <label className="form-label">{t('admin.modal.name')}</label>
                                            <input type="text" className="form-input" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('admin.modal.desc')}</label>
                                            <textarea className="form-input" style={{ minHeight: '80px' }} required value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">{t('admin.modal.points')}</label>
                                                <input type="number" className="form-input" required value={taskForm.points} onChange={e => setTaskForm({ ...taskForm, points: parseInt(e.target.value) })} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">{t('admin.modal.type')}</label>
                                                <select className="form-input" value={taskForm.type} onChange={e => setTaskForm({ ...taskForm, type: e.target.value })}>
                                                    <option value="craft">{t('components.task_card.types.craft')}</option>
                                                    <option value="food">{t('components.task_card.types.food')}</option>
                                                    <option value="health">{t('components.task_card.types.health')}</option>
                                                    <option value="environment">{t('components.task_card.types.environment')}</option>
                                                    <option value="community">{t('components.task_card.types.community')}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">URL Ảnh Nhiệm Vụ (Cloudinary)</label>
                                            <input type="text" className="form-input" placeholder="Dán link ảnh tại đây..." value={taskForm.img} onChange={e => setTaskForm({ ...taskForm, img: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>{t('admin.modal.cancel')}</button>
                                            <button type="submit" className="btn btn-primary">{t('admin.modal.save')}</button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ marginBottom: 'var(--space-lg)' }}>👤 Tạo tài khoản nhân viên</h2>
                                    <form onSubmit={handleSaveStaff}>
                                        <div className="form-group">
                                            <label className="form-label">Tên hiển thị</label>
                                            <input type="text" className="form-input" required value={staffForm.displayName} onChange={e => setStaffForm({ ...staffForm, displayName: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Username</label>
                                            <input type="text" className="form-input" required value={staffForm.username} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-input" required value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Mật khẩu</label>
                                            <input type="password" className="form-input" required value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowStaffModal(false)}>Hủy</button>
                                            <button type="submit" className="btn btn-primary">Tạo tài khoản</button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
