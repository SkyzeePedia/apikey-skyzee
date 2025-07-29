const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.get('/ai/blackbox', async (req, res) => {
    try {
        const { text, apikey } = req.query;

        if (!global.apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: 'Apikey invalid' });
        }

        if (!text) {
            return res.json({ status: false, error: 'Parameter text kosong' });
        }

        const url = "https://api.blackbox.ai/chat/completions";
        const user_api_key = "sk-K8O49NWZdCKQ99EqMv4TIA";

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user_api_key}`
        };

        const data = {
            model: "blackboxai/openai/gpt-4",
            messages: [
                {
                    role: "user",
                    content: text
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.choices && result.choices.length > 0) {
            res.status(200).json({
                status: true,
                result: result.choices[0].message.content
            });
        } else {
            res.json({ status: false, error: 'Tidak ada respon dari Blackbox AI.' });
        }

    } catch (error) {
        res.json({ status: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Blackbox AI berjalan di port ${PORT}`);
});
