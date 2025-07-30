module.exports = function(app) {
  const fetch = require('node-fetch');

  // API key khusus DeepSeek
  const DEEPSEEK_KEY = "sk-5c23491504274729a526ba53a92ef8f9"; // Ganti dengan API key asli

  // Fungsi untuk call DeepSeek
  async function DeepSeekAI(prompt) {
    const url = `https://api.deepseek.com/chat/completions`;

    const body = {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DEEPSEEK_KEY}`,
      "User-Agent": "deepseek-js-client/1.0.0"
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API Error ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result?.choices?.[0]?.message?.content || "Tidak ada respon dari DeepSeek";
  }

  // Route endpoint /ai/deepseek
  app.get('/ai/deepseek', async (req, res) => {
    try {
      const { text, apikey } = req.query;

      // Validasi API key global
      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' });
      }

      if (!text) return res.json({ status: false, error: 'Parameter text wajib diisi' });

      const result = await DeepSeekAI(text);

      res.status(200).json({
        status: true,
        result: result
      });

    } catch (error) {
      res.json({ status: false, error: error.message });
    }
  });
}
