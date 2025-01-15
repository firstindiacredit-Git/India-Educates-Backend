const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const QRCodeModel = require('../model/qrModel');

router.post('/qr/generate', async (req, res) => {
    try {
        const { title, content, userId } = req.body;
        // console.log('Received request to generate QR code:', { title, content, userId });
        
        if (!title || !content || !userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }
        
        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(content);
        
        // Save to database
        const newQRCode = new QRCodeModel({ 
            title,
            content,
            userId,
            qrCode: qrCodeDataUrl // Save the QR code data URL
        });
        
        const savedQRCode = await newQRCode.save();
        // console.log('Saved QR code:', savedQRCode);
        
        res.json({ 
            success: true, 
            qrCode: qrCodeDataUrl,
            savedQRCode // Return the saved document
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

router.get('/qr/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // console.log('Fetching QR codes for user:', userId);
        
        const userQRCodes = await QRCodeModel.find({ userId })
            .sort({ createdAt: -1 }); // Sort by newest first
        
        // console.log(`Found ${userQRCodes.length} QR codes for user`);
        res.json(userQRCodes);
    } catch (error) {
        console.error('Error fetching QR codes:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Add delete route
router.delete('/qr/:id', async (req, res) => {
    try {
        const qrCode = await QRCodeModel.findByIdAndDelete(req.params.id);
        if (!qrCode) {
            return res.status(404).json({ success: false, error: 'QR code not found' });
        }
        res.json({ success: true, message: 'QR code deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
