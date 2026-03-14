const { PayOS } = require('@payos/node');
const User = require('../models/User');
const Task = require('../models/Task');

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID || 'dummy_id',
    apiKey: process.env.PAYOS_API_KEY || 'dummy_api_key',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum'
});

// @desc    Create payment link for task retry
// @route   POST /api/payment/create-payment-link
exports.createPaymentLink = async (req, res) => {
    try {
        const { taskId } = req.body;
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        // PayOS orderCode must be a number and should be unique. 
        // We use the last 9 digits of timestamp which is < 2,147,483,647 (max int32)
        const orderCode = Number(String(Date.now()).slice(-9));
        const amount = 5000;
        const description = `Thực hiện lại: ${task.title}`.slice(0, 25); // PayOS limit 25 chars
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
        console.error('PayOS Error:', error);
        res.status(500).json({ message: 'Lỗi tạo link thanh toán' });
    }
};

// @desc    Handle PayOS Webhook (Optional but recommended for robustness)
// @route   POST /api/payment/webhook
exports.handleWebhook = async (req, res) => {
    try {
        const webhookData = payos.verifyPaymentWebhookData(req.body);
        
        // Logic to update user task status after successful payment
        // Note: For simplicity, we can also use the returnUrl to trigger the update on frontend
        // but webhook is more reliable.
        
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
        const user = await User.findById(req.userId);

        // Verify with PayOS if orderCode is paid
        const paymentInfo = await payos.getPaymentLinkInformation(Number(orderCode));
        console.log('PayOS Payment Info:', paymentInfo.status);
        
        if (paymentInfo.status === 'PAID') {
            const missionIndex = user.activeMissions.findIndex(m => m.taskId.toString() === taskId);
            
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Give another 30 mins

            if (missionIndex > -1) {
                user.activeMissions[missionIndex].status = 'started';
                user.activeMissions[missionIndex].expiresAt = expiresAt;
                user.activeMissions[missionIndex].startTime = new Date();
            } else {
                user.activeMissions.push({
                    taskId,
                    startTime: new Date(),
                    expiresAt,
                    status: 'started'
                });
            }

            await user.save();
            return res.json({ message: 'Thanh toán thành công! Nhiệm vụ đã được đặt lại.', expiresAt });
        } else {
            return res.status(400).json({ message: 'Giao dịch chưa được thanh toán thành công.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xác nhận thanh toán' });
    }
};
