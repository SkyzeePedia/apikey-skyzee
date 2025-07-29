module.exports = function(app) {
  const fetch = require("node-fetch");

  // Masukkan API key OpenAI (sk-proj)
  const OPENAI_KEY = process.env.OPENAI_API_KEY || "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";

  async function Llama(prompt) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Project": "default" // penting untuk sk-proj
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // cepat & murah
          messages: [
            { role: "system", content: "Kamu adalah AI yang ramah." },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response from OpenAI API: " + JSON.stringify(data));
      }

      return data.choices[0].message.content.trim();
    } catch (err) {
      throw new Error("OpenAI Error: " + err.message);
    }
  }

  app.get('/ai/openai', async (req, res) => {
    try {
      const { text, apikey } = req.query;
      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' });
      }
      if (!text) {
        return res.json({ status: false, error: 'Text is required' });
      }

      const result = await Llama(text);
      res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      res.json({ status: false, error: error.message });
    }
  });
};
