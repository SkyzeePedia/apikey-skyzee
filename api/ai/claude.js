module.exports = function(app) {
  const fetch = require("node-fetch");

  // Pakai Claude API
  const CLAUDE_KEY = "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";

  async function ClaudeReply(prompt) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Bisa diganti sonnet/opus
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Claude API error");
    return data.content?.[0]?.text || JSON.stringify(data);
  }

  // Endpoint Claude AI
  app.get("/ai/claude", async (req, res) => {
    try {
      const { text, apikey } = req.query;
      if (!text) return res.json({ status: false, error: "Parameter text wajib ada" });
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: "Apikey invalid" });

      const result = await ClaudeReply(text);
      res.status(200).json({
        status: true,
        result: result
      });
    } catch (error) {
      res.json({ status: false, error: error.message });
    }
  });
};
