const express = require('express');
const router = express.Router();
const KJUR = require('jsrsasign');

// Generate Zoom Meeting Token
const generateZoomToken = (meetingNumber, role) => {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // Token expires in 2 hours

    const oHeader = { alg: 'HS256', typ: 'JWT' };
    const oPayload = {
        sdkKey: process.env.ZOOM_SDK_KEY,
        mn: meetingNumber,
        role: role,
        iat: iat,
        exp: exp,
        tokenExp: exp
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_SECRET);

    return signature;
};

// Create a new Zoom meeting
router.post('/create-zoom-meeting', async (req, res) => {
    try {
        const meetingNumber = Math.floor(Math.random() * 1000000000); // Generate random meeting number
        const role = 1; // 1 for host, 0 for participant

        const token = generateZoomToken(meetingNumber, role);

        res.json({
            signature: token,
            meetingNumber: meetingNumber,
            sdkKey: process.env.ZOOM_SDK_KEY
        });
    } catch (error) {
        console.error('Error creating Zoom meeting:', error);
        res.status(500).json({ error: 'Failed to create Zoom meeting' });
    }
});

// Join an existing Zoom meeting
router.post('/join-zoom-meeting', async (req, res) => {
    try {
        const { meetingNumber } = req.body;
        const role = 0; // 0 for participant

        const token = generateZoomToken(meetingNumber, role);

        res.json({
            signature: token,
            meetingNumber: meetingNumber,
            sdkKey: process.env.ZOOM_SDK_KEY
        });
    } catch (error) {
        console.error('Error joining Zoom meeting:', error);
        res.status(500).json({ error: 'Failed to join Zoom meeting' });
    }
});

module.exports = router;
