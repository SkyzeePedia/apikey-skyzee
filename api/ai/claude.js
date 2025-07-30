module.exports = function(app) {
  const fetch = require('node-fetch');

  // API key khusus Claude
  const CLAUDE_KEY = "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"; // Ganti pake API key Claude asli lu

  async function ClaudeAI(prompt) {
    const url = `https://api.anthropic.com/v1/messages`;
    const body = {
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    };

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_KEY,
      "anthropic-version": "2023-06-01"
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Claude API Error ${response.status}: ${err.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return result?.content?.[0]?.text || "Tidak ada respon dari Claude";
  }

  app.get('/ai/claude', async (req, res) => {
    try {
      const { text, apikey } = req.query;

      // Validasi API key global
      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' });
      }

      if (!text) return res.json({ status: false, error: 'Parameter text wajib diisi' });

      const result = await ClaudeAI(text);

      res.status(200).json({
        status: true,
        result: result
      });

    } catch (error) {
      res.json({ status: false, error: error.message });
    }
  });
}
