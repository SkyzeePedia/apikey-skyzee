const fetch = require('node-fetch');

module.exports = function(app) {
  // Ganti ini dengan API Key OpenAI resmi kamu
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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";

  async function OpenAi(teks) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Model yang cepat & murah
          messages: [
            { role: "system", content: "Kamu adalah asisten AI yang ramah." },
            { role: "user", content: teks }
          ]
        })
      });

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response from OpenAI API: " + JSON.stringify(data));
      }

      return data.choices[0].message.content.trim();

    } catch (err) {
      throw new Error("Failed to fetch from OpenAI API: " + err.message);
    }
  }

  // Endpoint GET
  app.get('/ai/openai', async (req, res) => {
    const { text, apikey } = req.query;

    if (!text) {
      return res.json({ status: false, error: 'Text is required' });
    }

    if (!apikey || !global.apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Invalid or missing API key' });
    }

    try {
      const result = await OpenAi(text);
      res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};
