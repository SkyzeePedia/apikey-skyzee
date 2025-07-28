const fetch = require('node-fetch');

module.exports = function (app) {
  app.get('/pterodactyl/deleteserver', async (req, res) => {
    const { apikey, idserver, domain, ptla } = req.query;

    // Validasi API Key
    if (!global.apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: 'Apikey invalid' });
    }

    // Validasi Parameter
    if (!idserver || !domain || !ptla) {
      return res.status(400).json({ 
        status: false, 
        error: 'Parameter tidak lengkap. Wajib: idserver, domain, ptla' 
      });
    }

    const headers = {
      "Authorization": `Bearer ${ptla}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    try {
      const response = await fetch(`${domain}/api/application/servers/${idserver}`, {
        method: "DELETE",
        headers
      });

      if (response.status === 204) {
        // 204 berarti berhasil tanpa response body
        return res.status(200).json({
          status: true,
          message: `Server dengan ID ${idserver} berhasil dihapus.`
        });
      } else {
        const errorData = await response.json();
        return res.status(response.status).json({
          status: false,
          error: "Gagal menghapus server",
          detail: errorData
        });
      }

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: "Terjadi kesalahan saat menghapus server",
        detail: err.message
      });
    }
  });
};
