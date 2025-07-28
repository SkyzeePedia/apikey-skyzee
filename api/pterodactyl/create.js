module.exports = function (app) {
  app.get('/pterodactyl/create', async (req, res) => {
    const {
      apikey,
      username,
      ram,
      eggid,
      nestid,
      loc,
      domain,
      ptla
    } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!username || !ram || !eggid || !nestid || !loc || !domain || !ptla) {
      return res.json({
        status: false,
        error: "Parameter tidak lengkap. Harus ada: username, ram, eggid, nestid, loc, domain, ptla"
      });
    }

    const map = {
      "1gb": { ram: 1000, disk: 1000, cpu: 40 },
      "2gb": { ram: 2000, disk: 1000, cpu: 60 },
      "3gb": { ram: 3000, disk: 2000, cpu: 80 },
      "4gb": { ram: 4000, disk: 2000, cpu: 100 },
      "5gb": { ram: 5000, disk: 3000, cpu: 120 },
      "6gb": { ram: 6000, disk: 3000, cpu: 140 },
      "7gb": { ram: 7000, disk: 4000, cpu: 160 },
      "8gb": { ram: 8000, disk: 4000, cpu: 180 },
      "9gb": { ram: 9000, disk: 5000, cpu: 200 },
      "10gb": { ram: 10000, disk: 5000, cpu: 220 },
      "unlimited": { ram: 0, disk: 0, cpu: 0 }
    };

    const spec = map[ram.toLowerCase()] || map["1gb"];
    const email = `${username.toLowerCase()}@gmail.com`;
    const password = `${username.toLowerCase()}001`;
    const name = `${username.charAt(0).toUpperCase() + username.slice(1)} Server`;

    const headers = {
      "Authorization": `Bearer ${ptla}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    try {
      const userPayload = {
        email,
        username: username.toLowerCase(),
        first_name: username,
        last_name: "Skyzee",
        password,
        language: "en"
      };

      const userRes = await fetch(`${domain}/api/application/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(userPayload)
      });

      const userJson = await userRes.json();
      if (!userJson?.attributes?.id) {
        return res.json({ status: false, error: "Gagal membuat user", detail: userJson });
      }
      const userId = userJson.attributes.id;

      const eggRes = await fetch(`${domain}/api/application/nests/${nestid}/eggs/${eggid}`, { headers });
      const eggJson = await eggRes.json();

      const startup = eggJson?.attributes?.startup || "npm start";
      const docker = eggJson?.attributes?.docker_image || "ghcr.io/parkervcp/yolks:nodejs_21";

      const serverPayload = {
        name,
        user: userId,
        egg: parseInt(eggid),
        docker_image: docker,
        startup,
        limits: {
          memory: spec.ram,
          swap: 0,
          disk: spec.disk,
          io: 500,
          cpu: spec.cpu
        },
        feature_limits: {
          databases: 2,
          backups: 2,
          allocations: 1
        },
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start"
        },
        deploy: {
          locations: [parseInt(loc)],
          dedicated_ip: false,
          port_range: []
        },
        start_on_completion: true
      };

      const serverRes = await fetch(`${domain}/api/application/servers`, {
        method: "POST",
        headers,
        body: JSON.stringify(serverPayload)
      });

      const serverJson = await serverRes.json();
      if (!serverJson?.attributes?.id) {
        return res.json({ status: false, error: "Gagal membuat server", detail: serverJson });
      }

      return res.json({
        status: true,
        message: "Server berhasil dibuat!",
        panel: domain,
        user: username,
        pass: password,
        server_id: serverJson.attributes.id
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