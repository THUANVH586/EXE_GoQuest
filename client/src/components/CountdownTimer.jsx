import { useState, useEffect } from 'react';

export default function CountdownTimer({ expiresAt, onExpire }) {
    const calculateTimeLeft = () => {
        const difference = new Date(expiresAt) - new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        } else {
            timeLeft = { minutes: 0, seconds: 0 };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
                clearInterval(timer);
                if (onExpire) onExpire();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt]);

    return (
        <div style={{ 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            color: (timeLeft.minutes === 0 && timeLeft.seconds < 60) ? '#ef4444' : '#2d7a3a',
            background: 'rgba(255,255,255,0.8)',
            padding: '2px 8px',
            borderRadius: '4px',
            display: 'inline-block'
        }}>
            ⏱️ {timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
        </div>
    );
}
