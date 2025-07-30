const fetch = require('node-fetch');

module.exports = function(app) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-5c23491504274729a526ba53a92ef8f9";

  // Fungsi untuk request ke DeepSeek
  async function Deepseek(text) {
    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat", // Bisa diganti deepseek-reasoner jika tersedia
          messages: [
            {
              role: "system",
              content: "Kamu adalah AI ramah yang menjawab singkat, jelas, dan tepat."
            },
            {
              role: "user",
              content: text
            }
          ],
          stream: false
        })
      });

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error("Invalid response from DeepSeek API");
      }

      return data.choices[0].message.content.trim();

    } catch (err) {
      throw new Error("Failed to fetch from DeepSeek API: " + err.message);
    }
  }

  app.get('/ai/deepseek', async (req, res) => {
    const { text, apikey } = req.query;

    if (!text) {
      return res.status(400).json({ status: false, error: 'Text is required' });
    }

    // Jika ingin pakai global.apikey, pastikan didefinisikan dulu
    if (typeof global.apikey === 'undefined' || !apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: 'Invalid or missing API key' });
    }

    try {
      const result = await Deepseek(text);
      res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};
