module.exports = function (app) {
  app.get('/pterodactyl/deleteserver', async (req, res) => {
    const { apikey, idserver, domain, ptla } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!idserver || !domain || !ptla) {
      return res.json({ 
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
        return res.json({ status: true, message: `Server ID ${idserver} berhasil dihapus.` });
      } else {
        const errorData = await response.json();
        return res.json({
          status: false,
          error: "Gagal menghapus server.",
          detail: errorData
        });
      }

    } catch (err) {
      return res.json({
        status: false,
        error: "Terjadi kesalahan saat menghapus server.",
        detail: err.message
      });
    }
  });
};