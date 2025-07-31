const axios = require('axios');
const { fromBuffer } = require('file-type');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class LlamaCoder {
    // Upload image ke S3 sementara
    _upload = async function (buffer) {
        if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Image buffer is required');
        const { mime } = await fromBuffer(buffer);
        if (!/image/.test(mime)) throw new Error('Buffer must be an image');

        const { data } = await axios.post('https://llamacoder.together.ai/api/s3-upload', {
            filename: `${Date.now()}_upload.jpg`,
            filetype: 'image/jpeg',
            _nextS3: { strategy: 'aws-sdk' }
        });

        const s3 = new S3Client({
            region: data.region,
            credentials: {
                accessKeyId: data.token.Credentials.AccessKeyId,
                secretAccessKey: data.token.Credentials.SecretAccessKey,
                sessionToken: data.token.Credentials.SessionToken
            }
        });

        await s3.send(new PutObjectCommand({
            Bucket: data.bucket,
            Key: data.key,
            Body: buffer,
            ContentType: 'image/jpeg'
        }));

        return `https://${data.bucket}.s3.${data.region}.amazonaws.com/${data.key}`;
    }

    // Chat default model
    chat = async function (prompt, { image = null } = {}) {
        const model = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
        const quality = 'high';

        if (!prompt) throw new Error('Prompt is required');

        let img;
        if (image) img = await this._upload(image);

        // Request awal
        const { data: t } = await axios.post('https://llamacoder.together.ai/', [
            prompt,
            model,
            quality,
            ...(image ? [img] : ['$undefined'])
        ], {
            headers: {
                'next-action': '786db5a774bd0484c1c20894289532073f283d6fc3',
                'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(main)%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%22%2C%22refresh%22%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
                referer: 'https://llamacoder.together.ai/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            }
        });

        // Ambil lastMessageId
        const id = JSON.parse(
            t.split('\n').filter(l => l.trim().startsWith('1:'))[0].split('1:')[1]
        ).lastMessageId;

        // Ambil hasil akhir
        const { data } = await axios.post('https://llamacoder.together.ai/api/get-next-completion-stream-promise', {
            messageId: id,
            model: model
        });

        const result = data.split('\n')
            .filter(d => d)
            .map(m => JSON.parse(m))
            .map(line => line?.choices?.[0]?.text || '')
            .join('');

        // Cari blok kode dengan {filename=...}
        const codeBlockMatch = result.match(/```(\w+)?\{filename=([^}]+)\}([\s\S]*?)```/);
        if (codeBlockMatch) {
            const [, , file_name, code] = codeBlockMatch;
            return { file_name, code: code.trim(), full_response: result };
        }

        // Cari blok kode biasa
        const regularCodeMatch = result.match(/```[\w]*\n?([\s\S]*?)```/);
        if (regularCodeMatch) {
            return { file_name: null, code: regularCodeMatch[1].trim(), full_response: result };
        }

        return { file_name: null, code: null, full_response: result };
    }
}

// ===== Endpoint Express =====
module.exports = function (app) {
    app.get('/ai/llma', async (req, res) => {
        const { apikey, prompt } = req.query;

        try {
            // Validasi API Key
            if (!global.apikey || !global.apikey.includes(apikey)) {
                return res.json({ status: false, error: 'Apikey invalid' });
            }

            const llama = new LlamaCoder();
            const result = await llama.chat(prompt);

            return res.json({ status: true, ...result });

        } catch (err) {
            return res.json({ status: false, error: err.message });
        }
    });
};
