const express = require('express');
const router = express.Router();

// Get TURN/STUN credentials
router.get('/get-turn-credentials', async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (isProduction) {
            // In production, use Metered TURN servers
            const response = await fetch(
                `https://${process.env.METERED_SUBDOMAIN}.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`
            );
            const iceServers = await response.json();
            res.json({ iceServers });
        } else {
            // In development, use free STUN servers
            const iceServers = {
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302"
                        ]
                    }
                ]
            };
            res.json(iceServers);
        }
    } catch (error) {
        console.error('Error fetching TURN credentials:', error);
        res.status(500).json({ error: 'Failed to fetch TURN credentials' });
    }
});

// WebRTC signaling routes
router.post('/audio-call/signal', async (req, res) => {
    try {
        const { signal, from, to } = req.body;
        const io = req.app.get('io');
        
        // Forward the WebRTC signal to the target user
        io.to(to).emit('audio-signal', { signal, from });
        
        res.status(200).json({ message: 'Signal forwarded successfully' });
    } catch (error) {
        console.error('Error in signal forwarding:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
