// cuaca.js
const fetch = require("node-fetch");

module.exports = function(app) {
    // Fungsi ambil IP client
    function getIP(req) {
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
        if (ip.includes(",")) ip = ip.split(",")[0]; // ambil IP pertama
        if (ip.includes("::ffff:")) ip = ip.replace("::ffff:", "");
        if (ip === "::1" || ip === "127.0.0.1") ip = "8.8.8.8"; // fallback localhost
        return ip;
    }

    // Endpoint cuaca otomatis dari BMKG
    app.get("/tools/cuaca", async (req, res) => {
        try {
            const { apikey } = req.query;

            // Validasi API Key dari global
            if (!apikey || !global.apikey.includes(apikey)) {
                return res.json({ status: false, error: "Apikey invalid" });
            }

            // Deteksi IP client
            const ip = getIP(req);

            // Deteksi lokasi berdasarkan IP
            const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
            const ipData = await ipRes.json();

            if (!ipData.city) {
                return res.json({ status: false, error: "Gagal mendeteksi lokasi IP" });
            }

            const kota = ipData.city;
            const provinsi = ipData.regionName || "";

            // Ambil data cuaca BMKG
            const bmkgRes = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca`);
            const bmkgData = await bmkgRes.json();

            // Cari kota di data BMKG
            let lokasiCuaca = bmkgData.data.find(loc =>
                loc.lokasi.toLowerCase().includes(kota.toLowerCase())
            );

            // Fallback cari berdasarkan provinsi
            if (!lokasiCuaca) {
                lokasiCuaca = bmkgData.data.find(loc =>
                    loc.lokasi.toLowerCase().includes(provinsi.toLowerCase())
                );
            }

            if (!lokasiCuaca) {
                return res.json({ status: false, error: "Data cuaca BMKG tidak ditemukan untuk lokasi Anda" });
            }

            // Ambil prakiraan terbaru
            const prakiraan = lokasiCuaca.cuaca[0];

            res.json({
                status: true,
                lokasi: `${kota}, ${provinsi}, Indonesia`,
                data: {
                    cuaca: prakiraan.kondisi,
                    suhu: prakiraan.suhu,
                    kelembaban: prakiraan.kelembapan,
                    update: prakiraan.jam
                }
            });

        } catch (error) {
            res.status(500).json({ status: false, error: `Error: ${error.message}` });
        }
    });
};
