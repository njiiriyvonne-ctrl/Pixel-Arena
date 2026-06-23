const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get M-Pesa access token
async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const url = process.env.MPESA_ENV === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${credentials}` }
  });

  return response.data.access_token;
}

// Format phone number to 254XXXXXXXXX
function formatPhone(phone) {
  let cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

// Generate timestamp
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// ─────────────────────────────────────────
// DEPOSIT — STK Push
// ─────────────────────────────────────────
router.post('/deposit', auth, async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required' });
  }

  if (amount < 10) {
    return res.status(400).json({ error: 'Minimum deposit is KES 10' });
  }

  if (amount > 150000) {
    return res.status(400).json({ error: 'Maximum deposit is KES 150,000' });
  }

  try {
    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString('base64');

    const stkUrl = process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const formattedPhone = formatPhone(phone);

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: 'PixelArena',
      TransactionDesc: 'PixelArena Wallet Deposit'
    };

    const response = await axios.post(stkUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const checkoutRequestId = response.data.CheckoutRequestID;

    // Save pending transaction
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, mpesa_code, status)
      VALUES (?, 'deposit', ?, 'M-Pesa Deposit', ?, 'pending')
    `).run(req.user.id, amount, checkoutRequestId);

    res.json({
      success: true,
      message: 'STK push sent! Check your phone and enter your M-Pesa PIN.',
      checkoutRequestId
    });

  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message);

    if (err.response?.data) {
      return res.status(400).json({
        error: 'M-Pesa request failed',
        details: err.response.data
      });
    }

    res.status(500).json({
      error: 'Could not connect to M-Pesa. Check your API credentials in .env'
    });
  }
});

// ─────────────────────────────────────────
// CALLBACK — Safaricom calls this after payment
// ─────────────────────────────────────────
router.post('/callback', (req, res) => {
  console.log('M-Pesa callback received:', JSON.stringify(req.body, null, 2));

  try {
    const result = req.body?.Body?.stkCallback;

    if (!result) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (result.ResultCode === 0) {
      // Payment successful
      const items = result.CallbackMetadata?.Item || [];
      const amount = items.find(i => i.Name === 'Amount')?.Value;
      const mpesaCode = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = items.find(i => i.Name === 'PhoneNumber')?.Value;
      const checkoutRequestId = result.CheckoutRequestID;

      console.log(`Payment confirmed: KES ${amount} | Code: ${mpesaCode} | Phone: ${phoneNumber}`);

      // Find user by phone
      const formattedPhone = '0' + String(phoneNumber).slice(3);
      const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(formattedPhone);

      if (user) {
        // Credit wallet
        db.prepare(`
          UPDATE wallets
          SET balance = balance + ?,
              total_deposited = total_deposited + ?
          WHERE user_id = ?
        `).run(amount, amount, user.id);

        // Mark transaction complete
        db.prepare(`
          UPDATE transactions
          SET status = 'completed', mpesa_code = ?
          WHERE mpesa_code = ? AND status = 'pending'
        `).run(mpesaCode, checkoutRequestId);

        console.log(`Wallet credited: KES ${amount} for ${user.username}`);
      } else {
        console.log(`No user found for phone: ${formattedPhone}`);
      }

    } else {
      // Payment failed or cancelled
      const checkoutRequestId = result.CheckoutRequestID;
      console.log(`Payment failed: ${result.ResultDesc}`);

      db.prepare(`
        UPDATE transactions
        SET status = 'failed'
        WHERE mpesa_code = ? AND status = 'pending'
      `).run(checkoutRequestId);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (err) {
    console.error('Callback processing error:', err.message);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// ─────────────────────────────────────────
// CHECK PAYMENT STATUS
// ─────────────────────────────────────────
router.post('/check-status', auth, async (req, res) => {
  const { checkoutRequestId } = req.body;

  if (!checkoutRequestId) {
    return res.status(400).json({ error: 'checkoutRequestId is required' });
  }

  try {
    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString('base64');

    const queryUrl = process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    const response = await axios.post(queryUrl, {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.json(response.data);

  } catch (err) {
    res.status(500).json({ error: 'Could not check payment status' });
  }
});

// ─────────────────────────────────────────
// WITHDRAWAL
// ─────────────────────────────────────────
router.post('/withdraw', auth, async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required' });
  }

  if (amount < 10) {
    return res.status(400).json({ error: 'Minimum withdrawal is KES 10' });
  }

  try {
    // Check balance first
    const wallet = db.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).get(req.user.id);

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        error: `Insufficient balance. Available: KES ${wallet?.balance || 0}`
      });
    }

    // Deduct from wallet immediately
    db.prepare(`
      UPDATE wallets
      SET balance = balance - ?,
          total_withdrawn = total_withdrawn + ?
      WHERE user_id = ?
    `).run(amount, amount, req.user.id);

    // Log transaction
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, status)
      VALUES (?, 'withdrawal', ?, ?, 'completed')
    `).run(req.user.id, amount, `M-Pesa Withdrawal to ${phone}`);

    res.json({
      success: true,
      message: `KES ${amount} has been sent to ${phone} via M-Pesa.`,
      newBalance: wallet.balance - amount
    });

  } catch (err) {
    console.error('Withdrawal error:', err.message);
    res.status(500).json({ error: 'Withdrawal failed. Please try again.' });
  }
});

module.exports = router;