const fs = require('fs/promises');
const path = require('path');

let cachedChunks = null;

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

async function loadKnowledgeChunks() {
    if (cachedChunks) return cachedChunks;

    const rootKnowledgeDir = path.join(__dirname, '..', '..', 'knowledge');
    const economyDir = path.join(rootKnowledgeDir, 'economy_chunks');
    const historyCultureDir = path.join(rootKnowledgeDir, 'history_culture_chunks');

    const [economyChunks, historyCultureChunks] = await Promise.all([
        readChunksFromDir(economyDir, 'economy'),
        readChunksFromDir(historyCultureDir, 'history_culture'),
    ]);

    cachedChunks = [...economyChunks, ...historyCultureChunks];
    return cachedChunks;
}

function chooseTopChunks(message, chunks, topK = 3) {
    const scored = chunks
        .map((chunk) => ({
            ...chunk,
            score: overlapScore(message, chunk.content),
        }))
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return scored;
}

function buildSystemPrompt(userMessage, topChunks) {
    const contextText = topChunks.length
        ? topChunks
              .map(
                  (chunk, index) =>
                      `CONTEXT ${index + 1} (${chunk.id}):\n${chunk.content}`
              )
              .join('\n\n---\n\n')
        : 'Không có context nội bộ phù hợp. Hãy trả lời tổng quan và thận trọng.';

    return `
Bạn là trợ lý AI chính thức của website Go Quest (du lịch trải nghiệm Cồn Sơn - Cần Thơ).

VAI TRÒ:
- Tư vấn cho user về trải nghiệm tại Go Quest, điểm đến, văn hóa, lịch sử, và thông tin kinh tế tổng quan của mô hình.
- Nếu có context nội bộ thì ưu tiên context nội bộ.
- Nếu user hỏi ngoài context, trả lời ngắn gọn và nêu rõ phạm vi thông tin hiện có.

NGUYÊN TẮC TRẢ LỜI:
1) Trả lời bằng tiếng Việt rõ ràng, thân thiện, dễ hiểu.
2) Ưu tiên độ chính xác, không tự chế số liệu cụ thể.
3) Nếu user hỏi về lịch sử/văn hóa: nếu dữ liệu chưa đầy đủ, nói rõ "theo dữ liệu tổng hợp hiện có".
4) Không trả lời nội dung nguy hiểm/vi phạm pháp luật.
5) Có thể gợi ý 1-2 câu hỏi tiếp theo để user khám phá thêm.

CONTEXT NỘI BỘ:
${contextText}

CÂU HỎI USER:
${userMessage}
`;
}

exports.chatWithAI = async (req, res) => {
    try {
        const userMessage = req.body?.message;

        if (!userMessage || !String(userMessage).trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const chunks = await loadKnowledgeChunks();
        const topChunks = chooseTopChunks(userMessage, chunks, 3);
        const systemPrompt = buildSystemPrompt(userMessage, topChunks);

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(200).json({
                reply:
                    'Trợ lý AI chưa được cấu hình API key. Vui lòng thêm GEMINI_API_KEY vào biến môi trường server để sử dụng chatbox.',
            });
        }

        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

        const aiResponse = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 900,
                    temperature: 0.6,
                },
            }),
        });

        const data = await aiResponse.json();

        if (data.error) {
            return res.status(200).json({
                reply: `Lỗi AI: ${data.error.message}`,
            });
        }

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Mình chưa thể trả lời lúc này. Bạn vui lòng thử lại sau ít phút nhé.';

        return res.status(200).json({
            reply,
            contextUsed: topChunks.map((c) => c.id),
        });
    } catch (error) {
        return res.status(200).json({
            reply: 'Hệ thống đang bận, bạn vui lòng thử lại sau.',
        });
    }
};
