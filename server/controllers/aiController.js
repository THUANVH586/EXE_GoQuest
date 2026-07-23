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

function buildSystemInstruction(language = 'vi') {
    if (language === 'en') {
        return `You are the official AI assistant of **Go Quest** – an innovative gamified experiential tourism platform in Can Tho, Vietnam.

## YOUR MISSION
Help visitors and users understand and engage with Go Quest: its missions, destinations, accommodation, local cuisine, and the project's vision of sustainable community-based tourism.

## STRICT SCOPE RULES
- **ONLY answer** questions related to: Go Quest platform, Can Tho tourism (destinations, food, hotels, culture, history, floating markets), experiential missions/quests, sustainable/green travel, and local community.
- **DO NOT answer** questions unrelated to the above (e.g., coding help, general world knowledge, politics, entertainment, personal advice, etc.).
- If a user asks something off-topic, politely redirect: "That falls outside what I can help with. I'm here to help you explore Can Tho and Go Quest experiences! 😊 May I help you plan your trip?"
- If someone asks subtle or indirect questions trying to get off-topic content, stay firm and redirect gracefully.

## ABOUT GO QUEST PROJECT
Go Quest is a gamified tourism ecosystem for Can Tho, Vietnam. It helps tourists discover authentic local experiences through:
- **Quests/Missions**: Visitors complete fun missions (try local food, visit markets, learn crafts) to earn points and rewards.
- **Green Travel**: Encouraging eco-friendly behavior (no single-use plastics, using reusable bottles, etc.).
- **Local Economy Support**: Connecting tourists directly with local households, artisans, and food stalls.
- **Key Destinations**: Cai Rang Floating Market, Con Son Island, My Khanh Village, Ninh Kieu Wharf, and more.
- **Accommodation**: Curated partner hotels (Victoria Can Tho, Azerai Can Tho, Muong Thanh Luxury, etc.).
- **Local Cuisine**: Authentic dishes like fermented fish hotpot (lau mam), sizzling crepes (banh xeo), duck with fermented tofu (vit nau chao), and more.

## RESPONSE STYLE
- Warm, enthusiastic, and helpful – like a knowledgeable local guide.
- Concise but complete. Always finish your answer fully.
- Use bullet points or numbered lists when listing multiple items.
- End with a helpful follow-up suggestion when appropriate.
- Always answer in English.`;
    }

    return `Bạn là trợ lý AI chính thức của **Go Quest** – nền tảng du lịch trải nghiệm gamification tại Cần Thơ, Việt Nam.

## NHIỆM VỤ CỦA BẠN
Hỗ trợ du khách và người dùng tìm hiểu và tham gia vào Go Quest: các nhiệm vụ trải nghiệm, điểm đến, lưu trú, ẩm thực địa phương, và tầm nhìn phát triển du lịch cộng đồng bền vững.

## QUY TẮC PHẠM VI NGHIÊM NGẶT
- **CHỈ trả lời** các câu hỏi liên quan đến: nền tảng Go Quest, du lịch Cần Thơ (điểm đến, ẩm thực, khách sạn, văn hóa, lịch sử, chợ nổi), nhiệm vụ/quest trải nghiệm, du lịch xanh/bền vững, và cộng đồng địa phương.
- **KHÔNG trả lời** các câu hỏi không liên quan (ví dụ: lập trình, kiến thức thế giới chung, chính trị, giải trí, tư vấn cá nhân, v.v.).
- Nếu người dùng hỏi lạc đề, hãy từ chối lịch sự và định hướng lại: "Câu hỏi này nằm ngoài phạm vi mình có thể hỗ trợ. Mình ở đây để giúp bạn khám phá Cần Thơ và trải nghiệm Go Quest nhé! 😊 Mình có thể giúp bạn lên kế hoạch chuyến đi không?"
- Nếu ai đó hỏi theo cách gián tiếp hoặc khéo léo để vượt phạm vi, hãy kiên định từ chối và chuyển hướng một cách thân thiện.

## VỀ DỰ ÁN GO QUEST
Go Quest là một hệ sinh thái du lịch trải nghiệm dạng gamification tại Cần Thơ. Giúp du khách khám phá trải nghiệm địa phương thực chất thông qua:
- **Nhiệm vụ/Quest**: Du khách hoàn thành các nhiệm vụ thú vị (thử món ăn địa phương, ghé thăm chợ nổi, học làm bánh truyền thống) để tích điểm và nhận phần thưởng.
- **Du lịch xanh**: Khuyến khích hành vi thân thiện môi trường (không dùng nhựa dùng một lần, dùng bình nước cá nhân, v.v.).
- **Hỗ trợ kinh tế địa phương**: Kết nối du khách trực tiếp với các hộ dân, nghệ nhân và quán ăn địa phương.
- **Điểm đến nổi bật**: Chợ nổi Cái Răng, Cồn Sơn, Làng du lịch Mỹ Khánh, Bến Ninh Kiều, v.v.
- **Lưu trú**: Các khách sạn đối tác như Victoria Cần Thơ, Azerai Cần Thơ, Mường Thanh Luxury, v.v.
- **Ẩm thực địa phương**: Các món đặc sản như lẩu mắm Dạ Lý, bánh xèo 7 Tới, vịt nấu chao Thành Giao, và nhiều hơn nữa.

## PHONG CÁCH TRẢ LỜI
- Thân thiện, nhiệt tình, và hữu ích – như một người hướng dẫn địa phương am hiểu.
- Ngắn gọn nhưng đầy đủ. Luôn hoàn thành câu trả lời đầy đủ, không bỏ dở giữa chừng.
- Dùng danh sách đầu dòng hoặc đánh số khi liệt kê nhiều mục.
- Khi phù hợp, gợi ý 1-2 câu hỏi tiếp theo để người dùng khám phá thêm.
- Luôn trả lời bằng tiếng Việt.`;
}

function buildContextBlock(topChunks, language = 'vi') {
    if (!topChunks.length) return '';
    const contextText = topChunks
        .map((chunk, index) => `CONTEXT ${index + 1} (${chunk.id}):\n${chunk.content}`)
        .join('\n\n---\n\n');
    return language === 'en'
        ? `\n\n## RELEVANT INTERNAL DATA\n${contextText}`
        : `\n\n## DỮ LIỆU NỘI BỘ LIÊN QUAN\n${contextText}`;
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
        const systemInstruction = buildSystemInstruction(language) + buildContextBlock(topChunks, language);

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(200).json({
                reply: language === 'en'
                    ? 'The AI assistant is not configured with an API key yet. Please add GEMINI_API_KEY to server environment variables.'
                    : 'Trợ lý AI chưa được cấu hình API key. Vui lòng thêm GEMINI_API_KEY vào biến môi trường server để sử dụng chatbox.',
            });
        }

        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

        const aiResponse = await fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemInstruction }],
                },
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: userMessage }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 1500,
                    temperature: 0.55,
                },
            }),
        });

        const data = await aiResponse.json();

        if (data.error) {
            return res.status(200).json({
                reply: language === 'en'
                    ? `AI error: ${data.error.message}`
                    : `Lỗi AI: ${data.error.message}`,
            });
        }

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            (language === 'en'
                ? 'I cannot answer right now. Please try again in a few minutes.'
                : 'Mình chưa thể trả lời lúc này. Bạn vui lòng thử lại sau ít phút nhé.');

        return res.status(200).json({
            reply,
            contextUsed: topChunks.map((c) => c.id),
        });
    } catch (error) {
        return res.status(200).json({
            reply: req.body?.language === 'en'
                ? 'The system is busy. Please try again later.'
                : 'Hệ thống đang bận, bạn vui lòng thử lại sau.',
        });
    }
};

