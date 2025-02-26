const express = require('express');
const router = express.Router();
const ICCR = require('../model/iccrModel');
const { uploadICCR } = require('../utils/multerConfig');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();

// Create ICCR application
router.post('/iccr', uploadICCR.fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'permanentUniqueId', maxCount: 1 },
    { name: 'passportCopy', maxCount: 1 },
    { name: 'gradeXMarksheet', maxCount: 1 },
    { name: 'gradeXIIMarksheet', maxCount: 1 },
    { name: 'medicalFitnessCertificate', maxCount: 1 },
    { name: 'englishTranslationOfDocuments', maxCount: 1 },
    { name: 'englishAsSubjectDocument', maxCount: 1 },
    { name: 'anyOtherDocument', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]), async (req, res) => {
    try {
        const applicationData = req.body;

        // Handle file uploads
        if (req.files) {
            // Map file paths to the correct fields
            if (req.files.studentPhoto) {
                applicationData.studentPhoto = req.files.studentPhoto[0].path;
            }
            if (req.files.permanentUniqueId) {
                applicationData.permanentUniqueId = req.files.permanentUniqueId[0].path;
            }
            if (req.files.passportCopy) {
                applicationData.passportCopy = req.files.passportCopy[0].path;
            }
            if (req.files.gradeXMarksheet) {
                applicationData.gradeXMarksheet = req.files.gradeXMarksheet[0].path;
            }
            if (req.files.gradeXIIMarksheet) {
                applicationData.gradeXIIMarksheet = req.files.gradeXIIMarksheet[0].path;
            }
            if (req.files.medicalFitnessCertificate) {
                applicationData.medicalFitnessCertificate = req.files.medicalFitnessCertificate[0].path;
            }
            if (req.files.englishTranslationOfDocuments) {
                applicationData.englishTranslationOfDocuments = req.files.englishTranslationOfDocuments[0].path;
            }
            if (req.files.englishAsSubjectDocument) {
                applicationData.englishAsSubjectDocument = req.files.englishAsSubjectDocument[0].path;
            }
            if (req.files.anyOtherDocument) {
                applicationData.anyOtherDocument = req.files.anyOtherDocument[0].path;
            }
            if (req.files.signature) {
                applicationData.signature = req.files.signature[0].path;
            }
        }

        // Parse date fields
        const dateFields = ['dateOfBirth', 'passportIssueDate', 'passportExpiryDate', 'dateOfApplication'];
        dateFields.forEach(field => {
            if (applicationData[field]) {
                applicationData[field] = new Date(applicationData[field]);
            }
        });

        // Create new application
        const newApplication = new ICCR(applicationData);
        await newApplication.save();

        // Send email notification
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.USER_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: applicationData.email,
            subject: 'ICCR Scholarship Application Received',
            html: `
                <h2>Thank you for your application</h2>
                <p>Dear ${applicationData.fullName},</p>
                <p>We have received your ICCR scholarship application. Your application is currently under review.</p>
                <p>Application Details:</p>
                <ul>
                    <li>Application ID: ${newApplication._id}</li>
                    <li>Course Level: ${applicationData.levelOfCourse}</li>
                    <li>Stream: ${applicationData.courseMainStream}</li>
                </ul>
                <p>We will contact you soon regarding the status of your application.</p>
                <p>Best regards,<br>ICCR Scholarship Team</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: newApplication
        });

    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting application',
            error: error.message
        });
    }
});

// Get all ICCR applications
router.get('/iccr', async (req, res) => {
    try {
        const applications = await ICCR.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching applications',
            error: error.message
        });
    }
});

// Get single ICCR application
router.get('/iccr/:id', async (req, res) => {
    try {
        const application = await ICCR.findById(req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching application',
            error: error.message
        });
    }
});

module.exports = router;


