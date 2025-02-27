const express = require('express');
const router = express.Router();
const Client = require('../model/clientModel');
const nodemailer = require('nodemailer');
const { uploadClient } = require('../utils/multerConfig');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const Project = require('../model/projectModel');

dotenv.config();

// Total Clients
router.get('/totalClients', async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    res.json({ totalClients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new client
router.post('/clients', uploadClient.fields([
  { name: 'clientImage', maxCount: 1 },
  { name: 'clientDL', maxCount: 1 },
  { name: 'clientPassport', maxCount: 1 },
  { name: 'clientAgentID', maxCount: 1 },
  { name: 'clientGovtID', maxCount: 1 }
]), async (req, res) => {
  try {
    // Process clientImage
    let clientImage = 'default.jpeg';
    if (req.files.clientImage && req.files.clientImage[0]) {
      const path = req.files.clientImage[0].path;
      clientImage = path.replace('uploads\\', "");
    }
    req.body.clientImage = clientImage;
    
    // Process other document images
    if (req.files.clientDL && req.files.clientDL[0]) {
      const path = req.files.clientDL[0].path;
      req.body.clientDL = path.replace('uploads\\', "");
    }
    
    if (req.files.clientPassport && req.files.clientPassport[0]) {
      const path = req.files.clientPassport[0].path;
      req.body.clientPassport = path.replace('uploads\\', "");
    }
    
    if (req.files.clientAgentID && req.files.clientAgentID[0]) {
      const path = req.files.clientAgentID[0].path;
      req.body.clientAgentID = path.replace('uploads\\', "");
    }
    
    if (req.files.clientGovtID && req.files.clientGovtID[0]) {
      const path = req.files.clientGovtID[0].path;
      req.body.clientGovtID = path.replace('uploads\\', "");
    }
    
    // Extract bank details from request body
    const bankDetails = {
      accountNumber: req.body.accountNumber || '',
      accountType: req.body.accountType || '',
      accountHolderName: req.body.accountHolderName || '',
      ifscCode: req.body.ifscCode || '',
      bankName: req.body.bankName || '',
      upiId: req.body.upiId || '',
      qrCode: req.body.qrCode || '',
      paymentApp: req.body.paymentApp || ''
    };
    
    req.body.bankDetails = bankDetails;
    
    const client = new Client(req.body);
    await client.save();
    // Send email after saving client
    sendEmail(client);
    res.status(201).send(client);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).send({ errors });
    } else {
      res.status(500).send(error);
    }
  }
});
// Email sending function
async function sendEmail(client) {
  // Configure Nodemailer with your email service (for example, Gmail)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD  // your Gmail password or app password
    },
  });

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: client.clientEmail, // Send email to the client's email address
    subject: 'PIZEONFLY - Your Account Details',
    html: `
            <h1>Hello ${client.clientName},</h1>
            <p>You have been added as an Employee at PIZEONFLY. Here are your details:</p>
            <ul>
                <li><strong>Email:</strong> ${client.clientEmail}</li>
                <li><strong>Password:</strong> ${client.clientPassword}</li>
            </ul>
            <p><a href="https://crm.pizeonfly.com/#/clientsignin">Click here to login</a></p>
            <p>If you have any queries, please contact MD-Afzal at 9015662728</p>
            <p>Thank you for choosing our service!</p>
        `,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    // console.log(`Email sent to ${client.clientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
// Client login
router.post("/clientlogin", async (req, res) => {
  const { clientEmail, clientPassword } = req.body;

  if (!clientEmail || !clientPassword) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const clientDetails = await Client.findOne({
      clientEmail: clientEmail, // Correct field name
      clientPassword: clientPassword // Correct field name
    }).lean();

    if (!clientDetails) {
      return res.status(400).json({ message: "User not found or invalid credentials." });
    }

    const token = jwt.sign({ _id: clientDetails._id }, process.env.JWT_SECRET, { expiresIn: '10d' });

    return res.status(200).json({
      message: "Login success",
      user: clientDetails,
      token: token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Get all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find({});
    res.status(200).send(clients);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get a client by ID
router.get('/clients/:id', async (req, res) => {
  const _id = req.params.id;

  try {
    const client = await Client.findById(_id);

    if (!client) {
      return res.status(404).send({ error: 'Client not found' });
    }

    res.status(200).send(client);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Search clients by name
router.get("/search", async (req, res) => {
  const query = req.query.name;

  if (!query) {
    return res.status(400).json({ message: "Name query parameter is required for search" });
  }

  try {
    const regex = new RegExp(query, 'i');
    const clients = await Client.find({ clientName: { $regex: regex } });

    if (clients.length === 0) {
      return res.status(404).json({ message: 'No clients found with the provided name' });
    }

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a client by ID (with file handling)
router.put('/clients/:id', uploadClient.fields([
  { name: 'clientImage', maxCount: 1 },
  { name: 'clientDL', maxCount: 1 },
  { name: 'clientPassport', maxCount: 1 },
  { name: 'clientAgentID', maxCount: 1 },
  { name: 'clientGovtID', maxCount: 1 }
]), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).send({ error: 'Client not found' });
    }

    // Handle image updates
    if (req.files.clientImage && req.files.clientImage[0]) {
      const newPath = req.files.clientImage[0].path.replace('uploads\\', "");
      client.clientImage = newPath;
    }
    
    if (req.files.clientDL && req.files.clientDL[0]) {
      const newPath = req.files.clientDL[0].path.replace('uploads\\', "");
      client.clientDL = newPath;
    }
    
    if (req.files.clientPassport && req.files.clientPassport[0]) {
      const newPath = req.files.clientPassport[0].path.replace('uploads\\', "");
      client.clientPassport = newPath;
    }
    
    if (req.files.clientAgentID && req.files.clientAgentID[0]) {
      const newPath = req.files.clientAgentID[0].path.replace('uploads\\', "");
      client.clientAgentID = newPath;
    }
    
    if (req.files.clientGovtID && req.files.clientGovtID[0]) {
      const newPath = req.files.clientGovtID[0].path.replace('uploads\\', "");
      client.clientGovtID = newPath;
    }

    // Update bank details
    client.bankDetails = {
      accountNumber: req.body.accountNumber || client.bankDetails?.accountNumber || '',
      accountType: req.body.accountType || client.bankDetails?.accountType || '',
      accountHolderName: req.body.accountHolderName || client.bankDetails?.accountHolderName || '',
      ifscCode: req.body.ifscCode || client.bankDetails?.ifscCode || '',
      bankName: req.body.bankName || client.bankDetails?.bankName || '',
      upiId: req.body.upiId || client.bankDetails?.upiId || '',
      qrCode: req.body.qrCode || client.bankDetails?.qrCode || '',
      paymentApp: req.body.paymentApp || client.bankDetails?.paymentApp || ''
    };

    // Update other fields
    const basicFields = ['clientName', 'clientEmail', 'clientPassword', 
                        'clientPhone', 'clientAddress', 'clientDL', 
                        'clientPassport', 'clientAgentID'];
    basicFields.forEach(field => {
      if (req.body[field]) {
        client[field] = req.body[field];
      }
    });

    await client.save();
    res.status(200).send(client);
  } catch (error) {
    console.error('Error during client update:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Delete a client by ID
router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).send({ error: 'Client not found' });
    }

    res.status(200).send({ message: 'Client deleted successfully', client });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update this route
router.get('/totalClientProjects', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const clientId = decoded._id;
    
    // console.log('Looking for projects with clientId:', clientId);
    
    // Update the query to match the field name used in your schema
    const totalProjects = await Project.countDocuments({
      clientAssignPerson: clientId
    });
    
    // console.log('Total projects found:', totalProjects);
    
    res.json({ totalProjects });
  } catch (err) {
    console.error('Error in totalClientProjects:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
