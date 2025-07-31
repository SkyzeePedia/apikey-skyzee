const axios = require('axios');

module.exports = function(app) {
    app.get('/ai/chat-ai', async (req, res) => {
        const { apikey, question, system_prompt = null, model = 'grok-3-mini' } = req.query;

        try {
            // Validasi API key otomatis dari global.apikey
            if (!global.apikey || !global.apikey.includes(apikey)) {
                return res.json({ status: false, error: 'Apikey invalid' });
            }

            const _model = [
                'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'o4-mini',
                'deepseek-r1', 'deepseek-v3', 'claude-3.7', 'gemini-2.0',
                'grok-3-mini', 'qwen-qwq-32b', 'gpt-4o', 'o3',
                'gpt-4o-mini', 'llama-3.3'
            ];

            if (!question) return res.json({ status: false, error: 'Question is required' });
            if (!_model.includes(model)) return res.json({ status: false, error: `Available models: ${_model.join(', ')}` });

            // Request ke API AppZone
            const { data } = await axios.post('https://api.appzone.tech/v1/chat/completions', {
                messages: [
                    ...(system_prompt ? [{
                        role: 'system',
                        content: [{ type: 'text', text: system_prompt }]
                    }] : []),
                    {
                        role: 'user',
                        content: [{ type: 'text', text: question }]
                    }
                ],
                model: model,
                isSubscribed: true
            }, {
                headers: {
                    authorization: 'Bearer az-chatai-key',
                    'content-type': 'application/json',
                    'user-agent': 'okhttp/4.9.2',
                    'x-app-version': '3.0',
                    'x-requested-with': 'XMLHttpRequest',
                    'x-user-id': '$RCAnonymousID:84947a7a4141450385bfd07a66c3b5c4'
                }
            });

            // Parsing streaming response
            let fullText = '';
            const lines = data.split('\n\n').map(line => line.substring(6));
            for (const line of lines) {
                if (line === '[DONE]') continue;
                try {
                    const d = JSON.parse(line);
                    fullText += d.choices[0].delta.content || '';
                } catch (e) {}
            }

            const thinkMatch = fullText.match(/([\s\S]*?)<\/think>/);

            return res.json({
                status: true,
                think: thinkMatch ? thinkMatch[1].trim() : '',
                response: fullText.replace(/[\s\S]*?<\/think>/, '').trim()
            });

        } catch (error) {
            return res.json({ status: false, error: error.message });
        }
    });
};
