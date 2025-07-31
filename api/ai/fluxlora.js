const axios = require('axios');

module.exports = function (app) {
    app.get('/ai/fluxlora', async (req, res) => {
        const { apikey, text } = req.query;

        try {
            // Validasi API Key global
            if (!global.apikey || !global.apikey.includes(apikey)) {
                return res.json({ status: false, error: 'Apikey invalid' });
            }

            // Validasi text
            if (!text) {
                return res.json({ status: false, error: 'text parameter is required' });
            }

            // Default LoRA = icons
            const lora = 'Flux-Icon-Kit-LoRA';

            // Request ke Loras.dev
            const { data } = await axios.post('https://www.loras.dev/api/image', {
                prompt: text,
                lora: lora,
                userAPIKey: '3b6743c93d84ccd6374f72a30c48c35619df27db1c04727d15d22d22c70aecb5',
                seed: Math.floor(Math.random() * 10000000) + 1
            }, {
                headers: { 'content-type': 'application/json' }
            });

            return res.json({
                status: true,
                text: text,
                lora: 'icons',
                result: data
            });
        } catch (err) {
            return res.json({ status: false, error: err.message });
        }
    });
};
