const axios = require("axios");
const fetch = require("node-fetch");

module.exports = function (app) {
  async function fetchVPN() {
    const { data } = await axios.get("http://www.vpngate.net/api/iphone/");
    const lines = data.split("\n");
    const servers = [];
    const seenIP = new Set();

    lines.forEach((line, index) => {
      if (index < 2 || !line || line.startsWith("*")) return;

      const cols = line.split(",");
      if (cols.length > 14) {
        const ip = cols[1];
        if (seenIP.has(ip)) return;
        seenIP.add(ip);

        servers.push({
          hostName: cols[0],
          ip: ip,
          score: cols[2],
          ping: cols[3],
          speed: cols[4],
          countryCode: cols[5],
          country: cols[6],
          numVpnSessions: cols[7],
          openVPN_ConfigData_Base64: cols[14] || null,
        });
      }
    });

    return servers;
  }

  // ===== Endpoint: List VPN Gratis =====
  app.get("/vpn/free", async (req, res) => {
    const { apikey, country, limit } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      let servers = await fetchVPN();

      // Filter negara jika ada
      if (country) {
        servers = servers.filter(
          (s) =>
            s.country.toLowerCase() === country.toLowerCase() ||
            s.countryCode.toLowerCase() === country.toLowerCase()
        );
      }

      // Limit hasil
      const max = parseInt(limit) || 10;
      servers = servers.slice(0, max);

      res.json({
        status: true,
        total: servers.length,
        country: country || "ALL",
        servers,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: "Failed to fetch VPN list" });
    }
  });
  
  app.get("/vpn/countries", async (req, res) => {
    const { apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      const servers = await fetchVPN();
      const countries = [...new Set(servers.map((s) => `${s.country} (${s.countryCode})`))];

      res.json({
        status: true,
        totalCountries: countries.length,
        countries,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: "Failed to fetch country list" });
    }
  });
};
