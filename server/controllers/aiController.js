const fs = require('fs/promises');
const path = require('path');

const cachedChunksByLanguage = {};

function normalizeText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s\u00C0-\u1EF9]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(text) {
    return normalizeText(text).split(' ').filter(Boolean);
}

function overlapScore(query, content) {
    const qTokens = tokenize(query);
    if (!qTokens.length) return 0;

    const contentNorm = normalizeText(content);
    let score = 0;

    for (const token of qTokens) {
        if (token.length < 2) continue;
        if (contentNorm.includes(token)) score += 1;
    }

    return score;
}

async function readChunksFromDir(dirPath, namespace) {
    try {
        const files = await fs.readdir(dirPath);
        const txtFiles = files
            .filter((name) => name.toLowerCase().endsWith('.txt'))
            .filter((name) => name !== '00_index.txt');

        const chunks = await Promise.all(
            txtFiles.map(async (name) => {
                const fullPath = path.join(dirPath, name);
                const content = await fs.readFile(fullPath, 'utf8');
                return {
                    id: `${namespace}/${name}`,
                    fileName: name,
                    namespace,
                    content,
                };
            })
        );

        return chunks;
    } catch (error) {
        return [];
    }
}

async function loadKnowledgeChunks(language = 'vi') {
    const lang = language === 'en' ? 'en' : 'vi';
    if (cachedChunksByLanguage[lang]) return cachedChunksByLanguage[lang];

    const rootKnowledgeDir = path.join(__dirname, '..', '..', 'knowledge');
    let chunkLoadTasks = [];

    if (lang === 'en') {
        const englishDir = path.join(rootKnowledgeDir, 'english_chunks');
        chunkLoadTasks = [readChunksFromDir(englishDir, 'english')];
    } else {
        const economyDir = path.join(rootKnowledgeDir, 'economy_chunks');
        const historyCultureDir = path.join(rootKnowledgeDir, 'history_culture_chunks');
        chunkLoadTasks = [
            readChunksFromDir(economyDir, 'economy'),
            readChunksFromDir(historyCultureDir, 'history_culture'),
        ];
    }

    const loadedSets = await Promise.all(chunkLoadTasks);
    cachedChunksByLanguage[lang] = loadedSets.flat();
    return cachedChunksByLanguage[lang];
}

function chooseTopChunks(message, chunks, topK = 2) {
    const scored = chunks
        .map((chunk) => ({
            ...chunk,
            score: overlapScore(message, chunk.content),
        }))
        .filter((chunk) => chunk.score >= 2) // Chỉ lấy nếu có ít nhất 2 từ khóa khớp
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return scored;
}

function buildSystemPrompt(userMessage, topChunks, language = 'vi') {
    const isEnglish = language === 'en';
    const contextText = topChunks.length
        ? topChunks
            .map((c) => c.content
                .replace(/https?:\/\/[^\s]+/g, '') // Xóa URL
                .replace(/Nguon internet.*/gi, '') // Xóa metadata nguồn
                .trim()
            )
            .join('\n---\n')
        : (isEnglish ? 'No context.' : 'Không có dữ liệu.');

    if (isEnglish) {
        return `You are Go Quest AI (tourism in Con Son, Can Tho). 
Use context to answer. If not in context, answer briefly & honestly.
Rules: 
- Use clear spacing & bullet points for readability.
- Bold key information.
- Max 150-300 words.
Context: ${contextText}`;
    }

    return `Bạn là trợ lý Go Quest (du lịch Cồn Sơn, Cần Thơ). 
Dùng ngữ cảnh để trả lời. Nếu không có, trả lời ngắn gọn & trung thực.
Quy tắc: 
- Sử dụng ngắt dòng và danh sách liệt kê (bullet points) cho dễ đọc.
- In đậm các thông tin quan trọng.
- Tối đa 150-300 chữ.
Ngữ cảnh: ${contextText}`;
}

exports.chatWithAI = async (req, res) => {
    try {
        const userMessage = req.body?.message;
        const language = req.body?.language === 'en' ? 'en' : 'vi';

        if (!userMessage || !String(userMessage).trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const chunks = await loadKnowledgeChunks(language);
        const topChunks = chooseTopChunks(userMessage, chunks, 3);
        const systemPrompt = buildSystemPrompt(userMessage, topChunks, language);

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

        if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-deepseek-api-key-here') {
            return res.status(200).json({
                reply: language === 'en'
                    ? 'The AI assistant is not fully configured. Please add DEEPSEEK_API_KEY to server environment variables.'
                    : 'Trợ lý AI chưa được cấu hình đầy đủ. Vui lòng thêm DEEPSEEK_API_KEY vào biến môi trường server.',
            });
        }

        // DeepSeek API (OpenAI compatible)
        const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 500, // Giảm giới hạn token đầu ra
                temperature: 0.5, // Giảm để câu trả lời tập trung hơn
                stream: false
            }),
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            console.error('DeepSeek API Error:', errorData);
            return res.status(200).json({
                reply: language === 'en'
                    ? `AI service error: ${errorData.error?.message || aiResponse.statusText}`
                    : `Lỗi dịch vụ AI: ${errorData.error?.message || aiResponse.statusText}`,
            });
        }

        const data = await aiResponse.json();
        const reply = data?.choices?.[0]?.message?.content ||
            (language === 'en'
                ? 'I cannot answer right now. Please try again in a few minutes.'
                : 'Mình chưa thể trả lời lúc này. Bạn vui lòng thử lại sau ít phút nhé.');

        return res.status(200).json({
            reply,
            contextUsed: topChunks.map((c) => c.id),
        });
    } catch (error) {
        console.error('AI Controller Error:', error);
        return res.status(200).json({
            reply: req.body?.language === 'en'
                ? 'The system is busy. Please try again later.'
                : 'Hệ thống đang bận, bạn vui lòng thử lại sau.',
        });
    }
};
