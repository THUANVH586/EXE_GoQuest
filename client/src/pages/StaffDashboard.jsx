import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function StaffDashboard() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await api.get('/staff/dashboard');
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Lỗi tải dữ liệu dashboard');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleResetCode = async () => {
        try {
            const res = await api.post('/staff/reset-code');
            setStats(prev => ({ ...prev, currentCode: res.data.code, expiresAt: res.data.expiresAt }));
            toast.success('Đã tạo mã xác nhận mới');
        } catch (err) {
            toast.error('Lỗi reset mã');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ paddingBottom: 'var(--space-2xl)' }}>
            <div className="container">
                {/* Header Section */}
                <div className="page-header" style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 'var(--space-md)',
                    textAlign: 'center', 
                    padding: 'var(--space-xl) 0',
                    borderBottom: '1px solid rgba(45, 122, 58, 0.1)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Link to="/" className="navbar-brand">
                            <span>Go Quest</span> Staff
                        </Link>
                    </div>
                    <div style={{ width: '100%' }}>
                        <h1 className="page-title" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', margin: 0 }}>Trang Nhân Viên</h1>
                        <p className="page-subtitle" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-xs)' }}>Quản lý & hỗ trợ khách hàng tại điểm</p>
                    </div>
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleLogout}
                        style={{ 
                            borderColor: 'var(--color-error)', 
                            color: 'var(--color-error)',
                            padding: 'var(--space-sm) var(--space-lg)',
                            fontSize: 'var(--font-size-sm)',
                            alignSelf: 'center'
                        }}
                    >
                        🚪 Đăng xuất
                    </button>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr', 
                    gap: 'var(--space-lg)', 
                    marginBottom: 'var(--space-xl)' 
                }}>
                    
                    {/* Top: Verification Code Card (Primary focus on mobile) */}
                    <div className="card animate-fade-in" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        textAlign: 'center',
                        padding: 'var(--space-xl) var(--space-md)'
                    }}>
                        <div style={{ 
                            background: 'rgba(45, 122, 58, 0.1)', 
                            color: 'var(--color-accent-primary)',
                            padding: 'var(--space-sm) var(--space-lg)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            marginBottom: 'var(--space-lg)'
                        }}>
                            MÃ XÁC NHẬN NHIỆM VỤ
                        </div>
                        
                        <div className="animate-pulse" style={{ 
                            fontSize: 'clamp(3.5rem, 15vw, 6rem)', 
                            fontWeight: 900, 
                            color: 'var(--color-accent-primary)', 
                            letterSpacing: 'clamp(4px, 2vw, 12px)', 
                            margin: 'var(--space-sm) 0',
                            textShadow: '0 4px 12px rgba(45, 122, 58, 0.1)',
                            fontFamily: 'monospace'
                        }}>
                            {stats?.currentCode}
                        </div>
                        
                        <div style={{ 
                            background: 'rgba(0,0,0,0.03)', 
                            padding: 'var(--space-md)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                            width: '100%'
                        }}>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                                ⏱️ Hết hạn: <strong>{new Date(stats?.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                            </p>
                        </div>
                        
                        <button 
                            className="btn btn-primary" 
                            onClick={handleResetCode}
                            style={{ width: '100%' }}
                        >
                            ⚡ Tạo mã mới ngay
                        </button>
                    </div>

                    {/* Right: Active Players Stats */}
                    <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="section-header">
                            <h2 className="section-title">
                                👥 Khách đang làm nhiệm vụ
                            </h2>
                            <div className="stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
                                {stats?.totalPlayers}
                            </div>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: 'var(--space-md)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(45, 122, 58, 0.1)' }}>
                                        <th style={{ padding: 'var(--space-md) 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>KHÁCH HÀNG</th>
                                        <th style={{ padding: 'var(--space-md) 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>NHIỆM VỤ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.activePlayers.map(player => (
                                        <tr key={player.id} style={{ borderBottom: '1px solid rgba(45, 122, 58, 0.05)' }}>
                                            <td style={{ padding: 'var(--space-md) 0' }}>
                                                <div style={{ fontWeight: 600 }}>{player.displayName || 'Khách'}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>@{player.username}</div>
                                            </td>
                                            <td style={{ padding: 'var(--space-md) 0', textAlign: 'center' }}>
                                                <span className="task-badge community">
                                                    {player.activeMissionsCount} đang làm
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {stats?.activePlayers.length === 0 && (
                                        <tr>
                                            <td colSpan="2" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
                                                🏖️ Hiện không có khách nào đang làm nhiệm vụ
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="card" style={{ 
                    background: 'rgba(255, 255, 255, 0.5)', 
                    borderStyle: 'dashed',
                    padding: 'var(--space-lg)'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)' }}>💡 Hướng dẫn:</h3>
                    <ul style={{ 
                        color: 'var(--color-text-secondary)', 
                        paddingLeft: 'var(--space-lg)', 
                        fontSize: '0.85rem',
                        margin: 0
                    }}>
                        <li style={{ marginBottom: 'var(--space-xs)' }}>Kiểm tra xem khách đã thực hiện đúng yêu cầu chưa.</li>
                        <li style={{ marginBottom: 'var(--space-xs)' }}>Nếu hoàn thành, cung cấp <strong>mã bên trên</strong> cho khách.</li>
                        <li style={{ marginBottom: 0 }}>Mã này thay đổi sau mỗi 30 phút.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
