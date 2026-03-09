import { useState, useEffect } from 'react'
import api from '../services/api'

function AdminDashboard() {
    const [users, setUsers] = useState([])
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all') // all, completed, in-progress, not-started
    const [activeTab, setActiveTab] = useState('leaderboard') // leaderboard, tasks
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        points: 0,
        type: 'craft',
        category: 'short-term',
        img: '',
        icon: '✨'
    })

    useEffect(() => {
        fetchAllData()
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
            setError('Không thể tải dữ liệu. Phải là Admin mới có quyền này.')
            console.error(err)
        } finally {
            setLoading(false)
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
        } catch (err) {
            alert('Lỗi khi lưu nhiệm vụ')
        }
    }

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return
        try {
            await api.delete(`/admin/tasks/${id}`)
            fetchTasks()
        } catch (err) {
            alert('Lỗi khi xóa nhiệm vụ')
        }
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

    const filteredUsers = users.filter(u => {
        if (filter === 'all') return true
        if (filter === 'completed') return u.status === 'Đã hoàn thành'
        if (filter === 'in-progress') return u.status === 'Đang thực hiện'
        if (filter === 'not-started') return u.status === 'Chưa bắt đầu'
        return true
    }).filter(u => u.role !== 'admin' || (u.role === 'admin' && filter === 'all')) // Hide other admins if filtering

    // Calculate stats (only for users, not admin accounts if possible for accuracy)
    const playerUsers = users.filter(u => u.role === 'user')
    const totalPlayers = playerUsers.length
    const completedPlayers = playerUsers.filter(u => u.status === 'Đã hoàn thành').length
    const avgPoints = totalPlayers > 0
        ? Math.round(playerUsers.reduce((sum, u) => sum + u.points, 0) / totalPlayers)
        : 0

    const getStatusColor = (status) => {
        switch (status) {
            case 'Đã hoàn thành': return 'var(--color-success)'
            case 'Đang thực hiện': return 'var(--color-accent-tertiary)'
            default: return 'var(--color-text-muted)'
        }
    }

    const formatTime = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' +
            date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
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
                        <h2 style={{ color: 'var(--color-error)' }}>Lỗi</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <h1 className="page-title">Bảng điều khiển Admin</h1>
                        <p className="page-subtitle">Quản lý người chơi và nhiệm vụ trải nghiệm</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'var(--space-sm)' }}>
                    <button
                        className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('leaderboard')}
                        style={{
                            background: 'none', border: 'none', color: activeTab === 'leaderboard' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                            fontWeight: 600, cursor: 'pointer', paddingBottom: 'var(--space-xs)', borderBottom: activeTab === 'leaderboard' ? '2px solid var(--color-accent-primary)' : 'none'
                        }}
                    >
                        Bảng xếp hạng
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tasks')}
                        style={{
                            background: 'none', border: 'none', color: activeTab === 'tasks' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                            fontWeight: 600, cursor: 'pointer', paddingBottom: 'var(--space-xs)', borderBottom: activeTab === 'tasks' ? '2px solid var(--color-accent-primary)' : 'none'
                        }}
                    >
                        Quản lý nhiệm vụ
                    </button>
                </div>

                {activeTab === 'leaderboard' ? (
                    <>
                        {/* Stats Summary */}
                        <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: 'var(--space-xl)' }}>
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-accent-primary)' }}>
                                <div className="stat-value">{totalPlayers}</div>
                                <div className="stat-label">Tổng người chơi</div>
                            </div>
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                                <div className="stat-value">{completedPlayers}</div>
                                <div className="stat-label">Đã về đích</div>
                            </div>
                            <div className="card stat-card" style={{ borderLeft: '4px solid var(--color-accent-secondary)' }}>
                                <div className="stat-value">{avgPoints}</div>
                                <div className="stat-label">Điểm trung bình</div>
                            </div>
                        </div>

                        {/* Filters & Leaderboard Header */}
                        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                            <h2 className="section-title">Thứ hạng người chơi</h2>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                {['all', 'completed', 'in-progress'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ padding: 'var(--space-xs) var(--space-md)', fontSize: 'var(--font-size-sm)' }}
                                    >
                                        {f === 'all' ? 'Tất cả' : f === 'completed' ? 'Hoàn thành' : 'Đang làm'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)', width: '80px', textAlign: 'center' }}>Hạng</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)' }}>Người chơi</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)' }}>Trạng thái</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>Nhiệm vụ</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>Hành trình</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>Thời gian</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>Tổng điểm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, index) => {
                                        const isPlayer = u.role === 'user'
                                        const rank = index + 1
                                        return (
                                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: u.role === 'admin' ? 'rgba(124, 58, 237, 0.05)' : 'transparent' }}>
                                                <td style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>
                                                    {u.role === 'admin' ? (
                                                        <span title="Quản trị viên">⚙️</span>
                                                    ) : (
                                                        <span style={{
                                                            fontWeight: rank <= 3 ? 'bold' : 'normal',
                                                            fontSize: rank <= 3 ? '1.2rem' : '1rem',
                                                            color: rank === 1 ? 'gold' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'inherit'
                                                        }}>
                                                            {rank}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                                                    <div style={{ fontWeight: 600, color: u.role === 'admin' ? 'var(--color-accent-secondary)' : 'inherit' }}>
                                                        {u.displayName}
                                                        {u.role === 'admin' && <span style={{ marginLeft: 'var(--space-xs)', fontSize: '0.7rem', verticalAlign: 'middle' }}>(Admin)</span>}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.6 }}>@{u.username}</div>
                                                </td>
                                                <td style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        color: getStatusColor(u.status)
                                                    }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(u.status) }}></span>
                                                        {u.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>
                                                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
                                                        {u.completedCount}/{u.totalTasks}
                                                    </div>
                                                    <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '4px auto 0' }}>
                                                        <div style={{
                                                            width: `${(u.completedCount / u.totalTasks) * 100}%`,
                                                            height: '100%',
                                                            background: getStatusColor(u.status),
                                                            borderRadius: '2px'
                                                        }}></div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>
                                                    {Math.round(u.longTermProgress?.distance || 0)}m
                                                </td>
                                                <td style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center', fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>
                                                    {formatTime(u.lastCompletedAt)}
                                                </td>
                                                <td style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: 'var(--font-size-lg)',
                                                        fontWeight: 'bold',
                                                        color: isPlayer ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'
                                                    }}>
                                                        {u.points}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="empty-state" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                                    <p>Không tìm thấy người chơi nào phù hợp.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                            <h2 className="section-title">Danh sách nhiệm vụ</h2>
                            <button className="btn btn-primary" onClick={openAddModal}>+ Thêm nhiệm vụ</button>
                        </div>

                        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)' }}>Nhiệm vụ</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)' }}>Loại</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>Điểm</th>
                                        <th style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr key={task._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                    <div style={{ fontSize: '1.5rem' }}>{task.icon || '✨'}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                                                        <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.6, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {task.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                                                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                                    {task.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
                                                {task.points}
                                            </td>
                                            <td style={{ padding: 'var(--space-md) var(--space-lg)', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                                                    <button className="btn btn-secondary" style={{ padding: 'var(--space-xs) var(--space-sm)' }} onClick={() => openEditModal(task)}>Sửa</button>
                                                    <button className="btn btn-secondary" style={{ padding: 'var(--space-xs) var(--space-sm)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={() => handleDeleteTask(task._id)}>Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {tasks.length === 0 && (
                                <div className="empty-state" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                                    <p>Chưa có nhiệm vụ nào.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Task Modal */}
                {showTaskModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '500px', margin: 'var(--space-md)' }}>
                            <h2 style={{ marginBottom: 'var(--space-lg)' }}>{editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</h2>
                            <form onSubmit={handleSaveTask}>
                                <div className="form-group">
                                    <label className="form-label">Tên nhiệm vụ</label>
                                    <input
                                        type="text" className="form-input" required value={taskForm.title}
                                        onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mô tả</label>
                                    <textarea
                                        className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} required value={taskForm.description}
                                        onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Số điểm</label>
                                        <input
                                            type="number" className="form-input" required value={taskForm.points}
                                            onChange={e => setTaskForm({ ...taskForm, points: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Loại</label>
                                        <select
                                            className="form-input" value={taskForm.type}
                                            onChange={e => setTaskForm({ ...taskForm, type: e.target.value })}
                                        >
                                            <option value="craft">Thủ công</option>
                                            <option value="food">Ẩm thực</option>
                                            <option value="health">Sức khỏe</option>
                                            <option value="environment">Môi trường</option>
                                            <option value="community">Cộng đồng</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Link ảnh minh họa</label>
                                    <input
                                        type="text" className="form-input" placeholder="URL hình ảnh" value={taskForm.img}
                                        onChange={e => setTaskForm({ ...taskForm, img: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary">Lưu nhiệm vụ</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard
