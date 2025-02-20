const express = require('express');
const router = express.Router();
const Employee = require('../model/employeeModel');
const { uploadEmployee } = require('../utils/multerConfig');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

dotenv.config();

//Total Employee
router.get('/totalEmployees', async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments();
        res.json({ totalEmployees });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Create a new employee
// router.post('/employees', uploadEmployee.single("employeeImage"), async (req, res) => {
//     try {
//         // Declare path as let to allow reassignment
//         let path = req.file?.location;

//         // If path is undefined or null, assign a default image
//         if (!path) {
//             path = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/employee/default.jpeg`;
//         }

//         req.body.employeeImage = path;
//         const employee = new Employee(req.body);
//         const savedEmployee = await employee.save();
//         res.status(201).json(savedEmployee);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });
const upload = uploadEmployee.fields([
    { name: 'employeeImage', maxCount: 1 },
    { name: 'qrCode', maxCount: 1 }
]);

router.post('/employees', upload, async (req, res) => {
    try {
        const files = req.files;
        const employeeData = req.body;

        // Handle employee image
        if (files.employeeImage) {
            let newPath = files.employeeImage[0].path.replace('uploads\\', "");
            employeeData.employeeImage = newPath;
        } else {
            employeeData.employeeImage = "default.jpeg";
        }

        // Handle address details - Explicitly create the address object
        employeeData.address = {
            street: employeeData.street || '',
            city: employeeData.city || '',
            state: employeeData.state || '',
            country: employeeData.country || '',
            postalCode: employeeData.postalCode || ''
        };


        // Handle bank details
        employeeData.bankDetails = {
            bankName: employeeData.bankName || '',
            accountHolderName: employeeData.accountHolderName || '',
            accountNumber: employeeData.accountNumber || '',
            ifscCode: employeeData.ifscCode || '',
            accountType: employeeData.accountType || '',
            upiId: employeeData.upiId || '',
            paymentApp: employeeData.paymentApp || ''
        };

        // Handle QR code if present
        if (files.qrCode) {
            employeeData.bankDetails.qrCode = files.qrCode[0].path
                .replace(/\\/g, '/')
                .replace('uploads/', '');
        }

        // Remove individual fields that are now in nested objects
        const fieldsToDelete = [
            'bankName', 'accountHolderName', 'accountNumber', 'ifscCode', 
            'accountType', 'upiId', 'paymentApp', 'street', 'city', 
            'state', 'country', 'postalCode'
        ];
        
        fieldsToDelete.forEach(field => delete employeeData[field]);

        // Create and save employee
        const employee = new Employee(employeeData);
        
        
        const savedEmployee = await employee.save();
        
        // Send email and return response
        sendEmail(savedEmployee);
        res.status(201).json(savedEmployee);
    } catch (err) {
        console.error('Error creating employee:', err);
        console.error('Request body:', req.body);
        res.status(400).json({ message: err.message });
    }
});

// Email sending function
async function sendEmail(employee) {
    // Configure Nodemailer with your email service (for example, Gmail)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
        },
    });

    const mailOptions = {
        from: process.env.USER_EMAIL,
        to: employee.emailid, // Send email to the employee's email address
        subject: 'PIZEONFLY - Your Account Details',
        html: `
            <h1>Hello ${employee.employeeName},</h1>
            <p>You have been added as an Employee at PIZEONFLY. Here are your details:</p>
            <ul>
                <li><strong>Email:</strong> ${employee.emailid}</li>
                <li><strong>Password:</strong> ${employee.password}</li>
            </ul>
            <p><a href="https://crm.pizeonfly.com/#/employeesignin">Click here to login</a></p>
            <p>If you have any queries, please contact MD-Afzal at 9015662728</p>
            <p>Thank you for choosing our service!</p>
        `,
    };
    // Send the email
    try {
        await transporter.sendMail(mailOptions);
        // console.log(`Email sent to ${employee.emailid}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


//employee login
router.post("/employeelogin", async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status({
            status: 400,
            message: "email, password is required."
        })
    }
    const { email, password } = body;

    if (!email || !password) {
        return res.status({
            status: 400,
            message: "email, password is required."
        })
    }

    try {
        const empDetails = await Employee.findOne({
            emailid: email,
            password: password
        }).lean()

        if (!empDetails) {
            return res.send({
                status: 400,
                message: "User not found or invalid credentials"
            })
        }

        // console.log(empDetails._id.toString())
        // const token = jwt.sign(empDetails._id.toString(), process.env.JWT_SECRET);
        const token = jwt.sign({ _id: empDetails._id }, process.env.JWT_SECRET);

        return res.status(200).send({
            status: 200,
            message: "Login success",
            user: empDetails,
            token: token
        })
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }

})

// Get all employees
router.get('/employees', async (req, res) => {
    try {
        const employees = await Employee.find()
        // console.log("testing");
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a single employee
router.get('/employees/:employeeId', async (req, res) => {
    try {
        const employee = await Employee.findOne({ _id: req.params.employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/search", async (req, res) => {
    const queries = req.query;
    if (queries.hasOwnProperty('id') === false) {
        return res.status(200).json({ message: "id is require to search" })
    }
    const q_regex = new RegExp(queries.id, 'i');
    console.log(q_regex);
    const emps = await Employee.find({ employeeName: { $regex: q_regex } });
    // const emps = await Employee.find({ $or: [{ employeeId: { regex: q_regex } }, { employeeName: { regex: q_regex } }] })
    if (emps) {
        return res.status(200).json(emps);
    }
    console.log(queries);
    return res.sendStatus(500);
})

// Update an employee
router.put('/employees/:employeeId', upload, async (req, res) => {
    try {
        const existingEmployee = await Employee.findById(req.params.employeeId);
        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const files = req.files;
        const updatedData = req.body;

        // Handle file uploads
        if (files && files.employeeImage) {
            updatedData.employeeImage = files.employeeImage[0].path.replace('uploads\\', "");
        }

        // Handle bank details
        const bankDetails = {
            bankName: Array.isArray(updatedData.bankName) ? updatedData.bankName.join(', ') : (updatedData.bankName || existingEmployee.bankDetails?.bankName || ''),
            accountHolderName: Array.isArray(updatedData.accountHolderName) ? updatedData.accountHolderName.join(', ') : (updatedData.accountHolderName || existingEmployee.bankDetails?.accountHolderName || ''),
            accountNumber: Array.isArray(updatedData.accountNumber) ? updatedData.accountNumber.join(', ') : (updatedData.accountNumber || existingEmployee.bankDetails?.accountNumber || ''),
            ifscCode: Array.isArray(updatedData.ifscCode) ? updatedData.ifscCode.join(', ') : (updatedData.ifscCode || existingEmployee.bankDetails?.ifscCode || ''),
            accountType: Array.isArray(updatedData.accountType) ? updatedData.accountType.join(', ') : (updatedData.accountType || existingEmployee.bankDetails?.accountType || ''),
            upiId: Array.isArray(updatedData.upiId) ? updatedData.upiId.join(', ') : (updatedData.upiId || existingEmployee.bankDetails?.upiId || ''),
            paymentApp: Array.isArray(updatedData.paymentApp) ? updatedData.paymentApp.join(', ') : (updatedData.paymentApp || existingEmployee.bankDetails?.paymentApp || ''),
            qrCode: existingEmployee.bankDetails?.qrCode || ''
        };

        // Handle address details - preserve existing values and handle arrays
        const address = {
            street: Array.isArray(updatedData.street) ? updatedData.street.join(', ') : (updatedData.street || existingEmployee.address?.street || ''),
            city: Array.isArray(updatedData.city) ? updatedData.city.join(', ') : (updatedData.city || existingEmployee.address?.city || ''),
            state: Array.isArray(updatedData.state) ? updatedData.state.join(', ') : (updatedData.state || existingEmployee.address?.state || ''),
            country: Array.isArray(updatedData.country) ? updatedData.country.join(', ') : (updatedData.country || existingEmployee.address?.country || ''),
            postalCode: Array.isArray(updatedData.postalCode) ? updatedData.postalCode.join(', ') : (updatedData.postalCode || existingEmployee.address?.postalCode || '')
        };

        // console.log('Updated address data:', address); // Debug log

        // Update QR code if new one is uploaded
        if (files && files.qrCode) {
            bankDetails.qrCode = files.qrCode[0].path
                .replace(/\\/g, '/')
                .replace('uploads/', '');
        }

        // Remove individual fields
        const fieldsToDelete = [
            'bankName', 'accountHolderName', 'accountNumber', 'ifscCode', 
            'accountType', 'upiId', 'paymentApp', 'street', 'city', 
            'state', 'country', 'postalCode'
        ];
        
        fieldsToDelete.forEach(field => delete updatedData[field]);

        // Add the nested objects to the update data
        updatedData.bankDetails = bankDetails;
        updatedData.address = address;

        // Update employee
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.employeeId,
            { $set: updatedData },
            { new: true }
        );

        res.json(updatedEmployee);
    } catch (err) {
        console.error('Update error:', err);
        console.error('Request body:', req.body); // Debug log
        res.status(400).json({ message: err.message });
    }
});



// Delete an employee
router.delete('/employees/:employeeId', async (req, res) => {
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.employeeId)
        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add this new route to handle document deletion
// router.patch('/employees/:employeeId/document', async (req, res) => {
//     try {
//         const { employeeId } = req.params;
//         const { documentType } = req.body;

//         // Validate document type
//         if (!['aadhaarCard', 'panCard', 'resume'].includes(documentType)) {
//             return res.status(400).json({ message: 'Invalid document type' });
//         }

//         // Create update object
//         const updateObj = {
//             [documentType]: null
//         };

//         const updatedEmployee = await Employee.findByIdAndUpdate(
//             employeeId,
//             { $set: updateObj },
//             { new: true }
//         );

//         if (!updatedEmployee) {
//             return res.status(404).json({ message: 'Employee not found' });
//         }

//         res.json(updatedEmployee);
//     } catch (err) {
//         console.error('Error deleting document:', err);
//         res.status(500).json({ message: err.message });
//     }
// });

module.exports = router;
