const fetch = require('node-fetch');

module.exports = function (app) {

  app.get('/cloudflare/add-subdomain', async (req, res) => {
    const { apikey, subdomain, ip, zoneid, token, domain } = req.query;

    if (!global.apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: 'Apikey invalid' });
    }

    if (!subdomain || !ip || !zoneid || !token || !domain) {
      return res.status(400).json({
        status: false,
        error: "Parameter tidak lengkap. Wajib: subdomain, ip, zoneid, token, domain"
      });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    try {
      const payload = {
        type: "A",
        name: `${subdomain}.${domain}`,
        content: ip,
        ttl: 3600,
        proxied: false
      };

      const create = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const json = await create.json();

      if (!json.success) {
        return res.status(500).json({ status: false, error: "Gagal menambah subdomain", detail: json.errors });
      }

      return res.status(200).json({
        status: true,
        message: "Subdomain berhasil ditambahkan",
        subdomain: `${subdomain}.${domain}`,
        result: json.result
      });

    } catch (err) {
      return res.status(500).json({ status: false, error: "Terjadi kesalahan", detail: err.message });
    }
  });


  app.get('/cloudflare/delete-subdomain', async (req, res) => {
    const { apikey, subdomain, zoneid, token, domain } = req.query;

    if (!global.apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: 'Apikey invalid' });
    }

    if (!subdomain || !zoneid || !token || !domain) {
      return res.status(400).json({
        status: false,
        error: "Parameter tidak lengkap. Wajib: subdomain, zoneid, token, domain"
      });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    try {
      const find = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records?name=${subdomain}.${domain}`, { headers });
      const list = await find.json();

      if (!list.success || list.result.length === 0) {
        return res.status(404).json({ status: false, error: "Subdomain tidak ditemukan" });
      }

      const recordId = list.result[0].id;

      const del = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records/${recordId}`, {
        method: "DELETE",
        headers
      });

      const delJson = await del.json();
      if (!delJson.success) {
        return res.status(500).json({ status: false, error: "Gagal menghapus subdomain", detail: delJson.errors });
      }

      return res.status(200).json({
        status: true,
        message: "Subdomain berhasil dihapus",
        subdomain: `${subdomain}.${domain}`
      });

    } catch (err) {
      return res.status(500).json({ status: false, error: "Terjadi kesalahan", detail: err.message });
    }
  });

};
