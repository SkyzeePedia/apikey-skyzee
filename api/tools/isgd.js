const axios = require("axios");

async function shortIsGd(links) {
    try {
        const res = await axios.get('https://is.gd/create.php?format=simple&url=' + encodeURIComponent(links));
        return res.data.toString();
    } catch (error) {
        throw new Error('Gagal membuat shortlink is.gd: ' + error.message);
    }
}

module.exports = function(app) {
    app.get('/tools/isgd', async (req, res) => {
        try {
            const { apikey, url } = req.query;

            if (!global.apikey || !global.apikey.includes(apikey)) {
                return res.json({ status: false, error: 'Apikey invalid' });
            }

            if (!url) {
                return res.json({ status: false, error: 'Url is required' });
            }
            if (!/^https?:\/\/.+/i.test(url)) {
                return res.json({ status: false, error: 'Url must start with http:// or https://' });
            }

            const shortLink = await shortIsGd(url);

            res.status(200).json({
                status: true,
                original_url: url,
                short_url: shortLink
            });

        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
