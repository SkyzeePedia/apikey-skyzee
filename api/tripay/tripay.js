const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { ImageUploadService } = require('node-upload-images');

// In-memory transaction store
const transactions = new Map();

// Helper Functions
function generateTransactionId() {
    return `TRIPAY-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function generateExpirationTime(minutes = 30) {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + minutes);
    return expirationTime;
}

function generateTripaySignature(merchantRef, amount, privateKey) {
    const stringToSign = `${merchantRef}${amount}${privateKey}`;
    return crypto.createHash('sha256').update(stringToSign).digest('hex');
}

async function uploadQRImage(buffer) {
    try {
        const service = new ImageUploadService('pixhost.to');
        const { directLink } = await service.uploadFromBinary(buffer, 'qris-tripay.png');
        return directLink;
    } catch (error) {
        console.error('QR Upload Error:', error);
        throw new Error('Failed to upload QR image');
    }
}

// Tripay API Functions
async function createTripayTransaction(amount, tripayApiKey, tripayPrivateKey, merchantCode) {
    const merchantRef = generateTransactionId();
    const signature = generateTripaySignature(merchantRef, amount, tripayPrivateKey);

    const payload = {
        method: 'QRIS',
        merchant_ref: merchantRef,
        amount: parseInt(amount),
        customer_name: 'Customer',
        signature: signature
    };

    try {
        const response = await axios.post(
            'https://tripay.co.id/api/transaction/create',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${tripayApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.data;
    } catch (error) {
        console.error('Tripay API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create Tripay transaction');
    }
}

async function checkTripayPayment(reference, tripayApiKey) {
    try {
        const response = await axios.get(
            `https://tripay.co.id/api/transaction/detail/${reference}`,
            {
                headers: {
                    'Authorization': `Bearer ${tripayApiKey}`
                }
            }
        );

        return response.data.data;
    } catch (error) {
        console.error('Tripay Check Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to check payment status');
    }
}

// QRIS Generator
async function generateDynamicQRIS(amount, staticQR) {
    try {
        // Remove CRC from static QR
        let qrisData = staticQR.slice(0, -4);
        
        // Replace merchant code if needed
        const step1 = qrisData.replace("010211", "010212");
        const step2 = step1.split("5802ID");

        // Format amount
        amount = amount.toString();
        let amountPart = "54" + ("0" + amount.length).slice(-2) + amount;
        amountPart += "5802ID";

        // Combine all parts
        const dynamicQR = step2[0] + amountPart + step2[1] + convertCRC16(step2[0] + amountPart + step2[1]);

        // Generate QR image
        const buffer = await QRCode.toBuffer(dynamicQR, {
            scale: 20,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Upload image
        const qrImageUrl = await uploadQRImage(buffer);

        return {
            qr_data: dynamicQR,
            qr_image: qrImageUrl
        };
    } catch (error) {
        console.error('QR Generation Error:', error);
        throw new Error('Failed to generate dynamic QRIS');
    }
}

// Auto Payment Checker
function startPaymentChecker(tripayApiKey, interval = 30000) {
    return setInterval(async () => {
        try {
            console.log('[PaymentChecker] Checking pending transactions...');
            
            for (const [id, transaction] of transactions) {
                if (transaction.status === 'pending') {
                    try {
                        const status = await checkTripayPayment(transaction.reference, tripayApiKey);
                        
                        if (status.status === 'PAID') {
                            // Update transaction status
                            transaction.status = 'paid';
                            transaction.paid_at = new Date();
                            console.log(`[PaymentChecker] Transaction ${id} paid!`);
                            
                            // Here you can add your payment success logic
                            // e.g., send notification, update database, etc.
                        }
                    } catch (error) {
                        console.error(`[PaymentChecker] Error checking transaction ${id}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('[PaymentChecker] General error:', error);
        }
    }, interval);
}

module.exports = function(app) {
    let paymentCheckerInterval = null;

    app.get('/orderkuota/createpayment', async (req, res) => {
        const { 
            apikey, 
            amount, 
            tripay_apikey, 
            tripay_privatekey, 
            tripay_merchant 
        } = req.query;

        // Validate all parameters
        if (!apikey || !global.apikey.includes(apikey)) {
            return res.status(401).json({ 
                status: false, 
                error: 'Invalid API Key' 
            });
        }
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ 
                status: false, 
                error: 'Valid amount is required' 
            });
        }
        if (!tripay_apikey || !tripay_privatekey || !tripay_merchant) {
            return res.status(400).json({ 
                status: false, 
                error: 'Tripay credentials are required' 
            });
        }

        try {
            // Create Tripay transaction
            const tripayTransaction = await createTripayTransaction(
                amount, 
                tripay_apikey, 
                tripay_privatekey, 
                tripay_merchant
            );

            // Generate QR Code
            const qrData = await generateDynamicQRIS(amount, tripayTransaction.qr_string);

            // Store transaction
            const transactionData = {
                id: tripayTransaction.merchant_ref,
                amount: parseInt(amount),
                status: 'pending',
                created_at: new Date(),
                expires_at: generateExpirationTime(),
                qr_image: qrData.qr_image,
                qr_data: qrData.qr_data,
                reference: tripayTransaction.reference,
                payments: []
            };

            transactions.set(tripayTransaction.merchant_ref, transactionData);

            // Start payment checker if not already running
            if (!paymentCheckerInterval) {
                paymentCheckerInterval = startPaymentChecker(tripay_apikey);
            }

            res.status(200).json({
                status: true,
                result: {
                    idtransaksi: tripayTransaction.merchant_ref,
                    jumlah: amount,
                    expired: generateExpirationTime(),
                    imageqris: { 
                        url: qrData.qr_image
                    },
                    reference: tripayTransaction.reference
                }
            });
        } catch (error) {
            console.error('Create Payment Error:', error);
            res.status(500).json({ 
                status: false, 
                error: error.message 
            });
        }
    });
    
    app.get('/orderkuota/cekstatus', async (req, res) => {
        const { 
            apikey, 
            reference, 
            tripay_apikey 
        } = req.query;

        // Validate all parameters
        if (!apikey || !global.apikey.includes(apikey)) {
            return res.status(401).json({ 
                status: false, 
                error: 'Invalid API Key' 
            });
        }
        if (!reference) {
            return res.status(400).json({ 
                status: false, 
                error: 'Reference is required' 
            });
        }
        if (!tripay_apikey) {
            return res.status(400).json({ 
                status: false, 
                error: 'Tripay API Key is required' 
            });
        }

        try {
            // Check payment status
            const status = await checkTripayPayment(reference, tripay_apikey);

            // Update local transaction record if exists
            const transaction = transactions.get(status.merchant_ref);
            if (transaction) {
                transaction.status = status.status.toLowerCase();
                if (status.status === 'PAID') {
                    transaction.paid_at = new Date(status.paid_at);
                }
            }

            res.status(200).json({
                status: true, 
                result: {
                    status: status.status,
                    reference: status.reference,
                    amount: status.amount,
                    paid_at: status.paid_at,
                    merchant_ref: status.merchant_ref
                }
            });
        } catch (error) {
            console.error('Check Status Error:', error);
            res.status(500).json({ 
                status: false, 
                error: error.message 
            });
        }
    });

    // Cleanup on server shutdown
    process.on('SIGINT', () => {
        if (paymentCheckerInterval) {
            clearInterval(paymentCheckerInterval);
        }
        process.exit();
    });
};
