import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function LongTermTask({ task, currentValue, targetValue, onUpdate, isCompleted, unit = '', isTracking }) {
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState(currentValue || 0)

    const progress = Math.min((currentValue / targetValue) * 100, 100)

    const handleUpdate = () => {
        onUpdate(inputValue)
    }

    if (task.type === 'environment') {
        return (
            <div className="long-term-card">
                <div className="long-term-progress">
                    <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: 'var(--radius-full)',
                        background: isCompleted ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        transition: 'all 0.3s ease'
                    }}>
                        {task.icon || ''}
                    </div>
                </div>
                <div className="long-term-content">
                    <h4 className="long-term-title">{task.title}</h4>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {task.description}
                    </p>
                    <label className="checkbox-container" style={{ marginTop: 'var(--space-md)' }}>
                        <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={isCompleted}
                            onChange={(e) => onUpdate(e.target.checked)}
                        />
                        <span>{t('components.long_term_task.water_bottle')}</span>
                    </label>
                </div>
            </div>
        )
    }

    return (
        <div className="long-term-card">
            <div className="long-term-progress">
                <div style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                }}>
                    <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            stroke="rgba(255, 255, 255, 0.1)"
                            fill="transparent"
                            strokeWidth="6"
                            r="34"
                            cx="40"
                            cy="40"
                        />
                        <circle
                            stroke="url(#longTermGradient)"
                            fill="transparent"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                            r="34"
                            cx="40"
                            cy="40"
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                        <defs>
                            <linearGradient id="longTermGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00d4aa" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '1.5rem'
                    }}>
                        {task.icon || ''}
                    </span>
                </div>
            </div>
            <div className="long-term-content">
                <h4 className="long-term-title">{task.title}</h4>
                <div className="long-term-value">
                    {currentValue?.toLocaleString() || 0}{unit} / {targetValue?.toLocaleString()}{unit}
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-xs)' }}>
                    {task.description}
                </p>
                {task.type === 'health' ? (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <button
                            className={`btn ${isTracking ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={onUpdate}
                            style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}
                        >
                            {isTracking ? t('components.long_term_task.tracking.stop') : t('components.long_term_task.tracking.start')}
                        </button>
                        {isTracking && (
                            <p style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-sm)', textAlign: 'center', animation: 'pulse 2s infinite' }}>
                                {t('components.long_term_task.tracking.recording')}
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                        <input
                            type="number"
                            className="form-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
                            style={{ width: '120px' }}
                            min="0"
                        />
                        <button className="btn btn-primary" onClick={handleUpdate} style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                            {t('components.long_term_task.update')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LongTermTask
