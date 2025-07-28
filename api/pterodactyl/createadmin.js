module.exports = function (app) {
  app.get('/pterodactyl/createadmin', async (req, res) => {
    const { apikey, username, domain, ptla } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!username || !domain || !ptla) {
      return res.json({
        status: false,
        error: 'Parameter tidak lengkap. Harus ada: username, domain, ptla'
      });
    }

    const email = `${username.toLowerCase()}@gmail.com`;
    const password = `${username.toLowerCase()}001`;
    const headers = {
      "Authorization": `Bearer ${ptla}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    try {
      const payload = {
        email,
        username: username.toLowerCase(),
        first_name: username,
        last_name: "Admin",
        password,
        language: "en",
        root_admin: true
      };

      const response = await fetch(`${domain}/api/application/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (!json?.attributes?.id) {
        return res.json({ status: false, error: "Gagal membuat admin", detail: json });
      }

      return res.json({
        status: true,
        message: "Admin berhasil dibuat",
        panel: domain,
        email,
        username,
        password,
        admin_id: json.attributes.id
      });

    } catch (err) {
      return res.json({
        status: false,
        error: "Terjadi kesalahan",
        detail: err.message
      });
    }
  });
};