const PayOS = require('@payos/node');
const { User, Task, UserActiveMission } = require('../models');

// Robust initialization for different export styles
const payos = new (PayOS.default || PayOS)(
    process.env.PAYOS_CLIENT_ID || 'dummy_id',
    process.env.PAYOS_API_KEY || 'dummy_api_key',
    process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum'
);

// @desc    Create payment link for task retry
// @route   POST /api/payment/create-payment-link
exports.createPaymentLink = async (req, res) => {
    try {
        const { taskId } = req.body;
        const user = await User.findByPk(req.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        // PayOS orderCode must be a number and should be unique. 
        // We use the last 9 digits of timestamp.
        const orderCode = Number(String(Date.now()).slice(-9));
        
        const usdAmount = 0.5;
        const exchangeRate = 25000; // Tỉ giá 1 USD = 25,000 VND
        const amount = Math.round(usdAmount * exchangeRate); 

        // Sanitize description: no accents, alphanumeric only, max 25 chars
        const sanitizeText = (text) => {
            return text.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .slice(0, 25);
        };
        const description = sanitizeText(`Retry ${task.title}`);

        const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?taskId=${taskId}`;
        const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel?taskId=${taskId}`;

        const paymentData = {
            orderCode,
            amount,
            description,
            returnUrl,
            cancelUrl
        };

        console.log('Creating Payment Link with data:', paymentData);
        const paymentLink = await payos.createPaymentLink(paymentData);
        console.log('Payment Link Created:', paymentLink.checkoutUrl);

        res.json({
            checkoutUrl: paymentLink.checkoutUrl,
            orderCode
        });
    } catch (error) {
        console.error('PayOS createPaymentLink Error Detail:', {
            message: error.message,
            stack: error.stack,
            data: error.response?.data
        });
        res.status(500).json({ message: 'Lỗi tạo link thanh toán PayOS. Vui lòng thử lại sau.' });
    }
};

// @desc    Handle PayOS Webhook
// @route   POST /api/payment/webhook
exports.handleWebhook = async (req, res) => {
    try {
        const webhookData = payos.verifyPaymentWebhookData(req.body);
        res.json({ message: 'Webhook received' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid webhook data' });
    }
};

// @desc    Reset task status after successful payment
// @route   POST /api/payment/verify-success
exports.verifySuccess = async (req, res) => {
    try {
        const { taskId, orderCode } = req.body;
        console.log('Verifying payment for taskId:', taskId, 'orderCode:', orderCode);
        const user = await User.findByPk(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Verify with PayOS if orderCode is paid
        const paymentInfo = await payos.getPaymentLinkInformation(Number(orderCode));
        console.log('PayOS Payment Info:', paymentInfo.status);
        
        if (paymentInfo.status === 'PAID') {
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Give another 30 mins

            await UserActiveMission.upsert({
                UserId: user.id,
                TaskId: taskId,
                startTime: new Date(),
                expiresAt,
                status: 'started'
            });

            return res.json({ message: 'Thanh toán thành công! Nhiệm vụ đã được đặt lại.', expiresAt });
        } else {
            return res.status(400).json({ message: 'Giao dịch chưa được thanh toán thành công.' });
        }
    } catch (error) {
        console.error('verifySuccess error:', error);
        res.status(500).json({ message: 'Lỗi xác nhận thanh toán' });
    }
};
