const express = require('express');
const router = express.Router();
const { ICCRForm1 } = require('../model/iccrModel');

// Create a new ICCR Form1 application
router.post('/form1', async (req, res) => {
    try {
        // Check for existing email or phone number
        const existingUser = await ICCRForm1.findOne({
            $or: [
                { email: req.body.email },
                { mobileNumber: req.body.mobileNumber }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An application with this email or phone number already exists!"
            });
        }

        const newForm1 = new ICCRForm1(req.body);
        const savedForm1 = await newForm1.save();
        res.status(201).json({
            success: true,
            message: "Form 1 submitted successfully",
            data: savedForm1
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error submitting Form 1",
            error: error.message
        });
    }
});

// Get all ICCR Form1 applications
router.get('/form1', async (req, res) => {
    try {
        const forms = await ICCRForm1.find();
        res.status(200).json({
            success: true,
            data: forms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching Form 1 data",
            error: error.message
        });
    }
});

// Get a specific ICCR Form1 application by ID
router.get('/form1/:id', async (req, res) => {
    try {
        const form = await ICCRForm1.findById(req.params.id);
        if (!form) {
            return res.status(404).json({
                success: false,
                message: "Form not found"
            });
        }
        res.status(200).json({
            success: true,
            data: form
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching Form 1",
            error: error.message
        });
    }
});

// Delete a specific ICCR Form1 application by ID
router.delete('/form1/:id', async (req, res) => {
    try {
        const deletedForm = await ICCRForm1.findByIdAndDelete(req.params.id);
        if (!deletedForm) {
            return res.status(404).json({
                success: false,
                message: "Form not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Form deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting Form",
            error: error.message
        });
    }
});

module.exports = router;