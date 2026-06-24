const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware to parse URL-encoded form data (traditional form submit)
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON (for AJAX requests)
app.use(express.json());

// Serve static files from the current directory
// This will serve index.html, your CSS, JS, images, etc.
app.use(express.static('.'));

// Handle POST requests to /api/contact
app.post('/api/contact', async (req, res) => {
    // The form fields come from req.body (either URL-encoded or JSON)
    const { name, businessProperty, phone, email, serviceNeeded, address, message } = req.body;
    const turnstileResponse = req.body['cf-turnstile-response'];

    // Basic validation
    if (!name || !businessProperty || !phone || !email || !serviceNeeded) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!turnstileResponse) {
        return res.status(400).json({ error: 'Please complete the CAPTCHA' });
    }

    // Verify Turnstile token with Cloudflare
    try {
        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: turnstileResponse,
            }).toString()
        });

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            console.error('Turnstile verification failed:', verifyData);
            return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return res.status(500).json({ error: 'CAPTCHA verification service error' });
    }

    // Configure nodemailer transporter using environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `${name} <${email}>`,
        to: process.env.EMAIL_TO || 'you@example.com',
        subject: `New contact request – ${serviceNeeded}`,
        text: `Name: ${name}\nBusiness Property: ${businessProperty}\nPhone: ${phone}\nEmail: ${email}\nStreet Address: ${address || '(none)'}\nService Needed: ${serviceNeeded}\nMesssage: ${message || '(none)'}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Form action should point to /api/contact`);
});