const crypto = require('crypto');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
    }

    const password = body && body.password;
    const adminPassword = process.env.SPOTIFY_ADMIN_PASSWORD;

    if (!adminPassword) {
        return res.status(500).json({ error: 'Server configuration error: SPOTIFY_ADMIN_PASSWORD not set' });
    }

    if (password === adminPassword) {
        // Generate a stateless token using HMAC
        const token = crypto.createHmac('sha256', adminPassword).update('admin-session').digest('hex');
        
        // Set HttpOnly cookie. No Max-Age means it's a session cookie (cleared when browser closes)
        res.setHeader('Set-Cookie', `spotify_session=${token}; HttpOnly; Path=/; SameSite=Strict; Secure`);
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ error: 'Password admin salah.' });
    }
};
