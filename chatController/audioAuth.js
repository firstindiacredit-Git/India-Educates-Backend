const express = require('express');
const router = express.Router();

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
