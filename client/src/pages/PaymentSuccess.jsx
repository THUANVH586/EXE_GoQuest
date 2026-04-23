import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);

    const taskId = searchParams.get('taskId');
    const orderCode = searchParams.get('orderCode');

    useEffect(() => {
        const verify = async () => {
            try {
                await api.post('/payment/verify-success', { taskId, orderCode });
                toast.success('Thanh toán thành công! Nhiệm vụ đã được mở lại.');
                navigate('/dashboard');
            } catch (err) {
                toast.error('Xác nhận thanh toán thất bại.');
                navigate('/dashboard');
            } finally {
                setVerifying(false);
            }
        };

        if (taskId && orderCode) {
            verify();
        } else {
            navigate('/dashboard');
        }
    }, [taskId, orderCode]);

    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h2>Đang xác nhận thanh toán...</h2>
            <div className="spinner" style={{ margin: '2rem auto' }}></div>
        </div>
    );
}
