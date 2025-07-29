module.exports = function(app) {
  const fetch = require("node-fetch");

  // Masukkan API Key OpenAI sk-proj kamu di sini
  const OPENAI_KEY = process.env.OPENAI_API_KEY || "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";

  // OpenAI Project ID untuk sk-proj
  const PROJECT_ID = process.env.OPENAI_PROJECT || "default";

  // Fungsi untuk memanggil OpenAI
  async function Llama(prompt, model = "gpt-4o-mini") {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Project": PROJECT_ID
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "Kamu adalah AI yang ramah dan membantu." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const textResult = data?.choices?.[0]?.message?.content?.trim();
      if (!textResult) throw new Error("OpenAI API tidak mengembalikan teks");

      return textResult;
    } catch (err) {
      throw new Error("OpenAI Error: " + err.message);
    }
  }

  // Endpoint OpenAI
  app.get('/ai/openai', async (req, res) => {
    try {
      const { text, apikey, model } = req.query;

      if (!text) {
        return res.json({ status: false, error: 'Text is required' });
      }

      if (!apikey || !global.apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' });
      }

      // Model bisa diganti via query, default gpt-4o-mini
      const chosenModel = model || "gpt-4o-mini";

      const result = await Llama(text, chosenModel);
      res.status(200).json({
        status: true,
        model: chosenModel,
        result
      });
    } catch (error) {
      res.json({ status: false, error: error.message });
    }
  });
};
