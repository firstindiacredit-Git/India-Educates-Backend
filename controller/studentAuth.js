const express = require('express');
const router = express.Router();
const Student = require('../model/studentModel');
const { uploadStudent } = require('../utils/multerConfig');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

dotenv.config();

// Total Students
router.get('/totalStudents', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        res.json({ totalStudents });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const upload = uploadStudent.fields([
    { name: 'studentImage', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 }
]);

// Create a new student
router.post('/students', upload, async (req, res) => {
    try {
        const files = req.files;
        const studentData = req.body;

        if (files.studentImage) {
            let newPath = files.studentImage[0].path.replace('uploads\\', "");
            studentData.studentImage = newPath;
        } else {
            studentData.studentImage = "default.jpeg";
        }

        if (files.resume) {
            studentData.resume = files.resume[0].path.replace('uploads\\', "");
        }
        if (files.aadhaarCard) {
            studentData.aadhaarCard = files.aadhaarCard[0].path.replace('uploads\\', "");
        }

        studentData.socialLinks = {
            linkedin: studentData.linkedin || '',
            instagram: studentData.instagram || '',
            youtube: studentData.youtube || '',
            facebook: studentData.facebook || '',
            github: studentData.github || '',
            website: studentData.website || '',
            other: studentData.other || ''
        };

        // Handle bank details
        studentData.bankDetails = {
            bankName: studentData.bankName || '',
            accountHolderName: studentData.accountHolderName || '',
            accountNumber: studentData.accountNumber || '',
            ifscCode: studentData.ifscCode || '',
            accountType: studentData.accountType || '',
            upiId: studentData.upiId || '',
            paymentApp: studentData.paymentApp || ''
        };

        if (files.qrCode) {
            studentData.bankDetails.qrCode = files.qrCode[0].path
                .replace(/\\/g, '/')
                .replace('uploads/', '');
        }

        // Clean up individual fields
        delete studentData.linkedin;
        delete studentData.instagram;
        delete studentData.youtube;
        delete studentData.facebook;
        delete studentData.github;
        delete studentData.website;
        delete studentData.other;
        delete studentData.bankName;
        delete studentData.accountHolderName;
        delete studentData.accountNumber;
        delete studentData.ifscCode;
        delete studentData.accountType;
        delete studentData.upiId;
        delete studentData.paymentApp;

        const student = new Student(studentData);
        const savedStudent = await student.save();
        sendEmail(savedStudent);
        res.status(201).json(savedStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Student login
router.post("/studentlogin", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    try {
        const studentDetails = await Student.findOne({
            emailid: email,
            password: password
        }).lean();

        if (!studentDetails) {
            return res.status(400).json({
                message: "User not found or invalid credentials"
            });
        }

        const token = jwt.sign({ _id: studentDetails._id }, process.env.JWT_SECRET);

        return res.status(200).json({
            status: 200,
            message: "Login success",
            user: studentDetails,
            token: token
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Email sending function
async function sendEmail(student) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
        },
    });

    const mailOptions = {
        from: process.env.USER_EMAIL,
        to: student.emailid,
        subject: 'Your Student Account Details',
        html: `
            <h1>Hello ${student.studentName},</h1>
            <p>Welcome! Your student account has been created. Here are your login details:</p>
            <ul>
                <li><strong>Email:</strong> ${student.emailid}</li>
                <li><strong>Password:</strong> ${student.password}</li>
            </ul>
            <p><a href="https://yourwebsite.com/student-signin">Click here to login</a></p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thank you!</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        // console.log(`Email sent to ${student.emailid}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Add this GET route to fetch all students
router.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a student
router.put('/students/:id', upload, async (req, res) => {
    try {
        const files = req.files;
        const studentData = req.body;

        // Handle file uploads if present
        if (files?.studentImage) {
            let newPath = files.studentImage[0].path.replace('uploads\\', "");
            studentData.studentImage = newPath;
        }
        if (files?.resume) {
            studentData.resume = files.resume[0].path.replace('uploads\\', "");
        }
        if (files?.aadhaarCard) {
            studentData.aadhaarCard = files.aadhaarCard[0].path.replace('uploads\\', "");
        }
        if (files?.qrCode) {
            studentData.bankDetails = studentData.bankDetails || {};
            studentData.bankDetails.qrCode = files.qrCode[0].path
                .replace(/\\/g, '/')
                .replace('uploads/', '');
        }

        // Handle social links
        if (studentData.linkedin || studentData.instagram || studentData.youtube || 
            studentData.facebook || studentData.github || studentData.website || studentData.other) {
            studentData.socialLinks = {
                linkedin: studentData.linkedin || '',
                instagram: studentData.instagram || '',
                youtube: studentData.youtube || '',
                facebook: studentData.facebook || '',
                github: studentData.github || '',
                website: studentData.website || '',
                other: studentData.other || ''
            };

            // Clean up individual fields
            delete studentData.linkedin;
            delete studentData.instagram;
            delete studentData.youtube;
            delete studentData.facebook;
            delete studentData.github;
            delete studentData.website;
            delete studentData.other;
        }

        // Handle bank details
        if (studentData.bankName || studentData.accountHolderName || studentData.accountNumber || 
            studentData.ifscCode || studentData.accountType || studentData.upiId || studentData.paymentApp) {
            studentData.bankDetails = {
                ...studentData.bankDetails,
                bankName: studentData.bankName || '',
                accountHolderName: studentData.accountHolderName || '',
                accountNumber: studentData.accountNumber || '',
                ifscCode: studentData.ifscCode || '',
                accountType: studentData.accountType || '',
                upiId: studentData.upiId || '',
                paymentApp: studentData.paymentApp || ''
            };

            // Clean up individual fields
            delete studentData.bankName;
            delete studentData.accountHolderName;
            delete studentData.accountNumber;
            delete studentData.ifscCode;
            delete studentData.accountType;
            delete studentData.upiId;
            delete studentData.paymentApp;
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { $set: studentData },
            { new: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(updatedStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a student
router.delete('/students/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Return success message
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 