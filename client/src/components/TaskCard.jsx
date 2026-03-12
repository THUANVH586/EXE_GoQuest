import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function TaskCard({ task, onComplete, isCompleted }) {
    const { t } = useTranslation()
    const [isAnimating, setIsAnimating] = useState(false)

    const typeLabels = {
        food: t('components.task_card.types.food'),
        craft: t('components.task_card.types.craft'),
        community: t('components.task_card.types.community'),
        health: t('components.task_card.types.health'),
        environment: t('components.task_card.types.environment')
    }

    const handleClick = () => {
        if (isCompleted) return

        setIsAnimating(true)
        onComplete(task._id || task.id)

        setTimeout(() => setIsAnimating(false), 500)
    }

    return (
        <div
            className={`task-card ${isCompleted ? 'completed' : ''} ${isAnimating ? 'animate-celebrate' : ''}`}
            onClick={handleClick}
            style={{ animationDelay: `${(task.order || 0) * 0.1}s` }}
        >
            {isCompleted && (
                <div style={{
                    position: 'absolute',
                    top: 'var(--space-md)',
                    right: 'var(--space-md)',
                    color: 'var(--color-success)',
                    fontSize: '1.5rem'
                }}>
                    ✓
                </div>
            )}

            <div className="task-icon">
                {task.icon || ''}
            </div>

            <h3 className="task-title">{task.title}</h3>

            <p className="task-description">{task.description}</p>

            <div className="task-meta">
                <span className={`task-badge ${task.type}`}>
                    {typeLabels[task.type] || task.type}
                </span>

                {task.duration > 0 && (
                    <span className="task-badge">
                        {t('components.task_card.minutes', { count: task.duration })}
                    </span>
                )}

                <span className="task-badge">
                    {t('components.task_card.points', { count: task.points })}
                </span>
            </div>

            {task.location?.name && (
                <div style={{
                    marginTop: 'var(--space-md)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)'
                }}>
                    {task.location.name}
                </div>
            )}
        </div>
    )
}

export default TaskCard
