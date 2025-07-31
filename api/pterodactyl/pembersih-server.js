const fetch = require("node-fetch");

module.exports = function (app) {
  function getDaysOld(dateString) {
    const created = new Date(dateString);
    return Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  app.get("/pterodactyl/pembersih-server", async (req, res) => {
    const { apikey, plta, domain } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }
    if (!plta || !domain) {
      return res.json({ status: false, error: "plta & domain wajib diisi" });
    }

    const baseUrl = domain.replace(/\/+$/, "");

    try {
      const accRes = await fetch(`${baseUrl}/api/application/account`, {
        headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
      });
      const accJson = await accRes.json();
      const ownerId = accJson.id || accJson.attributes?.id;

      const serverRes = await fetch(`${baseUrl}/api/application/servers`, {
        headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
      });
      const serverJson = await serverRes.json();
      const servers = serverJson.data || [];

      const deletedServers = [];

      for (const s of servers) {
        const attr = s.attributes;
        const sid = attr.id;
        const name = attr.name;
        const userId = attr.user;

        const detailRes = await fetch(`${baseUrl}/api/application/servers/${sid}`, {
          headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
        });
        const detailJson = await detailRes.json();
        const createdAt = detailJson.attributes?.created_at || Date.now();
        const days = getDaysOld(createdAt);

        if (days >= 30 && userId !== ownerId) {
          await fetch(`${baseUrl}/api/application/servers/${sid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
          });

          deletedServers.push({ id: sid, name, days, status: "server_deleted" });
        }
      }

      const userRes = await fetch(`${baseUrl}/api/application/users`, {
        headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
      });
      const userJson = await userRes.json();
      const users = userJson.data || [];

      const deletedUsers = [];

      for (const u of users) {
        const attr = u.attributes;
        const uid = attr.id;
        const username = attr.username;

        const createdAt = attr.created_at || Date.now();
        const days = getDaysOld(createdAt);

        // Hanya hapus user >30 hari & bukan owner PLTA
        if (days >= 30 && uid !== ownerId) {
          await fetch(`${baseUrl}/api/application/users/${uid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${plta}`, Accept: "application/json" },
          });

          deletedUsers.push({ id: uid, username, days, status: "user_deleted" });
        }
      }

      return res.json({
        status: true,
        message: "Pembersihan selesai",
        deleted_servers_count: deletedServers.length,
        deleted_users_count: deletedUsers.length,
        deleted_servers: deletedServers,
        deleted_users: deletedUsers,
      });
    } catch (err) {
      console.error(err);
      return res.json({ status: false, error: err.message });
    }
  });
};
