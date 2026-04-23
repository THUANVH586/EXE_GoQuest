import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'

const SUGGEST_DELAY_MS = 12000

const DEFAULT_SUGGESTIONS = [
    'Cồn Sơn có gì đặc sắc cho người mới đi lần đầu?',
    'Tôi nên đi chợ nổi Cái Răng vào khung giờ nào?',
    'Go Quest có những nhiệm vụ trải nghiệm nào?',
]

function LogoAvatar() {
    return (
        <img
            src="https://res.cloudinary.com/dnnz4ze3b/image/upload/v1773476778/Asset_3_on57x4.png"
            alt="Go Quest"
            className="ai-chat-logo"
        />
    )
}

export default function AIChatWidget() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [showSuggestionBubble, setShowSuggestionBubble] = useState(false)
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Xin chào, mình là trợ lý AI của Go Quest. Mình có thể giúp bạn tìm hiểu về điểm đến, hành trình và văn hóa ở Cần Thơ.',
        },
    ])

    const listRef = useRef(null)

    const suggestions = useMemo(() => DEFAULT_SUGGESTIONS, [])
    const primarySuggestion = suggestions[0]

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSuggestionBubble(true)
        }, SUGGEST_DELAY_MS)

        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (open) {
            setShowSuggestionBubble(false)
        }
    }, [open])

    useEffect(() => {
        if (!listRef.current) return
        listRef.current.scrollTop = listRef.current.scrollHeight
    }, [messages, loading])

    const sendMessage = async (content) => {
        const text = String(content || '').trim()
        if (!text || loading) return

        setMessages((prev) => [...prev, { role: 'user', text }])
        setMessage('')
        setLoading(true)

        try {
            const res = await api.post('/ai/chat', { message: text })
            const reply = res?.data?.reply || 'Mình chưa có phản hồi phù hợp lúc này.'
            setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: 'Hệ thống đang bận. Bạn vui lòng thử lại sau ít phút nhé.',
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        await sendMessage(message)
    }

    return (
        <>
            {!open && showSuggestionBubble && (
                <div className="ai-suggest-bubble" onClick={() => setOpen(true)}>
                    <div className="ai-suggest-title">Go Quest AI</div>
                    <div className="ai-suggest-text">Bạn có thể hỏi: {primarySuggestion}</div>
                </div>
            )}

            {open && (
                <div className="ai-chat-panel" role="dialog" aria-label="Go Quest AI Chatbox">
                    <div className="ai-chat-header">
                        <div className="ai-chat-brand">
                            <LogoAvatar />
                            <div>
                                <div className="ai-chat-title">Trợ lý Go Quest</div>
                                <div className="ai-chat-sub">
                                    <span className="ai-chat-status-dot" />
                                    Hỗ trợ thông tin du lịch, văn hóa và hành trình
                                </div>
                            </div>
                        </div>
                        <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label="Đóng chatbox">
                            x
                        </button>
                    </div>

                    <div className="ai-chat-messages" ref={listRef}>
                        {messages.map((m, idx) => (
                            <div key={`${m.role}-${idx}`} className={`ai-msg ai-msg-${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="ai-msg ai-msg-assistant ai-msg-loading" aria-live="polite">
                                <span className="ai-typing-dot" />
                                <span className="ai-typing-dot" />
                                <span className="ai-typing-dot" />
                            </div>
                        )}
                    </div>

                    <div className="ai-chat-suggestions">
                        {suggestions.map((q) => (
                            <button key={q} type="button" className="ai-chip" onClick={() => sendMessage(q)}>
                                {q}
                            </button>
                        ))}
                    </div>

                    <form className="ai-chat-input-wrap" onSubmit={onSubmit}>
                        <input
                            className="ai-chat-input"
                            placeholder="Nhập câu hỏi của bạn..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button className="ai-chat-send" type="submit" disabled={loading}>
                            Gửi
                        </button>
                    </form>
                </div>
            )}

            <button
                className="ai-chat-fab"
                onClick={() => setOpen((v) => !v)}
                aria-label="Mở trợ lý AI"
                title="Trợ lý AI Go Quest"
            >
                <LogoAvatar />
            </button>
        </>
    )
}
