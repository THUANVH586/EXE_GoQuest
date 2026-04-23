import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PaymentCancel() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div style={{ 
            padding: '4rem 2rem', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            <div style={{ 
                fontSize: '5rem', 
                marginBottom: '1rem',
                animation: 'bounce 2s infinite'
            }}>
                ❌
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#333' }}>
                Thanh toán đã bị hủy
            </h2>
            <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '400px' }}>
                Giao dịch của bạn đã bị hủy. Bạn có thể thử lại bất cứ lúc nào từ Dashboard.
            </p>
            <button 
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary"
                style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
            >
                Quay lại Dashboard
            </button>
        </div>
    );
}
