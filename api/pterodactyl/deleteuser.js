module.exports = function (app) {
  app.get('/pterodactyl/deleteuser', async (req, res) => {
    const { apikey, iduser, domain, ptla } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!iduser || !domain || !ptla) {
      return res.json({
        status: false,
        error: 'Parameter tidak lengkap. Wajib: iduser, domain, ptla'
      });
    }

    const headers = {
      "Authorization": `Bearer ${ptla}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    try {
      const response = await fetch(`${domain}/api/application/users/${iduser}`, {
        method: "DELETE",
        headers
      });

      if (response.status === 204) {
        return res.json({
          status: true,
          message: `User ID ${iduser} berhasil dihapus.`
        });
      } else {
        const errorData = await response.json();
        return res.json({
          status: false,
          error: 'Gagal menghapus user',
          detail: errorData
        });
      }

    } catch (err) {
      return res.json({
        status: false,
        error: 'Terjadi kesalahan saat menghapus user',
        detail: err.message
      });
    }
  });
};