const PayOS = require('@payos/node');
require('dotenv').config();

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

console.log('PayOS keys loaded:', !!process.env.PAYOS_CLIENT_ID);
console.log('payos.createPaymentLink type:', typeof payos.createPaymentLink);

const paymentData = {
    orderCode: Number(String(Date.now()).slice(-9)),
    amount: 1000,
    description: 'Test payment',
    returnUrl: 'http://localhost:5173',
    cancelUrl: 'http://localhost:5173'
};

payos.createPaymentLink(paymentData)
    .then(link => console.log('Link created:', link.checkoutUrl))
    .catch(err => console.error('Error creating link:', err.message));
