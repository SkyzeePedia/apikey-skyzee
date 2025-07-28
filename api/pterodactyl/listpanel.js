const fetch = require('node-fetch');

module.exports = function (app) {
  app.get('/pterodactyl/listpanel', async (req, res) => {
    const { apikey, eggid, nestid, loc, domain, ptla } = req.query;

    // Validasi API Key
    if (!global.apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: 'Apikey invalid' });
    }

    // Validasi parameter wajib
    if (!domain || !ptla) {
      return res.status(400).json({
        status: false,
        error: 'Parameter wajib: domain & ptla'
      });
    }

    const headers = {
      Authorization: `Bearer ${ptla}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    try {
      // Ambil semua server
      const response = await fetch(`${domain}/api/application/servers`, { headers });
      const data = await response.json();

      if (!data || !Array.isArray(data.data)) {
        return res.status(500).json({
          status: false,
          error: "Gagal mengambil data server",
          detail: data
        });
      }

      // Filter sesuai nestid, eggid, loc (jika ada)
      const filtered = data.data.filter(server => {
        const attr = server.attributes;
        return (!nestid || attr.nest === parseInt(nestid)) &&
               (!eggid || attr.egg === parseInt(eggid)) &&
               (!loc || attr.location === parseInt(loc));
      });

      // Format hasil
      const result = filtered.map(srv => ({
        id: srv.attributes.id,
        name: srv.attributes.name,
        uuid: srv.attributes.uuid,
        identifier: srv.attributes.identifier,
        user: srv.attributes.user,
        limits: srv.attributes.limits,
        created_at: srv.attributes.created_at
      }));

      return res.status(200).json({
        status: true,
        total: result.length,
        servers: result
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Terjadi kesalahan saat mengambil list panel",
        detail: err.message
      });
    }
  });
};
