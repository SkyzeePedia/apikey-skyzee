module.exports = function(app) {
    const axios = require('axios');

    app.get('/tools/iplookup', async (req, res) => {
        try {
            const { apikey, q } = req.query;

            if (!global.apikey.includes(apikey)) {
                return res.json({ status: false, error: 'Apikey invalid' });
            }

            if (!q) {
                return res.json({ status: false, error: 'Query is required (IP or domain)' });
            }

            const url = `http://ip-api.com/json/${q}?fields=status,message,country,regionName,city,lat,lon,isp,org,as,query,timezone`;
            const response = await axios.get(url);

            if (response.data.status !== 'success') {
                return res.json({ status: false, error: response.data.message || 'IP lookup failed' });
            }

            res.status(200).json({
                status: true,
                result: {
                    ip: response.data.query,
                    city: response.data.city,
                    region: response.data.regionName,
                    country: response.data.country,
                    latitude: response.data.lat,
                    longitude: response.data.lon,
                    timezone: response.data.timezone,
                    isp: response.data.isp,
                    organization: response.data.org,
                    as: response.data.as
                }
            });

        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
