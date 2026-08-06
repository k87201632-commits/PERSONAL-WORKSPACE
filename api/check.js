const crypto = require('crypto');

module.exports = (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const adminPassword = process.env.SPOTIFY_ADMIN_PASSWORD;
    if (!adminPassword) {
        return res.status(500).json({ error: 'Server configuration error: SPOTIFY_ADMIN_PASSWORD not set' });
    }

    const cookies = req.headers.cookie;
    if (!cookies) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const match = cookies.match(/spotify_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const expectedToken = crypto.createHmac('sha256', adminPassword).update('admin-session').digest('hex');

    if (token === expectedToken) {
        return res.status(200).json({ authenticated: true });
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};
