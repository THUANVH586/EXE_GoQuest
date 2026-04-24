const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testDeepSeek() {
    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY || API_KEY === 'your-deepseek-api-key-here') {
        console.error('DEEPSEEK_API_KEY is not set in .env');
        return;
    }

    console.log('Testing DeepSeek Connection...');
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Hello, are you DeepSeek?' }],
                max_tokens: 100
            }),
        });

        const data = await response.json();
        if (data.error) {
            console.error('DeepSeek Error:', data.error);
        } else {
            console.log('Response:', data.choices[0].message.content);
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testDeepSeek();
