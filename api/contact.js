const nodemailer = require('nodemailer');
const escapeHtml = require('escape-html');

// ------------------ CORS helper ------------------
function setCorsHeaders(res) {
  // DEBUG=1 → development (allow all origins)
  // DEBUG=0 or unset → production (locked to DOMAIN)
  const isDev = process.env.DEBUG === '1';
  const allowedOrigin = isDev ? '*' : process.env.DOMAIN;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ------------------ Validate env vars on cold start ------------------
const requiredEnvVars = [
  'TURNSTILE_SECRET_KEY',
  'EMAIL_TO',
];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS');
}
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
}

// ------------------ Main handler ------------------
module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    setCorsHeaders(res);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract form fields
  const {
    name,
    businessProperty,
    phone,
    email,
    address,
    serviceNeeded,
    message,
    'cf-turnstile-response': turnstileToken,
  } = req.body;

  // Basic validation
  const missing = [];
  if (!name) missing.push('name');
  if (!businessProperty) missing.push('businessProperty');
  if (!phone) missing.push('phone');
  if (!email) missing.push('email');
  if (!serviceNeeded) missing.push('serviceNeeded');

  if (missing.length) {
    setCorsHeaders(res);
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  // Get IP for Turnstile verification
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    (req.socket && req.socket.remoteAddress) ||
    'unknown';

  // Turnstile CAPTCHA verification
  if (!turnstileToken) {
    setCorsHeaders(res);
    return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
  }

  try {
    const verificationResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: ip,
        }).toString(),
      }
    );
    const outcome = await verificationResponse.json();
    if (!outcome.success) {
      console.error('Turnstile failed:', outcome);
      setCorsHeaders(res);
      return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }
  } catch (err) {
    console.error('Turnstile API error:', err);
    setCorsHeaders(res);
    return res.status(500).json({ error: 'CAPTCHA verification error. Please try later.' });
  }

  // Send email via Nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${name}" <${email}>`,
    replyTo: email,
    to: process.env.EMAIL_TO,
    subject: `New Cleaning Request From - ${name} (${email})`,
    text: `
You have a new cleaning request:

Name: ${escapeHtml(name)}
Business/Property: ${escapeHtml(businessProperty)}
Phone: ${escapeHtml(phone)}
Email: ${escapeHtml(email)}
Address: ${escapeHtml(address || '(not provided)')}
Service: ${escapeHtml(serviceNeeded)}
Message: ${escapeHtml(message || '(none)')}
    `,
    html: `
      <h2>New Cleaning Request</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Business/Property:</strong> ${escapeHtml(businessProperty)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Address:</strong> ${escapeHtml(address || '(not provided)')}</p>
      <p><strong>Service:</strong> ${escapeHtml(serviceNeeded)}</p>
      <p><strong>Message:</strong><br>${escapeHtml(message || '(none)')}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    setCorsHeaders(res);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Nodemailer error:', error);
    setCorsHeaders(res);
    return res.status(500).json({ error: 'Failed to send email. Please try later.' });
  }
};