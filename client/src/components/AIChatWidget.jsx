import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

const INITIAL_SUGGEST_DELAY = 3000
const RECURRING_SUGGEST_DELAY = 12000
const ROTATION_INTERVAL = 4000

const CHAT_COPY = {
    vi: {
        welcome:
            'Xin chào, mình là trợ lý AI của Go Quest. Mình có thể giúp bạn tìm hiểu về điểm đến, hành trình và văn hóa ở Cần Thơ.',
        suggestions: [
            'Cồn Sơn có gì đặc sắc cho người mới đi lần đầu?',
            'Tôi nên đi chợ nổi Cái Răng vào khung giờ nào?',
            'Go Quest có những nhiệm vụ trải nghiệm nào?',
        ],
        suggestPrefix: 'Bạn có thể hỏi:',
        title: 'Trợ lý Go Quest',
        subtitle: 'Hỗ trợ thông tin du lịch, văn hóa và hành trình',
        closeAria: 'Đóng chatbox',
        inputPlaceholder: 'Nhập câu hỏi của bạn...',
        sendLabel: 'Gửi',
        openAria: 'Mở trợ lý AI',
        fabTitle: 'Trợ lý AI Go Quest',
        dismissSuggestAria: 'Tắt gợi ý',
        fallbackNoReply: 'Mình chưa có phản hồi phù hợp lúc này.',
        fallbackBusy: 'Hệ thống đang bận. Bạn vui lòng thử lại sau ít phút nhé.',
    },
    en: {
        welcome:
            'Hello, I am Go Quest AI assistant. I can help you explore destinations, itineraries, and local culture in Can Tho.',
        suggestions: [
            'What is special about Con Son for first-time visitors?',
            'What is the best time to visit Cai Rang floating market?',
            'What kinds of experience missions are available on Go Quest?',
        ],
        suggestPrefix: 'You can ask:',
        title: 'Go Quest Assistant',
        subtitle: 'Travel, culture, and itinerary support',
        closeAria: 'Close chatbox',
        inputPlaceholder: 'Type your question...',
        sendLabel: 'Send',
        openAria: 'Open AI assistant',
        fabTitle: 'Go Quest AI assistant',
        dismissSuggestAria: 'Dismiss suggestion',
        fallbackNoReply: 'I do not have a suitable answer right now.',
        fallbackBusy: 'The system is busy. Please try again in a few minutes.',
    },
}

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
    const { i18n } = useTranslation()
    const language = i18n.resolvedLanguage === 'en' ? 'en' : 'vi'
    const copy = CHAT_COPY[language]

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [showSuggestionBubble, setShowSuggestionBubble] = useState(false)
    const [currentSuggestIdx, setCurrentSuggestIdx] = useState(0)
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: copy.welcome,
        },
    ])

    const listRef = useRef(null)
    const suggestions = useMemo(() => copy.suggestions, [copy.suggestions])

    const [recurringTimer, setRecurringTimer] = useState(null)

    // Initial delay: show after 3s
    useEffect(() => {
        if (open || showSuggestionBubble) return
        const timer = setTimeout(() => {
            setShowSuggestionBubble(true)
        }, INITIAL_SUGGEST_DELAY)
        return () => clearTimeout(timer)
    }, [open, showSuggestionBubble])

    // Rotation logic
    useEffect(() => {
        if (!showSuggestionBubble || open) return
        const interval = setInterval(() => {
            setCurrentSuggestIdx((prev) => (prev + 1) % suggestions.length)
        }, ROTATION_INTERVAL)
        return () => clearInterval(interval)
    }, [showSuggestionBubble, open, suggestions.length])

    useEffect(() => {
        if (open) {
            setShowSuggestionBubble(false)
            if (recurringTimer) {
                clearTimeout(recurringTimer)
                setRecurringTimer(null)
            }
        }
    }, [open, recurringTimer])

    const dismissSuggestionBubble = (e) => {
        e.stopPropagation()
        setShowSuggestionBubble(false)
        
        // Clear any existing recurring timer
        if (recurringTimer) clearTimeout(recurringTimer)

        // Show again after 12s
        const timer = setTimeout(() => {
            if (!open) {
                setShowSuggestionBubble(true)
            }
        }, RECURRING_SUGGEST_DELAY)
        setRecurringTimer(timer)
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (recurringTimer) clearTimeout(recurringTimer)
        }
    }, [recurringTimer])

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
            const res = await api.post('/ai/chat', { message: text, language })
            const reply = res?.data?.reply || copy.fallbackNoReply
            setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: copy.fallbackBusy,
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleSuggestClick = () => {
        const question = suggestions[currentSuggestIdx]
        setOpen(true)
        sendMessage(question)
        setShowSuggestionBubble(false)
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        await sendMessage(message)
    }

    return (
        <>
            {!open && showSuggestionBubble && (
                <div className="ai-suggest-bubble" onClick={handleSuggestClick}>
                    <button
                        type="button"
                        className="ai-suggest-close"
                        aria-label={copy.dismissSuggestAria}
                        onClick={dismissSuggestionBubble}
                    >
                        ×
                    </button>
                    <div className="ai-suggest-title">Go Quest AI</div>
                    <div className="ai-suggest-text-container">
                        <div className="ai-suggest-prefix">{copy.suggestPrefix}</div>
                        <div className="ai-suggest-text-wrapper" key={currentSuggestIdx}>
                            <div className="ai-suggest-text-anim">
                                {suggestions[currentSuggestIdx]}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {open && (
                <div className="ai-chat-panel" role="dialog" aria-label="Go Quest AI Chatbox">
                    <div className="ai-chat-header">
                        <div className="ai-chat-brand">
                            <LogoAvatar />
                            <div>
                                <div className="ai-chat-title">{copy.title}</div>
                                <div className="ai-chat-sub">
                                    <span className="ai-chat-status-dot" />
                                    {copy.subtitle}
                                </div>
                            </div>
                        </div>
                        <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label={copy.closeAria}>
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
                            placeholder={copy.inputPlaceholder}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button className="ai-chat-send" type="submit" disabled={loading}>
                            {copy.sendLabel}
                        </button>
                    </form>
                </div>
            )}

            <button
                className="ai-chat-fab"
                onClick={() => setOpen((v) => !v)}
                aria-label={copy.openAria}
                title={copy.fabTitle}
            >
                <LogoAvatar />
            </button>
        </>
    )
}
